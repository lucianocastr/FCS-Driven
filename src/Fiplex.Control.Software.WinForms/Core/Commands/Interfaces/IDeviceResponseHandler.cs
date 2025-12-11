namespace Fiplex.Control.Software.WinForms.Core.Commands.Interfaces;

/// <summary>
/// Strategy pattern para procesamiento de respuestas específicas por dispositivo.
/// </summary>
public interface IDeviceResponseHandler
{
    /// <summary>
    /// Determina si este handler puede procesar respuestas del dispositivo especificado.
    /// </summary>
    /// <param name="deviceType">Tipo de dispositivo (1c, 2c, 5dm, etc.)</param>
    /// <param name="version">Versión del dispositivo</param>
    /// <returns>True si este handler es aplicable</returns>
    bool CanHandle(string deviceType, double version);
    
    /// <summary>
    /// Procesa la respuesta de un comando, aplicando transformaciones específicas.
    /// </summary>
    /// <param name="command">Comando enviado (C1, F1, U1, etc.)</param>
    /// <param name="rawResponse">Respuesta raw del dispositivo</param>
    /// <returns>Respuesta procesada</returns>
    string ProcessResponse(string command, string rawResponse);
    
    /// <summary>
    /// Prioridad del handler (mayor = se evalúa primero).
    /// </summary>
    int Priority => 0;
}
