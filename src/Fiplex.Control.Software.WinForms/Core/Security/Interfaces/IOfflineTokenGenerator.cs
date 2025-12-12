namespace Fiplex.Control.Software.WinForms.Core.Security.Interfaces;

/// <summary>
/// Offline token generator from backend.
/// </summary>
public interface IOfflineTokenGenerator
{
    /// <summary>
    /// Gets an offline token from the backend.
    /// </summary>
    /// <param name="idToken">Identity token for Bearer authorization.</param>
    /// <param name="progress">Progress report (0-100).</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>Offline token as string.</returns>
    Task<string> GetOfflineTokenAsync(string idToken, IProgress<int>? progress = null, CancellationToken ct = default);

    /// <summary>
    /// Gets the public key from the backend.
    /// </summary>
    /// <param name="progress">Progress report (0-100).</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>Public key as Base64 string.</returns>
    Task<string> GetPublicKeyStringAsync(IProgress<int>? progress = null, CancellationToken ct = default);

    /// <summary>
    /// Gets tokens for cloud calls from the backend.
    /// </summary>
    /// <param name="refreshToken">Refresh token for Bearer authorization.</param>
    /// <param name="progress">Progress report (0-100).</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>Token pair: cloudCallAccessToken and updated refreshToken.</returns>
    Task<CloudCallTokenResult> GetCloudCallTokenAsync(string refreshToken, IProgress<int>? progress = null, CancellationToken ct = default);

    /// <summary>
    /// Gets a valid token by renewing the current one.
    /// </summary>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>Renewed access token.</returns>
    Task<string> GetValidTokenAsync(CancellationToken ct = default);
}

/// <summary>
/// Result of token retrieval for cloud calls.
/// </summary>
public class CloudCallTokenResult
{
    /// <summary>
    /// Token de acceso para llamadas cloud.
    /// </summary>
    public string CloudCallAccessToken { get; set; } = string.Empty;

    /// <summary>
    /// Updated refresh token.
    /// </summary>
    public string RefreshToken { get; set; } = string.Empty;
}
