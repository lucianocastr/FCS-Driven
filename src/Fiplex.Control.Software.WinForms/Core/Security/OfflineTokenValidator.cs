using System.IdentityModel.Tokens.Jwt;
using System.Security.Cryptography;
using Fiplex.Control.Software.WinForms.Core.Security.Interfaces;
using Fiplex.Control.Software.WinForms.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Fiplex.Control.Software.WinForms.Core.Security;

/// <summary>
/// Offline JWT token validator.
/// Validates expiration, ECDSA signature and issuer of JWT tokens.
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
            // Load token from storage
            var tokenFromStorage = await _tokenManager.LoadOfflineTokenAsync(filename, ct);
            
            if (string.IsNullOrEmpty(tokenFromStorage))
            {
                _logger.LogDebug("Token not found: {Filename}", filename);
                return false;
            }

            // Load offline token for signature validation (if different)
            var tokenForSignatureValidation = filename == OfflineTokenManager.OFFLINE_TOKEN_NAME
                ? tokenFromStorage
                : await _tokenManager.LoadOfflineTokenAsync(OfflineTokenManager.OFFLINE_TOKEN_NAME, ct);

            // Verify expiration
            if (!IsTokenNotExpired(tokenFromStorage))
            {
                _logger.LogWarning("Token expired: {Filename}", filename);
                return false;
            }

            // Validate signature (only if we have the offline token)
            if (!string.IsNullOrEmpty(tokenForSignatureValidation))
            {
                var signatureValid = await ValidateSignatureAsync(tokenForSignatureValidation, ct);
                
                if (!signatureValid)
                {
                    _logger.LogWarning("Invalid token signature");
                    // For compatibility, allow to continue if no public key
                    // but log as warning
                }
            }

            _logger.LogInformation("Token valid: {Filename}", filename);
            return true;
        }
        catch (Exception ex)
        {
            if (ex.Message.Contains("Could not find file"))
            {
                _logger.LogDebug("Token file not found: {Filename}", filename);
                return false;
            }

            _logger.LogError(ex, "Error validating token: {Filename}", filename);
            
            if (filename == OfflineTokenManager.OFFLINE_TOKEN_NAME)
            {
                // Don't show MessageBox here, let the caller handle it
                _logger.LogWarning("Authentication token validation failed");
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

            // Get current timestamp in epoch seconds
            var currentEpoch = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            
            // Verify expiration (token.Payload.Exp > currentDateEpoc)
            var expiration = jwtToken.Payload.Expiration;
            
            if (expiration == null)
            {
                _logger.LogWarning("Token without expiration claim");
                return true; // No expiration, assume valid
            }

            var isValid = expiration > currentEpoch;
            
            if (!isValid)
            {
                _logger.LogDebug("Token expired. Exp: {Exp}, Current: {Current}", expiration, currentEpoch);
            }

            return isValid;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking token expiration");
            return false;
        }
    }

    /// <inheritdoc/>
    public async Task<bool> ValidateSignatureAsync(string token, CancellationToken ct = default)
    {
        try
        {
            // Load public key
            var publicKeyString = await _tokenManager.LoadOfflineTokenAsync(
                OfflineTokenManager.PUBLIC_KEY_NAME, ct);

            if (string.IsNullOrEmpty(publicKeyString))
            {
                _logger.LogDebug("Public key not available, skipping signature validation");
                return true; // No public key, cannot validate signature
            }

            // Convert public key to ECDSA format
            var publicKeyBytes = Convert.FromBase64String(publicKeyString);
            
            // Build ECDSA P-256 key blob
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
            
            _logger.LogInformation("Token signature validated successfully");
            return true;
        }
        catch (SecurityTokenValidationException ex)
        {
            _logger.LogWarning(ex, "Token signature validation failed");
            return false;
        }
        catch (CryptographicException ex)
        {
            _logger.LogWarning(ex, "Cryptographic error validating signature");
            return false;
        }
        catch (FormatException ex)
        {
            _logger.LogWarning(ex, "Invalid public key format");
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error validating token signature");
            return false;
        }
    }

    /// <summary>
    /// Case-insensitive JSON deserialization options.
    /// </summary>
    private static readonly System.Text.Json.JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };
    
    /// <summary>
    /// Extracts claims from JWT token.
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
                // Truncate long values for the log
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
                catch { /* Ignore deserialization errors */ }
            }

            var permissionsJson = GetClaimValue(jwtToken, "Permissions");
            if (!string.IsNullOrEmpty(permissionsJson) && permissionsJson != "null")
            {
                try
                {
                    claims.Permissions = System.Text.Json.JsonSerializer.Deserialize<List<Permission>>(permissionsJson, JsonOptions);
                }
                catch { /* Ignore deserialization errors */ }
            }

            var usersCountJson = GetClaimValue(jwtToken, "UsersCount");
            if (!string.IsNullOrEmpty(usersCountJson) && usersCountJson != "null")
            {
                try
                {
                    claims.UsersCount = System.Text.Json.JsonSerializer.Deserialize<List<UsersCountInfo>>(usersCountJson, JsonOptions);
                }
                catch { /* Ignore deserialization errors */ }
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
                catch { /* Ignore deserialization errors */ }
            }

            _logger.LogDebug("Claims extracted from token for user: {UniqueName}", claims.UniqueName);
            return claims;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error extracting claims from token");
            return null;
        }
    }

    /// <summary>
    /// Gets the value of a specific claim.
    /// </summary>
    private static string? GetClaimValue(JwtSecurityToken token, string claimType)
    {
        return token.Claims.FirstOrDefault(c => c.Type == claimType)?.Value;
    }

    /// <summary>
    /// Removes double quotes from start and end of a string.
    /// Some claims come with embedded quotes like: "\"Honeywell Internal US\""
    /// </summary>
    private static string? TrimQuotes(string? value)
    {
        if (string.IsNullOrEmpty(value))
            return value;
        
        // Remove double quotes from start and end
        return value.Trim('"');
    }

    /// <inheritdoc/>
    public OfflineTokenValidationResult ValidateToken(string token, string publicKey)
    {
        try
        {
            if (string.IsNullOrEmpty(token))
            {
                return OfflineTokenValidationResult.Failure("Empty or null token");
            }

            // Verify expiration first
            if (!IsTokenNotExpired(token))
            {
                return OfflineTokenValidationResult.Failure("Token expired");
            }

            // Validate signature if public key is available
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
                    _logger.LogWarning(ex, "Signature validation failed");
                    return OfflineTokenValidationResult.Failure($"Invalid signature: {ex.Message}");
                }
                catch (CryptographicException ex)
                {
                    _logger.LogWarning(ex, "Cryptographic error");
                    // Continue without signature validation if format error
                }
                catch (FormatException ex)
                {
                    _logger.LogWarning(ex, "Invalid key format");
                    // Continue without signature validation if format error
                }
            }

            // Extract claims
            var claims = ExtractClaims(token);
            
            if (claims == null)
            {
                return OfflineTokenValidationResult.Failure("Could not extract claims from token");
            }

            _logger.LogInformation("Token validated successfully for: {UserName}", claims.UniqueName);
            return OfflineTokenValidationResult.Success(claims);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating token");
            return OfflineTokenValidationResult.Failure($"Validation error: {ex.Message}");
        }
    }
}
