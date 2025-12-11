namespace Fiplex.Control.Software.WinForms.Core.Configuration.Interfaces;

/// <summary>
/// Resultado de la verificación de versiones.
/// </summary>
/// <param name="UpdateAvailable">Indica si hay una versión más reciente disponible</param>
/// <param name="CurrentVersion">Versión actual del software (local)</param>
/// <param name="LatestVersion">Versión más reciente disponible (remota), null si no se pudo obtener</param>
/// <param name="DownloadUrl">URL de descarga del instalador/ZIP, null si no disponible</param>
/// <param name="ErrorMessage">Mensaje de error si la verificación falló, null si exitosa</param>
public record VersionCheckResult(
    bool UpdateAvailable,
    string CurrentVersion,
    string? LatestVersion,
    string? DownloadUrl,
    string? ErrorMessage = null);

/// <summary>
/// Servicio para verificar actualizaciones de software.
/// 
/// 1. CheckNewVersion() navega a urlUpd (lastversions.txt)
/// 2. WebBrowser1_DocumentCompleted captura el contenido
/// 3. detectNewVersion() parsea y compara versiones
/// 4. Si hay nueva versión → lblHyperLink.Visible = True
/// 
/// En C# moderno usamos HttpClient async en lugar de WebBrowser.
/// </summary>
public interface IVersionCheckService
{
    /// <summary>
    /// Versión actual del software.
    /// </summary>
    string CurrentVersion { get; }

    /// <summary>
    /// Última versión disponible conocida (después de verificar).
    /// </summary>
    string? LatestVersion { get; }

    /// <summary>
    /// URL de descarga de la última versión.
    /// </summary>
    string? DownloadUrl { get; }

    /// <summary>
    /// Indica si hay una actualización disponible (después de verificar).
    /// </summary>
    bool UpdateAvailable { get; }

    /// <summary>
    /// Verifica si hay actualizaciones disponibles.
    /// </summary>
    /// <param name="cancellationToken">Token de cancelación</param>
    /// <returns>Resultado de la verificación con todos los detalles</returns>
    Task<VersionCheckResult> CheckForUpdatesAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Abre la URL de descarga en el navegador predeterminado.
    /// </summary>
    /// <returns>True si se pudo abrir el navegador, false en caso de error</returns>
    bool OpenDownloadUrl();
}
