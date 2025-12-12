// ==========================================================================
// Fiplex Control Software - Production Configuration Models
// ==========================================================================

namespace Fiplex.Control.Software.WinForms.Models;

/// <summary>
/// Represents a set of configuration commands for production tests.
/// </summary>
/// <remarks>
/// Used to send configuration command sequences to the device
/// during production line testing processes.
/// </remarks>
public class ProductionConfigData
{
    /// <summary>
    /// List of commands to send to the device.
    /// </summary>
    public List<ProductionCommand> Commands { get; } = new();

    /// <summary>
    /// Description of the configuration type.
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Device type for which this configuration applies.
    /// </summary>
    public string DeviceType { get; set; } = string.Empty;

    /// <summary>
    /// Device version.
    /// </summary>
    public double DeviceVersion { get; set; }
}

/// <summary>
/// Represents an individual production configuration command.
/// </summary>
public class ProductionCommand
{
    /// <summary>
    /// Command payload to send (hexadecimal string or text).
    /// </summary>
    public string Payload { get; set; } = string.Empty;

    /// <summary>
    /// Command description for logging and debugging.
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Indicates whether the command expects an ACK response from the device.
    /// </summary>
    public bool ExpectsAck { get; set; } = true;

    /// <summary>
    /// Timeout in seconds for the response.
    /// </summary>
    public int TimeoutSeconds { get; set; } = 10;

    /// <summary>
    /// Command prefix (for logging).
    /// For example: "C", "J", "O", "T", "!".
    /// </summary>
    public string CommandPrefix => Payload.Length > 0 ? Payload[0].ToString() : string.Empty;
}

/// <summary>
/// Defines the configuration modes for 2-channel tests.
/// </summary>
public enum TwoChannelMode
{
    /// <summary>
    /// Configures the channel at the start of the frequency band.
    /// </summary>
    BandStart = 0,

    /// <summary>
    /// Configures the channel at the center of the frequency band.
    /// </summary>
    BandCenter = 1,

    /// <summary>
    /// Configures the channel at the end of the frequency band.
    /// </summary>
    BandStop = 2
}

/// <summary>
/// Defines the number of channels for production tests.
/// </summary>
public enum ProductionChannels
{
    /// <summary>
    /// Configuration for FirstNet filter (exclusive for 1c v5 devices).
    /// </summary>
    FirstNet = 0,

    /// <summary>
    /// 1-channel configuration.
    /// </summary>
    OneChannel = 1,

    /// <summary>
    /// 2-channel configuration.
    /// </summary>
    TwoChannels = 2,

    /// <summary>
    /// 6-channel configuration.
    /// </summary>
    SixChannels = 6
}
