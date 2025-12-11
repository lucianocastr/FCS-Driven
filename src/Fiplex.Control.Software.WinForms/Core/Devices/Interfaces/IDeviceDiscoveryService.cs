using Fiplex.Control.Software.WinForms.Core.Devices;
using Fiplex.Control.Software.WinForms.Models;

namespace Fiplex.Control.Software.WinForms.Core.Devices.Interfaces;

public interface IDeviceDiscoveryService
{
    /// <summary>
    /// Escanea puertos COM en busca de dispositivos Fiplex.
    /// </summary>
    /// <param name="mode">Modo de escaneo: QuickScan (primer dispositivo) o FullScan (todos).</param>
    /// <param name="progress">Callback opcional para reportar progreso.</param>
    /// <param name="ct">Token de cancelación.</param>
    /// <returns>Lista de dispositivos encontrados.</returns>
    Task<List<DeviceInfo>> ScanPortsAsync(
        DeviceScanMode mode = DeviceScanMode.FullScan,
        IProgress<ScanProgress>? progress = null,
        CancellationToken ct = default);
}
