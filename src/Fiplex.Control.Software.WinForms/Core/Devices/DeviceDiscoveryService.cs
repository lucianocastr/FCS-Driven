using System.IO.Ports;
using System.Runtime.InteropServices;
using System.Text;
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
/// - COM1-COM255 scan with Win32 validation
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
    private const int MinPort = 1;
    private const int MaxPort = 255;
    private const int MaxRetries = 5;
    private const int TimeoutSeconds = 3;
    private static readonly TimeSpan CheckComPortTimeout = TimeSpan.FromMilliseconds(300);
    private static readonly TimeSpan ExistsPortTimeout = TimeSpan.FromMilliseconds(500);
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

        _logger.LogInformation(
            "Starting device scan from COM{MinPort} to COM{MaxPort} (Mode: {Mode})",
            MinPort, MaxPort, mode);

        // Scan all COM ports
        for (int portNumber = MinPort; portNumber <= MaxPort; portNumber++)
        {
            ct.ThrowIfCancellationRequested();

            // Report progress
            progress?.Report(new ScanProgress(
                CurrentPort: $"COM{portNumber}",
                Completed: portNumber - MinPort + 1,
                Total: MaxPort - MinPort + 1,
                DevicesFound: foundDevices.Count
            ));

            // Verify port availability (timeout-guarded to avoid hanging on foreign COM drivers)
            var portAvailable = await ExecuteWithTimeoutAsync(
                () => CheckComPort(portNumber),
                CheckComPortTimeout,
                ct);

            if (!portAvailable)
            {
                _logger.LogTrace("COM{Port} not available at system level", portNumber);
                continue;
            }

            // Verify if the port can be opened (timeout-guarded)
            var canOpen = await ExecuteWithTimeoutAsync(
                () => ExistePort(portNumber),
                ExistsPortTimeout,
                ct);

            if (!canOpen)
            {
                _logger.LogTrace("COM{Port} cannot be opened (in use)", portNumber);
                continue;
            }

            // Attempt to identify device
            var device = await TryIdentifyDeviceAsync(portNumber, ct);
            if (device != null)
            {
                foundDevices.Add(device);
                _logger.LogInformation(
                    "Found device: {DeviceName} on COM{Port}",
                    device.NameTypeDevice,
                    device.ComPort);

                // QuickScan: detener al encontrar primer dispositivo
                if (stopOnFirstDevice)
                {
                    _logger.LogDebug("QuickScan mode: stopping after first device found");
                    break;
                }
            }
        }

        _logger.LogInformation("Scan complete: {Count} device(s) found", foundDevices.Count);
        return foundDevices;
    }

    /// <summary>
    /// Verifies port availability at Win32 level using CreateFile/CloseHandle.
    /// </summary>
    private bool CheckComPort(int portNumber)
    {
        try
        {
            const uint GENERIC_READ = 0x80000000;
            const uint GENERIC_WRITE = 0x40000000;
            const uint OPEN_EXISTING = 3;
            var INVALID_HANDLE_VALUE = new IntPtr(-1);

            var handle = NativeMethods.CreateFile(
                $"\\\\.\\COM{portNumber}",
                GENERIC_READ | GENERIC_WRITE,
                0,
                IntPtr.Zero,
                OPEN_EXISTING,
                0,
                IntPtr.Zero);

            if (handle == INVALID_HANDLE_VALUE)
            {
                return false;
            }

            NativeMethods.CloseHandle(handle);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogTrace(ex, "CheckComPort failed for COM{Port}", portNumber);
            return false;
        }
    }

    /// <summary>
    /// Checks if the port can be opened by attempting to open it with SerialPort.
    /// </summary>
    private bool ExistePort(int portNumber)
    {
        try
        {
            using var port = new SerialPort($"COM{portNumber}");
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
    private async Task<DeviceInfo?> TryIdentifyDeviceAsync(int portNumber, CancellationToken ct)
    {
        var portName = $"COM{portNumber}";

        // Retry up to MaxRetries
        for (int retry = 0; retry < MaxRetries; retry++)
        {
            try
            {
                // Open port
                var openTask = _serialPort.OpenAsync(portName, baudRate: 9600, ct: ct);
                var openTimeoutTask = Task.Delay(OpenPortTimeout, ct);
                if (await Task.WhenAny(openTask, openTimeoutTask) != openTask)
                {
                    _logger.LogTrace("{Port} retry {Retry}: open timeout", portName, retry);
                    continue;
                }

                var opened = await openTask;
                if (!opened)
                {
                    _logger.LogTrace("Failed to open {Port} on retry {Retry}", portName, retry);
                    return null;
                }

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
                    _logger.LogWarning("{Port} retry {Retry}: identification timeout guard triggered", portName, retry);

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

                _logger.LogTrace(
                    "{Port} retry {Retry}: response={Response}",
                    portName, retry, response);

                // Retry if response is NACK
                if (response.Equals("NACK", StringComparison.OrdinalIgnoreCase))
                {
                    continue; // Retry
                }

                // Retry when response is empty/timeout or noisy/partial not yet matching IDN.
                // This improves resilience after disconnect/reconnect cycles where first read can be unstable.
                if (string.IsNullOrWhiteSpace(response))
                {
                    _logger.LogTrace("{Port} retry {Retry}: empty response, retrying", portName, retry);
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
                    _logger.LogTrace(
                        "{Port} retry {Retry}: invalid response '{Response}', retrying",
                        portName,
                        retry,
                        response.Length > 100 ? response[..100] + "..." : response);

                    continue;
                }

                break;
            }
            catch (OperationCanceledException)
            {
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogTrace(ex, "Error identifying device on {Port} retry {Retry}", portName, retry);

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

    /// <summary>
    /// Native Win32 methods for port validation
    /// </summary>
    private static class NativeMethods
    {
        [DllImport("kernel32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        public static extern IntPtr CreateFile(
            string lpFileName,
            uint dwDesiredAccess,
            uint dwShareMode,
            IntPtr lpSecurityAttributes,
            uint dwCreationDisposition,
            uint dwFlagsAndAttributes,
            IntPtr hTemplateFile);

        [DllImport("kernel32.dll", SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        public static extern bool CloseHandle(IntPtr hObject);
    }
}

