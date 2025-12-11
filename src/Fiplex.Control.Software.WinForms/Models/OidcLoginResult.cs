namespace Fiplex.Control.Software.WinForms.Models;

/// <summary>
/// Resultado de una operación de login OIDC.
/// </summary>
public class OidcLoginResult
{
    /// <summary>
    /// Indica si el login fue exitoso.
    /// </summary>
    public bool Success { get; init; }

    /// <summary>
    /// Mensaje de error si el login falló.
    /// </summary>
    public string? ErrorMessage { get; init; }

    /// <summary>
    /// Código de error específico.
    /// </summary>
    public OidcLoginErrorCode ErrorCode { get; init; } = OidcLoginErrorCode.None;

    /// <summary>
    /// Tokens obtenidos si el login fue exitoso.
    /// </summary>
    public FireAccessToken? Token { get; init; }

    /// <summary>
    /// Nombre del usuario autenticado.
    /// </summary>
    public string? UserName { get; init; }

    /// <summary>
    /// Crea un resultado exitoso.
    /// </summary>
    public static OidcLoginResult Succeeded(FireAccessToken token, string? userName = null)
        => new()
        {
            Success = true,
            Token = token,
            UserName = userName
        };

    /// <summary>
    /// Crea un resultado de fallo.
    /// </summary>
    public static OidcLoginResult Failed(string message, OidcLoginErrorCode errorCode = OidcLoginErrorCode.Unknown)
        => new()
        {
            Success = false,
            ErrorMessage = message,
            ErrorCode = errorCode
        };

    /// <summary>
    /// Resultado de cancelación por usuario.
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
/// Códigos de error para login OIDC.
/// </summary>
public enum OidcLoginErrorCode
{
    /// <summary>Sin error.</summary>
    None = 0,

    /// <summary>Usuario canceló el login.</summary>
    UserCancelled = 1,

    /// <summary>Token expirado o fecha/hora incorrecta.</summary>
    TokenExpired = 2,

    /// <summary>Sin conexión a internet.</summary>
    NoInternet = 3,

    /// <summary>Error de configuración OIDC.</summary>
    ConfigurationError = 4,

    /// <summary>Error del servidor de autenticación.</summary>
    ServerError = 5,

    /// <summary>Error desconocido.</summary>
    Unknown = 99
}
