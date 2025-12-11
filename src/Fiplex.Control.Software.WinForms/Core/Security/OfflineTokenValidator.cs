using System.IdentityModel.Tokens.Jwt;
using System.Security.Cryptography;
using Fiplex.Control.Software.WinForms.Core.Security.Interfaces;
using Fiplex.Control.Software.WinForms.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Fiplex.Control.Software.WinForms.Core.Security;

/// <summary>
/// Validador de tokens offline JWT.
/// Valida expiración, firma ECDSA e issuer de tokens JWT.
/// </summary>
public class OfflineTokenValidator : IOfflineTokenValidator
{
    private readonly IOfflineTokenManager _tokenManager;
    private readonly OidcSettings _settings;
    private readonly ILogger<OfflineTokenValidator> _logger;
    private readonly JwtSecurityTokenHandler _tokenHandler;

    public OfflineTokenValidator(
        IOfflineTokenManager tokenManager,
        IOptions<OidcSettings> settings,
        ILogger<OfflineTokenValidator> logger)
    {
        _tokenManager = tokenManager;
        _settings = settings.Value;
        _logger = logger;
        _tokenHandler = new JwtSecurityTokenHandler();
    }

    /// <inheritdoc/>
    public async Task<bool> ValidateTokenAsync(string filename, CancellationToken ct = default)
    {
        try
        {
            // Cargar token desde almacenamiento
            var tokenFromStorage = await _tokenManager.LoadOfflineTokenAsync(filename, ct);
            
            if (string.IsNullOrEmpty(tokenFromStorage))
            {
                _logger.LogDebug("Token no encontrado: {Filename}", filename);
                return false;
            }

            // Cargar token offline para validación de firma (si es diferente)
            var tokenForSignatureValidation = filename == OfflineTokenManager.OFFLINE_TOKEN_NAME
                ? tokenFromStorage
                : await _tokenManager.LoadOfflineTokenAsync(OfflineTokenManager.OFFLINE_TOKEN_NAME, ct);

            // Verificar expiración
            if (!IsTokenNotExpired(tokenFromStorage))
            {
                _logger.LogWarning("Token expirado: {Filename}", filename);
                return false;
            }

            // Validar firma (solo si tenemos el token offline)
            if (!string.IsNullOrEmpty(tokenForSignatureValidation))
            {
                var signatureValid = await ValidateSignatureAsync(tokenForSignatureValidation, ct);
                
                if (!signatureValid)
                {
                    _logger.LogWarning("Firma de token inválida");
                    // Por compatibilidad, permitir continuar si no hay clave pública
                    // pero log como warning
                }
            }

            _logger.LogInformation("Token válido: {Filename}", filename);
            return true;
        }
        catch (Exception ex)
        {
            if (ex.Message.Contains("Could not find file"))
            {
                _logger.LogDebug("Archivo de token no encontrado: {Filename}", filename);
                return false;
            }

            _logger.LogError(ex, "Error validando token: {Filename}", filename);
            
            if (filename == OfflineTokenManager.OFFLINE_TOKEN_NAME)
            {
                // No mostrar MessageBox aquí, dejar que el llamador lo maneje
                _logger.LogWarning("Validación de token de autenticación fallida");
            }

            return false;
        }
    }

    /// <inheritdoc/>
    public bool IsTokenNotExpired(string token)
    {
        try
        {
            if (string.IsNullOrEmpty(token))
                return false;

            var jwtToken = _tokenHandler.ReadJwtToken(token);
            
            if (jwtToken == null)
                return false;

            // Obtener timestamp actual en epoch seconds
            var currentEpoch = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            
            // Verificar expiración (token.Payload.Exp > currentDateEpoc)
            var expiration = jwtToken.Payload.Expiration;
            
            if (expiration == null)
            {
                _logger.LogWarning("Token sin claim de expiración");
                return true; // Sin expiración, asumir válido
            }

            var isValid = expiration > currentEpoch;
            
            if (!isValid)
            {
                _logger.LogDebug("Token expirado. Exp: {Exp}, Current: {Current}", expiration, currentEpoch);
            }

            return isValid;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error verificando expiración de token");
            return false;
        }
    }

    /// <inheritdoc/>
    public async Task<bool> ValidateSignatureAsync(string token, CancellationToken ct = default)
    {
        try
        {
            // Cargar clave pública
            var publicKeyString = await _tokenManager.LoadOfflineTokenAsync(
                OfflineTokenManager.PUBLIC_KEY_NAME, ct);

            if (string.IsNullOrEmpty(publicKeyString))
            {
                _logger.LogDebug("Clave pública no disponible, omitiendo validación de firma");
                return true; // Sin clave pública, no podemos validar firma
            }

            // Convertir clave pública a formato ECDSA
            var publicKeyBytes = Convert.FromBase64String(publicKeyString);
            
            // Construir blob de clave ECDSA P-256
            // keyType = 0x45, 0x43, 0x53, 0x31 (ECS1 = ECDSA P-256 public)
            // keyLength = 0x20, 0x00, 0x00, 0x00 (32 bytes)
            byte[] keyType = [0x45, 0x43, 0x53, 0x31];
            byte[] keyLength = [0x20, 0x00, 0x00, 0x00];
            var ecdsaPublicKeyBytes = keyType.Concat(keyLength).Concat(publicKeyBytes).ToArray();

            using var cngKey = CngKey.Import(ecdsaPublicKeyBytes, CngKeyBlobFormat.EccPublicBlob);
            using var ecdsa = new ECDsaCng(cngKey);

            var validationParameters = new TokenValidationParameters
            {
                ValidIssuer = _settings.Issuer,
                ValidAudience = _settings.ResourceId,
                IssuerSigningKey = new ECDsaSecurityKey(ecdsa),
                ValidateIssuerSigningKey = true,
                ValidateIssuer = !string.IsNullOrEmpty(_settings.Issuer),
                ValidateAudience = !string.IsNullOrEmpty(_settings.ResourceId),
                ValidateLifetime = true,
                ClockSkew = TimeSpan.FromMinutes(_settings.ClockSkewMinutes)
            };

            _tokenHandler.ValidateToken(token, validationParameters, out _);
            
            _logger.LogInformation("Firma de token validada exitosamente");
            return true;
        }
        catch (SecurityTokenValidationException ex)
        {
            _logger.LogWarning(ex, "Validación de firma de token fallida");
            return false;
        }
        catch (CryptographicException ex)
        {
            _logger.LogWarning(ex, "Error criptográfico validando firma");
            return false;
        }
        catch (FormatException ex)
        {
            _logger.LogWarning(ex, "Formato de clave pública inválido");
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error inesperado validando firma de token");
            return false;
        }
    }

    /// <summary>
    /// Opciones de deserialización JSON case-insensitive.
    /// </summary>
    private static readonly System.Text.Json.JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };
    
    /// <summary>
    /// Extrae claims del token JWT.
    /// </summary>
    public TokenClaims? ExtractClaims(string token)
    {
        try
        {
            if (string.IsNullOrEmpty(token))
                return null;

            var jwtToken = _tokenHandler.ReadJwtToken(token);
            
            if (jwtToken == null)
                return null;

            // Log all available claims for debugging
            _logger.LogDebug("Available claims in JWT token:");
            foreach (var claim in jwtToken.Claims)
            {
                // Truncar valores largos para el log
                var value = claim.Value.Length > 100 ? claim.Value[..100] + "..." : claim.Value;
                _logger.LogDebug("  Claim: '{Type}' = '{Value}'", claim.Type, value);
            }

            var claims = new TokenClaims
            {
                UniqueName = GetClaimValue(jwtToken, "unique_name"),
                AccountCompanyName = TrimQuotes(GetClaimValue(jwtToken, "AccountCompanyName")),
                Capability = TrimQuotes(GetClaimValue(jwtToken, "Capability")),
                IssuedAt = jwtToken.IssuedAt,
                ExpiresAt = jwtToken.ValidTo
            };

            // Deserializar claims complejos (usando JsonOptions case-insensitive)
            var esdBrandsJson = GetClaimValue(jwtToken, "EsdBrands");
            if (!string.IsNullOrEmpty(esdBrandsJson) && esdBrandsJson != "null")
            {
                try
                {
                    claims.EsdBrands = System.Text.Json.JsonSerializer.Deserialize<List<EsdBrand>>(esdBrandsJson, JsonOptions);
                }
                catch { /* Ignorar errores de deserialización */ }
            }

            var permissionsJson = GetClaimValue(jwtToken, "Permissions");
            if (!string.IsNullOrEmpty(permissionsJson) && permissionsJson != "null")
            {
                try
                {
                    claims.Permissions = System.Text.Json.JsonSerializer.Deserialize<List<Permission>>(permissionsJson, JsonOptions);
                }
                catch { /* Ignorar errores de deserialización */ }
            }

            var usersCountJson = GetClaimValue(jwtToken, "UsersCount");
            if (!string.IsNullOrEmpty(usersCountJson) && usersCountJson != "null")
            {
                try
                {
                    claims.UsersCount = System.Text.Json.JsonSerializer.Deserialize<List<UsersCountInfo>>(usersCountJson, JsonOptions);
                }
                catch { /* Ignorar errores de deserialización */ }
            }

            var trainingExpiryJson = GetClaimValue(jwtToken, "UsersTrainingExpiryDate");
            if (!string.IsNullOrEmpty(trainingExpiryJson) && trainingExpiryJson != "null")
            {
                try
                {
                    claims.UsersTrainingExpiryDate = System.Text.Json.JsonSerializer.Deserialize<List<UsersTrainingExpiryDateInfo>>(trainingExpiryJson, JsonOptions);
                    _logger.LogDebug("UsersTrainingExpiryDate parsed: {Count} items, JSON: {Json}", 
                        claims.UsersTrainingExpiryDate?.Count ?? 0, trainingExpiryJson);
                }
                catch (Exception ex) 
                { 
                    _logger.LogWarning(ex, "Error parsing UsersTrainingExpiryDate: {Json}", trainingExpiryJson);
                }
            }

            var licenseExpiryJson = GetClaimValue(jwtToken, "LicenseExpiryDetails");
            if (!string.IsNullOrEmpty(licenseExpiryJson) && licenseExpiryJson != "null")
            {
                try
                {
                    claims.LicenseExpiryDetails = System.Text.Json.JsonSerializer.Deserialize<List<LicenseExpiryDetailsInfo>>(licenseExpiryJson, JsonOptions);
                }
                catch { /* Ignorar errores de deserialización */ }
            }

            _logger.LogDebug("Claims extraídos del token para usuario: {UniqueName}", claims.UniqueName);
            return claims;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error extrayendo claims del token");
            return null;
        }
    }

    /// <summary>
    /// Obtiene el valor de un claim específico.
    /// </summary>
    private static string? GetClaimValue(JwtSecurityToken token, string claimType)
    {
        return token.Claims.FirstOrDefault(c => c.Type == claimType)?.Value;
    }

    /// <summary>
    /// Elimina comillas dobles al inicio y final de un string.
    /// Algunos claims vienen con comillas embebidas como: "\"Honeywell Internal US\""
    /// </summary>
    private static string? TrimQuotes(string? value)
    {
        if (string.IsNullOrEmpty(value))
            return value;
        
        // Eliminar comillas dobles al inicio y final
        return value.Trim('"');
    }

    /// <inheritdoc/>
    public OfflineTokenValidationResult ValidateToken(string token, string publicKey)
    {
        try
        {
            if (string.IsNullOrEmpty(token))
            {
                return OfflineTokenValidationResult.Failure("Token vacío o nulo");
            }

            // Verificar expiración primero
            if (!IsTokenNotExpired(token))
            {
                return OfflineTokenValidationResult.Failure("Token expirado");
            }

            // Validar firma si hay clave pública disponible
            if (!string.IsNullOrEmpty(publicKey))
            {
                try
                {
                    var publicKeyBytes = Convert.FromBase64String(publicKey);
                    
                    // Construir blob de clave ECDSA P-256
                    byte[] keyType = [0x45, 0x43, 0x53, 0x31];
                    byte[] keyLength = [0x20, 0x00, 0x00, 0x00];
                    var ecdsaPublicKeyBytes = keyType.Concat(keyLength).Concat(publicKeyBytes).ToArray();

                    using var cngKey = CngKey.Import(ecdsaPublicKeyBytes, CngKeyBlobFormat.EccPublicBlob);
                    using var ecdsa = new ECDsaCng(cngKey);

                    var validationParameters = new TokenValidationParameters
                    {
                        ValidIssuer = _settings.Issuer,
                        ValidAudience = _settings.ResourceId,
                        IssuerSigningKey = new ECDsaSecurityKey(ecdsa),
                        ValidateIssuerSigningKey = true,
                        ValidateIssuer = !string.IsNullOrEmpty(_settings.Issuer),
                        ValidateAudience = !string.IsNullOrEmpty(_settings.ResourceId),
                        ValidateLifetime = true,
                        ClockSkew = TimeSpan.FromMinutes(_settings.ClockSkewMinutes)
                    };

                    _tokenHandler.ValidateToken(token, validationParameters, out _);
                }
                catch (SecurityTokenValidationException ex)
                {
                    _logger.LogWarning(ex, "Validación de firma fallida");
                    return OfflineTokenValidationResult.Failure($"Firma inválida: {ex.Message}");
                }
                catch (CryptographicException ex)
                {
                    _logger.LogWarning(ex, "Error criptográfico");
                    // Continuar sin validación de firma si hay error de formato
                }
                catch (FormatException ex)
                {
                    _logger.LogWarning(ex, "Formato de clave inválido");
                    // Continuar sin validación de firma si hay error de formato
                }
            }

            // Extraer claims
            var claims = ExtractClaims(token);
            
            if (claims == null)
            {
                return OfflineTokenValidationResult.Failure("No se pudieron extraer claims del token");
            }

            _logger.LogInformation("Token validado exitosamente para: {UserName}", claims.UniqueName);
            return OfflineTokenValidationResult.Success(claims);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validando token");
            return OfflineTokenValidationResult.Failure($"Error de validación: {ex.Message}");
        }
    }
}
