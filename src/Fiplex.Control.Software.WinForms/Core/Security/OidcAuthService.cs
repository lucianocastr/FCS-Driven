using Duende.IdentityModel.OidcClient;
using Duende.IdentityModel.OidcClient.Browser;
using Fiplex.Control.Software.WinForms.Core.Security.Interfaces;
using Fiplex.Control.Software.WinForms.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Security.Claims;

namespace Fiplex.Control.Software.WinForms.Core.Security;

/// <summary>
/// OIDC authentication service for Azure AD.
/// </summary>
public class OidcAuthService : IOidcAuthService
{
    private readonly ILogger<OidcAuthService> _logger;
    private readonly IOfflineTokenManager _tokenManager;
    private readonly IOfflineTokenGenerator _tokenGenerator;
    private readonly IOfflineTokenValidator _tokenValidator;
    private readonly OidcSettings _settings;
    private readonly IBrowser _browser;
    private OidcClient? _oidcClient;

    /// <inheritdoc/>
    public FireAccessToken? CurrentToken { get; private set; }

    /// <inheritdoc/>
    public ToolsLicensePermissions Permissions { get; } = new();

    /// <inheritdoc/>
    public bool IsAuthenticated => 
        CurrentToken?.IsValid == true && Permissions.LoginStatus;

    public OidcAuthService(
        ILogger<OidcAuthService> logger,
        IOfflineTokenManager tokenManager,
        IOfflineTokenGenerator tokenGenerator,
        IOfflineTokenValidator tokenValidator,
        IOptions<OidcSettings> settings,
        ILogger<WinFormsWebView2Browser> browserLogger)
    {
        _logger = logger;
        _tokenManager = tokenManager;
        _tokenGenerator = tokenGenerator;
        _tokenValidator = tokenValidator;
        _settings = settings.Value;
        _browser = new WinFormsWebView2Browser(browserLogger);

        InitializeOidcClient();
    }

    /// <summary>
    /// Initializes the OIDC client.
    /// </summary>
    private void InitializeOidcClient()
    {
        if (!_settings.IsValid)
        {
            _logger.LogWarning("Invalid OIDC configuration. TenantName or ClientId are empty.");
            return;
        }

        try
        {
            var options = new OidcClientOptions
            {
                Authority = _settings.GetFormattedAuthority(),
                ClientId = _settings.ClientId,
                Scope = _settings.GetScopesString(),
                RedirectUri = _settings.RedirectUri,
                // Duende 6.x usa Authorization Code con PKCE por defecto
                LoadProfile = false,
                Browser = _browser
            };

            // Add Resource for OAuth v1.0 (ResourceId)
            // This is necessary for Azure AD when using the v1.0 endpoint
            if (!string.IsNullOrEmpty(_settings.ResourceId))
            {
                options.Resource.Add(_settings.ResourceId);
                _logger.LogDebug("Using ResourceId for OAuth v1.0: {ResourceId}", _settings.ResourceId);
            }

            // Security policies
            // Duende 6.x has simplified API for policies
            options.Policy.Discovery.ValidateIssuerName = false;
            options.Policy.Discovery.ValidateEndpoints = false;

            // Clock skew (1441 minutos)
            options.ClockSkew = TimeSpan.FromMinutes(_settings.ClockSkewMinutes);

            _oidcClient = new OidcClient(options);

            _logger.LogInformation("OIDC client initialized. Authority: {Authority}", 
                _settings.GetFormattedAuthority());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error initializing OIDC client");
        }
    }

    /// <inheritdoc/>
    public async Task<OidcLoginResult> LoginAsync(IProgress<int>? progress = null, CancellationToken ct = default)
    {
        if (_oidcClient == null)
        {
            var errorMsg = !string.IsNullOrEmpty(_settings.ValidationError) 
                ? _settings.ValidationError 
                : "OIDC client not configured. Check OidcSettings in appsettings.json";
            
            _logger.LogError("Login failed - invalid configuration: {Error}", errorMsg);
            
            return OidcLoginResult.Failed(errorMsg, OidcLoginErrorCode.ConfigurationError);
        }

        try
        {
            _logger.LogInformation("Starting OIDC login process");
            progress?.Report(0);

            // Preparar login
            var state = await _oidcClient.PrepareLoginAsync(cancellationToken: ct);
            progress?.Report(5);

            // Configure browser options
            var browserOptions = new BrowserOptions(
                state.StartUrl + "&prompt=login",
                _oidcClient.Options.RedirectUri)
            {
                Timeout = TimeSpan.FromSeconds(_settings.BrowserTimeoutSeconds)
            };

            // Invoke browser
            _logger.LogDebug("Opening browser for authentication");
            var browserResult = await _oidcClient.Options.Browser.InvokeAsync(browserOptions, ct);
            progress?.Report(10);

            // Handle user cancellation
            if (browserResult.ResultType == BrowserResultType.UserCancel)
            {
                _logger.LogWarning("User cancelled login");
                return OidcLoginResult.Cancelled();
            }

            // Handle browser errors
            if (browserResult.ResultType != BrowserResultType.Success)
            {
                var errorCode = browserResult.ResultType switch
                {
                    BrowserResultType.Timeout => OidcLoginErrorCode.NoInternet,
                    BrowserResultType.HttpError => OidcLoginErrorCode.ServerError,
                    _ => OidcLoginErrorCode.Unknown
                };
                
                return OidcLoginResult.Failed(
                    $"Browser error: {browserResult.Error}",
                    errorCode);
            }

            // Process response
            _logger.LogDebug("Processing authentication response");
            ct.ThrowIfCancellationRequested();
            var result = await _oidcClient.ProcessResponseAsync(browserResult.Response, state);
            progress?.Report(20);

            if (result.IsError)
            {
                return HandleLoginError(result.Error);
            }

            // Successful login - process tokens
            return await ProcessSuccessfulLoginAsync(result, progress, ct);
        }
        catch (OperationCanceledException)
        {
            _logger.LogWarning("Login cancelled");
            return OidcLoginResult.Cancelled();
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Network error during login");
            return OidcLoginResult.Failed(
                "Login Error: Please make sure you connect to internet when you are attempting to login.",
                OidcLoginErrorCode.NoInternet);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during login");
            
            // HResult -2146233079 indicates connection error
            if (ex.HResult == -2146233079)
            {
                return OidcLoginResult.Failed(
                    "Login Error: Please make sure you connect to internet when you are attempting to login.",
                    OidcLoginErrorCode.NoInternet);
            }

            return OidcLoginResult.Failed(
                $"Login Error: Unexpected error occurred. {ex.Message}",
                OidcLoginErrorCode.Unknown);
        }
    }

    /// <summary>
    /// Processes a successful login and stores tokens.
    /// </summary>
    private async Task<OidcLoginResult> ProcessSuccessfulLoginAsync(
        LoginResult result, 
        IProgress<int>? progress, 
        CancellationToken ct)
    {
        // Extract username
        string userName = "Admin";
        try
        {
            if (result.User?.Identity is ClaimsIdentity identity)
            {
                userName = identity.Name ?? "Admin";
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not extract username");
        }

        // Create token
        CurrentToken = new FireAccessToken
        {
            IdentityToken = result.IdentityToken,
            RefreshToken = result.RefreshToken,
            AccessToken = result.AccessToken,
            ExpiresAt = result.AccessTokenExpiration.UtcDateTime
        };

        progress?.Report(30);

        // Store tokens locally
        if (!string.IsNullOrEmpty(result.IdentityToken))
        {
            await _tokenManager.StoreOfflineTokenAsync(
                result.IdentityToken, 
                OfflineTokenManager.OFFLINE_TOKEN_NAME, 
                ct);
        }
        progress?.Report(40);

        if (!string.IsNullOrEmpty(result.RefreshToken))
        {
            await _tokenManager.StoreOfflineTokenAsync(
                result.RefreshToken, 
                OfflineTokenManager.REFRESH_TOKEN_NAME, 
                ct);
        }
        progress?.Report(50);

        // Get offline token from backend
        // IMPORTANT: Uses IdentityToken, NOT AccessToken
        try
        {
            if (!string.IsNullOrEmpty(result.IdentityToken))
            {
                _logger.LogDebug("Getting offline token from server using IdentityToken...");
                var offlineToken = await _tokenGenerator.GetOfflineTokenAsync(result.IdentityToken, null, ct);
                
                if (!string.IsNullOrEmpty(offlineToken))
                {
                    await _tokenManager.StoreOfflineTokenAsync(
                        offlineToken, 
                        OfflineTokenManager.OFFLINE_TOKEN_NAME, 
                        ct);
                    CurrentToken.IdentityToken = offlineToken;
                    _logger.LogDebug("Offline token stored successfully");
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not get offline token from server");
        }
        progress?.Report(60);

        // Get public key for validation
        try
        {
            _logger.LogDebug("Getting public key from server...");
            var publicKey = await _tokenGenerator.GetPublicKeyStringAsync(null, ct);
            
            if (!string.IsNullOrEmpty(publicKey))
            {
                await _tokenManager.StoreOfflineTokenAsync(
                    publicKey, 
                    OfflineTokenManager.PUBLIC_KEY_NAME, 
                    ct);
                _logger.LogDebug("Public key stored successfully");
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not get public key from server");
        }
        progress?.Report(70);

        // Get cloud call token
        try
        {
            if (!string.IsNullOrEmpty(result.AccessToken))
            {
                _logger.LogDebug("Getting cloud call token from server...");
                var cloudCallResult = await _tokenGenerator.GetCloudCallTokenAsync(result.AccessToken, null, ct);
                
                if (!string.IsNullOrEmpty(cloudCallResult.CloudCallAccessToken))
                {
                    await _tokenManager.StoreOfflineTokenAsync(
                        cloudCallResult.CloudCallAccessToken, 
                        OfflineTokenManager.CLOUD_CALL_TOKEN_NAME, 
                        ct);
                    CurrentToken.CloudCallAccessToken = cloudCallResult.CloudCallAccessToken;
                    _logger.LogDebug("Cloud call token stored successfully");
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not get cloud call token from server");
        }
        progress?.Report(85);

        // Update permissions
        Permissions.IsLicenseTokenValid = ToolsLicensePermissions.TOKEN_AUTHORIZATION_SUCCESS;
        Permissions.LoginStatus = true;
        Permissions.UserName = userName;
        Permissions.IsBasicUser = false;
        Permissions.IsStartup = false;

        progress?.Report(100);

        _logger.LogInformation("Login successful for user: {UserName}", userName);

        return OidcLoginResult.Succeeded(CurrentToken, userName);
    }

    /// <summary>
    /// Handles login errors.
    /// </summary>
    private OidcLoginResult HandleLoginError(string error)
    {
        _logger.LogWarning("Login error: {Error}", error);

        if (error.Contains("UserCancel", StringComparison.OrdinalIgnoreCase))
        {
            return OidcLoginResult.Cancelled();
        }

        if (error.Contains("SecurityTokenExpiredException", StringComparison.OrdinalIgnoreCase))
        {
            return OidcLoginResult.Failed(
                "Please check your system time and date and make sure they are not set ahead or behind of actual time and date.\nMake sure you correct the System Date and Time before you attempt to login.",
                OidcLoginErrorCode.TokenExpired);
        }

        return OidcLoginResult.Failed($"Login Error: {error}", OidcLoginErrorCode.Unknown);
    }

    /// <inheritdoc/>
    public async Task<bool> ValidateOfflineTokenAsync(CancellationToken ct = default)
    {
        try
        {
            // Check if offline token exists
            if (!_tokenManager.TokenFileExists(OfflineTokenManager.OFFLINE_TOKEN_NAME))
            {
                _logger.LogDebug("No offline token exists");
                return false;
            }

            // Load token
            var offlineToken = await _tokenManager.LoadOfflineTokenAsync(
                OfflineTokenManager.OFFLINE_TOKEN_NAME, ct);

            if (string.IsNullOrEmpty(offlineToken))
            {
                _logger.LogDebug("Offline token is empty");
                return false;
            }

            // Load public key for validation
            var publicKey = await _tokenManager.LoadOfflineTokenAsync(
                OfflineTokenManager.PUBLIC_KEY_NAME, ct);

            if (string.IsNullOrEmpty(publicKey))
            {
                _logger.LogWarning("No public key exists for JWT validation");
                // Try to get public key from server
                try
                {
                    publicKey = await _tokenGenerator.GetPublicKeyStringAsync(null, ct);
                    if (!string.IsNullOrEmpty(publicKey))
                    {
                        await _tokenManager.StoreOfflineTokenAsync(
                            publicKey, 
                            OfflineTokenManager.PUBLIC_KEY_NAME, 
                            ct);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Could not get public key from server");
                }
            }

            // Validate JWT token
            // If signature cannot be validated, allow to continue if token is not expired
            if (!string.IsNullOrEmpty(publicKey))
            {
                var validationResult = _tokenValidator.ValidateToken(offlineToken, publicKey);
                
                if (!validationResult.IsValid)
                {
                    // Check if error is only signature (allow continue) or expiration (block)
                    if (validationResult.ErrorMessage?.Contains("expirado", StringComparison.OrdinalIgnoreCase) == true ||
                        validationResult.ErrorMessage?.Contains("expired", StringComparison.OrdinalIgnoreCase) == true)
                    {
                        _logger.LogWarning("Offline token expired: {Error}", validationResult.ErrorMessage);
                        return false;
                    }
                    
                    // For other errors (signature, format, etc.), try basic validation
                    _logger.LogWarning("Full validation failed ({Error}), trying basic expiration validation", 
                        validationResult.ErrorMessage);
                    
                    // Validate only expiration as fallback
                    if (!_tokenValidator.IsTokenNotExpired(offlineToken))
                    {
                        _logger.LogWarning("Offline token expired in basic validation");
                        return false;
                    }
                    
                    _logger.LogInformation("Offline token valid (basic validation - expiration only)");
                }
                else
                {
                    _logger.LogInformation("Offline token validated correctly (full validation)");
                    
                    // Extract claims if validation was successful
                    if (validationResult.Claims != null)
                    {
                        Permissions.UserName = validationResult.Claims.UniqueName ?? Permissions.UserName;
                    }
                }
            }
            else
            {
                // Without public key, only verify that token exists and is not expired
                _logger.LogWarning("Token validation without public key - expiration verification");
                
                if (!_tokenValidator.IsTokenNotExpired(offlineToken))
                {
                    _logger.LogWarning("Offline token expired (no public key)");
                    return false;
                }
            }
            
            // Load tokens in memory
            await ReadTokenInformationAsync(ct);
            
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating offline token");
            return false;
        }
    }

    /// <inheritdoc/>
    public async Task<bool> RefreshTokenAsync(CancellationToken ct = default)
    {
        if (_oidcClient == null || string.IsNullOrEmpty(CurrentToken?.RefreshToken))
        {
            return false;
        }

        try
        {
            var result = await _oidcClient.RefreshTokenAsync(CurrentToken.RefreshToken, cancellationToken: ct);

            if (result.IsError)
            {
                _logger.LogWarning("Error refreshing token: {Error}", result.Error);
                return false;
            }

            // Update tokens
            CurrentToken.AccessToken = result.AccessToken;
            CurrentToken.RefreshToken = result.RefreshToken ?? CurrentToken.RefreshToken;
            CurrentToken.ExpiresAt = result.AccessTokenExpiration.UtcDateTime;

            // Store new refresh token
            if (!string.IsNullOrEmpty(result.RefreshToken))
            {
                await _tokenManager.StoreOfflineTokenAsync(
                    result.RefreshToken, 
                    OfflineTokenManager.REFRESH_TOKEN_NAME, 
                    ct);
            }

            _logger.LogInformation("Token refreshed successfully");
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error refrescando token");
            return false;
        }
    }

    /// <inheritdoc/>
    public Task LogoutAsync()
    {
        CurrentToken?.Clear();
        CurrentToken = null;
        Permissions.Reset();
        _tokenManager.ClearAllTokens();

        _logger.LogInformation("Session closed");
        return Task.CompletedTask;
    }

    /// <inheritdoc/>
    public async Task ReadTokenInformationAsync(CancellationToken ct = default)
    {
        try
        {
            var offlineToken = await _tokenManager.LoadOfflineTokenAsync(
                OfflineTokenManager.OFFLINE_TOKEN_NAME, ct);
            var refreshToken = await _tokenManager.LoadOfflineTokenAsync(
                OfflineTokenManager.REFRESH_TOKEN_NAME, ct);
            var cloudCallToken = await _tokenManager.LoadOfflineTokenAsync(
                OfflineTokenManager.CLOUD_CALL_TOKEN_NAME, ct);

            CurrentToken = new FireAccessToken
            {
                IdentityToken = offlineToken,
                RefreshToken = refreshToken,
                CloudCallAccessToken = cloudCallToken
            };

            if (CurrentToken.IsValid || !string.IsNullOrEmpty(offlineToken))
            {
                Permissions.LoginStatus = true;
                Permissions.IsLicenseTokenValid = ToolsLicensePermissions.TOKEN_AUTHORIZATION_SUCCESS;
            }

            _logger.LogDebug("Token information loaded");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reading token information");
        }
    }
}
