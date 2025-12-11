namespace Fiplex.Control.Software.WinForms.Models;

/// <summary>
/// Configuración OIDC para autenticación con Azure Active Directory.
/// </summary>
/// <remarks>
/// Contiene todos los parámetros necesarios para el flujo OAuth v1.0 con Azure AD.
/// Los valores se cargan desde la sección "OidcSettings" de appsettings.json.
/// </remarks>
public class OidcSettings
{
    /// <summary>
    /// URL base de autoridad de Azure AD.
    /// </summary>
    /// <remarks>
    /// Formato OAuth v1.0: "https://login.microsoftonline.com/{0}"
    /// El marcador {0} será reemplazado por <see cref="TenantName"/>.
    /// </remarks>
    public string Authority { get; set; } = "https://login.microsoftonline.com/{0}";

    /// <summary>
    /// Nombre del tenant de Azure AD.
    /// </summary>
    public string TenantName { get; set; } = string.Empty;

    /// <summary>
    /// ID de cliente de la aplicación registrada en Azure AD.
    /// </summary>
    public string ClientId { get; set; } = string.Empty;

    /// <summary>
    /// ResourceId para el flujo OAuth v1.0.
    /// </summary>
    public string ResourceId { get; set; } = string.Empty;

    /// <summary>
    /// Issuer esperado para validación de tokens JWT.
    /// </summary>
    /// <value>Por defecto: "HONEYWELL-PKI"</value>
    public string Issuer { get; set; } = "HONEYWELL-PKI";

    /// <summary>
    /// URI de redirección tras completar la autenticación.
    /// </summary>
    public string RedirectUri { get; set; } = "http://localhost:4200/signin";

    /// <summary>
    /// Scopes solicitados durante la autenticación.
    /// Para OAuth v1.0: Solo openid y offline_access
    /// </summary>
    public string[] Scopes { get; set; } = ["openid", "offline_access"];

    /// <summary>
    /// Tolerancia de reloj para validación de tokens (en minutos).
    /// </summary>
    /// <value>Por defecto: 1441 minutos (~24 horas).</value>
    public int ClockSkewMinutes { get; set; } = 1441;

    /// <summary>
    /// Timeout para operaciones del browser (en segundos).
    /// </summary>
    public int BrowserTimeoutSeconds { get; set; } = 3600;

    /// <summary>
    /// Indica si la configuración es válida.
    /// Verifica que no sean valores por defecto/placeholder.
    /// </summary>
    public bool IsValid => 
        !string.IsNullOrWhiteSpace(TenantName) && 
        !string.IsNullOrWhiteSpace(ClientId) &&
        !TenantName.StartsWith("YOUR_", StringComparison.OrdinalIgnoreCase) &&
        !ClientId.StartsWith("YOUR_", StringComparison.OrdinalIgnoreCase);

    /// <summary>
    /// Mensaje de error de validación.
    /// </summary>
    public string ValidationError
    {
        get
        {
            if (string.IsNullOrWhiteSpace(TenantName) || TenantName.StartsWith("YOUR_", StringComparison.OrdinalIgnoreCase))
                return "TenantName no configurado en appsettings.json. Configure 'OidcSettings.TenantName' con el nombre de su tenant de Azure AD.";
            if (string.IsNullOrWhiteSpace(ClientId) || ClientId.StartsWith("YOUR_", StringComparison.OrdinalIgnoreCase))
                return "ClientId no configurado en appsettings.json. Configure 'OidcSettings.ClientId' con el ID de cliente de Azure AD.";
            return string.Empty;
        }
    }

    /// <summary>
    /// Obtiene la URL de autoridad formateada.
    /// </summary>
    public string GetFormattedAuthority() => 
        string.Format(System.Globalization.CultureInfo.InvariantCulture, Authority, TenantName);

    /// <summary>
    /// Obtiene los scopes como string concatenado.
    /// </summary>
    public string GetScopesString() => string.Join(" ", Scopes);
}
