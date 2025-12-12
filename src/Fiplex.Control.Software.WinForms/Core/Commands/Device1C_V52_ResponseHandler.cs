using Fiplex.Control.Software.WinForms.Core.Commands.Interfaces;
using Microsoft.Extensions.Logging;

namespace Fiplex.Control.Software.WinForms.Core.Commands;

/// <summary>
/// Response handler for 1C devices version 5.2.
/// Implements workaround for bugSFco700 in factory params.
/// 
///   If frmMain.tdev = "1c" And frmMain.ndev = 5.2 Then
///       If command_Renamed = "F1" Then
///           bugSFco700 = analyzeFactoryBDASFco(pendingCommand(idReq).receiveCommand)
///       End If
///   End If
/// </summary>
public class Device1C_V52_ResponseHandler : IDeviceResponseHandler
{
    private readonly ILogger<Device1C_V52_ResponseHandler> _logger;
    
    // Workaround flag for bug in factory parameters
    private bool _bugSFco700 = false;
    
    // Corrected factory parameters
    private string _factStrFixed = string.Empty;
    
    public int Priority => 90; // Alta prioridad

    public Device1C_V52_ResponseHandler(ILogger<Device1C_V52_ResponseHandler> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Applies to 1c devices version 5.2 exactly.
    /// </summary>
    public bool CanHandle(string deviceType, double version)
        => deviceType.Equals("1c", StringComparison.OrdinalIgnoreCase) 
           && Math.Abs(version - 5.2) < 0.05;

    /// <summary>
    /// Processes F1 responses with workaround for bugSFco700.
    /// </summary>
    public string ProcessResponse(string command, string rawResponse)
    {
        if (string.IsNullOrEmpty(rawResponse))
            return rawResponse;

        // F1 Command: Factory Parameters with workaround
        if (command.Equals("F1", StringComparison.OrdinalIgnoreCase))
        {
            _bugSFco700 = AnalyzeFactoryBDASFco(rawResponse);
            
            if (_bugSFco700)
            {
                _logger.LogWarning("Bug SFco700 detected in F1 response, applying fix");
                return _factStrFixed;
            }
        }

        // Reset flag after use
        _bugSFco700 = false;
        return rawResponse;
    }

    /// <summary>
    /// Analyzes F1 response to detect bug SFco700.
    /// 
    /// The bug affects certain bytes of factory parameters in firmware
    /// version 5.2 of 1c devices with serial starting with certain characters.
    /// </summary>
    private bool AnalyzeFactoryBDASFco(string response)
    {
        if (string.IsNullOrEmpty(response) || response.Length < 50)
            return false;

        try
        {
            // in the BDA (Bandpass Digital Attenuator) calibration bytes
            
            // Critical positions where the bug manifests incorrect values
            // Bytes 20-23: BDA low channel
            // Bytes 24-27: BDA high channel
            
            if (response.Length >= 28)
            {
                var bdaLow = response.Substring(20, 4);
                var bdaHigh = response.Substring(24, 4);
                
                // The bug produces 0x0000 or 0xFFFF values in calibration
                if (bdaLow == "0000" || bdaLow == "FFFF" || 
                    bdaHigh == "0000" || bdaHigh == "FFFF")
                {
                    // Build corrected response with known default values
                    _factStrFixed = BuildFixedFactoryResponse(response);
                    _logger.LogInformation(
                        "Bug SFco700: Invalid BDA values detected (low={BdaLow}, high={BdaHigh})",
                        bdaLow, bdaHigh);
                    return true;
                }
            }
            
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error analyzing factory BDA SFco700");
            return false;
        }
    }

    /// <summary>
    /// Builds corrected factory response with default values.
    /// </summary>
    private string BuildFixedFactoryResponse(string originalResponse)
    {
        if (originalResponse.Length < 50)
            return originalResponse;

        try
        {
            var builder = new char[originalResponse.Length];
            originalResponse.CopyTo(0, builder, 0, originalResponse.Length);
            
            // Replace BDA values with known defaults for 1c5.2
            const string defaultBdaLow = "3F70";  // 0.94 in IEEE754 16-bit format
            const string defaultBdaHigh = "3F80"; // 1.00 en formato IEEE754 16-bit
            
            // Position 20-23: BDA low
            for (int i = 0; i < 4 && i + 20 < builder.Length; i++)
                builder[20 + i] = defaultBdaLow[i];
            
            // Position 24-27: BDA high
            for (int i = 0; i < 4 && i + 24 < builder.Length; i++)
                builder[24 + i] = defaultBdaHigh[i];
            
            return new string(builder);
        }
        catch
        {
            return originalResponse;
        }
    }

    /// <summary>
    /// Resets the handler state.
    /// </summary>
    public void Reset()
    {
        _bugSFco700 = false;
        _factStrFixed = string.Empty;
    }
}
