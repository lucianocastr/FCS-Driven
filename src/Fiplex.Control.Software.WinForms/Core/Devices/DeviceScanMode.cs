namespace Fiplex.Control.Software.WinForms.Core.Devices;

/// <summary>
/// Defines the Fiplex device scan mode.
/// </summary>
public enum DeviceScanMode
{
    /// <summary>
    /// Quick scan: stops when the first valid device is found.
    /// Ideal for initial form load.
    /// </summary>
    QuickScan,

    /// <summary>
    /// Full scan: iterates through all available COM ports.
    /// Used when the user requests to identify all devices.
    /// </summary>
    FullScan
}
