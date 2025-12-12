using Microsoft.Extensions.Logging;

namespace Fiplex.Control.Software.WinForms.Core.Commands;

/// <summary>
/// Formats serial responses according to settings.cfg specifications
/// Implements "splitwith3tabs" format for JavaScript frontend compatibility
/// 
/// Some devices (1c5.2, etc.) already send the response WITH triple tabs and remote data.
/// In that case, we should NOT reformat - just pass the response as is.
/// Other devices (5dm1, etc.) send only master data and require us to add
/// empty remote frames.
/// </summary>
public class ResponseFormatter
{
    private readonly ILogger<ResponseFormatter> _logger;
    
    // Separador triple tab usado en protocolo Fiplex
    private const string TripleTab = "\t\t\t";

    public ResponseFormatter(ILogger<ResponseFormatter> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Applies splitwith3tabs format to raw hex response.
    /// Expected format for JavaScript: frames separated by "\t\t\t", each frame with internal structure separated by "\t"
    /// For global_conf (U1): Master + 8 Remotes
    /// 
    /// - If the response ALREADY contains triple tabs, the device already formatted → pass without modifying
    /// - If the response does NOT contain triple tabs but has extra data at the end (remote IDs),
    ///   extract that data and format correctly
    /// - Only generate "0000" for remotes when the device did not send remote information
    /// </summary>
    /// <param name="rawResponse">Complete hex response from the device</param>
    /// <param name="lengthSpec">Format specification (e.g.: "splitwith3tabs:3104,2870,2528,4")</param>
    /// <param name="nrOfRemotes">Number of remote devices (typically 8)</param>
    /// <returns>Formatted response with tab separators</returns>
    public string FormatResponse(string rawResponse, string lengthSpec, int nrOfRemotes = 8)
    {
        if (string.IsNullOrEmpty(rawResponse))
        {
            _logger.LogWarning("FormatResponse: empty response");
            return rawResponse;
        }

        if (!lengthSpec.StartsWith("splitwith3tabs:", StringComparison.OrdinalIgnoreCase))
        {
            // Does not require special formatting
            return rawResponse;
        }
        if (rawResponse.Contains(TripleTab))
        {
            _logger.LogDebug("FormatResponse: Response already contains triple tabs - preserving original format");
            return rawResponse;
        }

        try
        {
            // Parse: "splitwith3tabs:3104,2870,2528,4" -> [3104, 2870, 2528, 4]
            // Donde: masterLen, remoteLen1, remoteLen2, headerLen
            var specParts = lengthSpec.Substring("splitwith3tabs:".Length).Split(',');
            if (specParts.Length < 1)
            {
                _logger.LogError("FormatResponse: invalid spec, expected at least 1 value: {LengthSpec}", lengthSpec);
                return rawResponse;
            }

            int expectedMasterLength = int.Parse(specParts[0]);
            
            // Length of each remote ID (typically 4 hex chars: "0100", "0200", etc.)
            const int remoteIdLength = 4;
            int expectedTotalWithRemotes = expectedMasterLength + (nrOfRemotes * remoteIdLength);

            _logger.LogDebug("FormatResponse: Respuesta raw={RawLen} chars, esperado master={Expected}, con remotes={TotalExpected}",
                rawResponse.Length, expectedMasterLength, expectedTotalWithRemotes);

            var frames = new List<string>();

            // Frame 0: Master
            string masterFrame = rawResponse.Length >= expectedMasterLength 
                ? rawResponse.Substring(0, expectedMasterLength)
                : rawResponse;
            
            frames.Add(masterFrame);
            _logger.LogDebug("FormatResponse: Master frame ({Length} chars)", masterFrame.Length);
            // Some devices send: [master data][0100][0200][0300]...[0800]
            // Instead of sending with tabs like: [master]\t\t\t[remote1]\t\t\t[remote2]...
            if (rawResponse.Length >= expectedTotalWithRemotes)
            {
                // The device included remote IDs - extract them
                _logger.LogDebug("FormatResponse: Device included remote IDs at the end");
                
                int remoteDataStart = expectedMasterLength;
                for (int i = 0; i < nrOfRemotes; i++)
                {
                    int startPos = remoteDataStart + (i * remoteIdLength);
                    if (startPos + remoteIdLength <= rawResponse.Length)
                    {
                        string remoteId = rawResponse.Substring(startPos, remoteIdLength);
                        frames.Add(remoteId);
                        _logger.LogDebug("FormatResponse: Remote {Index} ID: {RemoteId}", i + 1, remoteId);
                    }
                    else
                    {
                        frames.Add("0000"); // Fallback if not enough data
                        _logger.LogDebug("FormatResponse: Remote {Index} frame (no data, using 0000)", i + 1);
                    }
                }
            }
            else
            {
                // The device did NOT include remote data - generate empty frames
                // This is typical when no remotes are connected
                _logger.LogDebug("FormatResponse: Device did not include remote IDs, generating empty frames");
                
                for (int i = 0; i < nrOfRemotes; i++)
                {
                    // Header of 4 hex characters: "0000" = not connected
                    // JavaScript checks substring(2,4) == "01" to mark as connected
                    frames.Add("0000");
                    _logger.LogDebug("FormatResponse: Remote {Index} frame (empty/disconnected)", i + 1);
                }
            }

            // Unir frames con triple tab
            string formatted = string.Join(TripleTab, frames);
            
            _logger.LogInformation("FormatResponse: {FrameCount} frames formateados ({TotalChars} chars -> {FormattedChars} chars)",
                frames.Count, rawResponse.Length, formatted.Length);

            return formatted;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "FormatResponse: Error applying splitwith3tabs to response of {Length} chars", rawResponse.Length);
            return rawResponse; // Fallback: return unformatted
        }
    }
}
