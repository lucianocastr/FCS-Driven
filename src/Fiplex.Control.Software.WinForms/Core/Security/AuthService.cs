using Fiplex.Control.Software.WinForms.Core.Security.Interfaces;
using Fiplex.Control.Software.WinForms.Core.Serial.Interfaces;
using Fiplex.Control.Software.WinForms.Core.Serial.Models;
using Fiplex.Control.Software.WinForms.Models;
using Microsoft.Extensions.Logging;

namespace Fiplex.Control.Software.WinForms.Core.Security;

public class AuthService : IAuthService
{
    private readonly ISerialCommandPipeline _pipeline;
    private readonly ILogger<AuthService> _logger;
    
    /// <summary>
    /// Microcontroller version extracted from V1 response.
    /// </summary>
    public int UcVersion { get; private set; }
    
    /// <summary>
    /// Raw response from V1 command for diagnostics.
    /// </summary>
    public string LastV1Response { get; private set; } = string.Empty;

    public AuthService(
        ISerialCommandPipeline pipeline,
        ILogger<AuthService> logger)
    {
        _pipeline = pipeline;
        _logger = logger;
    }

    public async Task<bool> AuthenticateAsync(string password, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(password))
        {
            _logger.LogWarning("Empty password provided");
            return false;
        }

        _logger.LogInformation("Attempting authentication");

        var command = new SerialCommand
        {
            Payload = $"*0{password}",
            ExpectsAck = true,
            ExpectsData = false,
            MaxRetries = 2,
            AckTimeout = TimeSpan.FromSeconds(1),
            CancellationToken = ct
        };

        var result = await _pipeline.EnqueueCommandAsync(command);

        if (result.Success)
        {
            _logger.LogInformation("Authentication succeeded");
        }
        else
        {
            _logger.LogWarning("Authentication failed: {Status}", result.Status);
        }

        return result.Success;
    }

    public async Task<string> GetVersionAsync(CancellationToken ct = default)
    {
        _logger.LogDebug("Requesting firmware version");

        var command = new SerialCommand
        {
            Payload = "V1",
            ExpectsAck = true,
            ExpectsData = true,
            MaxRetries = 3,
            AckTimeout = TimeSpan.FromMilliseconds(800),
            DataTimeout = TimeSpan.FromSeconds(2),
            CancellationToken = ct
        };

        var result = await _pipeline.EnqueueCommandAsync(command);

        if (result.Success)
        {
            LastV1Response = result.Data;
            ExtractUcVersion(result.Data);
            _logger.LogInformation("Firmware version: {Version}, ucVersion: 0x{UcVersion:X}", result.Data, UcVersion);
            return result.Data;
        }

        _logger.LogWarning("Failed to get version: {Status}", result.Status);
        return string.Empty;
    }

    public async Task<bool> CheckDeviceAliveAsync(CancellationToken ct = default)
    {
        var command = new SerialCommand
        {
            Payload = "N1",
            ExpectsAck = true,
            ExpectsData = false,
            MaxRetries = 1,
            AckTimeout = TimeSpan.FromMilliseconds(500),
            CancellationToken = ct
        };

        var result = await _pipeline.EnqueueCommandAsync(command);
        return result.Success;
    }

    /// <inheritdoc/>
    public async Task<AuthResult> CheckAuthenticationRequirementAsync(CancellationToken ct = default)
    {
        try
        {
            _logger.LogInformation("Verifying authentication requirement (V1 command)");

            // Create V1 command with 2-3 second timeout
            // CRITICAL: Short timeout only for this command 
            var command = new SerialCommand
            {
                Payload = "V1",
                ExpectsAck = true,
                ExpectsData = true,
                MaxRetries = 3,
                AckTimeout = TimeSpan.FromMilliseconds(800),
                DataTimeout = TimeSpan.FromSeconds(3),
                CancellationToken = ct
            };

            var result = await _pipeline.EnqueueCommandAsync(command);

            // STEP 1: Verify if there was a successful command result
            if (!result.Success)
            {
                _logger.LogWarning("Device not responding to V1 command (Status: {Status})", result.Status);
                return AuthResult.DeviceNotResponding;
            }

            // If there is data, analyze it (case for devices that return V1 text)
            if (!string.IsNullOrWhiteSpace(result.Data))
            {
                // Save response and extract ucVersion
                LastV1Response = result.Data;
                ExtractUcVersion(result.Data);

                // STEP 2: Analyze response to detect "INVALID" (case-insensitive)
                // If contains "INVALID" → requires password
                if (result.Data.Contains("INVALID", StringComparison.OrdinalIgnoreCase))
                {
                    _logger.LogInformation("Device requires password (response contains INVALID)");
                    return AuthResult.PasswordRequired;
                }

                // STEP 3: Valid response without "INVALID" → no authentication required
                _logger.LogInformation(
                    "Device does not require password (valid V1: {Response}, ucVersion: 0x{UcVersion:X})",
                    result.Data.Length > 50 ? result.Data.Substring(0, 50) + "..." : result.Data,
                    UcVersion);

                return AuthResult.NoAuthRequired;
            }

            // Special case: Success == true but empty Data.
            // This occurs when V1 without password returned INVALID CREDENTIALS and the retry
            // authenticated (*0{password}1) only responded ACK without data.
            // At this point we are already authenticated correctly.
            _logger.LogInformation(
                "Authentication completed with ACK without data in V1. Assuming password requirement resolved.");
            return AuthResult.NoAuthRequired;
        }
        catch (OperationCanceledException)
        {
            _logger.LogWarning("Authentication verification cancelled");
            return AuthResult.DeviceNotResponding;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Critical error verifying authentication requirement");
            return AuthResult.DeviceNotResponding;
        }
    }
    
    /// <summary>
    /// Extracts ucVersion from V1 response.
    /// ucVersion = AsciiToInt(Mid(verstr, 7, 2)) * 256 + AsciiToInt(Mid(verstr, 9, 2))
    /// </summary>
    /// <param name="v1Response">V1 command response</param>
    private void ExtractUcVersion(string v1Response)
    {
        UcVersion = 0;
        
        if (string.IsNullOrEmpty(v1Response) || v1Response.Length < 10)
        {
            _logger.LogWarning("V1 response too short to extract ucVersion: {Length} chars", 
                v1Response?.Length ?? 0);
            return;
        }
        
        try
        {
            // Mid(verstr, 7, 2) = substring index 6-7 (0-based)
            // Mid(verstr, 9, 2) = substring index 8-9 (0-based)
            var highByteStr = v1Response.Substring(6, 2);
            var lowByteStr = v1Response.Substring(8, 2);
            
            // AsciiToInt convierte 2 caracteres hex a entero
            var highByte = AsciiToInt(highByteStr);
            var lowByte = AsciiToInt(lowByteStr);
            
            UcVersion = (highByte * 256) + lowByte;
            
            _logger.LogDebug("ucVersion extracted: 0x{UcVersion:X} (high=0x{High:X2}, low=0x{Low:X2})", 
                UcVersion, highByte, lowByte);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error extracting ucVersion from V1 response: {Response}", 
                v1Response.Length > 20 ? v1Response.Substring(0, 20) + "..." : v1Response);
        }
    }
    
    /// <summary>
    /// Converts 2 hex ASCII characters to integer.
    /// Equivalent to AsciiToInt() in mdlStringFunctions.vb
    /// </summary>
    private static int AsciiToInt(string hexStr)
    {
        if (string.IsNullOrEmpty(hexStr) || hexStr.Length < 2)
            return 0;
        
        return Convert.ToInt32(hexStr.Substring(0, 2), 16);
    }
}
