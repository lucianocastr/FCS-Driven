using System.Collections.Concurrent;
using Microsoft.Extensions.Logging;

namespace Fiplex.Control.Software.WinForms.Core.Serial.Implementation;

/// <summary>
/// Process-lifetime registry of serial ports that proved hostile (INIT-005 Phase 2 · M-2).
/// </summary>
/// <remarks>
/// A port enters quarantine when a write or a close on it had to be abandoned
/// (the driver call never completed — Phase 1A findings F-002/F-008). A quarantined
/// port is never touched again by discovery or connection for the remainder of the
/// process: re-opening it would fail with AccessDenied against our own retained
/// handle, and re-writing to it would only spawn another orphaned task.
/// Quarantine is intentionally conservative: ordinary identification timeouts
/// (device absent or silent) never quarantine a port.
/// </remarks>
public sealed class PortQuarantine
{
    public sealed record QuarantineEntry(string Reason, DateTime Since);

    private readonly ConcurrentDictionary<string, QuarantineEntry> _ports =
        new(StringComparer.OrdinalIgnoreCase);
    private readonly ILogger<PortQuarantine> _logger;

    public PortQuarantine(ILogger<PortQuarantine> logger)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>Puts a port in quarantine. Idempotent — the first reason wins.</summary>
    public void Quarantine(string portName, string reason)
    {
        if (_ports.TryAdd(portName, new QuarantineEntry(reason, DateTime.Now)))
        {
            _logger.LogWarning(
                "Port {Port} QUARANTINED reason={Reason} — port will not be touched again for the remainder of the process",
                portName, reason);
        }
    }

    public bool IsQuarantined(string portName) => _ports.ContainsKey(portName);

    public bool TryGet(string portName, out QuarantineEntry? entry) =>
        _ports.TryGetValue(portName, out entry);

    public int Count => _ports.Count;
}
