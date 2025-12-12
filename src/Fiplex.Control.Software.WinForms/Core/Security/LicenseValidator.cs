using System.Text.Json;
using Fiplex.Control.Software.WinForms.Core.Security.Interfaces;
using Fiplex.Control.Software.WinForms.Models;
using Microsoft.Extensions.Logging;

namespace Fiplex.Control.Software.WinForms.Core.Security;

/// <summary>
/// License validator that reads from fiplex.license.
/// </summary>
public class LicenseValidator : ILicenseValidator
{
    private readonly ILogger<LicenseValidator> _logger;
    private LicenseInfo? _cachedLicense;
    private const string LicenseFileName = "fiplex.license";

    public LicenseValidator(ILogger<LicenseValidator> logger)
    {
        _logger = logger;
    }

    public async Task<bool> ValidateLicenseAsync(string deviceId, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(deviceId))
        {
            _logger.LogWarning("Empty device ID for license validation");
            return false;
        }

        // Load license if not cached
        if (_cachedLicense == null || !_cachedLicense.IsLoaded)
        {
            await LoadLicenseFileAsync(ct);
        }

        if (_cachedLicense == null || !_cachedLicense.IsLoaded)
        {
            _logger.LogWarning("License file not loaded, validation failed for device {DeviceId}", deviceId);
            return false;
        }

        // Verify expiration
        var isValid = !IsLicenseExpired();
        
        _logger.LogInformation("License validation for device {DeviceId}: {Status} (User: {User}, Org: {Org})", 
            deviceId, 
            isValid ? "Valid" : "Expired",
            _cachedLicense.UserName ?? "Unknown",
            _cachedLicense.Organization ?? "Unknown");

        return isValid;
    }

    public bool IsLicenseExpired()
    {
        if (_cachedLicense == null || !_cachedLicense.IsLoaded)
        {
            _logger.LogWarning("License not loaded, treating as expired");
            return true;
        }

        var now = DateTime.UtcNow;
        
        // Verify LoginExpiryDate
        if (_cachedLicense.LoginExpiryDate.HasValue && now > _cachedLicense.LoginExpiryDate.Value)
        {
            _logger.LogWarning("Login license expired on {Date}", _cachedLicense.LoginExpiryDate.Value);
            return true;
        }

        // Verify TrainingExpiryDate
        if (_cachedLicense.TrainingExpiryDate.HasValue && now > _cachedLicense.TrainingExpiryDate.Value)
        {
            _logger.LogWarning("Training license expired on {Date}", _cachedLicense.TrainingExpiryDate.Value);
            return true;
        }

        return false;
    }

    public DateTime? GetExpirationDate()
    {
        if (_cachedLicense == null || !_cachedLicense.IsLoaded)
            return null;

        // Return the closest expiration date
        var dates = new List<DateTime>();
        
        if (_cachedLicense.LoginExpiryDate.HasValue)
            dates.Add(_cachedLicense.LoginExpiryDate.Value);
            
        if (_cachedLicense.TrainingExpiryDate.HasValue)
            dates.Add(_cachedLicense.TrainingExpiryDate.Value);

        return dates.Count > 0 ? dates.Min() : null;
    }

    /// <summary>
    /// Gets the complete loaded license information.
    /// </summary>
    public LicenseInfo? GetLicenseInfo()
    {
        return _cachedLicense;
    }

    /// <summary>
    /// Loads the license file from disk.
    /// Searches in: current directory, App.BaseDirectory
    /// </summary>
    private async Task LoadLicenseFileAsync(CancellationToken ct = default)
    {
        var possiblePaths = new[]
        {
            Path.Combine(AppDomain.CurrentDomain.BaseDirectory, LicenseFileName),
            Path.Combine(Environment.CurrentDirectory, LicenseFileName),
            LicenseFileName
        };

        foreach (var path in possiblePaths)
        {
            if (File.Exists(path))
            {
                try
                {
                    var json = await File.ReadAllTextAsync(path, ct);
                    var license = JsonSerializer.Deserialize<LicenseInfo>(json, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                    if (license != null)
                    {
                        license.IsLoaded = true;
                        _cachedLicense = license;
                        
                        _logger.LogInformation(
                            "License loaded from {Path}: ID={LicenseId}, User={User}, LoginExpiry={Login}, TrainingExpiry={Training}",
                            path,
                            license.LicenseId ?? "N/A",
                            license.UserName ?? "N/A",
                            license.LoginExpiryDate?.ToString("yyyy-MM-dd") ?? "N/A",
                            license.TrainingExpiryDate?.ToString("yyyy-MM-dd") ?? "N/A");
                        
                        return;
                    }
                }
                catch (JsonException ex)
                {
                    _logger.LogError(ex, "Failed to parse license file {Path}", path);
                    _cachedLicense = new LicenseInfo
                    {
                        IsLoaded = false,
                        ErrorMessage = $"Invalid JSON format: {ex.Message}"
                    };
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to read license file {Path}", path);
                    _cachedLicense = new LicenseInfo
                    {
                        IsLoaded = false,
                        ErrorMessage = ex.Message
                    };
                }
            }
        }

        _logger.LogWarning("License file not found in any expected location");
        _cachedLicense = new LicenseInfo
        {
            IsLoaded = false,
            ErrorMessage = "License file not found"
        };
    }

    /// <summary>
    /// Forces license file reload.
    /// </summary>
    public async Task ReloadLicenseAsync(CancellationToken ct = default)
    {
        _cachedLicense = null;
        await LoadLicenseFileAsync(ct);
    }
}
