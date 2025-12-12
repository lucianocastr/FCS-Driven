namespace Fiplex.Control.Software.WinForms.Models;

/// <summary>
/// OIDC configuration for authentication with Azure Active Directory.
/// </summary>
/// <remarks>
/// Contains all parameters required for the OAuth v1.0 flow with Azure AD.
/// Values are loaded from the "OidcSettings" section of appsettings.json.
/// </remarks>
public class OidcSettings
{
    /// <summary>
    /// Azure AD authority base URL.
    /// </summary>
    /// <remarks>
    /// OAuth v1.0 format: "https://login.microsoftonline.com/{0}"
    /// The {0} placeholder will be replaced by <see cref="TenantName"/>.
    /// </remarks>
    public string Authority { get; set; } = "https://login.microsoftonline.com/{0}";

    /// <summary>
    /// Azure AD tenant name.
    /// </summary>
    public string TenantName { get; set; } = string.Empty;

    /// <summary>
    /// Client ID of the application registered in Azure AD.
    /// </summary>
    public string ClientId { get; set; } = string.Empty;

    /// <summary>
    /// ResourceId for the OAuth v1.0 flow.
    /// </summary>
    public string ResourceId { get; set; } = string.Empty;

    /// <summary>
    /// Expected issuer for JWT token validation.
    /// </summary>
    /// <value>Default: "HONEYWELL-PKI"</value>
    public string Issuer { get; set; } = "HONEYWELL-PKI";

    /// <summary>
    /// Redirect URI after completing authentication.
    /// </summary>
    public string RedirectUri { get; set; } = "http://localhost:4200/signin";

    /// <summary>
    /// Scopes requested during authentication.
    /// For OAuth v1.0: Only openid and offline_access
    /// </summary>
    public string[] Scopes { get; set; } = ["openid", "offline_access"];

    /// <summary>
    /// Clock tolerance for token validation (in minutes).
    /// </summary>
    /// <value>Default: 1441 minutes (~24 hours).</value>
    public int ClockSkewMinutes { get; set; } = 1441;

    /// <summary>
    /// Timeout for browser operations (in seconds).
    /// </summary>
    public int BrowserTimeoutSeconds { get; set; } = 3600;

    /// <summary>
    /// Indicates if the configuration is valid.
    /// Verifies that values are not default/placeholder values.
    /// </summary>
    public bool IsValid => 
        !string.IsNullOrWhiteSpace(TenantName) && 
        !string.IsNullOrWhiteSpace(ClientId) &&
        !TenantName.StartsWith("YOUR_", StringComparison.OrdinalIgnoreCase) &&
        !ClientId.StartsWith("YOUR_", StringComparison.OrdinalIgnoreCase);

    /// <summary>
    /// Validation error message.
    /// </summary>
    public string ValidationError
    {
        get
        {
            if (string.IsNullOrWhiteSpace(TenantName) || TenantName.StartsWith("YOUR_", StringComparison.OrdinalIgnoreCase))
                return "TenantName not configured in appsettings.json. Configure 'OidcSettings.TenantName' with your Azure AD tenant name.";
            if (string.IsNullOrWhiteSpace(ClientId) || ClientId.StartsWith("YOUR_", StringComparison.OrdinalIgnoreCase))
                return "ClientId not configured in appsettings.json. Configure 'OidcSettings.ClientId' with the Azure AD client ID.";
            return string.Empty;
        }
    }

    /// <summary>
    /// Gets the formatted authority URL.
    /// </summary>
    public string GetFormattedAuthority() => 
        string.Format(System.Globalization.CultureInfo.InvariantCulture, Authority, TenantName);

    /// <summary>
    /// Gets the scopes as a concatenated string.
    /// </summary>
    public string GetScopesString() => string.Join(" ", Scopes);
}
