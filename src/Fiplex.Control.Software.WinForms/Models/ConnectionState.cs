namespace Fiplex.Control.Software.WinForms.Models;

/// <summary>
/// Represents the current state of the device connection lifecycle.
/// </summary>
public enum ConnectionState
{
    /// <summary>No device is connected.</summary>
    Disconnected,

    /// <summary>Scanning serial ports for available devices.</summary>
    Scanning,

    /// <summary>Establishing connection to a discovered device.</summary>
    Connecting,

    /// <summary>Successfully connected to a device.</summary>
    Connected,

    /// <summary>Configuring device settings and loading UI.</summary>
    Configuring,

    /// <summary>An error occurred during connection or communication.</summary>
    Error
}
