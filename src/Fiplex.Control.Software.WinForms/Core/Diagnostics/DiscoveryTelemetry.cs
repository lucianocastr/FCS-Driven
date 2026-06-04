namespace Fiplex.Control.Software.WinForms.Core.Diagnostics;

/// <summary>
/// Lock-free counters for discovery observability (ROB-001 Phase 1A · PR-1 · I-6).
///
/// Passive observation only — never alters discovery, serial or shutdown behavior.
/// All counters use Interlocked for atomic thread-safe updates with zero contention.
///
/// Consumed by DeviceDiscoveryService, SerialPortAdapter, and SimulatedSerialPort
/// as a singleton; values are cumulative for the lifetime of the process.
/// </summary>
public sealed class DiscoveryTelemetry
{
    // Scan-level
    private long _scansStarted;
    private long _scansCompleted;
    private long _scansAbortedByWatchdog;
    private long _totalScanDurationMs;

    // Port-open
    private long _portOpenSuccess;
    private long _portOpenFailedAccessDenied;
    private long _portOpenHungSkipped;
    private long _portOpenFailedOther;

    // Identification
    private long _identificationSuccess;
    private long _identificationTimeouts;
    private long _nonFiplexResponses;

    // Device
    private long _devicesFoundTotal;
    private long _devicesInCatalog;
    private long _devicesUnknown;

    // ──────────────── Scan-level ────────────────
    public void IncrementScansStarted() => Interlocked.Increment(ref _scansStarted);
    public void IncrementScansCompleted() => Interlocked.Increment(ref _scansCompleted);
    public void IncrementScansAbortedByWatchdog() => Interlocked.Increment(ref _scansAbortedByWatchdog);
    public void AddScanDurationMs(long ms) => Interlocked.Add(ref _totalScanDurationMs, ms);

    // ──────────────── Port-open ────────────────
    public void IncrementPortOpenSuccess() => Interlocked.Increment(ref _portOpenSuccess);
    public void IncrementPortOpenFailedAccessDenied() => Interlocked.Increment(ref _portOpenFailedAccessDenied);
    public void IncrementPortOpenHungSkipped() => Interlocked.Increment(ref _portOpenHungSkipped);
    public void IncrementPortOpenFailedOther() => Interlocked.Increment(ref _portOpenFailedOther);

    // ──────────────── Identification ────────────────
    public void IncrementIdentificationSuccess() => Interlocked.Increment(ref _identificationSuccess);
    public void IncrementIdentificationTimeouts() => Interlocked.Increment(ref _identificationTimeouts);
    public void IncrementNonFiplexResponses() => Interlocked.Increment(ref _nonFiplexResponses);

    // ──────────────── Device ────────────────
    public void IncrementDevicesFoundTotal() => Interlocked.Increment(ref _devicesFoundTotal);
    public void IncrementDevicesInCatalog() => Interlocked.Increment(ref _devicesInCatalog);
    public void IncrementDevicesUnknown() => Interlocked.Increment(ref _devicesUnknown);

    /// <summary>
    /// Atomic snapshot of all counters. Each field is individually atomic;
    /// the snapshot as a whole may not be globally consistent during concurrent
    /// activity but is sufficient for logging and V-ROB-001-06 cross-checking.
    /// </summary>
    public TelemetrySnapshot GetSnapshot() => new(
        ScansStarted: Interlocked.Read(ref _scansStarted),
        ScansCompleted: Interlocked.Read(ref _scansCompleted),
        ScansAbortedByWatchdog: Interlocked.Read(ref _scansAbortedByWatchdog),
        TotalScanDurationMs: Interlocked.Read(ref _totalScanDurationMs),
        PortOpenSuccess: Interlocked.Read(ref _portOpenSuccess),
        PortOpenFailedAccessDenied: Interlocked.Read(ref _portOpenFailedAccessDenied),
        PortOpenHungSkipped: Interlocked.Read(ref _portOpenHungSkipped),
        PortOpenFailedOther: Interlocked.Read(ref _portOpenFailedOther),
        IdentificationSuccess: Interlocked.Read(ref _identificationSuccess),
        IdentificationTimeouts: Interlocked.Read(ref _identificationTimeouts),
        NonFiplexResponses: Interlocked.Read(ref _nonFiplexResponses),
        DevicesFoundTotal: Interlocked.Read(ref _devicesFoundTotal),
        DevicesInCatalog: Interlocked.Read(ref _devicesInCatalog),
        DevicesUnknown: Interlocked.Read(ref _devicesUnknown));

    /// <summary>
    /// Formats a single-line cumulative summary for a completed scan.
    /// Prefix "[Telemetry]" makes it greppable and ignorable by parsers
    /// keyed on existing log categories.
    /// </summary>
    public string FormatScanSummary(string scanId, long scanDurationMs)
    {
        var s = GetSnapshot();
        return $"[Telemetry] Scan {scanId}: " +
               $"opens={{ok:{s.PortOpenSuccess}, denied:{s.PortOpenFailedAccessDenied}, " +
               $"hung:{s.PortOpenHungSkipped}, other:{s.PortOpenFailedOther}}} " +
               $"ident={{ok:{s.IdentificationSuccess}, timeout:{s.IdentificationTimeouts}, " +
               $"non_fiplex:{s.NonFiplexResponses}}} " +
               $"devices={{total:{s.DevicesFoundTotal}, catalog:{s.DevicesInCatalog}, " +
               $"unknown:{s.DevicesUnknown}}} " +
               $"scan_duration_ms={scanDurationMs}";
    }
}

/// <summary>
/// Immutable snapshot of <see cref="DiscoveryTelemetry"/> at a point in time.
/// </summary>
public sealed record TelemetrySnapshot(
    long ScansStarted,
    long ScansCompleted,
    long ScansAbortedByWatchdog,
    long TotalScanDurationMs,
    long PortOpenSuccess,
    long PortOpenFailedAccessDenied,
    long PortOpenHungSkipped,
    long PortOpenFailedOther,
    long IdentificationSuccess,
    long IdentificationTimeouts,
    long NonFiplexResponses,
    long DevicesFoundTotal,
    long DevicesInCatalog,
    long DevicesUnknown);
