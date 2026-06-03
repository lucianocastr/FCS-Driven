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
                _logger.LogInformation("Serial port {Port} opened at {BaudRate} baud", portName, baudRate);
                _telemetry.IncrementPortOpenSuccess();
                return true;
            }
            catch (UnauthorizedAccessException ex)
            {
                // Port already in use by another process — expected during scan when
                // the connected device's COM port is encountered. WARN, not ERR.
                _logger.LogWarning("Failed to open {Port} — port in use: {Msg}", portName, ex.Message);
                _telemetry.IncrementPortOpenFailedAccessDenied();
                ErrorOccurred?.Invoke(ex);
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to open {Port}", portName);
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

    public void Close()
    {
        if (_serialPort != null)
        {
            try
            {
                if (_serialPort.IsOpen) 
                    _serialPort.Close();
                _serialPort.Dispose();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error closing port");
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

        return Task.Run(() =>
        {
            try { if (portToClose.IsOpen) portToClose.Close(); }
            catch { }
            finally
            {
                try { portToClose.Dispose(); }
                catch { }
            }
        });
    }

    public void Dispose() => Close();
}
