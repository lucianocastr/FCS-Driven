using Fiplex.Control.Software.WinForms.Core.Commands.Interfaces;
using Microsoft.Extensions.Logging;

namespace Fiplex.Control.Software.WinForms.Core.Commands;

/// <summary>
/// Handler de respuestas para dispositivos 1C versión 2.2.
/// Implementa lógica SCA (Single Channel Activation) especial.
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
    
    // Variable confSCA - almacena configuración SCA procesada
    private string _confSCA = string.Empty;
    
    // Estado de activación del test de canal
    private short _chTestActivated = -1;
    
    public int Priority => 100; // Alta prioridad para dispositivo específico

    public Device1C_V22_ResponseHandler(ILogger<Device1C_V22_ResponseHandler> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Aplica a dispositivos 1c versión 2.2 exactamente.
    /// </summary>
    public bool CanHandle(string deviceType, double version)
        => deviceType.Equals("1c", StringComparison.OrdinalIgnoreCase) 
           && Math.Abs(version - 2.2) < 0.05;

    /// <summary>
    /// Procesa respuestas C1 y F1 con lógica SCA especial.
    /// </summary>
    public string ProcessResponse(string command, string rawResponse)
    {
        if (string.IsNullOrEmpty(rawResponse))
            return rawResponse;

        // Comando C1: Configuration Read con SCA
        if (command.Equals("C1", StringComparison.OrdinalIgnoreCase))
        {
            var isActivated = IsSCAConfCHTestActivated(rawResponse);
            _logger.LogDebug("IsSCAConfCHTestActivated={IsActivated} para C1", isActivated);
            
            // Retornar confSCA procesada si está activada
            return isActivated ? _confSCA : rawResponse;
        }

        // Comando F1: Factory Read con SCA
        if (command.Equals("F1", StringComparison.OrdinalIgnoreCase))
        {
            var isActivated = IsSCAFactCHTestActivated(rawResponse);
            _logger.LogDebug("IsSCAFactCHTestActivated={IsActivated} para F1", isActivated);
            // F1 no modifica la respuesta, solo actualiza estado
        }

        return rawResponse;
    }

    /// <summary>
    /// Determina si la configuración SCA de canal de prueba está activada.
    /// 
    /// Analiza respuesta C1 hex para extraer estado de activación del canal de prueba.
    /// </summary>
    private bool IsSCAConfCHTestActivated(string response)
    {
        if (string.IsNullOrEmpty(response) || response.Length < 10)
        {
            _logger.LogWarning("Respuesta C1 demasiado corta para análisis SCA: {Length} chars", 
                response?.Length ?? 0);
            return false;
        }

        try
        {
            // La posición del flag de activación depende del formato de respuesta 1c2.2
            
            // Byte 8-9 contiene flag de canal activo (posición específica para 1c2.2)
            // Formato: respuesta hex donde cada 2 chars = 1 byte
            if (response.Length >= 18)
            {
                // Posición 8 (bytes 16-17 del hex string)
                var chFlagHex = response.Substring(16, 2);
                var chFlag = Convert.ToInt32(chFlagHex, 16);
                
                // Si bit 0 está activado, el test de canal está habilitado
                _chTestActivated = (short)(chFlag & 0x01);
                
                if (_chTestActivated == 1)
                {
                    // Procesar y almacenar confSCA
                    _confSCA = ProcessSCAConfiguration(response);
                    _logger.LogInformation("Canal de prueba SCA activado, confSCA almacenada");
                    return true;
                }
            }
            
            _chTestActivated = -1;
            _confSCA = string.Empty;
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error procesando SCA de respuesta C1");
            return false;
        }
    }

    /// <summary>
    /// Determina si los parámetros factory SCA están activados.
    /// </summary>
    private bool IsSCAFactCHTestActivated(string response)
    {
        if (string.IsNullOrEmpty(response) || response.Length < 10)
            return false;

        try
        {
            // Análisis similar a C1 pero para parámetros factory
            // Los dispositivos 1c2.2 tienen formato específico en F1
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
            _logger.LogError(ex, "Error procesando SCA de respuesta F1");
            return false;
        }
    }

    /// <summary>
    /// Procesa la configuración SCA completa desde respuesta C1.
    /// </summary>
    private string ProcessSCAConfiguration(string response)
    {
        // para reflejar el estado de activación del canal de prueba
        
        if (response.Length < 20)
            return response;

        try
        {
            // Crear copia modificada con flag SCA procesado
            var builder = new char[response.Length];
            response.CopyTo(0, builder, 0, response.Length);
            
            // Posición 18-19: Modificar para indicar SCA procesada
            // Esto depende del protocolo específico 1c2.2
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
    /// Resetea el estado SCA.
    /// </summary>
    public void Reset()
    {
        _confSCA = string.Empty;
        _chTestActivated = -1;
    }
}
