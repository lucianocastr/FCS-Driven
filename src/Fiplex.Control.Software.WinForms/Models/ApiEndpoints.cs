namespace Fiplex.Control.Software.WinForms.Models;

/// <summary>
/// Configuración de URLs de endpoints de API para autenticación y servicios cloud.
/// </summary>
/// <remarks>
/// Los valores se cargan desde la sección "ApiEndpoints" de appsettings.json.
/// </remarks>
public class ApiEndpoints
{
    /// <summary>
    /// URL del endpoint para obtener token offline.
    /// </summary>
    public string OfflineApi { get; set; } = string.Empty;

    /// <summary>
    /// URL del endpoint para obtener la clave pública de validación JWT.
    /// </summary>
    public string PublicKeyUrl { get; set; } = string.Empty;

    /// <summary>
    /// URL del endpoint para obtener token de llamadas a servicios cloud.
    /// </summary>
    public string ClssCloudTokenUrl { get; set; } = string.Empty;

    /// <summary>
    /// URL base del endpoint de token OAuth.
    /// </summary>
    public string TokenUrl { get; set; } = string.Empty;

    /// <summary>
    /// Indica si la configuración es válida.
    /// </summary>
    public bool IsValid =>
        !string.IsNullOrWhiteSpace(OfflineApi) &&
        !string.IsNullOrWhiteSpace(PublicKeyUrl) &&
        !string.IsNullOrWhiteSpace(ClssCloudTokenUrl);
}
