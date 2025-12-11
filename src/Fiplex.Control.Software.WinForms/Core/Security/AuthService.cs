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
    /// Versión del microcontrolador extraída de respuesta V1.
    /// </summary>
    public int UcVersion { get; private set; }
    
    /// <summary>
    /// Respuesta raw del comando V1 para diagnóstico.
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
            _logger.LogInformation("Verificando requerimiento de autenticación (comando V1)");

            // Crear comando V1 con timeout de 2-3 segundos
            // CRÍTICO: Timeout corto solo para este comando 
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

            // PASO 1: Verificar si hubo resultado exitoso del comando
            if (!result.Success)
            {
                _logger.LogWarning("Dispositivo no responde a comando V1 (Status: {Status})", result.Status);
                return AuthResult.DeviceNotResponding;
            }

            // Si hay datos, analizarlos (caso equipos que devuelven texto V1)
            if (!string.IsNullOrWhiteSpace(result.Data))
            {
                // Guardar respuesta y extraer ucVersion
                LastV1Response = result.Data;
                ExtractUcVersion(result.Data);

                // PASO 2: Analizar respuesta para detectar "INVALID" (case-insensitive)
                // Si contiene "INVALID" → requiere contraseña
                if (result.Data.Contains("INVALID", StringComparison.OrdinalIgnoreCase))
                {
                    _logger.LogInformation("Dispositivo requiere contraseña (respuesta contiene INVALID)");
                    return AuthResult.PasswordRequired;
                }

                // PASO 3: Respuesta válida sin "INVALID" → no requiere autenticación
                _logger.LogInformation(
                    "Dispositivo no requiere contraseña (V1 válido: {Response}, ucVersion: 0x{UcVersion:X})",
                    result.Data.Length > 50 ? result.Data.Substring(0, 50) + "..." : result.Data,
                    UcVersion);

                return AuthResult.NoAuthRequired;
            }

            // Caso especial: Success == true pero Data vacío.
            // Esto ocurre cuando V1 sin password devolvió INVALID CREDENTIALS y el reintento
            // autenticado (*0{password}1) solo respondió ACK sin datos.
            // En este punto ya estamos autenticados correctamente.
            _logger.LogInformation(
                "Autenticación completada con ACK sin datos en V1. Asumiendo requerimiento de password resuelto.");
            return AuthResult.NoAuthRequired;
        }
        catch (OperationCanceledException)
        {
            _logger.LogWarning("Verificación de autenticación cancelada");
            return AuthResult.DeviceNotResponding;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error crítico verificando requerimiento de autenticación");
            return AuthResult.DeviceNotResponding;
        }
    }
    
    /// <summary>
    /// Extrae ucVersion de respuesta V1.
    /// ucVersion = AsciiToInt(Mid(verstr, 7, 2)) * 256 + AsciiToInt(Mid(verstr, 9, 2))
    /// </summary>
    /// <param name="v1Response">Respuesta del comando V1</param>
    private void ExtractUcVersion(string v1Response)
    {
        UcVersion = 0;
        
        if (string.IsNullOrEmpty(v1Response) || v1Response.Length < 10)
        {
            _logger.LogWarning("Respuesta V1 demasiado corta para extraer ucVersion: {Length} chars", 
                v1Response?.Length ?? 0);
            return;
        }
        
        try
        {
            // Mid(verstr, 7, 2) = substring índice 6-7 (0-based)
            // Mid(verstr, 9, 2) = substring índice 8-9 (0-based)
            var highByteStr = v1Response.Substring(6, 2);
            var lowByteStr = v1Response.Substring(8, 2);
            
            // AsciiToInt convierte 2 caracteres hex a entero
            var highByte = AsciiToInt(highByteStr);
            var lowByte = AsciiToInt(lowByteStr);
            
            UcVersion = (highByte * 256) + lowByte;
            
            _logger.LogDebug("ucVersion extraído: 0x{UcVersion:X} (high=0x{High:X2}, low=0x{Low:X2})", 
                UcVersion, highByte, lowByte);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error extrayendo ucVersion de respuesta V1: {Response}", 
                v1Response.Length > 20 ? v1Response.Substring(0, 20) + "..." : v1Response);
        }
    }
    
    /// <summary>
    /// Convierte 2 caracteres hex ASCII a entero.
    /// Equivalente a AsciiToInt() en mdlStringFunctions.vb
    /// </summary>
    private static int AsciiToInt(string hexStr)
    {
        if (string.IsNullOrEmpty(hexStr) || hexStr.Length < 2)
            return 0;
        
        return Convert.ToInt32(hexStr.Substring(0, 2), 16);
    }
}
