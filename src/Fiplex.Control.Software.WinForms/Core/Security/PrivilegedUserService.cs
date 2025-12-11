using Fiplex.Control.Software.WinForms.Core.Security.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Fiplex.Control.Software.WinForms.Core.Security;

/// <summary>
/// Implementación del servicio de usuarios privilegiados.
/// 
/// Whitelist original (30+ usuarios):
/// validUser = (usr = "H469432") Or (usr = "H469421") Or (usr = "H469433") Or ...
/// </summary>
public class PrivilegedUserService : IPrivilegedUserService
{
    private readonly ILogger<PrivilegedUserService> _logger;
    private readonly IConfiguration _configuration;
    
    /// <summary>
    /// Whitelist de usuarios privilegiados.
    /// Originalmente hardcodeada en General.vb.
    /// Puede ser sobreescrita desde configuración.
    /// </summary>
    private static readonly HashSet<string> DefaultAllowedUsers = new(StringComparer.OrdinalIgnoreCase)
    {
        "H469432", "H469421", "H469433", "H469434", "H469435",
        "H469436", "H469437", "H469438", "H469439", "H469440",
        "H469441", "H469442", "H469443", "H469444", "H469445",
        "H469446", "H469447", "H469448", "H469449", "H469450",
        "H469451", "H469452", "H469453", "H469454", "H469455",
        "H469456", "H469457", "H469458", "H469459", "H469460"
    };
    
    private readonly HashSet<string> _allowedUsers;
    
    /// <inheritdoc/>
    public string PasswordFilePath => Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.Desktop),
        "pass.bin");
    
    public PrivilegedUserService(
        ILogger<PrivilegedUserService> logger,
        IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;
        
        // Intentar cargar usuarios desde configuración
        var configuredUsers = _configuration
            .GetSection("Security:PrivilegedUsers")
            .Get<string[]>();
        
        if (configuredUsers != null && configuredUsers.Length > 0)
        {
            _allowedUsers = new HashSet<string>(configuredUsers, StringComparer.OrdinalIgnoreCase);
            _logger.LogInformation("Cargados {Count} usuarios privilegiados desde configuración", 
                _allowedUsers.Count);
        }
        else
        {
            _allowedUsers = DefaultAllowedUsers;
            _logger.LogDebug("Usando whitelist por defecto ({Count} usuarios)", 
                _allowedUsers.Count);
        }
    }
    
    /// <inheritdoc/>
    public bool IsCurrentUserInWhitelist
    {
        get
        {
            var currentUser = Environment.UserName;
            var isInWhitelist = _allowedUsers.Contains(currentUser);
            
            _logger.LogDebug("Usuario '{User}' {Status} en whitelist", 
                currentUser, 
                isInWhitelist ? "está" : "NO está");
            
            return isInWhitelist;
        }
    }
    
    /// <inheritdoc/>
    public async Task<(bool IsValid, string? Password)> ValidatePrivilegedUserAsync()
    {
        var currentUser = Environment.UserName;
        
        // PASO 1: Verificar whitelist
        if (!_allowedUsers.Contains(currentUser))
        {
            _logger.LogDebug("Usuario '{User}' no está en whitelist de privilegiados", currentUser);
            return (false, null);
        }
        
        _logger.LogDebug("Usuario '{User}' está en whitelist, verificando pass.bin", currentUser);
        
        // PASO 2: Verificar existencia de pass.bin
        if (!File.Exists(PasswordFilePath))
        {
            _logger.LogDebug("Archivo pass.bin no encontrado en: {Path}", PasswordFilePath);
            return (false, null);
        }
        
        // PASO 3: Leer password del archivo
        try
        {
            // Leer password del archivo
            var password = await File.ReadAllTextAsync(PasswordFilePath);
            password = password.Trim();
            
            if (string.IsNullOrEmpty(password))
            {
                _logger.LogWarning("Archivo pass.bin vacío");
                return (false, null);
            }
            
            _logger.LogInformation("Usuario privilegiado validado: {User}", currentUser);
            return (true, password);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Sin permisos para leer pass.bin");
            return (false, null);
        }
        catch (IOException ex)
        {
            _logger.LogWarning(ex, "Error de I/O leyendo pass.bin");
            return (false, null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error inesperado leyendo pass.bin");
            return (false, null);
        }
    }
}
