namespace Fiplex.Control.Software.WinForms.Core.Security.Interfaces;

/// <summary>
/// Offline token manager for local persistence.
/// </summary>
public interface IOfflineTokenManager
{
    /// <summary>
    /// Stores a token in a local file.
    /// </summary>
    /// <param name="tokenValue">Token value to store.</param>
    /// <param name="fileName">File name (e.g.: "offline.token").</param>
    /// <returns>True if stored successfully.</returns>
    Task<bool> StoreOfflineTokenAsync(string tokenValue, string fileName, CancellationToken ct = default);

    /// <summary>
    /// Loads a token from a local file.
    /// </summary>
    /// <param name="fileName">File name to read.</param>
    /// <returns>Token content or null if it doesn't exist.</returns>
    Task<string?> LoadOfflineTokenAsync(string fileName, CancellationToken ct = default);

    /// <summary>
    /// Checks if a token file exists.
    /// </summary>
    /// <param name="fileName">File name to verify.</param>
    /// <returns>True if the file exists.</returns>
    bool TokenFileExists(string fileName);

    /// <summary>
    /// Deletes a token file.
    /// </summary>
    /// <param name="fileName">File name to delete.</param>
    /// <returns>True if deleted successfully.</returns>
    bool DeleteTokenFile(string fileName);

    /// <summary>
    /// Deletes all token files.
    /// </summary>
    void ClearAllTokens();
}
