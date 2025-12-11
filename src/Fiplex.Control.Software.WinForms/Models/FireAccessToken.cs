namespace Fiplex.Control.Software.WinForms.Models;

/// <summary>
/// Almacena los tokens de autenticación OIDC para la sesión actual.
/// </summary>
/// <remarks>
/// Contiene todos los tokens necesarios para autenticación y autorización:
/// <list type="bullet">
///   <item><see cref="IdentityToken"/> - Claims del usuario</item>
///   <item><see cref="AccessToken"/> - Acceso a APIs</item>
///   <item><see cref="RefreshToken"/> - Renovación de sesión</item>
/// </list>
/// </remarks>
public class FireAccessToken
{
    /// <summary>
    /// Token de identidad JWT.
    /// Contiene claims del usuario autenticado.
    /// </summary>
    public string? IdentityToken { get; set; }

    /// <summary>
    /// Token de refresco para obtener nuevos access tokens.
    /// Permite renovar la sesión sin re-autenticación.
    /// </summary>
    public string? RefreshToken { get; set; }

    /// <summary>
    /// Token de acceso para llamadas a APIs protegidas.
    /// </summary>
    public string? AccessToken { get; set; }

    /// <summary>
    /// Fecha de expiración del access token.
    /// </summary>
    public DateTime? ExpiresAt { get; set; }

    /// <summary>
    /// Token para llamadas a servicios cloud de Fiplex.
    /// </summary>
    /// <remarks>Utilizado para comunicación con APIs backend de CLSS.</remarks>
    public string? CloudCallAccessToken { get; set; }

    /// <summary>
    /// Indica si el token es válido y no ha expirado.
    /// </summary>
    public bool IsValid => 
        !string.IsNullOrEmpty(AccessToken) && 
        (!ExpiresAt.HasValue || ExpiresAt.Value > DateTime.UtcNow);

    /// <summary>
    /// Limpia todos los tokens almacenados.
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
