using System.Security.Cryptography;
using System.Text;
using Fiplex.Control.Software.WinForms.Core.Security.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Win32;

namespace Fiplex.Control.Software.WinForms.Core.Security;

/// <summary>
/// Offline token manager for local persistence with DPAPI encryption.
/// Stores encrypted tokens in %LocalAppData%/Fiplex.Control.Software/Tokens/
/// </summary>
public class OfflineTokenManager : IOfflineTokenManager
{
    private readonly ILogger<OfflineTokenManager> _logger;
    private readonly string _tokenDirectory;
    private readonly bool _useEncryption;

    // Standard file names
    public const string OFFLINE_TOKEN_NAME = "offline.token";
    public const string PUBLIC_KEY_NAME = "publicKey.key";
    public const string REFRESH_TOKEN_NAME = "refresh.token";
    public const string CLOUD_CALL_TOKEN_NAME = "cloudCallAccessToken.token";

    public OfflineTokenManager(ILogger<OfflineTokenManager> logger, bool useEncryption = true)
    {
        _logger = logger;
        _useEncryption = useEncryption;
        
        // Secure directory for tokens
        var localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        _tokenDirectory = Path.Combine(localAppData, "Fiplex.Control.Software", "Tokens");
        
        EnsureTokenDirectoryExists();
    }

    /// <summary>
    /// Stores a token in a local file with DPAPI encryption.
    /// </summary>
    public async Task<bool> StoreOfflineTokenAsync(string tokenValue, string fileName, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(tokenValue))
        {
            _logger.LogWarning("Attempt to store empty token: {FileName}", fileName);
            return false;
        }

        try
        {
            var filePath = GetTokenFilePath(fileName);
            
            // Encrypt token before storing
            var dataToStore = _useEncryption ? EncryptToken(tokenValue) : tokenValue;
            
            await File.WriteAllTextAsync(filePath, dataToStore, ct);
            
            _logger.LogDebug("Token stored{Encrypted}: {FileName}", 
                _useEncryption ? " (encrypted)" : "", fileName);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error storing token: {FileName}", fileName);
            return false;
        }
    }

    /// <summary>
    /// Loads a token from a local file and decrypts it.
    /// </summary>
    public async Task<string?> LoadOfflineTokenAsync(string fileName, CancellationToken ct = default)
    {
        try
        {
            var filePath = GetTokenFilePath(fileName);
            
            if (!File.Exists(filePath))
            {
                _logger.LogDebug("Token not found: {FileName}", fileName);
                return null;
            }

            var encryptedContent = await File.ReadAllTextAsync(filePath, ct);
            
            // Decrypt token
            var content = _useEncryption ? DecryptToken(encryptedContent) : encryptedContent;
            
            _logger.LogDebug("Token loaded{Decrypted}: {FileName}", 
                _useEncryption ? " (decrypted)" : "", fileName);
            return content;
        }
        catch (CryptographicException ex)
        {
            _logger.LogWarning(ex, "Error decrypting token (possible user/machine change): {FileName}", fileName);
            // Try to read without decrypting for compatibility
            try
            {
                var filePath = GetTokenFilePath(fileName);
                return await File.ReadAllTextAsync(filePath, ct);
            }
            catch
            {
                return null;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error loading token: {FileName}", fileName);
            return null;
        }
    }

    /// <summary>
    /// Checks if a token file exists.
    /// </summary>
    public bool TokenFileExists(string fileName)
    {
        var filePath = GetTokenFilePath(fileName);
        return File.Exists(filePath);
    }

    /// <summary>
    /// Deletes a token file.
    /// </summary>
    public bool DeleteTokenFile(string fileName)
    {
        try
        {
            var filePath = GetTokenFilePath(fileName);
            
            if (File.Exists(filePath))
            {
                File.Delete(filePath);
                _logger.LogDebug("Token deleted: {FileName}", fileName);
                return true;
            }
            
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting token: {FileName}", fileName);
            return false;
        }
    }

    /// <summary>
    /// Deletes all token files.
    /// </summary>
    public void ClearAllTokens()
    {
        try
        {
            if (Directory.Exists(_tokenDirectory))
            {
                var files = Directory.GetFiles(_tokenDirectory, "*.token")
                    .Concat(Directory.GetFiles(_tokenDirectory, "*.key"));
                
                foreach (var file in files)
                {
                    try
                    {
                        File.Delete(file);
                        _logger.LogDebug("Token deleted: {File}", Path.GetFileName(file));
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Could not delete: {File}", file);
                    }
                }
            }
            
            _logger.LogInformation("All tokens have been deleted");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error clearing tokens");
        }
    }

    /// <summary>
    /// Gets the full path of the token file.
    /// </summary>
    private string GetTokenFilePath(string fileName)
    {
        // Sanitize file name
        var sanitized = Path.GetFileName(fileName);
        return Path.Combine(_tokenDirectory, sanitized);
    }

    /// <summary>
    /// Asegura que el directorio de tokens exista.
    /// </summary>
    private void EnsureTokenDirectoryExists()
    {
        try
        {
            if (!Directory.Exists(_tokenDirectory))
            {
                Directory.CreateDirectory(_tokenDirectory);
                _logger.LogDebug("Tokens directory created: {Dir}", _tokenDirectory);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating tokens directory: {Dir}", _tokenDirectory);
        }
    }

    #region DPAPI Encryption

    /// <summary>
    /// Encrypts a token using DPAPI with entropy based on MachineGuid.
    /// </summary>
    private string EncryptToken(string plainToken)
    {
        try
        {
            var entropy = GetMachineGuidBytes();
            var plainBytes = Encoding.UTF8.GetBytes(plainToken);
            var encryptedBytes = ProtectedData.Protect(plainBytes, entropy, DataProtectionScope.CurrentUser);
            return Convert.ToBase64String(encryptedBytes);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error encrypting token, storing without encryption");
            return plainToken;
        }
    }

    /// <summary>
    /// Decrypts a token using DPAPI with entropy based on MachineGuid.
    /// </summary>
    private string DecryptToken(string encryptedToken)
    {
        try
        {
            var entropy = GetMachineGuidBytes();
            var encryptedBytes = Convert.FromBase64String(encryptedToken);
            var plainBytes = ProtectedData.Unprotect(encryptedBytes, entropy, DataProtectionScope.CurrentUser);
            return Encoding.UTF8.GetString(plainBytes);
        }
        catch (FormatException)
        {
            // Not Base64, probably not encrypted (migration)
            _logger.LogDebug("Token is not in Base64 format, assuming unencrypted");
            return encryptedToken;
        }
    }

    /// <summary>
    /// Gets the MachineGuid as bytes to use as entropy.
    /// </summary>
    private byte[] GetMachineGuidBytes()
    {
        var machineGuid = GetMachineGuid();
        return Encoding.UTF8.GetBytes(machineGuid);
    }

    /// <summary>
    /// Gets the MachineGuid from Windows registry.
    /// </summary>
    private string GetMachineGuid()
    {
        const string location = @"SOFTWARE\Microsoft\Cryptography";
        const string name = "MachineGuid";

        try
        {
            using var localMachineX64View = RegistryKey.OpenBaseKey(RegistryHive.LocalMachine, RegistryView.Registry64);
            using var regKey = localMachineX64View.OpenSubKey(location);
            
            if (regKey == null)
            {
                _logger.LogWarning("Registry key not found: {Location}", location);
                return GetFallbackEntropy();
            }

            var machineGuid = regKey.GetValue(name);
            
            if (machineGuid == null)
            {
                _logger.LogWarning("MachineGuid not found in registry");
                return GetFallbackEntropy();
            }

            return machineGuid.ToString()!;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error getting MachineGuid from registry");
            return GetFallbackEntropy();
        }
    }

    /// <summary>
    /// Generates fallback entropy if MachineGuid is not available.
    /// </summary>
    private string GetFallbackEntropy()
    {
        // Use machine name + user as fallback entropy
        return $"{Environment.MachineName}_{Environment.UserName}_FiplexControlSoftware";
    }

    #endregion
}
