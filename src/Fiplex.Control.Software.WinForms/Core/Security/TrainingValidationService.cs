using Fiplex.Control.Software.WinForms.Core.Security.Interfaces;
using Fiplex.Control.Software.WinForms.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace Fiplex.Control.Software.WinForms.Core.Security;

/// <summary>
/// Implementación de validación de entrenamiento Fiplex.
/// Lee información desde archivo de licencia local o configuración.
/// </summary>
public class TrainingValidationService : ITrainingValidationService
{
    private readonly ILogger<TrainingValidationService> _logger;
    private readonly IConfiguration _configuration;
    private readonly IOfflineTokenManager _tokenManager;
    private readonly IOfflineTokenValidator _tokenValidator;
    
    private DateTime? _trainingExpiryDate;
    private DateTime? _loginExpiryDate;
    private DateTime? _subscriptionExpiryDate;
    private DateTime? _updatedOnDate;
    private string? _userName;
    private string? _organization;
    private LicenseInfo? _licenseInfo;
    private bool _tokenLoaded;
    
    // Nombre del archivo de licencia
    private const string LicenseFileName = "fiplex.license";
    private const string LicenseFileNameAlt = "clss.dat";
    
    // Nombre del software para buscar en UsersTrainingExpiryDate
    private const string FiplexSoftwareName = "FCS";

    public TrainingValidationService(
        ILogger<TrainingValidationService> logger,
        IConfiguration configuration,
        IOfflineTokenManager tokenManager,
        IOfflineTokenValidator tokenValidator)
    {
        _logger = logger;
        _configuration = configuration;
        _tokenManager = tokenManager;
        _tokenValidator = tokenValidator;
    }

    /// <inheritdoc />
    public DateTime? TrainingExpiryDate => _trainingExpiryDate;
    
    /// <inheritdoc />
    public DateTime? SubscriptionExpiryDate => _subscriptionExpiryDate;
    
    /// <inheritdoc />
    public DateTime? UpdatedOnDate => _updatedOnDate;
    
    /// <inheritdoc />
    public string? UserName => _userName ?? _licenseInfo?.UserName;
    
    /// <inheritdoc />
    public string? Organization => _organization ?? _licenseInfo?.Organization;

    /// <inheritdoc />
    public int DaysRemaining
    {
        get
        {
            if (_trainingExpiryDate == null)
                return 0;
            
            return (int)(_trainingExpiryDate.Value.Date - DateTime.Now.Date).TotalDays;
        }
    }

    /// <inheritdoc />
    /// <remarks>
    /// ExpireDate = remainingDays.ToString() donde remainingDays viene del JWT Exp
    /// </remarks>
    public int LoginDaysRemaining
    {
        get
        {
            if (_loginExpiryDate == null)
                return 0;
            
            return (int)(_loginExpiryDate.Value.Date - DateTime.Now.Date).TotalDays;
        }
    }

    /// <inheritdoc />
    public bool IsTrainingValid
    {
        get
        {
#if DEBUG
            // En DEBUG siempre permitir conexión 
            return true;
#else
            // En Release validar fecha de expiración
            if (_trainingExpiryDate == null)
            {
                _logger.LogWarning("Training expiry date not loaded");
                return false;
            }
            
            return _trainingExpiryDate.Value > DateTime.Now;
#endif
        }
    }

    /// <inheritdoc />
    /// <remarks>
    /// Prioridad: 
    /// - UserName/Organization: SIEMPRE del JWT (es el login real)
    /// - TrainingExpiryDate: 1) JWT UsersTrainingExpiryDate, 2) Archivo de licencia
    /// </remarks>
    public async Task ReadTokenInformationAsync(CancellationToken ct = default)
    {
        if (_tokenLoaded)
        {
            _logger.LogDebug("Token information already loaded");
            return;
        }

        try
        {
            _logger.LogInformation("Reading CLSS token information...");
            
            // PASO 1: Extraer información del usuario del JWT (siempre)
            // El usuario autenticado viene del JWT, no del archivo de licencia
            var jwtUserLoaded = await TryLoadUserFromJwtTokenAsync(ct);
            
            // PASO 2: Intentar obtener TrainingExpiryDate del JWT
            var trainingFromJwt = await TryLoadTrainingFromJwtTokenAsync(ct);
            
            if (trainingFromJwt)
            {
                _tokenLoaded = true;
                _logger.LogInformation(
                    "License loaded from JWT token. User: {User}, Org: {Org}, Training valid until: {ExpiryDate}, {Days} days remaining",
                    _userName ?? "Unknown",
                    _organization ?? "Unknown",
                    _trainingExpiryDate?.ToString("yyyy-MM-dd") ?? "N/A",
                    DaysRemaining);
                return;
            }
            
            // PASO 3: Fallback - cargar solo fecha de training desde archivo
            // (Mantener el usuario del JWT si ya se cargó)
            _licenseInfo = await LoadLicenseFromFileAsync(ct)
                        ?? await LoadLicenseFromConfigurationAsync(ct)
                        ?? CreateDevelopmentLicense();

            if (_licenseInfo.IsLoaded)
            {
                _trainingExpiryDate = _licenseInfo.TrainingExpiryDate;
                _loginExpiryDate = _licenseInfo.LoginExpiryDate;
                _subscriptionExpiryDate = _licenseInfo.SubscriptionExpiryDate;
                _updatedOnDate = _licenseInfo.UpdatedOnDate ?? DateTime.Now;
                
                // IMPORTANTE: Solo asignar UserName/Organization del archivo si NO vienen del JWT
                // El usuario real es el del JWT (login), no el del archivo de licencia de desarrollo
                // No sobrescribir _userName y _organization si ya vienen del JWT
                
                _tokenLoaded = true;
                
                _logger.LogInformation(
                    "Training date loaded from file. User: {User}, Org: {Org}, Training valid until: {ExpiryDate}, {Days} days remaining",
                    UserName ?? "Unknown",  // Usa la propiedad que prioriza JWT sobre archivo
                    Organization ?? "Unknown",
                    _trainingExpiryDate?.ToString("yyyy-MM-dd") ?? "N/A",
                    DaysRemaining);
            }
            else
            {
                _logger.LogWarning("Failed to load license: {Error}", _licenseInfo.ErrorMessage);
                
                // En desarrollo, usar licencia temporal
#if DEBUG
                _trainingExpiryDate = DateTime.Now.AddYears(1);
                _tokenLoaded = true;
                _logger.LogWarning("DEBUG mode: Using temporary 1-year license");
#endif
            }
        }
        catch (OperationCanceledException)
        {
            _logger.LogDebug("Token read cancelled");
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to read token information");
            _trainingExpiryDate = null;
            _tokenLoaded = false;
        }
    }
    
    /// <summary>
    /// Carga información del usuario desde el token JWT offline.
    /// SIEMPRE debe ejecutarse primero, ya que el usuario real es el del JWT (login).
    /// </summary>
    /// <returns>true si se cargó información del usuario del JWT</returns>
    private async Task<bool> TryLoadUserFromJwtTokenAsync(CancellationToken ct)
    {
        try
        {
            var offlineToken = await _tokenManager.LoadOfflineTokenAsync(
                OfflineTokenManager.OFFLINE_TOKEN_NAME, ct);
            
            if (string.IsNullOrEmpty(offlineToken))
            {
                _logger.LogDebug("No offline token found for user extraction");
                return false;
            }
            
            var claims = _tokenValidator.ExtractClaims(offlineToken);
            if (claims == null)
            {
                _logger.LogWarning("Failed to extract claims from offline token for user");
                return false;
            }
            
            // Asignar datos del usuario del JWT (esto es el login real)
            _userName = claims.UniqueName;
            _organization = claims.AccountCompanyName;
            _loginExpiryDate = claims.ExpiresAt;
            _updatedOnDate = claims.IssuedAt ?? DateTime.Now;
            
            _logger.LogDebug("JWT user loaded: {User}, Org: {Org}", 
                _userName ?? "Unknown", _organization ?? "Unknown");
            
            return !string.IsNullOrEmpty(_userName);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error loading user from JWT token");
            return false;
        }
    }
    
    /// <summary>
    /// Intenta cargar la fecha de training desde el token JWT offline.
    /// Busca en UsersTrainingExpiryDate el software "FCS".
    /// </summary>
    /// <returns>true si se encontró fecha de training en el JWT</returns>
    private async Task<bool> TryLoadTrainingFromJwtTokenAsync(CancellationToken ct)
    {
        try
        {
            var offlineToken = await _tokenManager.LoadOfflineTokenAsync(
                OfflineTokenManager.OFFLINE_TOKEN_NAME, ct);
            
            if (string.IsNullOrEmpty(offlineToken))
            {
                _logger.LogDebug("No offline token found for training extraction");
                return false;
            }
            
            var claims = _tokenValidator.ExtractClaims(offlineToken);
            if (claims == null)
            {
                _logger.LogWarning("Failed to extract claims from offline token for training");
                return false;
            }
            
            // Asignar fecha de training para FCS
            AssignFiplexTrainingExpiryDate(claims);
            
            if (!_trainingExpiryDate.HasValue)
            {
                _logger.LogDebug("No training expiry date in JWT token, will try fallback sources");
                return false;
            }
            
            // Asignar fecha de suscripción desde LicenseExpiryDetails
            AssignLicenseExpiryDate(claims);
            
            _logger.LogDebug("JWT training date loaded: {ExpiryDate}", 
                _trainingExpiryDate?.ToString("yyyy-MM-dd") ?? "N/A");
            
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error loading training from JWT token, will try fallback sources");
            return false;
        }
    }
    
    /// <summary>
    /// Asigna la fecha de expiración del entrenamiento Fiplex desde los claims del token.
    /// Busca en UsersTrainingExpiryDate el software "FCS".
    /// </summary>
    private void AssignFiplexTrainingExpiryDate(TokenClaims claims)
    {
        _trainingExpiryDate = null;
        
        // Log all available training items for debugging
        if (claims.UsersTrainingExpiryDate != null && claims.UsersTrainingExpiryDate.Count > 0)
        {
            _logger.LogDebug("UsersTrainingExpiryDate contains {Count} items", claims.UsersTrainingExpiryDate.Count);
            foreach (var item in claims.UsersTrainingExpiryDate)
            {
                _logger.LogDebug("  - Software: '{Software}', ExpirationDate: '{ExpDate}'", 
                    item.Software, item.ExpirationDate);
            }
        }
        else
        {
            _logger.LogWarning("UsersTrainingExpiryDate is null or empty in token claims");
            return;
        }
        
        var fiplexTrainingExpiryDetails = claims.UsersTrainingExpiryDate
            .FirstOrDefault(x => string.Equals(x.Software, FiplexSoftwareName, StringComparison.OrdinalIgnoreCase));
        
        if (fiplexTrainingExpiryDetails != null)
        {
            var fiplexTrainingExpDate = fiplexTrainingExpiryDetails.ExpirationDate;
            _logger.LogDebug("Found FCS training expiry details. ExpirationDate: '{ExpDate}'", fiplexTrainingExpDate);
            
            if (!string.IsNullOrEmpty(fiplexTrainingExpDate))
            {
                var unixEpoch = new DateTime(1970, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc);
                
                if (DateTime.TryParse(fiplexTrainingExpDate, out var parsedDate))
                {
                    var expirySecs = (long)(parsedDate - unixEpoch).TotalSeconds;
                    _trainingExpiryDate = unixEpoch.AddSeconds(expirySecs).ToLocalTime();
                    
                    _logger.LogInformation("Fiplex training expiry date set to: {Date} (parsed from '{Original}')", 
                        _trainingExpiryDate?.ToString("dd MMM yyyy"), fiplexTrainingExpDate);
                }
                else
                {
                    _logger.LogWarning("Failed to parse FCS training expiry date: '{Date}'", fiplexTrainingExpDate);
                }
            }
            else
            {
                _logger.LogWarning("FCS training expiry date is null or empty");
            }
        }
        else
        {
            _logger.LogWarning("No FCS training entry found in UsersTrainingExpiryDate. Looking for Software='{Software}'", 
                FiplexSoftwareName);
        }
    }
    
    /// <summary>
    /// Asigna la fecha de expiración de suscripción desde los claims del token.
    /// </summary>
    private void AssignLicenseExpiryDate(TokenClaims claims)
    {
        _subscriptionExpiryDate = null;
        
        // Buscar en LicenseExpiryDetails 
        var licenseDetails = claims.LicenseExpiryDetails?.FirstOrDefault();
        
        if (licenseDetails?.ExpiryDate != null)
        {
            if (DateTime.TryParse(licenseDetails.ExpiryDate, out var parsedDate))
            {
                _subscriptionExpiryDate = parsedDate;
                _logger.LogDebug("Subscription expiry date set to: {Date}", 
                    _subscriptionExpiryDate?.ToString("yyyy-MM-dd"));
            }
        }
    }

    /// <summary>
    /// Intenta cargar licencia desde archivo local.
    /// Busca: fiplex.license, clss.dat
    /// </summary>
    private async Task<LicenseInfo?> LoadLicenseFromFileAsync(CancellationToken ct)
    {
        var basePath = AppDomain.CurrentDomain.BaseDirectory;
        var searchPaths = new[]
        {
            Path.Combine(basePath, LicenseFileName),
            Path.Combine(basePath, LicenseFileNameAlt),
            Path.Combine(basePath, "licenses", LicenseFileName),
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), 
                "Fiplex", LicenseFileName)
        };

        foreach (var path in searchPaths)
        {
            if (File.Exists(path))
            {
                _logger.LogDebug("Found license file: {Path}", path);
                try
                {
                    return await ParseLicenseFileAsync(path, ct);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to parse license file: {Path}", path);
                }
            }
        }

        _logger.LogDebug("No license file found in any search path");
        return null;
    }

    /// <summary>
    /// Parsea archivo de licencia.
    /// Soporta formato JSON y formato legacy texto plano.
    /// </summary>
    private async Task<LicenseInfo> ParseLicenseFileAsync(string path, CancellationToken ct)
    {
        var content = await File.ReadAllTextAsync(path, ct);
        
        // Intentar JSON primero
        if (content.TrimStart().StartsWith("{"))
        {
            try
            {
                var info = JsonSerializer.Deserialize<LicenseInfo>(content, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
                
                if (info != null)
                {
                    info.IsLoaded = true;
                    return info;
                }
            }
            catch (JsonException ex)
            {
                _logger.LogDebug(ex, "License file is not valid JSON, trying legacy format");
            }
        }
        
        // Formato legacy: líneas key=value
        return ParseLegacyLicenseFormat(content);
    }

    /// <summary>
    /// Parsea formato legacy de archivo de licencia.
    /// Formato: key=value por línea
    /// </summary>
    private LicenseInfo ParseLegacyLicenseFormat(string content)
    {
        var info = new LicenseInfo();
        var lines = content.Split('\n', StringSplitOptions.RemoveEmptyEntries);

        foreach (var line in lines)
        {
            var trimmed = line.Trim();
            if (string.IsNullOrEmpty(trimmed) || trimmed.StartsWith("#") || trimmed.StartsWith("//"))
                continue;

            var parts = trimmed.Split('=', 2);
            if (parts.Length != 2)
                continue;

            var key = parts[0].Trim().ToLowerInvariant();
            var value = parts[1].Trim();

            switch (key)
            {
                case "trainingexpirydate":
                case "fiplextrainingexpirydate":
                    if (DateTime.TryParse(value, out var trainingDate))
                        info.TrainingExpiryDate = trainingDate;
                    break;
                    
                case "loginexpirydate":
                case "expiredate":
                    if (DateTime.TryParse(value, out var loginDate))
                        info.LoginExpiryDate = loginDate;
                    break;
                    
                case "subscriptionexpirydate":
                    if (DateTime.TryParse(value, out var subscriptionDate))
                        info.SubscriptionExpiryDate = subscriptionDate;
                    break;
                    
                case "updatedondate":
                case "updatedon":
                case "lastupdated":
                    if (DateTime.TryParse(value, out var updatedDate))
                        info.UpdatedOnDate = updatedDate;
                    break;
                    
                case "username":
                case "user":
                    info.UserName = value;
                    break;
                    
                case "organization":
                case "org":
                    info.Organization = value;
                    break;
                    
                case "licenseid":
                case "id":
                    info.LicenseId = value;
                    break;
                    
                case "version":
                    if (int.TryParse(value, out var version))
                        info.Version = version;
                    break;
            }
        }

        info.IsLoaded = info.TrainingExpiryDate.HasValue;
        
        if (!info.IsLoaded)
        {
            info.ErrorMessage = "No valid TrainingExpiryDate found in license file";
        }

        return info;
    }

    /// <summary>
    /// Carga licencia desde appsettings.json sección "License".
    /// </summary>
    private Task<LicenseInfo?> LoadLicenseFromConfigurationAsync(CancellationToken ct)
    {
        var section = _configuration.GetSection("License");
        
        if (!section.Exists())
        {
            _logger.LogDebug("No 'License' section in configuration");
            return Task.FromResult<LicenseInfo?>(null);
        }

        var info = new LicenseInfo();
        
        var trainingExpiry = section["TrainingExpiryDate"];
        if (!string.IsNullOrEmpty(trainingExpiry) && DateTime.TryParse(trainingExpiry, out var trainingDate))
        {
            info.TrainingExpiryDate = trainingDate;
        }
        
        var loginExpiry = section["LoginExpiryDate"];
        if (!string.IsNullOrEmpty(loginExpiry) && DateTime.TryParse(loginExpiry, out var loginDate))
        {
            info.LoginExpiryDate = loginDate;
        }
        
        info.UserName = section["UserName"];
        info.Organization = section["Organization"];
        info.LicenseId = section["LicenseId"];
        
        info.IsLoaded = info.TrainingExpiryDate.HasValue;
        
        if (info.IsLoaded)
        {
            _logger.LogInformation("License loaded from configuration");
        }

        return Task.FromResult<LicenseInfo?>(info.IsLoaded ? info : null);
    }

    /// <summary>
    /// Crea una licencia de desarrollo válida por 1 año.
    /// Solo se usa si no se encuentra ninguna otra fuente.
    /// </summary>
    private LicenseInfo CreateDevelopmentLicense()
    {
        _logger.LogWarning("No license found, creating development license (valid 1 year)");
        
        return new LicenseInfo
        {
            TrainingExpiryDate = DateTime.Now.AddYears(1),
            LoginExpiryDate = DateTime.Now.AddYears(1),
            UserName = "Development",
            Organization = "Fiplex",
            LicenseId = "DEV-" + Guid.NewGuid().ToString("N")[..8].ToUpper(),
            Version = 1,
            IsLoaded = true
        };
    }

    /// <inheritdoc />
    public string GetStatusMessage()
    {
        if (!_tokenLoaded || _loginExpiryDate == null)
        {
            return "CLSS login status unknown";
        }

        // Usar LoginDaysRemaining para calcular días restantes de login
        var loginDays = LoginDaysRemaining;
        
        if (loginDays > 0)
        {
            return $"CLSS login is valid for the next {loginDays} days";
        }
        else
        {
            return "CLSS login has expired";
        }
    }

    /// <inheritdoc />
    public string GetExpiredTooltip()
    {
        return "You are not permitted to connect to any device as your training has expired";
    }
    
    /// <inheritdoc />
    public void ClearLicenseData()
    {
        _logger.LogInformation("Clearing license data (logout)");
        
        // Limpia estado interno
        _trainingExpiryDate = null;
        _loginExpiryDate = null;
        _subscriptionExpiryDate = null;
        _updatedOnDate = null;
        _licenseInfo = null;
        _tokenLoaded = false;
        
        // CRÍTICO: Limpiar tokens OIDC para que el siguiente inicio requiera login
        try
        {
            _tokenManager.ClearAllTokens();
            _logger.LogInformation("OIDC tokens cleared successfully");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not clear OIDC tokens during logout");
        }
        
        // Intentar eliminar archivo de licencia local si existe
        try
        {
            var basePath = AppDomain.CurrentDomain.BaseDirectory;
            var licensePath = Path.Combine(basePath, LicenseFileName);
            var licensePathAlt = Path.Combine(basePath, LicenseFileNameAlt);
            
            // No eliminamos el archivo, solo lo vaciamos para logout temporal
            if (File.Exists(licensePath))
            {
                // Crear backup antes de invalidar
                var backupPath = licensePath + ".bak";
                File.Copy(licensePath, backupPath, overwrite: true);
                _logger.LogDebug("License backup created: {Path}", backupPath);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not backup license file during logout");
        }
        
        _logger.LogInformation("License data cleared successfully");
    }
}
