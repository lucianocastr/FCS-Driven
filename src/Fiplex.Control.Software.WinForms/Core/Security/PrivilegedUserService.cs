using Fiplex.Control.Software.WinForms.Core.Security.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Fiplex.Control.Software.WinForms.Core.Security;

/// <summary>
/// Privileged user service implementation.
/// 
/// Original whitelist (30+ users):
/// validUser = (usr = "H469432") Or (usr = "H469421") Or (usr = "H469433") Or ...
/// </summary>
public class PrivilegedUserService : IPrivilegedUserService
{
    private readonly ILogger<PrivilegedUserService> _logger;
    private readonly IConfiguration _configuration;
    
    /// <summary>
    /// Privileged user whitelist.
    /// Originally hardcoded in General.vb.
    /// Can be overridden from configuration.
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
        
        // Try to load users from configuration
        var configuredUsers = _configuration
            .GetSection("Security:PrivilegedUsers")
            .Get<string[]>();
        
        if (configuredUsers != null && configuredUsers.Length > 0)
        {
            _allowedUsers = new HashSet<string>(configuredUsers, StringComparer.OrdinalIgnoreCase);
            _logger.LogInformation("Loaded {Count} privileged users from configuration", 
                _allowedUsers.Count);
        }
        else
        {
            _allowedUsers = DefaultAllowedUsers;
            _logger.LogDebug("Using default whitelist ({Count} users)", 
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
            
            _logger.LogDebug("User '{User}' {Status} in whitelist", 
                currentUser, 
                isInWhitelist ? "is" : "is NOT");
            
            return isInWhitelist;
        }
    }
    
    /// <inheritdoc/>
    public async Task<(bool IsValid, string? Password)> ValidatePrivilegedUserAsync()
    {
        var currentUser = Environment.UserName;
        
        // STEP 1: Verify whitelist
        if (!_allowedUsers.Contains(currentUser))
        {
            _logger.LogDebug("User '{User}' is not in privileged whitelist", currentUser);
            return (false, null);
        }
        
        _logger.LogDebug("User '{User}' is in whitelist, verifying pass.bin", currentUser);
        
        // STEP 2: Verify pass.bin exists
        if (!File.Exists(PasswordFilePath))
        {
            _logger.LogDebug("pass.bin file not found at: {Path}", PasswordFilePath);
            return (false, null);
        }
        
        // STEP 3: Read password from file
        try
        {
            // Read password from file
            var password = await File.ReadAllTextAsync(PasswordFilePath);
            password = password.Trim();
            
            if (string.IsNullOrEmpty(password))
            {
                _logger.LogWarning("File pass.bin is empty");
                return (false, null);
            }
            
            _logger.LogInformation("Privileged user validated: {User}", currentUser);
            return (true, password);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "No permission to read pass.bin");
            return (false, null);
        }
        catch (IOException ex)
        {
            _logger.LogWarning(ex, "I/O error reading pass.bin");
            return (false, null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error reading pass.bin");
            return (false, null);
        }
    }
}
