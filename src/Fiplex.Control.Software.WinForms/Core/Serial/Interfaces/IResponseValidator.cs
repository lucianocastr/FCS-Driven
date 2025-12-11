namespace Fiplex.Control.Software.WinForms.Core.Serial.Interfaces;

/// <summary>
/// Servicio para validación de respuestas serial.
/// </summary>
public interface IResponseValidator
{
    /// <summary>
    /// Valida si la respuesta cumple con la especificación de longitud.
    /// </summary>
    /// <param name="response">Respuesta del dispositivo</param>
    /// <param name="lengthSpec">Especificación de longitud (ej: "128", "128,256", "splitwith3tabs:40")</param>
    /// <returns>True si la respuesta es válida</returns>
    bool ValidateLength(string response, string lengthSpec);
    
    /// <summary>
    /// Valida si la respuesta contiene credenciales inválidas.
    /// </summary>
    bool ContainsInvalidCredentials(string response);
    
    /// <summary>
    /// Extrae mensaje de error si la respuesta indica un error.
    /// </summary>
    string? ExtractErrorMessage(string response);
}
