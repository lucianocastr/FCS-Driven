namespace Fiplex.Control.Software.WinForms.Models;

/// <summary>
/// Development mode configuration for testing without physical hardware.
/// </summary>
public class DevelopmentModeSettings
{
    /// <summary>
    /// Enables development mode without physical USB/Serial connection.
    /// Allows running and testing the application without connected devices.
    /// </summary>
    public bool NoUSB { get; set; } = false;

    /// <summary>
    /// Device model to simulate (2c1, 3d, 5dm, etc.).
    /// </summary>
    public string SimulatedDevice { get; set; } = "2c1";

    /// <summary>
    /// Virtual COM port (not actually opened).
    /// </summary>
    public string SimulatedComPort { get; set; } = "COM99";

    /// <summary>
    /// Simulated PathShared directory (must exist).
    /// </summary>
    public string SimulatedPathShared { get; set; } = "pages/htdocs_2c1";

    /// <summary>
    /// Enables detailed logging.
    /// </summary>
    public bool EnableLogging { get; set; } = true;
}
