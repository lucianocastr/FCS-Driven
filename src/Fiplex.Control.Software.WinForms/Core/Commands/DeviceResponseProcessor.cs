using Fiplex.Control.Software.WinForms.Core.Commands.Interfaces;
using Microsoft.Extensions.Logging;

namespace Fiplex.Control.Software.WinForms.Core.Commands;

/// <summary>
/// Servicio que coordina múltiples handlers de respuesta específicos por dispositivo.
/// Implementa el patrón Chain of Responsibility para procesar respuestas.
///
/// tdev/ndev para aplicar procesamiento específico.
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
    /// Configura el procesador para un dispositivo específico.
    /// Debe llamarse después de identificar el dispositivo conectado.
    /// </summary>
    /// <param name="deviceType">Tipo de dispositivo (1c, 2c, 5dm, etc.)</param>
    /// <param name="deviceVersion">Versión del dispositivo</param>
    public void ConfigureForDevice(string deviceType, double deviceVersion)
    {
        _currentDeviceType = deviceType;
        _currentDeviceVersion = deviceVersion;
        
        // Buscar handler aplicable
        _activeHandler = _handlers.FirstOrDefault(h => 
            h.CanHandle(deviceType, deviceVersion));
        
        if (_activeHandler != null)
        {
            _logger.LogInformation(
                "Handler de respuesta activado para dispositivo {Type} v{Version}: {Handler}",
                deviceType, deviceVersion, _activeHandler.GetType().Name);
        }
        else
        {
            _logger.LogDebug(
                "No hay handler específico para dispositivo {Type} v{Version}, usando procesamiento estándar",
                deviceType, deviceVersion);
        }
    }

    /// <summary>
    /// Procesa una respuesta de comando aplicando el handler específico si existe.
    /// </summary>
    /// <param name="command">Comando enviado</param>
    /// <param name="rawResponse">Respuesta raw del dispositivo</param>
    /// <returns>Respuesta procesada</returns>
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
                    "Respuesta procesada por {Handler}: {Command} ({OrigLen} -> {NewLen} chars)",
                    _activeHandler.GetType().Name, command, 
                    rawResponse.Length, processed.Length);
            }
            
            return processed;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, 
                "Error en handler {Handler} procesando {Command}, retornando respuesta original",
                _activeHandler.GetType().Name, command);
            return rawResponse;
        }
    }

    /// <summary>
    /// Resetea el estado de todos los handlers.
    /// Llamar al desconectar del dispositivo.
    /// </summary>
    public void Reset()
    {
        _currentDeviceType = string.Empty;
        _currentDeviceVersion = 0;
        _activeHandler = null;
        
        // Resetear handlers que implementen método Reset
        foreach (var handler in _handlers)
        {
            if (handler is Device1C_V22_ResponseHandler h22)
                h22.Reset();
            else if (handler is Device1C_V52_ResponseHandler h52)
                h52.Reset();
        }
        
        _logger.LogDebug("DeviceResponseProcessor reseteado");
    }

    /// <summary>
    /// Indica si hay un handler activo para el dispositivo actual.
    /// </summary>
    public bool HasActiveHandler => _activeHandler != null;

    /// <summary>
    /// Tipo de dispositivo actualmente configurado.
    /// </summary>
    public string CurrentDeviceType => _currentDeviceType;

    /// <summary>
    /// Versión del dispositivo actualmente configurado.
    /// </summary>
    public double CurrentDeviceVersion => _currentDeviceVersion;
}
