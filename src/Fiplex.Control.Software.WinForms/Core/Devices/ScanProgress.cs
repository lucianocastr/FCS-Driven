namespace Fiplex.Control.Software.WinForms.Core.Devices;

/// <summary>
/// Represents the progress of a serial port scan operation.
/// </summary>
/// <param name="CurrentPort">The name of the port currently being scanned.</param>
/// <param name="Completed">Number of ports already scanned.</param>
/// <param name="Total">Total number of ports to scan.</param>
/// <param name="DevicesFound">Number of devices discovered so far.</param>
public record ScanProgress(
    string CurrentPort,
    int Completed,
    int Total,
    int DevicesFound
);
