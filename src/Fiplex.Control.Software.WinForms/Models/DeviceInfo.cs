namespace Fiplex.Control.Software.WinForms.Models;

/// <summary>
/// Contains identification and configuration information for a Fiplex device.
/// </summary>
/// <remarks>
/// Device information is loaded from the fdevices.tsv catalog and matched to connected hardware.
/// The <see cref="TDev"/> and <see cref="NDev"/> properties determine which UI and behavior are used.
/// </remarks>
public record DeviceInfo
{
    /// <summary>Gets the unique device identifier (e.g., "Fiplex000000081").</summary>
    public string Id { get; init; } = string.Empty;

    /// <summary>Gets the human-readable device name (e.g., "Signal Booster Dual Band").</summary>
    public string NameTypeDevice { get; init; } = string.Empty;

    /// <summary>Gets the path to the device's web UI resources (htdocs folder).</summary>
    public string PathShared { get; init; } = string.Empty;

    /// <summary>Gets the device type code (e.g., "1c", "2c", "5dm").</summary>
    public string TDev { get; init; } = string.Empty;

    /// <summary>Gets the device firmware version number.</summary>
    public double NDev { get; init; }

    /// <summary>Gets a value indicating whether the device requires password authentication.</summary>
    public bool DeviceWithPass { get; init; }

    /// <summary>Gets the firmware frame version extracted from chars 7-11 of the device identification response. 0 for standard devices, >0 for SDRP/FL2 devices.</summary>
    public int FrVersion { get; init; }

    /// <summary>Gets the password authentication level: 0 = no password, 1 = standard password, 2 = SDRP reset procedure (frmResetPass).</summary>
    public int PassLevel { get; init; }

    /// <summary>Gets the maximum firmware frame version supported by this device type (VB6 1.12 bufftab(4)). 0 = no versioned htdocs. Used to cap FrVersion.</summary>
    public int MaxVersion { get; init; }

    /// <summary>Gets or sets the COM port number where the device is connected.</summary>
    public int ComPort { get; set; }

    /// <summary>Gets the display label shown in the device selector (e.g., "COM92 - Signal Booster"). Matches VB 1.9 format.</summary>
    public string DisplayLabel => $"COM{ComPort} - {NameTypeDevice}";
}
