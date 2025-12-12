using Microsoft.Extensions.Logging;
using Fiplex.Control.Software.WinForms.Core.Config.Interfaces;
using Fiplex.Control.Software.WinForms.Core.Serial.Interfaces;
using Fiplex.Control.Software.WinForms.Core.Serial.Models;
using Fiplex.Control.Software.WinForms.Models;

namespace Fiplex.Control.Software.WinForms.Core.Config;

/// <summary>
/// Service for managing the Ethernet Rabbit module.
/// 
/// The Ethernet module is controlled via bit 7 of position 93-94 in the factory string:
/// - Bit 7 = 0: Ethernet INSTALLED
/// - Bit 7 = 1: Ethernet NOT INSTALLED (disabled)
/// 
/// For PSC Master devices (5dm), double writing with alternate headers is required.
/// </summary>
public class EthernetModuleService : IEthernetModuleService
{
    private readonly ISerialCommandPipeline _pipeline;
    private readonly ILogger<EthernetModuleService> _logger;
    
    /// <summary>
    /// Minimum required factory string length.
    /// </summary>
    private const int MinFactoryStringLength = 482;
    
    /// <summary>
    /// Ethernet mask byte position.
    /// In C# (0-indexed) = 92.
    /// </summary>
    private const int EthernetMaskPosition = 92;
    
    /// <summary>
    /// CommonUl byte position.
    /// In C# (0-indexed) = 2.
    /// </summary>
    private const int CommonUlPosition = 2;
    
    /// <summary>
    /// Bit indicating Ethernet disabled (0x80 = bit 7).
    /// </summary>
    private const byte EthernetDisabledBit = 0x80;
    
    public EthernetModuleService(
        ISerialCommandPipeline pipeline,
        ILogger<EthernetModuleService> logger)
    {
        _pipeline = pipeline;
        _logger = logger;
    }
    
    /// <inheritdoc />
    public async Task<EthernetModuleResult> ReadFactoryStringAsync(
        string? header = null, 
        CancellationToken ct = default)
    {
        _logger.LogDebug("Reading factory string, header={Header}", header ?? "none");
        
        try
        {
            // Build F1 command with optional header
            var payload = string.IsNullOrEmpty(header) ? "F1" : $"F1{header}";
            
            var command = new SerialCommand
            {
                Payload = payload,
                ExpectsAck = false,
                ExpectsData = true,
                MaxRetries = 2,
                AckTimeout = TimeSpan.FromSeconds(5),
                DataTimeout = TimeSpan.FromSeconds(8),
                CancellationToken = ct
            };
            
            var result = await _pipeline.EnqueueCommandAsync(command);
            
            if (!result.Success)
            {
                _logger.LogError("F1 command failed: {Status}", result.Status);
                return EthernetModuleResult.Failed($"Command failed: {result.Status}");
            }
            
            if (string.IsNullOrEmpty(result.Data))
            {
                _logger.LogError("Empty F1 response");
                return EthernetModuleResult.Failed("Empty response");
            }
            
            // Validate minimum length
            if (result.Data.Length < MinFactoryStringLength)
            {
                _logger.LogError(
                    "Factory string too short: {Length} characters (minimum {Min})",
                    result.Data.Length, MinFactoryStringLength);
                return EthernetModuleResult.Failed(
                    $"Response too short: {result.Data.Length} chars (min {MinFactoryStringLength})");
            }
            
            // Extract flags
            var ethernetInstalled = IsEthernetInstalled(result.Data);
            var commonUl = IsCommonUl(result.Data);
            
            _logger.LogInformation(
                "Factory string read: {Length} chars, Ethernet={Eth}, CommonUl={Cul}",
                result.Data.Length, ethernetInstalled, commonUl);
            
            return EthernetModuleResult.Success(result.Data, ethernetInstalled, commonUl);
        }
        catch (OperationCanceledException)
        {
            _logger.LogWarning("Factory string read cancelled");
            return EthernetModuleResult.Failed("Operation cancelled");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reading factory string");
            return EthernetModuleResult.Failed($"Error: {ex.Message}");
        }
    }
    
    /// <inheritdoc />
    public async Task<bool> WriteFactoryStringAsync(
        string factoryString, 
        string? header = null, 
        CancellationToken ct = default)
    {
        _logger.LogDebug(
            "Writing factory string ({Length} chars), header={Header}",
            factoryString.Length, header ?? "none");
        
        try
        {
            // Build F0 command with optional header
            var payload = string.IsNullOrEmpty(header) 
                ? $"F0{factoryString}" 
                : $"F0{header}{factoryString}";
            
            var command = new SerialCommand
            {
                Payload = payload,
                ExpectsAck = true,
                ExpectsData = false,
                MaxRetries = 2,
                AckTimeout = TimeSpan.FromSeconds(10),
                CancellationToken = ct
            };
            
            var result = await _pipeline.EnqueueCommandAsync(command);
            var isAck = result.Success && 
                        result.Data?.StartsWith("ACK", StringComparison.OrdinalIgnoreCase) == true;
            
            if (isAck)
            {
                _logger.LogInformation("Factory string written successfully");
            }
            else
            {
                _logger.LogError(
                    "Error writing factory string: {Status}, Response={Data}",
                    result.Status, result.Data);
            }
            
            return isAck;
        }
        catch (OperationCanceledException)
        {
            _logger.LogWarning("Factory string write cancelled");
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error writing factory string");
            return false;
        }
    }
    
    /// <inheritdoc />
    public bool IsEthernetInstalled(string factoryString)
    {
        if (factoryString.Length < EthernetMaskPosition + 2)
        {
            _logger.LogWarning(
                "Factory string too short to extract Ethernet mask: {Length}",
                factoryString.Length);
            return false;
        }
        
        try
        {
            var maskHex = factoryString.Substring(EthernetMaskPosition, 2);
            var mask = Convert.ToByte(maskHex, 16);
            
            // Bit 7 = 0 means Ethernet installed
            var installed = (mask & EthernetDisabledBit) == 0;
            
            _logger.LogDebug(
                "Ethernet mask: 0x{Mask:X2}, Installed={Installed}",
                mask, installed);
            
            return installed;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error parsing Ethernet mask");
            return false;
        }
    }
    
    /// <inheritdoc />
    public bool IsCommonUl(string factoryString)
    {
        if (factoryString.Length < CommonUlPosition + 2)
        {
            _logger.LogWarning(
                "Factory string too short to extract commonUl: {Length}",
                factoryString.Length);
            return false;
        }
        
        try
        {
            var commonUlHex = factoryString.Substring(CommonUlPosition, 2);
            var commonUlByte = Convert.ToByte(commonUlHex, 16);
            
            // Bit 7 = 1 means commonUl active
            var isCommon = (commonUlByte & 0x80) != 0;
            
            _logger.LogDebug(
                "Byte commonUl: 0x{Byte:X2}, Active={Active}",
                commonUlByte, isCommon);
            
            return isCommon;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error parsing commonUl");
            return false;
        }
    }
    
    /// <inheritdoc />
    public string SetEthernetInstalled(string factoryString, bool installed)
    {
        // mask = AsciiToInt(Mid(factstr, 93, 2)) And &H7F
        // If chkEth.CheckState = Unchecked Then mask = mask Or &H80
        // factstr = Left(factstr, 92) & Right("0" & Hex(mask), 2) & Right(factstr, Len(factstr) - 94)
        
        if (factoryString.Length < EthernetMaskPosition + 2)
        {
            _logger.LogError(
                "Factory string too short to modify: {Length}",
                factoryString.Length);
            return factoryString;
        }
        
        try
        {
            var maskHex = factoryString.Substring(EthernetMaskPosition, 2);
            var mask = Convert.ToByte(maskHex, 16);
            
            // Clear bit 7 first (And &H7F)
            mask = (byte)(mask & 0x7F);
            
            // If NOT installed, set bit 7 (Or &H80)
            if (!installed)
            {
                mask = (byte)(mask | EthernetDisabledBit);
            }
            
            // Reconstruir string
            var newMaskHex = mask.ToString("X2");
            var result = factoryString.Substring(0, EthernetMaskPosition) 
                       + newMaskHex 
                       + factoryString.Substring(EthernetMaskPosition + 2);
            
            _logger.LogInformation(
                "Ethernet mask modified: 0x{OldMask} → 0x{NewMask:X2}, Installed={Installed}",
                maskHex, mask, installed);
            
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error modifying Ethernet mask");
            return factoryString;
        }
    }
}
