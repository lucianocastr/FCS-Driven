using Fiplex.Control.Software.WinForms.Core.Configuration.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Diagnostics;
using System.Reflection;

namespace Fiplex.Control.Software.WinForms.Core.Configuration;

/// <summary>
/// Configuration for the version check service.
/// Loaded from appsettings.json section "VersionCheck".
/// </summary>
public class VersionCheckSettings
{
    /// <summary>
    /// URL of the versions file.
    /// Expected format: "fcs 1.9.0.0\nfcsng 2.0.0.0\n..."
    /// </summary>
    public string VersionsUrl { get; set; } = "http://www.fiplex.com/poms/lastversions.txt";

    /// <summary>
    /// Installer download URL.
    /// </summary>
    public string DownloadUrl { get; set; } = "http://www.fiplex.com/poms/FiplexControlSoftware.zip";

    /// <summary>
    /// Product code to search for in the versions file.
    /// </summary>
    public string ProductCode { get; set; } = "fcs";

    /// <summary>
    /// Timeout in seconds for the HTTP request.
    /// </summary>
    public int TimeoutSeconds { get; set; } = 10;

    /// <summary>
    /// Enables or disables version checking.
    /// </summary>
    public bool Enabled { get; set; } = true;
}

/// <summary>
/// Implementation of the version check service.
/// 
/// - C# uses async HttpClient to fetch the versions file directly
/// - Robust error and timeout handling
/// - Structured logging for diagnostics
/// </summary>
public class VersionCheckService : IVersionCheckService
{
    private readonly HttpClient _httpClient;
    private readonly VersionCheckSettings _settings;
    private readonly ILogger<VersionCheckService> _logger;

    private string? _latestVersion;
    private bool _updateAvailable;

    /// <summary>
    /// Current software version.
    /// Uses InformationalVersion to support semantic suffixes (-alpha, -beta, etc.)
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

        // Get current version from assembly
        // Split('+')[0] removes the Git hash that .NET adds automatically
        CurrentVersion = (Assembly.GetExecutingAssembly()
            .GetCustomAttribute<AssemblyInformationalVersionAttribute>()
            ?.InformationalVersion ?? "3.9.0")
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

            // Add date parameter to avoid cache
            var urlWithCacheBuster = $"{_settings.VersionsUrl}?d={DateTime.Now.Ticks}";

            using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            cts.CancelAfter(TimeSpan.FromSeconds(_settings.TimeoutSeconds));

            var response = await _httpClient.GetAsync(urlWithCacheBuster, cts.Token);
            response.EnsureSuccessStatusCode();

            var content = await response.Content.ReadAsStringAsync(cts.Token);

            _logger.LogDebug("Received version file content: {Content}", content);

            // Parse and detect new version
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

            // UseShellExecute = true is required to open URLs in the default browser
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
    /// Detects if a new version is available by parsing the versions file content.
    /// 
    /// Expected file format:
    /// fcs 1.9.0.0
    /// fcsng 2.0.0.0
    /// other 1.0.0.0
    /// </summary>
    /// <param name="content">Versions file content</param>
    /// <returns>Tuple (updateAvailable, latestVersion)</returns>
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
    /// Compares two versions to determine if the remote one is newer.
    /// </summary>
    /// <param name="currentVersion">Current local version</param>
    /// <param name="remoteVersion">Remote version to compare</param>
    /// <returns>True if the remote version is newer</returns>
    private bool CompareVersions(string currentVersion, string remoteVersion)
    {
        try
        {
            // Clean semantic suffixes (-alpha, -beta, -rc1, etc.) for numeric comparison
            var cleanCurrent = CleanVersionString(currentVersion);
            var cleanRemote = CleanVersionString(remoteVersion);

            // Use Version.TryParse for robust comparison
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
    /// Cleans the version string by removing semantic suffixes.
    /// "3.0.0-alpha" → "3.0.0"
    /// "1.8.0.0" → "1.8.0.0"
    /// </summary>
    private static string CleanVersionString(string version)
    {
        var dashIndex = version.IndexOf('-');
        return dashIndex >= 0 ? version[..dashIndex] : version;
    }

    /// <summary>
    /// Converts version to long integer for comparison.
    /// 
    /// aux = aux + 2 ^ (8 * (3 - i)) * CInt(buff(i))
    /// This creates a number where each part has 8 bits (256 values).
    /// </summary>
    private static long VersionToLong(string version)
    {
        var parts = version.Split('.');
        long result = 0;

        for (int i = 0; i < Math.Min(parts.Length, 4); i++)
        {
            if (int.TryParse(parts[i], out var part))
            {
                // Shift 8 bits per position (equivalent to 2^(8*(3-i)))
                result += (long)part << (8 * (3 - i));
            }
        }

        return result;
    }

    /// <summary>
    /// Normalizes multiple spaces to a single space.
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
