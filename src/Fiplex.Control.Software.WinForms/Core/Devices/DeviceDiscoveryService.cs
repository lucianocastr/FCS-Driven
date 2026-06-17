using System.IO.Ports;
using System.Text;
using System.Diagnostics;
using Microsoft.Win32;
using Fiplex.Control.Software.WinForms.Core.Devices.Interfaces;
using Fiplex.Control.Software.WinForms.Core.Diagnostics;
using Fiplex.Control.Software.WinForms.Core.Serial.Implementation;
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
/// - Up to 2 retries in case of NACK
/// - 3 second timeout per port
/// - "Fiplex" response validation with length >= 15
/// - Device resolution from catalog
/// </summary>
public class DeviceDiscoveryService : IDeviceDiscoveryService
{
    private readonly ISerialPort _serialPort;
    private readonly ISerialCommandPipeline _pipeline;
    private readonly IDeviceCatalogService _catalog;
    private readonly DiscoveryTelemetry _telemetry;
    private readonly PortQuarantine _quarantine;
    private readonly ILogger<DeviceDiscoveryService> _logger;

    public event Action<string>? PortScanTrace;

    // Scan configuration constants
    // MaxRetries=5: VB6 1.12 parity (Loop While instRx="NACK" And num < 5).
    // Devices that respond on the first attempt are unaffected.
    // Slower devices (e.g. DAS Remote) that return NACK on early attempts get additional chances.
    private const int MaxRetries = 5;
    private const int TimeoutSeconds = 3;
    // OpenPortTimeout=4000ms: some USB-serial drivers (e.g. dual-port CP2105 adapters used by DAS Remote)
    // take >2s to complete Open(). At 2000ms the port was silently skipped with no retry and no trace log entry.
    private static readonly TimeSpan OpenPortTimeout = TimeSpan.FromMilliseconds(4000);
    private static readonly TimeSpan PortCloseTimeout = TimeSpan.FromMilliseconds(1500);
    private const int ScanWatchdogSeconds = 60;
    private const string IdentificationCommand = "I1";
    private const string ExpectedPrefix = "Fiplex";
    private const int MinResponseLength = 15;

    public DeviceDiscoveryService(
        ISerialPort serialPort,
        ISerialCommandPipeline pipeline,
        IDeviceCatalogService catalog,
        DiscoveryTelemetry telemetry,
        PortQuarantine quarantine,
        ILogger<DeviceDiscoveryService> logger)
    {
        _serialPort = serialPort ?? throw new ArgumentNullException(nameof(serialPort));
        _pipeline = pipeline ?? throw new ArgumentNullException(nameof(pipeline));
        _catalog = catalog ?? throw new ArgumentNullException(nameof(catalog));
        _telemetry = telemetry ?? throw new ArgumentNullException(nameof(telemetry));
        _quarantine = quarantine ?? throw new ArgumentNullException(nameof(quarantine));
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
        var scanStopwatch = Stopwatch.StartNew();
        _telemetry.IncrementScansStarted();

        _logger.LogInformation(
            "Starting device scan {ScanId} with {PortCount} installed COM candidate(s) (Mode: {Mode})",
            scanId, candidatePorts.Count, mode);

        if (candidatePorts.Count == 0)
        {
            _logger.LogInformation("Scan {ScanId}: no installed COM ports detected", scanId);
            return foundDevices;
        }

        using var watchdogCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        watchdogCts.CancelAfter(TimeSpan.FromSeconds(ScanWatchdogSeconds));
        var scanToken = watchdogCts.Token;

        // Scan only detected candidate ports
        for (int index = 0; index < candidatePorts.Count; index++)
        {
            if (scanToken.IsCancellationRequested)
            {
                _logger.LogWarning(
                    "[Scan {ScanId}] Watchdog triggered after {Seconds}s — scan aborted at port {Port} ({Done}/{Total})",
                    scanId, ScanWatchdogSeconds,
                    candidatePorts[index].PortName, index, candidatePorts.Count);
                _telemetry.IncrementScansAbortedByWatchdog();
                break;
            }

            var portStopwatch = Stopwatch.StartNew();
            var (portName, portNumber) = candidatePorts[index];

            // INIT-005 Phase 2 (M-2): never touch a port that already proved hostile.
            if (_quarantine.TryGet(portName, out var quarantineEntry))
            {
                _logger.LogInformation(
                    "[Scan {ScanId}] Port {Port} QUARANTINED (reason={Reason}, since={Since:HH:mm:ss}) — skipped",
                    scanId, portName, quarantineEntry!.Reason, quarantineEntry.Since);
                continue;
            }

            _logger.LogDebug("[Scan {ScanId}] {Port} - scan start", scanId, portName);

            // Report progress
            progress?.Report(new ScanProgress(
                CurrentPort: portName,
                Completed: index + 1,
                Total: candidatePorts.Count,
                DevicesFound: foundDevices.Count
            ));

            // Attempt to identify device
            var device = await TryIdentifyDeviceAsync(portName, portNumber, scanId, scanToken);
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
        scanStopwatch.Stop();
        _telemetry.IncrementScansCompleted();
        _telemetry.AddScanDurationMs(scanStopwatch.ElapsedMilliseconds);
        _logger.LogInformation("{Summary}", _telemetry.FormatScanSummary(scanId, scanStopwatch.ElapsedMilliseconds));
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

                // Open port — if it hangs beyond OpenPortTimeout the port is skipped entirely (no retry).
                // Hanging opens leave a blocked thread-pool thread; returning null prevents retry accumulation.
                var openTask = _serialPort.OpenAsync(portName, baudRate: 9600, ct: ct);
                if (await Task.WhenAny(openTask, Task.Delay(OpenPortTimeout, ct)) != openTask)
                {
                    _logger.LogWarning(
                        "[Scan {ScanId}] {Port} - open hung after {Ms}ms, skipping port",
                        scanId, portName, (int)OpenPortTimeout.TotalMilliseconds);
                    _telemetry.IncrementPortOpenHungSkipped();
                    return null;
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
                var timeoutTask = Task.Delay(TimeSpan.FromSeconds(TimeoutSeconds), ct);
                if (await Task.WhenAny(resultTask, timeoutTask) != resultTask)
                {
                    _logger.LogWarning(
                        "[Scan {ScanId}] {Port} retry {Retry} - identification timeout after {ElapsedMs} ms",
                        scanId,
                        portName,
                        retry + 1,
                        retryStopwatch.ElapsedMilliseconds);
                    _telemetry.IncrementIdentificationTimeouts();

                    _pipeline.CancelPendingCommands();

                    // CloseAsync now runs on a background thread. Wait up to PortCloseTimeout
                    // so the handle is released before the next retry opens the same port.
                    // If the driver hangs on close, we continue scan anyway.
                    if (_serialPort.IsOpen)
                    {
                        var closeTask = _serialPort.CloseAsync();
                        // INIT-005 Phase 1A (I-1): same abandonment decision as before,
                        // now logged. Correlates with the adapter's "Close START" by port
                        // and time window (one close per port at a time).
                        if (await Task.WhenAny(closeTask, Task.Delay(PortCloseTimeout, ct)) != closeTask)
                        {
                            _logger.LogWarning(
                                "[Scan {ScanId}] Close {Port} ABANDONED after={GuardMs}ms — close task did not complete within guard; handle may remain held for process lifetime",
                                scanId, portName, (int)PortCloseTimeout.TotalMilliseconds);
                            // INIT-005 Phase 2 (M-2 trigger b): an abandoned close means the
                            // handle is likely retained — reopening would AccessDenied forever.
                            _quarantine.Quarantine(portName, "close-abandoned");
                            return null;
                        }
                    }

                    break;
                }

                var result = await resultTask;

                // INIT-005 Phase 2 (M-2 trigger a): a write that exhausted its budget marks
                // the port hostile. No retry — re-writing would spawn another orphan. Close
                // best-effort under the same guard and quarantine the port for the process.
                if (result.Status == CommandResultStatus.WriteTimeout)
                {
                    _quarantine.Quarantine(portName, "write-abandoned");
                    if (_serialPort.IsOpen)
                    {
                        var hostileCloseTask = _serialPort.CloseAsync();
                        await Task.WhenAny(hostileCloseTask, Task.Delay(PortCloseTimeout, ct));
                    }
                    return null;
                }

                // Close port
                await _serialPort.CloseAsync();

                var response = (result.Data ?? string.Empty)
                    .Trim('\0', '\r', '\n', ' ');

                // VB6 1.12 parity: WriteLog("COM{i} Nretry={num} ans={instRx}") inside scan loop
                PortScanTrace?.Invoke($"{portName} Nretry={retry} ans={response}");

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

                // VB6 1.12 parity: empty response exits scan loop (no retry).
                if (string.IsNullOrWhiteSpace(response))
                {
                    _logger.LogDebug("[Scan {ScanId}] {Port} retry {Retry} - empty response", scanId, portName, retry + 1);
                    break;
                }

                // Verify minimum response length
                if (response.Length >= MinResponseLength)
                {
                    // Verify if response starts with "Fiplex"
                    if (response.StartsWith(ExpectedPrefix, StringComparison.OrdinalIgnoreCase))
                    {
                        _telemetry.IncrementIdentificationSuccess();
                        _telemetry.IncrementDevicesFoundTotal();
                        var frVersion = int.TryParse(response.Substring(6, 5), out var parsed) ? parsed : 0;

                        // Resolve device type from catalog
                        var deviceInfo = _catalog.ResolveDevice(response);
                        if (deviceInfo != null)
                        {
                            _telemetry.IncrementDevicesInCatalog();
                            // VB6 1.12 parity line 2743: If frversion > maxversion Then frversion = maxversion
                            var cappedFrVersion = frVersion > deviceInfo.MaxVersion
                                ? deviceInfo.MaxVersion
                                : frVersion;

                            _logger.LogDebug(
                                "[Scan {ScanId}] {Port} retry {Retry} - identified as {DeviceName} ({DeviceId}) FrVersion={FrVersion}(capped from {RawFrVersion})",
                                scanId,
                                portName,
                                retry + 1,
                                deviceInfo.NameTypeDevice,
                                deviceInfo.Id,
                                cappedFrVersion,
                                frVersion);

                            // VB6 1.12 parity line 2744: If frversion > 0 Then PathShared += "_" & CStr(frversion)
                            // Uses the POST-cap frVersion so it can never request a non-existent versioned dir.
                            var versionedPathShared = cappedFrVersion > 0
                                ? deviceInfo.PathShared + "_" + cappedFrVersion
                                : deviceInfo.PathShared;

                            return deviceInfo with
                            {
                                ComPort = portNumber,
                                FrVersion = cappedFrVersion,
                                PathShared = versionedPathShared
                            };
                        }
                        else
                        {
                            _logger.LogWarning(
                                "Device on {Port} returned valid IDN but not in catalog: {Idn}",
                                portName, response);
                            _telemetry.IncrementDevicesUnknown();

                            // VB6 1.12 parity: SetDeviceType fallback sets NameTypeDevice="Unknown device"
                            // and still adds the entry to cmbCOM. Do the same here.
                            return new DeviceInfo
                            {
                                Id = response,
                                NameTypeDevice = "Unknown device",
                                ComPort = portNumber,
                                FrVersion = frVersion
                            };
                        }
                    }
                    else
                    {
                        _telemetry.IncrementNonFiplexResponses();
                    }
                }

                // VB6 1.12 parity: invalid non-Fiplex response exits scan loop (no retry).
                _logger.LogDebug(
                    "[Scan {ScanId}] {Port} retry {Retry} - invalid non-Fiplex response '{Response}'",
                    scanId,
                    portName,
                    retry + 1,
                    response.Length > 100 ? response[..100] + "..." : response);

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

}

