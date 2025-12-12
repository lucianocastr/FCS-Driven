using Fiplex.Control.Software.WinForms.Models;

namespace Fiplex.Control.Software.WinForms.Core.Security.Interfaces;

/// <summary>
/// OIDC authentication service for Azure AD.
/// </summary>
public interface IOidcAuthService
{
    /// <summary>
    /// Current access token.
    /// </summary>
    FireAccessToken? CurrentToken { get; }

    /// <summary>
    /// User permissions and license status.
    /// </summary>
    ToolsLicensePermissions Permissions { get; }

    /// <summary>
    /// Indicates whether there is a valid active session.
    /// </summary>
    bool IsAuthenticated { get; }

    /// <summary>
    /// Starts the OIDC login process.
    /// Opens an embedded browser for Azure AD authentication.
    /// </summary>
    /// <param name="progress">Progress report (0-100).</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>Login result.</returns>
    Task<OidcLoginResult> LoginAsync(IProgress<int>? progress = null, CancellationToken ct = default);

    /// <summary>
    /// Validates whether a valid offline token exists.
    /// </summary>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>True if a valid offline token exists.</returns>
    Task<bool> ValidateOfflineTokenAsync(CancellationToken ct = default);

    /// <summary>
    /// Refreshes the access token using the refresh token.
    /// </summary>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>True if the refresh was successful.</returns>
    Task<bool> RefreshTokenAsync(CancellationToken ct = default);

    /// <summary>
    /// Closes the current session and clears the tokens.
    /// </summary>
    Task LogoutAsync();

    /// <summary>
    /// Reads stored token information.
    /// </summary>
    Task ReadTokenInformationAsync(CancellationToken ct = default);
}
