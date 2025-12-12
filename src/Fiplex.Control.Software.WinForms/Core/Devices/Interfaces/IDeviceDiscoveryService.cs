using Fiplex.Control.Software.WinForms.Core.Devices;
using Fiplex.Control.Software.WinForms.Models;

namespace Fiplex.Control.Software.WinForms.Core.Devices.Interfaces;

public interface IDeviceDiscoveryService
{
    /// <summary>
    /// Scans COM ports for Fiplex devices.
    /// </summary>
    /// <param name="mode">Scan mode: QuickScan (first device) or FullScan (all).</param>
    /// <param name="progress">Optional callback to report progress.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>List of found devices.</returns>
    Task<List<DeviceInfo>> ScanPortsAsync(
        DeviceScanMode mode = DeviceScanMode.FullScan,
        IProgress<ScanProgress>? progress = null,
        CancellationToken ct = default);
}
