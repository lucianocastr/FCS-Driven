using Microsoft.Extensions.Logging;
using Fiplex.Control.Software.WinForms.Core.Config.Interfaces;
using Fiplex.Control.Software.WinForms.Core.Serial.Interfaces;
using Fiplex.Control.Software.WinForms.Core.Serial.Models;
using Fiplex.Control.Software.WinForms.Models;

namespace Fiplex.Control.Software.WinForms.Core.Config;

/// <summary>
/// Servicio para gestión del módulo Ethernet Rabbit.
/// 
/// El módulo Ethernet se controla mediante el bit 7 de la posición 93-94 del factory string:
/// - Bit 7 = 0: Ethernet INSTALADO
/// - Bit 7 = 1: Ethernet NO INSTALADO (desactivado)
/// 
/// Para dispositivos PSC Master (5dm), se requiere doble escritura con headers alternos.
/// </summary>
public class EthernetModuleService : IEthernetModuleService
{
    private readonly ISerialCommandPipeline _pipeline;
    private readonly ILogger<EthernetModuleService> _logger;
    
    /// <summary>
    /// Longitud mínima requerida del factory string.
    /// </summary>
    private const int MinFactoryStringLength = 482;
    
    /// <summary>
    /// Posición del byte de máscara Ethernet .
    /// En C# (0-indexed) = 92.
    /// </summary>
    private const int EthernetMaskPosition = 92;
    
    /// <summary>
    /// Posición del byte commonUl .
    /// En C# (0-indexed) = 2.
    /// </summary>
    private const int CommonUlPosition = 2;
    
    /// <summary>
    /// Bit que indica Ethernet desactivado (0x80 = bit 7).
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
        _logger.LogDebug("Leyendo factory string, header={Header}", header ?? "ninguno");
        
        try
        {
            // Construir comando F1 con header opcional
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
                _logger.LogError("Comando F1 falló: {Status}", result.Status);
                return EthernetModuleResult.Failed($"Command failed: {result.Status}");
            }
            
            if (string.IsNullOrEmpty(result.Data))
            {
                _logger.LogError("Respuesta F1 vacía");
                return EthernetModuleResult.Failed("Empty response");
            }
            
            // Validar longitud mínima
            if (result.Data.Length < MinFactoryStringLength)
            {
                _logger.LogError(
                    "Factory string muy corto: {Length} caracteres (mínimo {Min})",
                    result.Data.Length, MinFactoryStringLength);
                return EthernetModuleResult.Failed(
                    $"Response too short: {result.Data.Length} chars (min {MinFactoryStringLength})");
            }
            
            // Extraer flags
            var ethernetInstalled = IsEthernetInstalled(result.Data);
            var commonUl = IsCommonUl(result.Data);
            
            _logger.LogInformation(
                "Factory string leído: {Length} chars, Ethernet={Eth}, CommonUl={Cul}",
                result.Data.Length, ethernetInstalled, commonUl);
            
            return EthernetModuleResult.Success(result.Data, ethernetInstalled, commonUl);
        }
        catch (OperationCanceledException)
        {
            _logger.LogWarning("Lectura factory string cancelada");
            return EthernetModuleResult.Failed("Operation cancelled");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error leyendo factory string");
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
            "Escribiendo factory string ({Length} chars), header={Header}",
            factoryString.Length, header ?? "ninguno");
        
        try
        {
            // Construir comando F0 con header opcional
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
                _logger.LogInformation("Factory string escrito exitosamente");
            }
            else
            {
                _logger.LogError(
                    "Error escribiendo factory string: {Status}, Response={Data}",
                    result.Status, result.Data);
            }
            
            return isAck;
        }
        catch (OperationCanceledException)
        {
            _logger.LogWarning("Escritura factory string cancelada");
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error escribiendo factory string");
            return false;
        }
    }
    
    /// <inheritdoc />
    public bool IsEthernetInstalled(string factoryString)
    {
        if (factoryString.Length < EthernetMaskPosition + 2)
        {
            _logger.LogWarning(
                "Factory string muy corto para extraer máscara Ethernet: {Length}",
                factoryString.Length);
            return false;
        }
        
        try
        {
            var maskHex = factoryString.Substring(EthernetMaskPosition, 2);
            var mask = Convert.ToByte(maskHex, 16);
            
            // Bit 7 = 0 significa Ethernet instalado
            var installed = (mask & EthernetDisabledBit) == 0;
            
            _logger.LogDebug(
                "Máscara Ethernet: 0x{Mask:X2}, Instalado={Installed}",
                mask, installed);
            
            return installed;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error parseando máscara Ethernet");
            return false;
        }
    }
    
    /// <inheritdoc />
    public bool IsCommonUl(string factoryString)
    {
        if (factoryString.Length < CommonUlPosition + 2)
        {
            _logger.LogWarning(
                "Factory string muy corto para extraer commonUl: {Length}",
                factoryString.Length);
            return false;
        }
        
        try
        {
            var commonUlHex = factoryString.Substring(CommonUlPosition, 2);
            var commonUlByte = Convert.ToByte(commonUlHex, 16);
            
            // Bit 7 = 1 significa commonUl activo
            var isCommon = (commonUlByte & 0x80) != 0;
            
            _logger.LogDebug(
                "Byte commonUl: 0x{Byte:X2}, Activo={Active}",
                commonUlByte, isCommon);
            
            return isCommon;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error parseando commonUl");
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
                "Factory string muy corto para modificar: {Length}",
                factoryString.Length);
            return factoryString;
        }
        
        try
        {
            var maskHex = factoryString.Substring(EthernetMaskPosition, 2);
            var mask = Convert.ToByte(maskHex, 16);
            
            // Limpiar bit 7 primero (And &H7F)
            mask = (byte)(mask & 0x7F);
            
            // Si NO instalado, setear bit 7 (Or &H80)
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
                "Máscara Ethernet modificada: 0x{OldMask} → 0x{NewMask:X2}, Instalado={Installed}",
                maskHex, mask, installed);
            
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error modificando máscara Ethernet");
            return factoryString;
        }
    }
}
