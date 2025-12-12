using Fiplex.Control.Software.WinForms.Core.Commands.Interfaces;
using Microsoft.Extensions.Logging;

namespace Fiplex.Control.Software.WinForms.Core.Commands;

/// <summary>
/// Service that coordinates multiple device-specific response handlers.
/// Implements the Chain of Responsibility pattern to process responses.
///
/// tdev/ndev to apply specific processing.
/// </summary>
public class DeviceResponseProcessor
{
    private readonly IEnumerable<IDeviceResponseHandler> _handlers;
    private readonly ILogger<DeviceResponseProcessor> _logger;
    
    private string _currentDeviceType = string.Empty;
    private double _currentDeviceVersion = 0;
    private IDeviceResponseHandler? _activeHandler = null;

    public DeviceResponseProcessor(
        IEnumerable<IDeviceResponseHandler> handlers,
        ILogger<DeviceResponseProcessor> logger)
    {
        _handlers = handlers.OrderByDescending(h => h.Priority);
        _logger = logger;
    }

    /// <summary>
    /// Configures the processor for a specific device.
    /// Should be called after identifying the connected device.
    /// </summary>
    /// <param name="deviceType">Device type (1c, 2c, 5dm, etc.)</param>
    /// <param name="deviceVersion">Device version</param>
    public void ConfigureForDevice(string deviceType, double deviceVersion)
    {
        _currentDeviceType = deviceType;
        _currentDeviceVersion = deviceVersion;
        
        // Find applicable handler
        _activeHandler = _handlers.FirstOrDefault(h => 
            h.CanHandle(deviceType, deviceVersion));
        
        if (_activeHandler != null)
        {
            _logger.LogInformation(
                "Response handler activated for device {Type} v{Version}: {Handler}",
                deviceType, deviceVersion, _activeHandler.GetType().Name);
        }
        else
        {
            _logger.LogDebug(
                "No specific handler for device {Type} v{Version}, using standard processing",
                deviceType, deviceVersion);
        }
    }

    /// <summary>
    /// Processes a command response applying the specific handler if exists.
    /// </summary>
    /// <param name="command">Sent command</param>
    /// <param name="rawResponse">Raw response from device</param>
    /// <returns>Processed response</returns>
    public string ProcessResponse(string command, string rawResponse)
    {
        if (_activeHandler == null)
            return rawResponse;

        try
        {
            var processed = _activeHandler.ProcessResponse(command, rawResponse);
            
            if (processed != rawResponse)
            {
                _logger.LogDebug(
                    "Response processed by {Handler}: {Command} ({OrigLen} -> {NewLen} chars)",
                    _activeHandler.GetType().Name, command, 
                    rawResponse.Length, processed.Length);
            }
            
            return processed;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, 
                "Error in handler {Handler} processing {Command}, returning original response",
                _activeHandler.GetType().Name, command);
            return rawResponse;
        }
    }

    /// <summary>
    /// Resetea el estado de todos los handlers.
    /// Call when disconnecting from the device.
    /// </summary>
    public void Reset()
    {
        _currentDeviceType = string.Empty;
        _currentDeviceVersion = 0;
        _activeHandler = null;
        
        // Reset handlers that implement Reset method
        foreach (var handler in _handlers)
        {
            if (handler is Device1C_V22_ResponseHandler h22)
                h22.Reset();
            else if (handler is Device1C_V52_ResponseHandler h52)
                h52.Reset();
        }
        
        _logger.LogDebug("DeviceResponseProcessor reset");
    }

    /// <summary>
    /// Indicates whether there is an active handler for the current device.
    /// </summary>
    public bool HasActiveHandler => _activeHandler != null;

    /// <summary>
    /// Currently configured device type.
    /// </summary>
    public string CurrentDeviceType => _currentDeviceType;

    /// <summary>
    /// Version of the currently configured device.
    /// </summary>
    public double CurrentDeviceVersion => _currentDeviceVersion;
}
