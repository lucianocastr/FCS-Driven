using Fiplex.Control.Software.WinForms.Core.Commands.Interfaces;
using Microsoft.Extensions.Logging;

namespace Fiplex.Control.Software.WinForms.Core.Commands;

/// <summary>
/// Response handler for 1C devices version 2.2.
/// Implements special SCA (Single Channel Activation) logic.
/// 
///   If frmMain.tdev = "1c" And frmMain.ndev = 2.2 Then
///       If command_Renamed = "C1" Then
///           bres = IsSCAConfCHTestActivated(pendingCommand(idReq).receiveCommand)
///           pendingCommand(idReq).receiveCommand = confSCA
///       End If
///   End If
/// </summary>
public class Device1C_V22_ResponseHandler : IDeviceResponseHandler
{
    private readonly ILogger<Device1C_V22_ResponseHandler> _logger;
    
    // confSCA variable - stores processed SCA configuration
    private string _confSCA = string.Empty;
    
    // Channel test activation state
    private short _chTestActivated = -1;
    
    public int Priority => 100; // High priority for device-specific handler

    public Device1C_V22_ResponseHandler(ILogger<Device1C_V22_ResponseHandler> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Applies to 1c devices version 2.2 exactly.
    /// </summary>
    public bool CanHandle(string deviceType, double version)
        => deviceType.Equals("1c", StringComparison.OrdinalIgnoreCase) 
           && Math.Abs(version - 2.2) < 0.05;

    /// <summary>
    /// Processes C1 and F1 responses with special SCA logic.
    /// </summary>
    public string ProcessResponse(string command, string rawResponse)
    {
        if (string.IsNullOrEmpty(rawResponse))
            return rawResponse;

        // C1 Command: Configuration Read with SCA
        if (command.Equals("C1", StringComparison.OrdinalIgnoreCase))
        {
            var isActivated = IsSCAConfCHTestActivated(rawResponse);
            _logger.LogDebug("IsSCAConfCHTestActivated={IsActivated} for C1", isActivated);
            
            // Return processed confSCA if activated
            return isActivated ? _confSCA : rawResponse;
        }

        // F1 Command: Factory Read with SCA
        if (command.Equals("F1", StringComparison.OrdinalIgnoreCase))
        {
            var isActivated = IsSCAFactCHTestActivated(rawResponse);
            _logger.LogDebug("IsSCAFactCHTestActivated={IsActivated} for F1", isActivated);
            // F1 does not modify the response, only updates state
        }

        return rawResponse;
    }

    /// <summary>
    /// Determines if the SCA test channel configuration is activated.
    /// 
    /// Analyzes C1 hex response to extract test channel activation state.
    /// </summary>
    private bool IsSCAConfCHTestActivated(string response)
    {
        if (string.IsNullOrEmpty(response) || response.Length < 10)
        {
            _logger.LogWarning("C1 response too short for SCA analysis: {Length} chars", 
                response?.Length ?? 0);
            return false;
        }

        try
        {
            // The activation flag position depends on the 1c2.2 response format
            
            // Byte 8-9 contains active channel flag (specific position for 1c2.2)
            // Format: hex response where each 2 chars = 1 byte
            if (response.Length >= 18)
            {
                // Position 8 (bytes 16-17 of hex string)
                var chFlagHex = response.Substring(16, 2);
                var chFlag = Convert.ToInt32(chFlagHex, 16);
                
                // If bit 0 is set, the channel test is enabled
                _chTestActivated = (short)(chFlag & 0x01);
                
                if (_chTestActivated == 1)
                {
                    // Process and store confSCA
                    _confSCA = ProcessSCAConfiguration(response);
                    _logger.LogInformation("SCA test channel activated, confSCA stored");
                    return true;
                }
            }
            
            _chTestActivated = -1;
            _confSCA = string.Empty;
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing SCA from C1 response");
            return false;
        }
    }

    /// <summary>
    /// Determines if the factory SCA parameters are activated.
    /// </summary>
    private bool IsSCAFactCHTestActivated(string response)
    {
        if (string.IsNullOrEmpty(response) || response.Length < 10)
            return false;

        try
        {
            // Similar analysis to C1 but for factory parameters
            // 1c2.2 devices have specific format in F1
            if (response.Length >= 12)
            {
                var factFlagHex = response.Substring(10, 2);
                var factFlag = Convert.ToInt32(factFlagHex, 16);
                
                return (factFlag & 0x80) != 0; // Bit 7 indica factory SCA
            }
            
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing SCA from F1 response");
            return false;
        }
    }

    /// <summary>
    /// Processes the complete SCA configuration from C1 response.
    /// </summary>
    private string ProcessSCAConfiguration(string response)
    {
        // to reflect the test channel activation state
        
        if (response.Length < 20)
            return response;

        try
        {
            // Create modified copy with processed SCA flag
            var builder = new char[response.Length];
            response.CopyTo(0, builder, 0, response.Length);
            
            // Position 18-19: Modify to indicate processed SCA
            // This depends on the specific 1c2.2 protocol
            builder[18] = '0';
            builder[19] = '1';
            
            return new string(builder);
        }
        catch
        {
            return response;
        }
    }

    /// <summary>
    /// Resets the SCA state.
    /// </summary>
    public void Reset()
    {
        _confSCA = string.Empty;
        _chTestActivated = -1;
    }
}
