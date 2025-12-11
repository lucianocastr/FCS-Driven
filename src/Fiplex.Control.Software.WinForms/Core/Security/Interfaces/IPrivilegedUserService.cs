namespace Fiplex.Control.Software.WinForms.Core.Security.Interfaces;

/// <summary>
/// Servicio para validación de usuarios privilegiados.
/// </summary>
/// <remarks>
/// Un usuario privilegiado cumple:
/// 1. Username está en whitelist hardcodeada
/// 2. Existe archivo Desktop\pass.bin con password
/// </remarks>
public interface IPrivilegedUserService
{
    /// <summary>
    /// Indica si el usuario actual está en la whitelist de usuarios privilegiados.
    /// NO verifica existencia de pass.bin.
    /// </summary>
    bool IsCurrentUserInWhitelist { get; }
    
    /// <summary>
    /// Valida completamente si el usuario es privilegiado:
    /// 1. Verifica whitelist
    /// 2. Verifica existencia de pass.bin en Desktop
    /// 3. Lee password del archivo
    /// </summary>
    /// <returns>
    /// Tupla con:
    /// - IsValid: true si usuario privilegiado Y pass.bin existe
    /// - Password: contenido de pass.bin si válido, null si no
    /// </returns>
    Task<(bool IsValid, string? Password)> ValidatePrivilegedUserAsync();
    
    /// <summary>
    /// Obtiene la ruta esperada del archivo pass.bin
    /// </summary>
    string PasswordFilePath { get; }
}
