namespace Fiplex.Control.Software.WinForms.Core.Security.Interfaces;

/// <summary>
/// Service for privileged user validation.
/// </summary>
/// <remarks>
/// A privileged user meets:
/// 1. Username is in hardcoded whitelist
/// 2. Desktop\pass.bin file exists with password
/// </remarks>
public interface IPrivilegedUserService
{
    /// <summary>
    /// Indicates if the current user is in the privileged users whitelist.
    /// Does NOT verify pass.bin existence.
    /// </summary>
    bool IsCurrentUserInWhitelist { get; }
    
    /// <summary>
    /// Fully validates if user is privileged:
    /// 1. Verifies whitelist
    /// 2. Verifies pass.bin existence on Desktop
    /// 3. Reads password from file
    /// </summary>
    /// <returns>
    /// Tuple with:
    /// - IsValid: true if privileged user AND pass.bin exists
    /// - Password: content of pass.bin if valid, null if not
    /// </returns>
    Task<(bool IsValid, string? Password)> ValidatePrivilegedUserAsync();
    
    /// <summary>
    /// Gets the expected path of pass.bin file
    /// </summary>
    string PasswordFilePath { get; }
}
