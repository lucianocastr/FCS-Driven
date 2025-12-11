namespace Fiplex.Control.Software.WinForms.Models;

/// <summary>
/// Definición de comando parseado desde settings.cfg.
/// </summary>
/// <remarks>
/// Representa un mapeo HTTP a Serial con metadata de validación.
/// </remarks>
/// <param name="Page">Nombre de la página HTTP.</param>
/// <param name="Command">Comando serial a ejecutar.</param>
/// <param name="RequiresEncoding">Indica si requiere codificación hexadecimal.</param>
/// <param name="LengthValidation">Cadena de validación de longitud.</param>
/// <param name="Message">Mensaje descriptivo del comando.</param>
public record CommandDefinition(
    string Page,
    string Command,
    bool RequiresEncoding,
    string LengthValidation,
    string Message
)
{
    /// <summary>
    /// Método HTTP (GET, POST, FILE) inferido del contexto.
    /// </summary>
    public string HttpMethod { get; init; } = "GET";
    
    /// <summary>
    /// Longitud esperada de respuesta (parseado de LengthValidation).
    /// </summary>
    /// <remarks>
    /// -1 indica longitud variable. Valores negativos indican formato splitwith3tabs.
    /// </remarks>
    public int ExpectedLength { get; init; } = -1;
    
    /// <summary>
    /// Indica si la respuesta usa codificación hexadecimal.
    /// </summary>
    public bool HexEncoding { get; init; } = false;
    
    /// <summary>
    /// Para comandos POST: indica si esperar respuesta del dispositivo.
    /// </summary>
    public bool WaitResponse { get; init; } = true;
    
    /// <summary>
    /// Número de caracteres iniciales que no deben codificarse en hex.
    /// </summary>
    public string NoEncodeParams { get; init; } = string.Empty;
    
    /// <summary>
    /// Parámetros URL esperados separados por coma.
    /// </summary>
    public string UrlParameters { get; init; } = string.Empty;
    
    /// <summary>
    /// Modo de archivo para comandos FILE (SaveCFG, LoadCFG, etc.)
    /// </summary>
    public string FileMode { get; init; } = string.Empty;
}
