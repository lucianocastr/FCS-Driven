using Fiplex.Control.Software.WinForms.Models;

namespace Fiplex.Control.Software.WinForms.Core.Security.Interfaces;

/// <summary>
/// Servicio de autenticación OIDC para Azure AD.
/// </summary>
public interface IOidcAuthService
{
    /// <summary>
    /// Token de acceso actual.
    /// </summary>
    FireAccessToken? CurrentToken { get; }

    /// <summary>
    /// Permisos y estado de licencia del usuario.
    /// </summary>
    ToolsLicensePermissions Permissions { get; }

    /// <summary>
    /// Indica si hay una sesión activa válida.
    /// </summary>
    bool IsAuthenticated { get; }

    /// <summary>
    /// Inicia el proceso de login OIDC.
    /// Abre browser embebido para autenticación Azure AD.
    /// </summary>
    /// <param name="progress">Reporte de progreso (0-100).</param>
    /// <param name="ct">Token de cancelación.</param>
    /// <returns>Resultado del login.</returns>
    Task<OidcLoginResult> LoginAsync(IProgress<int>? progress = null, CancellationToken ct = default);

    /// <summary>
    /// Valida si existe un token offline válido.
    /// </summary>
    /// <param name="ct">Token de cancelación.</param>
    /// <returns>True si token offline válido existe.</returns>
    Task<bool> ValidateOfflineTokenAsync(CancellationToken ct = default);

    /// <summary>
    /// Refresca el access token usando el refresh token.
    /// </summary>
    /// <param name="ct">Token de cancelación.</param>
    /// <returns>True si el refresh fue exitoso.</returns>
    Task<bool> RefreshTokenAsync(CancellationToken ct = default);

    /// <summary>
    /// Cierra la sesión actual y limpia los tokens.
    /// </summary>
    Task LogoutAsync();

    /// <summary>
    /// Lee la información de tokens almacenados.
    /// </summary>
    Task ReadTokenInformationAsync(CancellationToken ct = default);
}
