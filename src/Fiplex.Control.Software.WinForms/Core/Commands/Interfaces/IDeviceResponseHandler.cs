namespace Fiplex.Control.Software.WinForms.Core.Commands.Interfaces;

/// <summary>
/// Strategy pattern for device-specific response processing.
/// </summary>
public interface IDeviceResponseHandler
{
    /// <summary>
    /// Determines if this handler can process responses from the specified device.
    /// </summary>
    /// <param name="deviceType">Device type (1c, 2c, 5dm, etc.)</param>
    /// <param name="version">Device version</param>
    /// <returns>True if this handler is applicable</returns>
    bool CanHandle(string deviceType, double version);
    
    /// <summary>
    /// Processes a command response, applying specific transformations.
    /// </summary>
    /// <param name="command">Command sent (C1, F1, U1, etc.)</param>
    /// <param name="rawResponse">Raw response from device</param>
    /// <returns>Processed response</returns>
    string ProcessResponse(string command, string rawResponse);
    
    /// <summary>
    /// Handler priority (higher = evaluated first).
    /// </summary>
    int Priority => 0;
}
