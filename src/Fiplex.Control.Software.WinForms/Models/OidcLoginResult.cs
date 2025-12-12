namespace Fiplex.Control.Software.WinForms.Models;

/// <summary>
/// Result of an OIDC login operation.
/// </summary>
public class OidcLoginResult
{
    /// <summary>
    /// Indicates whether the login was successful.
    /// </summary>
    public bool Success { get; init; }

    /// <summary>
    /// Error message if the login failed.
    /// </summary>
    public string? ErrorMessage { get; init; }

    /// <summary>
    /// Specific error code.
    /// </summary>
    public OidcLoginErrorCode ErrorCode { get; init; } = OidcLoginErrorCode.None;

    /// <summary>
    /// Tokens obtained if the login was successful.
    /// </summary>
    public FireAccessToken? Token { get; init; }

    /// <summary>
    /// Authenticated user name.
    /// </summary>
    public string? UserName { get; init; }

    /// <summary>
    /// Creates a successful result.
    /// </summary>
    public static OidcLoginResult Succeeded(FireAccessToken token, string? userName = null)
        => new()
        {
            Success = true,
            Token = token,
            UserName = userName
        };

    /// <summary>
    /// Creates a failure result.
    /// </summary>
    public static OidcLoginResult Failed(string message, OidcLoginErrorCode errorCode = OidcLoginErrorCode.Unknown)
        => new()
        {
            Success = false,
            ErrorMessage = message,
            ErrorCode = errorCode
        };

    /// <summary>
    /// User cancellation result.
    /// </summary>
    public static OidcLoginResult Cancelled()
        => new()
        {
            Success = false,
            ErrorMessage = "Login Error: User has cancelled login",
            ErrorCode = OidcLoginErrorCode.UserCancelled
        };
}

/// <summary>
/// Error codes for OIDC login.
/// </summary>
public enum OidcLoginErrorCode
{
    /// <summary>No error.</summary>
    None = 0,

    /// <summary>User cancelled the login.</summary>
    UserCancelled = 1,

    /// <summary>Token expired or incorrect date/time.</summary>
    TokenExpired = 2,

    /// <summary>No internet connection.</summary>
    NoInternet = 3,

    /// <summary>OIDC configuration error.</summary>
    ConfigurationError = 4,

    /// <summary>Authentication server error.</summary>
    ServerError = 5,

    /// <summary>Unknown error.</summary>
    Unknown = 99
}
