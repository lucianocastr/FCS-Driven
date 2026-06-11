using System.Diagnostics;
using System.IO.Ports;
using Fiplex.Control.Software.WinForms.Core.Diagnostics;
using Fiplex.Control.Software.WinForms.Core.Serial.Interfaces;
using Microsoft.Extensions.Logging;

namespace Fiplex.Control.Software.WinForms.Core.Serial.Implementation;

/// <summary>
/// Implementation of <see cref="ISerialPort"/> that wraps the .NET <see cref="SerialPort"/> class.
/// </summary>
/// <remarks>
/// This adapter provides async wrappers around the synchronous SerialPort API and
/// handles port lifecycle including opening, closing, reading, and writing.
/// Default configuration: 8N1 (8 data bits, no parity, 1 stop bit) with 500ms timeouts.
/// </remarks>
public sealed class SerialPortAdapter : ISerialPort
{
    private readonly ILogger<SerialPortAdapter> _logger;
    private readonly DiscoveryTelemetry _telemetry;
    private SerialPort? _serialPort;

    public SerialPortAdapter(ILogger<SerialPortAdapter> logger, DiscoveryTelemetry telemetry)
    {
        _logger = logger;
        _telemetry = telemetry;
    }

    public bool IsOpen => _serialPort?.IsOpen ?? false;
    public int BytesToRead => _serialPort?.BytesToRead ?? 0;

    public void DiscardInBuffer()
    {
        try { _serialPort?.DiscardInBuffer(); }
        catch { }
    }
    
    public event Action<Exception>? ErrorOccurred;

    public Task<bool> OpenAsync(string portName, int baudRate = 9600, CancellationToken ct = default)
    {
        return Task.Run(() =>
        {
            var sw = Stopwatch.StartNew();
            try
            {
                Close();
                _serialPort = new SerialPort(portName, baudRate, Parity.None, 8, StopBits.One)
                {
                    ReadTimeout = 500,
                    WriteTimeout = 500,
                    NewLine = "\n"
                };
                _serialPort.Open();
                _logger.LogInformation("[Serial] Open  {Port} OK     duration={Ms}ms", portName, sw.ElapsedMilliseconds);
                _telemetry.IncrementPortOpenSuccess();
                return true;
            }
            catch (UnauthorizedAccessException ex)
            {
                // Port already in use by another process — expected during scan when
                // the connected device's COM port is encountered. WARN, not ERR.
                _logger.LogWarning("[Serial] Open  {Port} FAIL   duration={Ms}ms reason=AccessDenied", portName, sw.ElapsedMilliseconds);
                _telemetry.IncrementPortOpenFailedAccessDenied();
                ErrorOccurred?.Invoke(ex);
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Serial] Open  {Port} FAIL   duration={Ms}ms reason={Reason}", portName, sw.ElapsedMilliseconds, ex.GetType().Name);
                _telemetry.IncrementPortOpenFailedOther();
                ErrorOccurred?.Invoke(ex);
                return false;
            }
        }, ct);
    }

    public async Task<int> WriteAsync(ReadOnlyMemory<byte> data, CancellationToken ct = default)
    {
        if (!IsOpen) 
            throw new InvalidOperationException("Port not open");
        
        try
        {
            await _serialPort!.BaseStream.WriteAsync(data, ct);
            return data.Length;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Write failed");
            ErrorOccurred?.Invoke(ex);
            throw;
        }
    }

    public async Task<int> ReadAsync(Memory<byte> buffer, CancellationToken ct = default)
    {
        if (!IsOpen) 
            throw new InvalidOperationException("Port not open");
        
        try
        {
            return await _serialPort!.BaseStream.ReadAsync(buffer, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Read failed");
            ErrorOccurred?.Invoke(ex);
            throw;
        }
    }

    // INIT-005 Phase 1A (I-1): a close that takes longer than this exceeded the
    // PortCloseTimeout guard used by discovery and was likely abandoned by its caller.
    // Mirrors DeviceDiscoveryService.PortCloseTimeout — instrumentation threshold only.
    private const int LateCloseThresholdMs = 1500;

    public void Close()
    {
        if (_serialPort != null)
        {
            var portName = _serialPort.PortName;
            var closeId = Guid.NewGuid().ToString("N")[..4];
            _logger.LogDebug("[Serial] Close {Port} START  closeId={CloseId} mode=sync", portName, closeId);
            var sw = Stopwatch.StartNew();
            try
            {
                if (_serialPort.IsOpen)
                    _serialPort.Close();
                _serialPort.Dispose();
                _logger.LogInformation("[Serial] Close {Port} OK     closeId={CloseId} duration={Ms}ms", portName, closeId, sw.ElapsedMilliseconds);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[Serial] Close {Port} FAIL   closeId={CloseId} duration={Ms}ms — error closing port", portName, closeId, sw.ElapsedMilliseconds);
            }
            finally
            {
                _serialPort = null;
            }
        }
    }

    public Task CloseAsync()
    {
        var portToClose = _serialPort;
        _serialPort = null;
        if (portToClose == null) return Task.CompletedTask;

        var portName = portToClose.PortName;
        var closeId = Guid.NewGuid().ToString("N")[..4];
        _logger.LogDebug("[Serial] Close {Port} START  closeId={CloseId} mode=async", portName, closeId);
        return Task.Run(() =>
        {
            var sw = Stopwatch.StartNew();
            try
            {
                if (portToClose.IsOpen) portToClose.Close();
                if (sw.ElapsedMilliseconds > LateCloseThresholdMs)
                {
                    _logger.LogWarning(
                        "[Serial] Close {Port} LATE_COMPLETED closeId={CloseId} duration={Ms}ms — close exceeded the caller guard window and may have been abandoned by its caller",
                        portName, closeId, sw.ElapsedMilliseconds);
                }
                else
                {
                    _logger.LogInformation("[Serial] Close {Port} OK     closeId={CloseId} duration={Ms}ms", portName, closeId, sw.ElapsedMilliseconds);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning("[Serial] Close {Port} FAIL   closeId={CloseId} duration={Ms}ms reason={Reason}", portName, closeId, sw.ElapsedMilliseconds, ex.GetType().Name);
            }
            finally
            {
                try { portToClose.Dispose(); }
                catch { }
            }
        });
    }

    public void Dispose() => Close();
}
