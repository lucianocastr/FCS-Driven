namespace Fiplex.Control.Software.WinForms.Models;

/// <summary>
/// Represents the current session state including connection status, device info, and runtime properties.
/// </summary>
/// <remarks>
/// This immutable record is used to track session state throughout the application.
/// Additional properties can be stored in the <see cref="Properties"/> dictionary.
/// </remarks>
public record SessionContext
{
    /// <summary>Gets the current connection state.</summary>
    public ConnectionState State { get; init; } = ConnectionState.Disconnected;

    /// <summary>Gets the currently connected device information, if any.</summary>
    public DeviceInfo? Device { get; init; }

    /// <summary>Gets a value indicating whether serial communication tracing is enabled.</summary>
    public bool TracesEnabled { get; init; }

    /// <summary>Gets the dictionary of additional session properties.</summary>
    public Dictionary<string, object> Properties { get; init; } = new();
}
