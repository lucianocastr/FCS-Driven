using System.Security.Cryptography;
using System.Text;
using Fiplex.Control.Software.WinForms.Core.Security.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Win32;

namespace Fiplex.Control.Software.WinForms.Core.Security;

/// <summary>
/// Gestor de tokens offline para persistencia local con encriptación DPAPI.
/// Almacena tokens encriptados en %LocalAppData%/Fiplex.Control.Software/Tokens/
/// </summary>
public class OfflineTokenManager : IOfflineTokenManager
{
    private readonly ILogger<OfflineTokenManager> _logger;
    private readonly string _tokenDirectory;
    private readonly bool _useEncryption;

    // Nombres de archivo estándar
    public const string OFFLINE_TOKEN_NAME = "offline.token";
    public const string PUBLIC_KEY_NAME = "publicKey.key";
    public const string REFRESH_TOKEN_NAME = "refresh.token";
    public const string CLOUD_CALL_TOKEN_NAME = "cloudCallAccessToken.token";

    public OfflineTokenManager(ILogger<OfflineTokenManager> logger, bool useEncryption = true)
    {
        _logger = logger;
        _useEncryption = useEncryption;
        
        // Directorio seguro para tokens
        var localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        _tokenDirectory = Path.Combine(localAppData, "Fiplex.Control.Software", "Tokens");
        
        EnsureTokenDirectoryExists();
    }

    /// <summary>
    /// Almacena un token en archivo local con encriptación DPAPI.
    /// </summary>
    public async Task<bool> StoreOfflineTokenAsync(string tokenValue, string fileName, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(tokenValue))
        {
            _logger.LogWarning("Intento de almacenar token vacío: {FileName}", fileName);
            return false;
        }

        try
        {
            var filePath = GetTokenFilePath(fileName);
            
            // Encriptar token antes de almacenar
            var dataToStore = _useEncryption ? EncryptToken(tokenValue) : tokenValue;
            
            await File.WriteAllTextAsync(filePath, dataToStore, ct);
            
            _logger.LogDebug("Token almacenado{Encrypted}: {FileName}", 
                _useEncryption ? " (encriptado)" : "", fileName);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error almacenando token: {FileName}", fileName);
            return false;
        }
    }

    /// <summary>
    /// Carga un token desde archivo local y lo desencripta.
    /// </summary>
    public async Task<string?> LoadOfflineTokenAsync(string fileName, CancellationToken ct = default)
    {
        try
        {
            var filePath = GetTokenFilePath(fileName);
            
            if (!File.Exists(filePath))
            {
                _logger.LogDebug("Token no encontrado: {FileName}", fileName);
                return null;
            }

            var encryptedContent = await File.ReadAllTextAsync(filePath, ct);
            
            // Desencriptar token
            var content = _useEncryption ? DecryptToken(encryptedContent) : encryptedContent;
            
            _logger.LogDebug("Token cargado{Decrypted}: {FileName}", 
                _useEncryption ? " (desencriptado)" : "", fileName);
            return content;
        }
        catch (CryptographicException ex)
        {
            _logger.LogWarning(ex, "Error desencriptando token (posible cambio de usuario/máquina): {FileName}", fileName);
            // Intentar leer sin desencriptar por compatibilidad
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
            _logger.LogError(ex, "Error cargando token: {FileName}", fileName);
            return null;
        }
    }

    /// <summary>
    /// Verifica si existe un archivo de token.
    /// </summary>
    public bool TokenFileExists(string fileName)
    {
        var filePath = GetTokenFilePath(fileName);
        return File.Exists(filePath);
    }

    /// <summary>
    /// Elimina un archivo de token.
    /// </summary>
    public bool DeleteTokenFile(string fileName)
    {
        try
        {
            var filePath = GetTokenFilePath(fileName);
            
            if (File.Exists(filePath))
            {
                File.Delete(filePath);
                _logger.LogDebug("Token eliminado: {FileName}", fileName);
                return true;
            }
            
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error eliminando token: {FileName}", fileName);
            return false;
        }
    }

    /// <summary>
    /// Elimina todos los archivos de tokens.
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
                        _logger.LogDebug("Token eliminado: {File}", Path.GetFileName(file));
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "No se pudo eliminar: {File}", file);
                    }
                }
            }
            
            _logger.LogInformation("Todos los tokens han sido eliminados");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error limpiando tokens");
        }
    }

    /// <summary>
    /// Obtiene la ruta completa del archivo de token.
    /// </summary>
    private string GetTokenFilePath(string fileName)
    {
        // Sanitizar nombre de archivo
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
                _logger.LogDebug("Directorio de tokens creado: {Dir}", _tokenDirectory);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creando directorio de tokens: {Dir}", _tokenDirectory);
        }
    }

    #region DPAPI Encryption

    /// <summary>
    /// Encripta un token usando DPAPI con entropía basada en MachineGuid.
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
            _logger.LogWarning(ex, "Error encriptando token, almacenando sin encriptación");
            return plainToken;
        }
    }

    /// <summary>
    /// Desencripta un token usando DPAPI con entropía basada en MachineGuid.
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
            // No es Base64, probablemente no está encriptado (migración)
            _logger.LogDebug("Token no está en formato Base64, asumiendo sin encriptar");
            return encryptedToken;
        }
    }

    /// <summary>
    /// Obtiene el MachineGuid como bytes para usar como entropía.
    /// </summary>
    private byte[] GetMachineGuidBytes()
    {
        var machineGuid = GetMachineGuid();
        return Encoding.UTF8.GetBytes(machineGuid);
    }

    /// <summary>
    /// Obtiene el MachineGuid del registro de Windows.
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
                _logger.LogWarning("Clave de registro no encontrada: {Location}", location);
                return GetFallbackEntropy();
            }

            var machineGuid = regKey.GetValue(name);
            
            if (machineGuid == null)
            {
                _logger.LogWarning("MachineGuid no encontrado en registro");
                return GetFallbackEntropy();
            }

            return machineGuid.ToString()!;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error obteniendo MachineGuid del registro");
            return GetFallbackEntropy();
        }
    }

    /// <summary>
    /// Genera entropía de respaldo si MachineGuid no está disponible.
    /// </summary>
    private string GetFallbackEntropy()
    {
        // Usar nombre de máquina + usuario como entropía de respaldo
        return $"{Environment.MachineName}_{Environment.UserName}_FiplexControlSoftware";
    }

    #endregion
}
