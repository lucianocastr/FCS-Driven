namespace Fiplex.Control.Software.WinForms.Models;

/// <summary>
/// API endpoint URL configuration for authentication and cloud services.
/// </summary>
/// <remarks>
/// Values are loaded from the "ApiEndpoints" section of appsettings.json.
/// </remarks>
public class ApiEndpoints
{
    /// <summary>
    /// Endpoint URL for obtaining offline token.
    /// </summary>
    public string OfflineApi { get; set; } = string.Empty;

    /// <summary>
    /// Endpoint URL for obtaining JWT validation public key.
    /// </summary>
    public string PublicKeyUrl { get; set; } = string.Empty;

    /// <summary>
    /// Endpoint URL for obtaining cloud service call token.
    /// </summary>
    public string ClssCloudTokenUrl { get; set; } = string.Empty;

    /// <summary>
    /// Base URL of the OAuth token endpoint.
    /// </summary>
    public string TokenUrl { get; set; } = string.Empty;

    /// <summary>
    /// Indicates whether the configuration is valid.
    /// </summary>
    public bool IsValid =>
        !string.IsNullOrWhiteSpace(OfflineApi) &&
        !string.IsNullOrWhiteSpace(PublicKeyUrl) &&
        !string.IsNullOrWhiteSpace(ClssCloudTokenUrl);
}
