using System.IO.Ports;
using System.Text;
using System.Diagnostics;
using Microsoft.Win32;
using Fiplex.Control.Software.WinForms.Core.Devices.Interfaces;
using Fiplex.Control.Software.WinForms.Core.Serial.Interfaces;
using Fiplex.Control.Software.WinForms.Core.Serial.Models;
using Fiplex.Control.Software.WinForms.Models;
using Microsoft.Extensions.Logging;

namespace Fiplex.Control.Software.WinForms.Core.Devices;

/// <summary>
/// Fiplex device discovery service for COM ports.
/// 
/// Implemented features:
/// - Installed COM ports scan (no fixed COM1-COM255 sweep)
/// - USB/Serial dynamic prioritization based on currently connected hardware
/// - I1 identification command
/// - Up to 5 retries in case of NACK
/// - 3 second timeout per port
/// - "Fiplex" response validation with length >= 15
/// - Device resolution from catalog
/// </summary>
public class DeviceDiscoveryService : IDeviceDiscoveryService
{
    private readonly ISerialPort _serialPort;
    private readonly ISerialCommandPipeline _pipeline;
    private readonly IDeviceCatalogService _catalog;
    private readonly ILogger<DeviceDiscoveryService> _logger;

    // Scan configuration constants
    private const int MaxRetries = 5;
    private const int TimeoutSeconds = 3;
    private static readonly TimeSpan ProbePortTimeout = TimeSpan.FromMilliseconds(500);
    private static readonly TimeSpan OpenPortTimeout = TimeSpan.FromMilliseconds(1200);
    private const string IdentificationCommand = "I1";
    private const string ExpectedPrefix = "Fiplex";
    private const int MinResponseLength = 15;

    public DeviceDiscoveryService(
        ISerialPort serialPort,
        ISerialCommandPipeline pipeline,
        IDeviceCatalogService catalog,
        ILogger<DeviceDiscoveryService> logger)
    {
        _serialPort = serialPort ?? throw new ArgumentNullException(nameof(serialPort));
        _pipeline = pipeline ?? throw new ArgumentNullException(nameof(pipeline));
        _catalog = catalog ?? throw new ArgumentNullException(nameof(catalog));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<List<DeviceInfo>> ScanPortsAsync(
        DeviceScanMode mode = DeviceScanMode.FullScan,
        IProgress<ScanProgress>? progress = null,
        CancellationToken ct = default)
    {
        var foundDevices = new List<DeviceInfo>();
        var stopOnFirstDevice = mode == DeviceScanMode.QuickScan;
        var scanId = Guid.NewGuid().ToString("N")[..8];
        var candidatePorts = GetCandidatePorts(scanId);

        _logger.LogInformation(
            "Starting device scan {ScanId} with {PortCount} installed COM candidate(s) (Mode: {Mode})",
            scanId, candidatePorts.Count, mode);

        if (candidatePorts.Count == 0)
        {
            _logger.LogInformation("Scan {ScanId}: no installed COM ports detected", scanId);
            return foundDevices;
        }

        // Scan only detected candidate ports
        for (int index = 0; index < candidatePorts.Count; index++)
        {
            ct.ThrowIfCancellationRequested();
            var portStopwatch = Stopwatch.StartNew();
            var (portName, portNumber) = candidatePorts[index];

            _logger.LogDebug("[Scan {ScanId}] {Port} - scan start", scanId, portName);

            // Report progress
            progress?.Report(new ScanProgress(
                CurrentPort: portName,
                Completed: index + 1,
                Total: candidatePorts.Count,
                DevicesFound: foundDevices.Count
            ));

            // Verify if the port can be opened (timeout-guarded)
            var canOpen = await ExecuteWithTimeoutAsync(
                () => CanOpenPort(portName),
                ProbePortTimeout,
                ct);

            _logger.LogDebug(
                "[Scan {ScanId}] {Port} - CanOpenPort => {Result} ({ElapsedMs} ms)",
                scanId,
                portName,
                canOpen,
                portStopwatch.ElapsedMilliseconds);

            if (!canOpen)
            {
                _logger.LogTrace("{Port} cannot be opened (in use)", portName);
                continue;
            }

            // Attempt to identify device
            var device = await TryIdentifyDeviceAsync(portName, portNumber, scanId, ct);
            if (device != null)
            {
                foundDevices.Add(device);
                _logger.LogInformation(
                    "[Scan {ScanId}] Found device: {DeviceName} on {Port} after {ElapsedMs} ms",
                    scanId,
                    device.NameTypeDevice,
                    portName,
                    portStopwatch.ElapsedMilliseconds);

                // QuickScan: detener al encontrar primer dispositivo
                if (stopOnFirstDevice)
                {
                    _logger.LogDebug("QuickScan mode: stopping after first device found");
                    break;
                }
            }
            else
            {
                _logger.LogDebug(
                    "[Scan {ScanId}] {Port} - no Fiplex device identified after {ElapsedMs} ms",
                    scanId,
                    portName,
                    portStopwatch.ElapsedMilliseconds);
            }
        }

        _logger.LogInformation("Scan {ScanId} complete: {Count} device(s) found", scanId, foundDevices.Count);
        return foundDevices;
    }

    private List<(string PortName, int PortNumber)> GetCandidatePorts(string scanId)
    {
        try
        {
            var installedPorts = SerialPort.GetPortNames()
                .Where(p => !string.IsNullOrWhiteSpace(p))
                .Select(p => p.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .Select(portName => new
                {
                    PortName = portName,
                    Parsed = TryParseComPortNumber(portName, out var portNumber),
                    PortNumber = portNumber
                })
                .Where(x => x.Parsed)
                .Select(x => (x.PortName, x.PortNumber))
                .ToList();

            if (installedPorts.Count == 0)
            {
                return new();
            }

            // Identify USB-like serial ports from registry to prioritize them first.
            var usbPortNumbers = GetUsbSerialPortNumbers();

            var ordered = installedPorts
                .OrderByDescending(p => usbPortNumbers.Contains(p.PortNumber))
                .ThenBy(p => p.PortNumber)
                .ToList();

            var usbCount = ordered.Count(p => usbPortNumbers.Contains(p.PortNumber));
            _logger.LogDebug(
                "[Scan {ScanId}] Candidate ports: {Ports} (USB-prioritized: {UsbCount})",
                scanId,
                string.Join(", ", ordered.Select(p => p.PortName)),
                usbCount);

            return ordered;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to enumerate installed COM ports. Falling back to raw GetPortNames order.");

            return SerialPort.GetPortNames()
                .Where(p => !string.IsNullOrWhiteSpace(p))
                .Select(p => p.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .Where(p => TryParseComPortNumber(p, out _))
                .Select(p => (PortName: p, PortNumber: ExtractComPortNumberOrZero(p)))
                .OrderBy(p => p.PortNumber)
                .ToList();
        }
    }

    /// <summary>
    /// Checks if the port can be opened by attempting to open it with SerialPort.
    /// </summary>
    private bool CanOpenPort(string portName)
    {
        try
        {
            using var port = new SerialPort(portName);
            port.Open();
            port.Close();
            return true;
        }
        catch
        {
            return false;
        }
    }

    /// <summary>
    /// Attempts to identify a Fiplex device on the port.
    /// Sends I1 command and analyzes the response to detect Fiplex devices.
    /// </summary>
    private async Task<DeviceInfo?> TryIdentifyDeviceAsync(string portName, int portNumber, string scanId, CancellationToken ct)
    {
        // Retry up to MaxRetries
        for (int retry = 0; retry < MaxRetries; retry++)
        {
            try
            {
                var retryStopwatch = Stopwatch.StartNew();
                _logger.LogDebug("[Scan {ScanId}] {Port} retry {Retry} - identify start", scanId, portName, retry + 1);

                // Open port
                var openTask = _serialPort.OpenAsync(portName, baudRate: 9600, ct: ct);
                var openTimeoutTask = Task.Delay(OpenPortTimeout, ct);
                if (await Task.WhenAny(openTask, openTimeoutTask) != openTask)
                {
                    _logger.LogDebug(
                        "[Scan {ScanId}] {Port} retry {Retry} - open timeout after {ElapsedMs} ms",
                        scanId,
                        portName,
                        retry + 1,
                        retryStopwatch.ElapsedMilliseconds);
                    continue;
                }

                var opened = await openTask;
                if (!opened)
                {
                    _logger.LogDebug(
                        "[Scan {ScanId}] {Port} retry {Retry} - open returned false after {ElapsedMs} ms",
                        scanId,
                        portName,
                        retry + 1,
                        retryStopwatch.ElapsedMilliseconds);
                    return null;
                }

                _logger.LogDebug(
                    "[Scan {ScanId}] {Port} retry {Retry} - port opened ({ElapsedMs} ms)",
                    scanId,
                    portName,
                    retry + 1,
                    retryStopwatch.ElapsedMilliseconds);

                // Wait 10ms before sending command
                await Task.Delay(10, ct);

                // Send identification command
                var command = new SerialCommand
                {
                    Payload = IdentificationCommand,
                    ExpectsAck = false,
                    ExpectsData = true,
                    AcceptPartialResponse = true,
                    MaxRetries = 1,
                    DataTimeout = TimeSpan.FromSeconds(TimeoutSeconds),
                    CancellationToken = ct
                };

                // Hard timeout guard: prevents a single COM port from freezing full scan.
                var resultTask = _pipeline.EnqueueCommandAsync(command);
                var timeoutTask = Task.Delay(TimeSpan.FromSeconds(TimeoutSeconds + 1), ct);
                if (await Task.WhenAny(resultTask, timeoutTask) != resultTask)
                {
                    _logger.LogWarning(
                        "[Scan {ScanId}] {Port} retry {Retry} - identification timeout guard after {ElapsedMs} ms",
                        scanId,
                        portName,
                        retry + 1,
                        retryStopwatch.ElapsedMilliseconds);

                    // Try to cancel blocked pipeline command(s) and continue scanning.
                    _pipeline.CancelPendingCommands();

                    if (_serialPort.IsOpen)
                    {
                        await _serialPort.CloseAsync();
                    }

                    continue;
                }

                var result = await resultTask;

                // Close port
                await _serialPort.CloseAsync();

                var response = (result.Data ?? string.Empty)
                    .Trim('\0', '\r', '\n', ' ');

                _logger.LogDebug(
                    "[Scan {ScanId}] {Port} retry {Retry} - raw response '{Response}' ({ElapsedMs} ms)",
                    scanId,
                    portName,
                    retry + 1,
                    response.Length > 120 ? response[..120] + "..." : response,
                    retryStopwatch.ElapsedMilliseconds);

                // Retry if response is NACK
                if (response.Equals("NACK", StringComparison.OrdinalIgnoreCase))
                {
                    _logger.LogDebug("[Scan {ScanId}] {Port} retry {Retry} - NACK", scanId, portName, retry + 1);
                    continue; // Retry
                }

                // Retry when response is empty/timeout or noisy/partial not yet matching IDN.
                // This improves resilience after disconnect/reconnect cycles where first read can be unstable.
                if (string.IsNullOrWhiteSpace(response))
                {
                    _logger.LogDebug("[Scan {ScanId}] {Port} retry {Retry} - empty response", scanId, portName, retry + 1);
                    continue;
                }

                // Verify minimum response length
                if (response.Length >= MinResponseLength)
                {
                    // Verify if response starts with "Fiplex"
                    if (response.StartsWith(ExpectedPrefix, StringComparison.OrdinalIgnoreCase))
                    {
                        // Resolve device type from catalog
                        var deviceInfo = _catalog.ResolveDevice(response);
                        if (deviceInfo != null)
                        {
                            _logger.LogDebug(
                                "[Scan {ScanId}] {Port} retry {Retry} - identified as {DeviceName} ({DeviceId})",
                                scanId,
                                portName,
                                retry + 1,
                                deviceInfo.NameTypeDevice,
                                deviceInfo.Id);

                            return deviceInfo with { ComPort = portNumber };
                        }
                        else
                        {
                            _logger.LogWarning(
                                "Device on {Port} returned valid IDN but not in catalog: {Idn}",
                                portName, response);
                        }
                    }
                }

                // Invalid response. Retry while attempts remain to tolerate transient post-disconnect noise.
                if (retry < MaxRetries - 1)
                {
                    _logger.LogDebug(
                        "[Scan {ScanId}] {Port} retry {Retry} - invalid non-Fiplex response '{Response}', retrying",
                        scanId,
                        portName,
                        retry + 1,
                        response.Length > 100 ? response[..100] + "..." : response);

                    continue;
                }

                _logger.LogDebug(
                    "[Scan {ScanId}] {Port} retry {Retry} - exhausted identification attempts",
                    scanId,
                    portName,
                    retry + 1);

                break;
            }
            catch (OperationCanceledException)
            {
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "[Scan {ScanId}] {Port} retry {Retry} - identification exception", scanId, portName, retry + 1);

                // Ensure port is closed
                try
                {
                    if (_serialPort.IsOpen)
                    {
                        await _serialPort.CloseAsync();
                    }
                }
                catch { }
            }
        }

        return null;
    }

    private static bool TryParseComPortNumber(string portName, out int portNumber)
    {
        portNumber = 0;

        if (string.IsNullOrWhiteSpace(portName))
        {
            return false;
        }

        var normalized = portName.Trim();
        if (!normalized.StartsWith("COM", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        return int.TryParse(normalized.AsSpan(3), out portNumber) && portNumber > 0;
    }

    private static int ExtractComPortNumberOrZero(string portName)
    {
        return TryParseComPortNumber(portName, out var portNumber) ? portNumber : 0;
    }

    private HashSet<int> GetUsbSerialPortNumbers()
    {
        var usbPorts = new HashSet<int>();

        try
        {
            using var serialCommKey = Registry.LocalMachine.OpenSubKey(@"HARDWARE\DEVICEMAP\SERIALCOMM");
            if (serialCommKey == null)
            {
                return usbPorts;
            }

            foreach (var devicePath in serialCommKey.GetValueNames())
            {
                if (serialCommKey.GetValue(devicePath) is not string portName)
                {
                    continue;
                }

                if (!TryParseComPortNumber(portName, out var portNumber))
                {
                    continue;
                }

                // Common USB-serial signatures in Windows serial map entries.
                if (devicePath.Contains("USBSER", StringComparison.OrdinalIgnoreCase)
                    || devicePath.Contains("USB", StringComparison.OrdinalIgnoreCase)
                    || devicePath.Contains("VCP", StringComparison.OrdinalIgnoreCase))
                {
                    usbPorts.Add(portNumber);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Unable to classify USB serial ports from registry");
        }

        return usbPorts;
    }

    /// <summary>
    /// Executes a potentially blocking synchronous COM probe with timeout guard.
    /// If timeout is reached, returns false and allows scan to continue.
    /// </summary>
    private async Task<bool> ExecuteWithTimeoutAsync(
        Func<bool> operation,
        TimeSpan timeout,
        CancellationToken ct)
    {
        try
        {
            var operationTask = Task.Run(operation, ct);
            var timeoutTask = Task.Delay(timeout, ct);

            if (await Task.WhenAny(operationTask, timeoutTask) != operationTask)
            {
                return false;
            }

            return await operationTask;
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch
        {
            return false;
        }
    }
}

