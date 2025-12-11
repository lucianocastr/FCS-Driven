using Fiplex.Control.Software.WinForms.Core.Configuration.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Diagnostics;
using System.Reflection;

namespace Fiplex.Control.Software.WinForms.Core.Configuration;

/// <summary>
/// Configuración para el servicio de verificación de versiones.
/// Se carga desde appsettings.json sección "VersionCheck".
/// </summary>
public class VersionCheckSettings
{
    /// <summary>
    /// URL del archivo de versiones .
    /// Formato esperado: "fcs 1.9.0.0\nfcsng 2.0.0.0\n..."
    /// </summary>
    public string VersionsUrl { get; set; } = "http://www.fiplex.com/poms/lastversions.txt";

    /// <summary>
    /// URL de descarga del instalador .
    /// </summary>
    public string DownloadUrl { get; set; } = "http://www.fiplex.com/poms/FiplexControlSoftware.zip";

    /// <summary>
    /// Código del producto para buscar en el archivo de versiones .
    /// </summary>
    public string ProductCode { get; set; } = "fcs";

    /// <summary>
    /// Timeout en segundos para la petición HTTP.
    /// </summary>
    public int TimeoutSeconds { get; set; } = 10;

    /// <summary>
    /// Habilita o deshabilita la verificación de versiones.
    /// </summary>
    public bool Enabled { get; set; } = true;
}

/// <summary>
/// Implementación del servicio de verificación de versiones.
/// 
/// - C# usa HttpClient async para obtener el archivo de versiones directamente
/// - Manejo robusto de errores y timeouts
/// - Logging estructurado para diagnóstico
/// </summary>
public class VersionCheckService : IVersionCheckService
{
    private readonly HttpClient _httpClient;
    private readonly VersionCheckSettings _settings;
    private readonly ILogger<VersionCheckService> _logger;

    private string? _latestVersion;
    private bool _updateAvailable;

    /// <summary>
    /// Versión actual del software.
    /// Usa InformationalVersion para soportar sufijos semánticos (-alpha, -beta, etc.)
    /// </summary>
    public string CurrentVersion { get; }

    /// <inheritdoc/>
    public string? LatestVersion => _latestVersion;

    /// <inheritdoc/>
    public string? DownloadUrl => _settings.DownloadUrl;

    /// <inheritdoc/>
    public bool UpdateAvailable => _updateAvailable;

    public VersionCheckService(
        HttpClient httpClient,
        IOptions<VersionCheckSettings> settings,
        ILogger<VersionCheckService> logger)
    {
        _httpClient = httpClient;
        _settings = settings.Value;
        _logger = logger;

        // Obtener versión actual del ensamblado
        // Split('+')[0] elimina el hash de Git que .NET agrega automáticamente
        CurrentVersion = (Assembly.GetExecutingAssembly()
            .GetCustomAttribute<AssemblyInformationalVersionAttribute>()
            ?.InformationalVersion ?? "3.0.0")
            .Split('+')[0];

        _logger.LogDebug("VersionCheckService initialized. Current version: {Version}", CurrentVersion);
    }

    /// <inheritdoc/>
    public async Task<VersionCheckResult> CheckForUpdatesAsync(CancellationToken cancellationToken = default)
    {
        if (!_settings.Enabled)
        {
            _logger.LogDebug("Version check is disabled in settings");
            return new VersionCheckResult(
                UpdateAvailable: false,
                CurrentVersion: CurrentVersion,
                LatestVersion: null,
                DownloadUrl: null,
                ErrorMessage: "Version check is disabled");
        }

        try
        {
            _logger.LogInformation("Checking for updates at {Url}", _settings.VersionsUrl);

            // Agregar parámetro de fecha para evitar cache 
            var urlWithCacheBuster = $"{_settings.VersionsUrl}?d={DateTime.Now.Ticks}";

            using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            cts.CancelAfter(TimeSpan.FromSeconds(_settings.TimeoutSeconds));

            var response = await _httpClient.GetAsync(urlWithCacheBuster, cts.Token);
            response.EnsureSuccessStatusCode();

            var content = await response.Content.ReadAsStringAsync(cts.Token);

            _logger.LogDebug("Received version file content: {Content}", content);

            // Parsear y detectar nueva versión 
            var (updateAvailable, latestVersion) = DetectNewVersion(content);

            _latestVersion = latestVersion;
            _updateAvailable = updateAvailable;

            if (updateAvailable)
            {
                _logger.LogInformation(
                    "Update available! Current: {Current}, Latest: {Latest}",
                    CurrentVersion, latestVersion);
            }
            else
            {
                _logger.LogInformation(
                    "No update available. Current: {Current}, Latest: {Latest}",
                    CurrentVersion, latestVersion ?? "unknown");
            }

            return new VersionCheckResult(
                UpdateAvailable: updateAvailable,
                CurrentVersion: CurrentVersion,
                LatestVersion: latestVersion,
                DownloadUrl: updateAvailable ? _settings.DownloadUrl : null);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            _logger.LogDebug("Version check cancelled by user");
            throw;
        }
        catch (TaskCanceledException)
        {
            _logger.LogWarning("Version check timed out after {Timeout} seconds", _settings.TimeoutSeconds);
            return new VersionCheckResult(
                UpdateAvailable: false,
                CurrentVersion: CurrentVersion,
                LatestVersion: null,
                DownloadUrl: null,
                ErrorMessage: "Connection timed out");
        }
        catch (HttpRequestException ex)
        {
            _logger.LogWarning(ex, "Failed to check for updates: {Message}", ex.Message);
            return new VersionCheckResult(
                UpdateAvailable: false,
                CurrentVersion: CurrentVersion,
                LatestVersion: null,
                DownloadUrl: null,
                ErrorMessage: $"Network error: {ex.Message}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error checking for updates");
            return new VersionCheckResult(
                UpdateAvailable: false,
                CurrentVersion: CurrentVersion,
                LatestVersion: null,
                DownloadUrl: null,
                ErrorMessage: ex.Message);
        }
    }

    /// <inheritdoc/>
    public bool OpenDownloadUrl()
    {
        if (string.IsNullOrEmpty(_settings.DownloadUrl))
        {
            _logger.LogWarning("Download URL is not configured");
            return false;
        }

        try
        {
            var urlWithCacheBuster = $"{_settings.DownloadUrl}?d={DateTime.Now.Ticks}";

            _logger.LogInformation("Opening download URL: {Url}", urlWithCacheBuster);

            // UseShellExecute = true es necesario para abrir URLs en el navegador predeterminado
            Process.Start(new ProcessStartInfo
            {
                FileName = urlWithCacheBuster,
                UseShellExecute = true
            });

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to open download URL");
            return false;
        }
    }

    /// <summary>
    /// Detecta si hay una nueva versión disponible parseando el contenido del archivo de versiones.
    /// 
    /// Formato esperado del archivo:
    /// fcs 1.9.0.0
    /// fcsng 2.0.0.0
    /// other 1.0.0.0
    /// </summary>
    /// <param name="content">Contenido del archivo de versiones</param>
    /// <returns>Tupla (updateAvailable, latestVersion)</returns>
    private (bool UpdateAvailable, string? LatestVersion) DetectNewVersion(string content)
    {
        try
        {
            var lines = content.Split('\n', StringSplitOptions.RemoveEmptyEntries);

            foreach (var line in lines)
            {
                var normalizedLine = NormalizeWhitespace(line.Trim());
                var parts = normalizedLine.Split(' ', StringSplitOptions.RemoveEmptyEntries);

                if (parts.Length >= 2 &&
                    parts[0].Equals(_settings.ProductCode, StringComparison.OrdinalIgnoreCase))
                {
                    var remoteVersion = parts[1].Trim();
                    var updateAvailable = CompareVersions(CurrentVersion, remoteVersion);

                    return (updateAvailable, remoteVersion);
                }
            }

            _logger.LogWarning(
                "Product code '{ProductCode}' not found in version file",
                _settings.ProductCode);

            return (false, null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error parsing version file");
            return (false, null);
        }
    }

    /// <summary>
    /// Compara dos versiones para determinar si la remota es más reciente.
    /// </summary>
    /// <param name="currentVersion">Versión actual local</param>
    /// <param name="remoteVersion">Versión remota a comparar</param>
    /// <returns>True si la versión remota es más reciente</returns>
    private bool CompareVersions(string currentVersion, string remoteVersion)
    {
        try
        {
            // Limpiar sufijos semánticos (-alpha, -beta, -rc1, etc.) para comparación numérica
            var cleanCurrent = CleanVersionString(currentVersion);
            var cleanRemote = CleanVersionString(remoteVersion);

            // Usar Version.TryParse para comparación robusta
            if (Version.TryParse(cleanCurrent, out var current) &&
                Version.TryParse(cleanRemote, out var remote))
            {
                return remote > current;
            }
            var currentLong = VersionToLong(cleanCurrent);
            var remoteLong = VersionToLong(cleanRemote);

            return remoteLong > currentLong;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex,
                "Error comparing versions '{Current}' vs '{Remote}', assuming no update",
                currentVersion, remoteVersion);
            return false;
        }
    }

    /// <summary>
    /// Limpia el string de versión removiendo sufijos semánticos.
    /// "3.0.0-alpha" → "3.0.0"
    /// "1.8.0.0" → "1.8.0.0"
    /// </summary>
    private static string CleanVersionString(string version)
    {
        var dashIndex = version.IndexOf('-');
        return dashIndex >= 0 ? version[..dashIndex] : version;
    }

    /// <summary>
    /// Convierte versión a entero largo para comparación.
    /// 
    /// aux = aux + 2 ^ (8 * (3 - i)) * CInt(buff(i))
    /// Esto crea un número donde cada parte tiene 8 bits (256 valores).
    /// </summary>
    private static long VersionToLong(string version)
    {
        var parts = version.Split('.');
        long result = 0;

        for (int i = 0; i < Math.Min(parts.Length, 4); i++)
        {
            if (int.TryParse(parts[i], out var part))
            {
                // Shift 8 bits por cada posición (equivalente a 2^(8*(3-i)))
                result += (long)part << (8 * (3 - i));
            }
        }

        return result;
    }

    /// <summary>
    /// Normaliza espacios múltiples a un solo espacio.
    /// </summary>
    private static string NormalizeWhitespace(string input)
    {
        while (input.Contains("  "))
        {
            input = input.Replace("  ", " ");
        }
        return input;
    }
}
