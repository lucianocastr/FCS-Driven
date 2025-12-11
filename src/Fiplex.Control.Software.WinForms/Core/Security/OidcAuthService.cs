using Duende.IdentityModel.OidcClient;
using Duende.IdentityModel.OidcClient.Browser;
using Fiplex.Control.Software.WinForms.Core.Security.Interfaces;
using Fiplex.Control.Software.WinForms.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Security.Claims;

namespace Fiplex.Control.Software.WinForms.Core.Security;

/// <summary>
/// Servicio de autenticación OIDC para Azure AD.
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
    /// Inicializa el cliente OIDC.
    /// </summary>
    private void InitializeOidcClient()
    {
        if (!_settings.IsValid)
        {
            _logger.LogWarning("Configuración OIDC inválida. TenantName o ClientId vacíos.");
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

            // Agregar Resource para OAuth v1.0 (ResourceId)
            // Esto es necesario para Azure AD cuando se usa el endpoint v1.0
            if (!string.IsNullOrEmpty(_settings.ResourceId))
            {
                options.Resource.Add(_settings.ResourceId);
                _logger.LogDebug("Usando ResourceId para OAuth v1.0: {ResourceId}", _settings.ResourceId);
            }

            // Políticas de seguridad
            // Duende 6.x tiene API simplificada para políticas
            options.Policy.Discovery.ValidateIssuerName = false;
            options.Policy.Discovery.ValidateEndpoints = false;

            // Clock skew (1441 minutos)
            options.ClockSkew = TimeSpan.FromMinutes(_settings.ClockSkewMinutes);

            _oidcClient = new OidcClient(options);

            _logger.LogInformation("Cliente OIDC inicializado. Authority: {Authority}", 
                _settings.GetFormattedAuthority());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error inicializando cliente OIDC");
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
            
            _logger.LogError("Login fallido - configuración inválida: {Error}", errorMsg);
            
            return OidcLoginResult.Failed(errorMsg, OidcLoginErrorCode.ConfigurationError);
        }

        try
        {
            _logger.LogInformation("Iniciando proceso de login OIDC");
            progress?.Report(0);

            // Preparar login
            var state = await _oidcClient.PrepareLoginAsync(cancellationToken: ct);
            progress?.Report(5);

            // Configurar opciones del browser
            var browserOptions = new BrowserOptions(
                state.StartUrl + "&prompt=login",
                _oidcClient.Options.RedirectUri)
            {
                Timeout = TimeSpan.FromSeconds(_settings.BrowserTimeoutSeconds)
            };

            // Invocar browser
            _logger.LogDebug("Abriendo browser para autenticación");
            var browserResult = await _oidcClient.Options.Browser.InvokeAsync(browserOptions, ct);
            progress?.Report(10);

            // Manejar cancelación por usuario
            if (browserResult.ResultType == BrowserResultType.UserCancel)
            {
                _logger.LogWarning("Usuario canceló el login");
                return OidcLoginResult.Cancelled();
            }

            // Manejar errores del browser
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

            // Procesar respuesta
            _logger.LogDebug("Procesando respuesta de autenticación");
            ct.ThrowIfCancellationRequested();
            var result = await _oidcClient.ProcessResponseAsync(browserResult.Response, state);
            progress?.Report(20);

            if (result.IsError)
            {
                return HandleLoginError(result.Error);
            }

            // Login exitoso - procesar tokens
            return await ProcessSuccessfulLoginAsync(result, progress, ct);
        }
        catch (OperationCanceledException)
        {
            _logger.LogWarning("Login cancelado");
            return OidcLoginResult.Cancelled();
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Error de red durante login");
            return OidcLoginResult.Failed(
                "Login Error: Please make sure you connect to internet when you are attempting to login.",
                OidcLoginErrorCode.NoInternet);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error inesperado durante login");
            
            // HResult -2146233079 indica error de conexión
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
    /// Procesa un login exitoso y almacena tokens.
    /// </summary>
    private async Task<OidcLoginResult> ProcessSuccessfulLoginAsync(
        LoginResult result, 
        IProgress<int>? progress, 
        CancellationToken ct)
    {
        // Extraer nombre de usuario
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
            _logger.LogWarning(ex, "No se pudo extraer nombre de usuario");
        }

        // Crear token
        CurrentToken = new FireAccessToken
        {
            IdentityToken = result.IdentityToken,
            RefreshToken = result.RefreshToken,
            AccessToken = result.AccessToken,
            ExpiresAt = result.AccessTokenExpiration.UtcDateTime
        };

        progress?.Report(30);

        // Almacenar tokens localmente
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

        // Obtener offline token del backend
        // IMPORTANTE: Se usa IdentityToken, NO AccessToken
        try
        {
            if (!string.IsNullOrEmpty(result.IdentityToken))
            {
                _logger.LogDebug("Obteniendo offline token del servidor usando IdentityToken...");
                var offlineToken = await _tokenGenerator.GetOfflineTokenAsync(result.IdentityToken, null, ct);
                
                if (!string.IsNullOrEmpty(offlineToken))
                {
                    await _tokenManager.StoreOfflineTokenAsync(
                        offlineToken, 
                        OfflineTokenManager.OFFLINE_TOKEN_NAME, 
                        ct);
                    CurrentToken.IdentityToken = offlineToken;
                    _logger.LogDebug("Offline token almacenado correctamente");
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "No se pudo obtener offline token del servidor");
        }
        progress?.Report(60);

        // Obtener public key para validación
        try
        {
            _logger.LogDebug("Obteniendo clave pública del servidor...");
            var publicKey = await _tokenGenerator.GetPublicKeyStringAsync(null, ct);
            
            if (!string.IsNullOrEmpty(publicKey))
            {
                await _tokenManager.StoreOfflineTokenAsync(
                    publicKey, 
                    OfflineTokenManager.PUBLIC_KEY_NAME, 
                    ct);
                _logger.LogDebug("Clave pública almacenada correctamente");
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "No se pudo obtener clave pública del servidor");
        }
        progress?.Report(70);

        // Obtener cloud call token
        try
        {
            if (!string.IsNullOrEmpty(result.AccessToken))
            {
                _logger.LogDebug("Obteniendo cloud call token del servidor...");
                var cloudCallResult = await _tokenGenerator.GetCloudCallTokenAsync(result.AccessToken, null, ct);
                
                if (!string.IsNullOrEmpty(cloudCallResult.CloudCallAccessToken))
                {
                    await _tokenManager.StoreOfflineTokenAsync(
                        cloudCallResult.CloudCallAccessToken, 
                        OfflineTokenManager.CLOUD_CALL_TOKEN_NAME, 
                        ct);
                    CurrentToken.CloudCallAccessToken = cloudCallResult.CloudCallAccessToken;
                    _logger.LogDebug("Cloud call token almacenado correctamente");
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "No se pudo obtener cloud call token del servidor");
        }
        progress?.Report(85);

        // Actualizar permisos
        Permissions.IsLicenseTokenValid = ToolsLicensePermissions.TOKEN_AUTHORIZATION_SUCCESS;
        Permissions.LoginStatus = true;
        Permissions.UserName = userName;
        Permissions.IsBasicUser = false;
        Permissions.IsStartup = false;

        progress?.Report(100);

        _logger.LogInformation("Login exitoso para usuario: {UserName}", userName);

        return OidcLoginResult.Succeeded(CurrentToken, userName);
    }

    /// <summary>
    /// Maneja errores de login.
    /// </summary>
    private OidcLoginResult HandleLoginError(string error)
    {
        _logger.LogWarning("Error de login: {Error}", error);

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
            // Verificar si existe token offline
            if (!_tokenManager.TokenFileExists(OfflineTokenManager.OFFLINE_TOKEN_NAME))
            {
                _logger.LogDebug("No existe token offline");
                return false;
            }

            // Cargar token
            var offlineToken = await _tokenManager.LoadOfflineTokenAsync(
                OfflineTokenManager.OFFLINE_TOKEN_NAME, ct);

            if (string.IsNullOrEmpty(offlineToken))
            {
                _logger.LogDebug("Token offline vacío");
                return false;
            }

            // Cargar clave pública para validación
            var publicKey = await _tokenManager.LoadOfflineTokenAsync(
                OfflineTokenManager.PUBLIC_KEY_NAME, ct);

            if (string.IsNullOrEmpty(publicKey))
            {
                _logger.LogWarning("No existe clave pública para validación JWT");
                // Intentar obtener la clave pública del servidor
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
                    _logger.LogWarning(ex, "No se pudo obtener clave pública del servidor");
                }
            }

            // Validar token JWT
            // Si la firma no puede validarse, se permite continuar si el token no ha expirado
            if (!string.IsNullOrEmpty(publicKey))
            {
                var validationResult = _tokenValidator.ValidateToken(offlineToken, publicKey);
                
                if (!validationResult.IsValid)
                {
                    // Verificar si el error es solo de firma (permitir continuar) o de expiración (bloquear)
                    if (validationResult.ErrorMessage?.Contains("expirado", StringComparison.OrdinalIgnoreCase) == true ||
                        validationResult.ErrorMessage?.Contains("expired", StringComparison.OrdinalIgnoreCase) == true)
                    {
                        _logger.LogWarning("Token offline expirado: {Error}", validationResult.ErrorMessage);
                        return false;
                    }
                    
                    // Para otros errores (firma, formato, etc.), intentar validación básica
                    _logger.LogWarning("Validación completa fallida ({Error}), intentando validación básica de expiración", 
                        validationResult.ErrorMessage);
                    
                    // Validar solo expiración como fallback
                    if (!_tokenValidator.IsTokenNotExpired(offlineToken))
                    {
                        _logger.LogWarning("Token offline expirado en validación básica");
                        return false;
                    }
                    
                    _logger.LogInformation("Token offline válido (validación básica - solo expiración)");
                }
                else
                {
                    _logger.LogInformation("Token offline validado correctamente (validación completa)");
                    
                    // Extraer claims si la validación fue exitosa
                    if (validationResult.Claims != null)
                    {
                        Permissions.UserName = validationResult.Claims.UniqueName ?? Permissions.UserName;
                    }
                }
            }
            else
            {
                // Sin clave pública, solo verificar que el token existe y no está expirado
                _logger.LogWarning("Validación de token sin clave pública - verificación de expiración");
                
                if (!_tokenValidator.IsTokenNotExpired(offlineToken))
                {
                    _logger.LogWarning("Token offline expirado (sin clave pública)");
                    return false;
                }
            }
            
            // Cargar tokens en memoria
            await ReadTokenInformationAsync(ct);
            
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validando token offline");
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
                _logger.LogWarning("Error refrescando token: {Error}", result.Error);
                return false;
            }

            // Actualizar tokens
            CurrentToken.AccessToken = result.AccessToken;
            CurrentToken.RefreshToken = result.RefreshToken ?? CurrentToken.RefreshToken;
            CurrentToken.ExpiresAt = result.AccessTokenExpiration.UtcDateTime;

            // Almacenar nuevo refresh token
            if (!string.IsNullOrEmpty(result.RefreshToken))
            {
                await _tokenManager.StoreOfflineTokenAsync(
                    result.RefreshToken, 
                    OfflineTokenManager.REFRESH_TOKEN_NAME, 
                    ct);
            }

            _logger.LogInformation("Token refrescado exitosamente");
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

        _logger.LogInformation("Sesión cerrada");
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

            _logger.LogDebug("Información de tokens cargada");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error leyendo información de tokens");
        }
    }
}
