namespace Fiplex.Control.Software.WinForms.Models;

/// <summary>
/// Claims extraídos del token JWT para autenticación offline.
/// </summary>
/// <remarks>
/// Contiene la información del usuario extraída del token JWT incluyendo:
/// <list type="bullet">
///   <item>Identificación del usuario (UniqueName, AccountCompanyName)</item>
///   <item>Roles y permisos</item>
///   <item>Información de licencia y training</item>
/// </list>
/// </remarks>
public class TokenClaims
{
    /// <summary>
    /// Nombre único del usuario (claim "unique_name").
    /// </summary>
    public string? UniqueName { get; set; }

    /// <summary>
    /// Nombre de la compañía asociada a la cuenta.
    /// </summary>
    public string? AccountCompanyName { get; set; }

    /// <summary>
    /// Capacidad o nivel de acceso del usuario.
    /// </summary>
    public string? Capability { get; set; }

    /// <summary>
    /// Lista de marcas ESD asociadas al usuario.
    /// </summary>
    public List<EsdBrand>? EsdBrands { get; set; }

    /// <summary>
    /// Roles asignados al usuario en el sistema.
    /// </summary>
    public List<Role>? Roles { get; set; }

    /// <summary>
    /// Información de conteo de usuarios por software.
    /// </summary>
    public List<UsersCountInfo>? UsersCount { get; set; }

    /// <summary>
    /// Información de fechas de expiración de entrenamiento.
    /// </summary>
    public List<UsersTrainingExpiryDateInfo>? UsersTrainingExpiryDate { get; set; }

    /// <summary>
    /// Detalles de expiración de licencias.
    /// </summary>
    public List<LicenseExpiryDetailsInfo>? LicenseExpiryDetails { get; set; }

    /// <summary>
    /// Permisos específicos del usuario.
    /// </summary>
    public List<Permission>? Permissions { get; set; }

    /// <summary>
    /// Fecha de emisión del token (iat claim).
    /// </summary>
    public DateTime? IssuedAt { get; set; }

    /// <summary>
    /// Fecha de expiración del token (exp claim).
    /// </summary>
    public DateTime? ExpiresAt { get; set; }
}

/// <summary>
/// Representa una marca ESD asociada al usuario.
/// </summary>
public class EsdBrand
{
    /// <summary>Nombre de la marca.</summary>
    public string BrandName { get; set; } = string.Empty;
}

/// <summary>
/// Representa un rol asignado al usuario.
/// </summary>
public class Role
{
    /// <summary>Identificador único del rol.</summary>
    public int Id { get; set; }
    
    /// <summary>Nombre descriptivo del rol.</summary>
    public string Name { get; set; } = string.Empty;
    
    /// <summary>Fecha de expiración del rol (formato ISO 8601).</summary>
    public string? Expiry { get; set; }
    
    /// <summary>Descripción del rol y sus permisos.</summary>
    public string? Description { get; set; }
    
    /// <summary>Indica si el rol requiere licencia activa.</summary>
    public bool IsLicenseRequired { get; set; }
    
    /// <summary>Indica si el training está completado y vigente.</summary>
    public bool IsTrainingCompletedAndNotExpired { get; set; }
}

/// <summary>
/// Información de conteo de usuarios por tipo de software.
/// </summary>
public class UsersCountInfo
{
    /// <summary>Nombre del software.</summary>
    public string Software { get; set; } = string.Empty;
    
    /// <summary>Número de usuarios con licencia para este software.</summary>
    public int NumberOfUsers { get; set; }
}

/// <summary>
/// Información de fecha de expiración de entrenamiento por usuario.
/// </summary>
public class UsersTrainingExpiryDateInfo
{
    /// <summary>Identificador de objeto del usuario.</summary>
    public string? UserOId { get; set; }
    
    /// <summary>Nombre del software asociado al training.</summary>
    public string Software { get; set; } = string.Empty;
    
    /// <summary>Fecha de expiración del training (formato ISO 8601).</summary>
    public string? ExpirationDate { get; set; }
    
    /// <summary>Indica si el training está activo ("true"/"false").</summary>
    public string? IsActive { get; set; }
}

/// <summary>
/// Información detallada de expiración de licencia.
/// </summary>
public class LicenseExpiryDetailsInfo
{
    /// <summary>Identificador único de la licencia.</summary>
    public int Id { get; set; }
    
    /// <summary>Fecha de expiración (formato ISO 8601).</summary>
    public string? ExpiryDate { get; set; }
    
    /// <summary>Indica si la licencia está activa.</summary>
    public string? IsActive { get; set; }
    
    /// <summary>Indica si la licencia está pagada.</summary>
    public string? IsPaid { get; set; }
    
    /// <summary>Indica si la renovación automática está habilitada.</summary>
    public string? AutoRenewal { get; set; }
}

/// <summary>
/// Representa un permiso específico del usuario.
/// </summary>
public class Permission
{
    /// <summary>Identificador único del permiso.</summary>
    public int Id { get; set; }
    
    /// <summary>Nombre del permiso.</summary>
    public string Name { get; set; } = string.Empty;
    
    /// <summary>Fecha de expiración del permiso.</summary>
    public string? Expiry { get; set; }
    
    /// <summary>Descripción del permiso.</summary>
    public string? Description { get; set; }
    
    /// <summary>Indica si requiere licencia activa.</summary>
    public bool IsLicenseRequired { get; set; }
    
    /// <summary>Indica si el training está vigente.</summary>
    public bool IsTrainingCompletedAndNotExpired { get; set; }
}

/// <summary>
/// Resultado de la validación de un token JWT.
/// </summary>
public class OfflineTokenValidationResult
{
    /// <summary>
    /// Indica si la validación fue exitosa.
    /// </summary>
    public bool IsValid { get; set; }
    
    /// <summary>
    /// Mensaje de error si la validación falló.
    /// </summary>
    public string? ErrorMessage { get; set; }
    
    /// <summary>
    /// Claims extraídos del token si la validación fue exitosa.
    /// </summary>
    public TokenClaims? Claims { get; set; }
    
    /// <summary>
    /// Crea un resultado de validación exitosa.
    /// </summary>
    public static OfflineTokenValidationResult Success(TokenClaims claims) => new()
    {
        IsValid = true,
        Claims = claims
    };
    
    /// <summary>
    /// Crea un resultado de validación fallida.
    /// </summary>
    public static OfflineTokenValidationResult Failure(string errorMessage) => new()
    {
        IsValid = false,
        ErrorMessage = errorMessage
    };
}
