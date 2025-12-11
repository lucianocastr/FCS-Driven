using Fiplex.Control.Software.WinForms.Models;

namespace Fiplex.Control.Software.WinForms.Core.Security.Interfaces;

/// <summary>
/// Validador de licencias para dispositivos Fiplex.
/// </summary>
public interface ILicenseValidator
{
    /// <summary>
    /// Valida la licencia para un dispositivo específico.
    /// </summary>
    Task<bool> ValidateLicenseAsync(string deviceId, CancellationToken ct = default);
    
    /// <summary>
    /// Indica si la licencia actual está expirada.
    /// </summary>
    bool IsLicenseExpired();
    
    /// <summary>
    /// Obtiene la fecha de expiración más cercana.
    /// </summary>
    DateTime? GetExpirationDate();
    
    /// <summary>
    /// Obtiene información completa de la licencia cargada.
    /// </summary>
    LicenseInfo? GetLicenseInfo();
    
    /// <summary>
    /// Recarga el archivo de licencia desde disco.
    /// </summary>
    Task ReloadLicenseAsync(CancellationToken ct = default);
}
