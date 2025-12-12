namespace Fiplex.Control.Software.WinForms.Models;

/// <summary>
/// CLSS license information for user and device.
/// </summary>
/// <remarks>
/// Centralizes all license-related information including:
/// <list type="bullet">
///   <item>Software license (subscription)</item>
///   <item>CLSS training</item>
///   <item>Licensed user data</item>
/// </list>
/// </remarks>
public class LicenseInfo
{
    /// <summary>
    /// Device license key.
    /// </summary>
    /// <remarks>Used for license identification and validation.</remarks>
    public string? Key { get; set; }
    
    /// <summary>
    /// Indicates whether the license is valid and current.
    /// </summary>
    public bool IsValid { get; set; }
    
    /// <summary>
    /// Device license expiration date.
    /// </summary>
    public DateTime ExpirationDate { get; set; } = DateTime.MaxValue;
    
    /// <summary>
    /// CLSS login expiration date.
    /// </summary>
    public DateTime? LoginExpiryDate { get; set; }
    
    /// <summary>
    /// Fiplex training expiration date (CLSS Training).
    /// </summary>
    /// <remarks>
    /// Training must be current to connect with devices.
    /// </remarks>
    public DateTime? TrainingExpiryDate { get; set; }
    
    /// <summary>
    /// Licensed user name.
    /// </summary>
    public string? UserName { get; set; }
    
    /// <summary>
    /// User organization.
    /// </summary>
    public string? Organization { get; set; }
    
    /// <summary>
    /// Unique license identifier.
    /// </summary>
    public string? LicenseId { get; set; }
    
    /// <summary>
    /// License file format version.
    /// </summary>
    public int Version { get; set; } = 1;
    
    /// <summary>
    /// Indicates whether the license was loaded successfully from file.
    /// </summary>
    public bool IsLoaded { get; set; }
    
    /// <summary>
    /// Error message if license loading failed.
    /// </summary>
    public string? ErrorMessage { get; set; }
    
    /// <summary>
    /// Software subscription expiration date.
    /// </summary>
    public DateTime? SubscriptionExpiryDate { get; set; }
    
    /// <summary>
    /// Last login update date.
    /// </summary>
    public DateTime? UpdatedOnDate { get; set; }
}
