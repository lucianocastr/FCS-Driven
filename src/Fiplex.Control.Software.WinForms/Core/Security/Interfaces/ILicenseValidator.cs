using Fiplex.Control.Software.WinForms.Models;

namespace Fiplex.Control.Software.WinForms.Core.Security.Interfaces;

/// <summary>
/// License validator for Fiplex devices.
/// </summary>
public interface ILicenseValidator
{
    /// <summary>
    /// Validates the license for a specific device.
    /// </summary>
    Task<bool> ValidateLicenseAsync(string deviceId, CancellationToken ct = default);
    
    /// <summary>
    /// Indicates if the current license is expired.
    /// </summary>
    bool IsLicenseExpired();
    
    /// <summary>
    /// Gets the closest expiration date.
    /// </summary>
    DateTime? GetExpirationDate();
    
    /// <summary>
    /// Gets complete information of the loaded license.
    /// </summary>
    LicenseInfo? GetLicenseInfo();
    
    /// <summary>
    /// Reloads the license file from disk.
    /// </summary>
    Task ReloadLicenseAsync(CancellationToken ct = default);
}
