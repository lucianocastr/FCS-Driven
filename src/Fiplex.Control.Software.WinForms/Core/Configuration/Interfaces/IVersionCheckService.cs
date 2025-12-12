namespace Fiplex.Control.Software.WinForms.Core.Configuration.Interfaces;

/// <summary>
/// Version check result.
/// </summary>
/// <param name="UpdateAvailable">Indicates if a newer version is available</param>
/// <param name="CurrentVersion">Current software version (local)</param>
/// <param name="LatestVersion">Latest available version (remote), null if it couldn't be obtained</param>
/// <param name="DownloadUrl">Installer/ZIP download URL, null if not available</param>
/// <param name="ErrorMessage">Error message if the check failed, null if successful</param>
public record VersionCheckResult(
    bool UpdateAvailable,
    string CurrentVersion,
    string? LatestVersion,
    string? DownloadUrl,
    string? ErrorMessage = null);

/// <summary>
/// Service for checking software updates.
/// 
/// 1. CheckNewVersion() navigates to urlUpd (lastversions.txt)
/// 2. WebBrowser1_DocumentCompleted captures the content
/// 3. detectNewVersion() parses and compares versions
/// 4. If there's a new version → lblHyperLink.Visible = True
/// 
/// In modern C# we use async HttpClient instead of WebBrowser.
/// </summary>
public interface IVersionCheckService
{
    /// <summary>
    /// Current software version.
    /// </summary>
    string CurrentVersion { get; }

    /// <summary>
    /// Latest available version known (after checking).
    /// </summary>
    string? LatestVersion { get; }

    /// <summary>
    /// Download URL for the latest version.
    /// </summary>
    string? DownloadUrl { get; }

    /// <summary>
    /// Indicates if an update is available (after checking).
    /// </summary>
    bool UpdateAvailable { get; }

    /// <summary>
    /// Checks if updates are available.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Check result with all details</returns>
    Task<VersionCheckResult> CheckForUpdatesAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Opens the download URL in the default browser.
    /// </summary>
    /// <returns>True if the browser could be opened, false on error</returns>
    bool OpenDownloadUrl();
}
