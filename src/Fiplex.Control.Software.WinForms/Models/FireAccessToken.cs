namespace Fiplex.Control.Software.WinForms.Models;

/// <summary>
/// Stores OIDC authentication tokens for the current session.
/// </summary>
/// <remarks>
/// Contains all tokens required for authentication and authorization:
/// <list type="bullet">
///   <item><see cref="IdentityToken"/> - User claims</item>
///   <item><see cref="AccessToken"/> - API access</item>
///   <item><see cref="RefreshToken"/> - Session renewal</item>
/// </list>
/// </remarks>
public class FireAccessToken
{
    /// <summary>
    /// JWT identity token.
    /// Contains claims of the authenticated user.
    /// </summary>
    public string? IdentityToken { get; set; }

    /// <summary>
    /// Refresh token to obtain new access tokens.
    /// Allows session renewal without re-authentication.
    /// </summary>
    public string? RefreshToken { get; set; }

    /// <summary>
    /// Access token for calls to protected APIs.
    /// </summary>
    public string? AccessToken { get; set; }

    /// <summary>
    /// Access token expiration date.
    /// </summary>
    public DateTime? ExpiresAt { get; set; }

    /// <summary>
    /// Token for calls to Fiplex cloud services.
    /// </summary>
    /// <remarks>Used for communication with CLSS backend APIs.</remarks>
    public string? CloudCallAccessToken { get; set; }

    /// <summary>
    /// Indicates if the token is valid and has not expired.
    /// </summary>
    public bool IsValid => 
        !string.IsNullOrEmpty(AccessToken) && 
        (!ExpiresAt.HasValue || ExpiresAt.Value > DateTime.UtcNow);

    /// <summary>
    /// Clears all stored tokens.
    /// </summary>
    public void Clear()
    {
        IdentityToken = null;
        RefreshToken = null;
        AccessToken = null;
        ExpiresAt = null;
        CloudCallAccessToken = null;
    }
}
