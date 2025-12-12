namespace Fiplex.Control.Software.WinForms.Models;

/// <summary>
/// Claims extracted from JWT token for offline authentication.
/// </summary>
/// <remarks>
/// Contains user information extracted from JWT token including:
/// <list type="bullet">
///   <item>User identification (UniqueName, AccountCompanyName)</item>
///   <item>Roles and permissions</item>
///   <item>License and training information</item>
/// </list>
/// </remarks>
public class TokenClaims
{
    /// <summary>
    /// Unique user name (claim "unique_name").
    /// </summary>
    public string? UniqueName { get; set; }

    /// <summary>
    /// Company name associated with the account.
    /// </summary>
    public string? AccountCompanyName { get; set; }

    /// <summary>
    /// User capability or access level.
    /// </summary>
    public string? Capability { get; set; }

    /// <summary>
    /// List of ESD brands associated with the user.
    /// </summary>
    public List<EsdBrand>? EsdBrands { get; set; }

    /// <summary>
    /// Roles assigned to the user in the system.
    /// </summary>
    public List<Role>? Roles { get; set; }

    /// <summary>
    /// User count information per software.
    /// </summary>
    public List<UsersCountInfo>? UsersCount { get; set; }

    /// <summary>
    /// Training expiration date information.
    /// </summary>
    public List<UsersTrainingExpiryDateInfo>? UsersTrainingExpiryDate { get; set; }

    /// <summary>
    /// License expiration details.
    /// </summary>
    public List<LicenseExpiryDetailsInfo>? LicenseExpiryDetails { get; set; }

    /// <summary>
    /// User-specific permissions.
    /// </summary>
    public List<Permission>? Permissions { get; set; }

    /// <summary>
    /// Token issue date (iat claim).
    /// </summary>
    public DateTime? IssuedAt { get; set; }

    /// <summary>
    /// Token expiration date (exp claim).
    /// </summary>
    public DateTime? ExpiresAt { get; set; }
}

/// <summary>
/// Represents an ESD brand associated with the user.
/// </summary>
public class EsdBrand
{
    /// <summary>Brand name.</summary>
    public string BrandName { get; set; } = string.Empty;
}

/// <summary>
/// Represents a role assigned to the user.
/// </summary>
public class Role
{
    /// <summary>Unique role identifier.</summary>
    public int Id { get; set; }
    
    /// <summary>Descriptive role name.</summary>
    public string Name { get; set; } = string.Empty;
    
    /// <summary>Role expiration date (ISO 8601 format).</summary>
    public string? Expiry { get; set; }
    
    /// <summary>Role and permissions description.</summary>
    public string? Description { get; set; }
    
    /// <summary>Indicates whether the role requires an active license.</summary>
    public bool IsLicenseRequired { get; set; }
    
    /// <summary>Indicates whether training is completed and current.</summary>
    public bool IsTrainingCompletedAndNotExpired { get; set; }
}

/// <summary>
/// User count information per software type.
/// </summary>
public class UsersCountInfo
{
    /// <summary>Software name.</summary>
    public string Software { get; set; } = string.Empty;
    
    /// <summary>Number of users licensed for this software.</summary>
    public int NumberOfUsers { get; set; }
}

/// <summary>
/// Training expiration date information per user.
/// </summary>
public class UsersTrainingExpiryDateInfo
{
    /// <summary>User object identifier.</summary>
    public string? UserOId { get; set; }
    
    /// <summary>Software name associated with training.</summary>
    public string Software { get; set; } = string.Empty;
    
    /// <summary>Training expiration date (ISO 8601 format).</summary>
    public string? ExpirationDate { get; set; }
    
    /// <summary>Indicates whether training is active ("true"/"false").</summary>
    public string? IsActive { get; set; }
}

/// <summary>
/// Detailed license expiration information.
/// </summary>
public class LicenseExpiryDetailsInfo
{
    /// <summary>Unique license identifier.</summary>
    public int Id { get; set; }
    
    /// <summary>Expiration date (ISO 8601 format).</summary>
    public string? ExpiryDate { get; set; }
    
    /// <summary>Indicates whether the license is active.</summary>
    public string? IsActive { get; set; }
    
    /// <summary>Indicates whether the license is paid.</summary>
    public string? IsPaid { get; set; }
    
    /// <summary>Indicates whether auto-renewal is enabled.</summary>
    public string? AutoRenewal { get; set; }
}

/// <summary>
/// Represents a user-specific permission.
/// </summary>
public class Permission
{
    /// <summary>Unique permission identifier.</summary>
    public int Id { get; set; }
    
    /// <summary>Permission name.</summary>
    public string Name { get; set; } = string.Empty;
    
    /// <summary>Permission expiration date.</summary>
    public string? Expiry { get; set; }
    
    /// <summary>Permission description.</summary>
    public string? Description { get; set; }
    
    /// <summary>Indicates whether an active license is required.</summary>
    public bool IsLicenseRequired { get; set; }
    
    /// <summary>Indicates whether training is current.</summary>
    public bool IsTrainingCompletedAndNotExpired { get; set; }
}

/// <summary>
/// Result of JWT token validation.
/// </summary>
public class OfflineTokenValidationResult
{
    /// <summary>
    /// Indicates whether the validation was successful.
    /// </summary>
    public bool IsValid { get; set; }
    
    /// <summary>
    /// Error message if validation failed.
    /// </summary>
    public string? ErrorMessage { get; set; }
    
    /// <summary>
    /// Claims extracted from the token if validation was successful.
    /// </summary>
    public TokenClaims? Claims { get; set; }
    
    /// <summary>
    /// Creates a successful validation result.
    /// </summary>
    public static OfflineTokenValidationResult Success(TokenClaims claims) => new()
    {
        IsValid = true,
        Claims = claims
    };
    
    /// <summary>
    /// Creates a failed validation result.
    /// </summary>
    public static OfflineTokenValidationResult Failure(string errorMessage) => new()
    {
        IsValid = false,
        ErrorMessage = errorMessage
    };
}
