namespace Fiplex.Control.Software.WinForms.Models;

/// <summary>
/// Información de licencia CLSS del usuario y dispositivo.
/// </summary>
/// <remarks>
/// Centraliza toda la información relacionada con licencias incluyendo:
/// <list type="bullet">
///   <item>Licencia del software (suscripción)</item>
///   <item>Entrenamiento CLSS (training)</item>
///   <item>Datos del usuario licenciado</item>
/// </list>
/// </remarks>
public class LicenseInfo
{
    /// <summary>
    /// Clave de licencia del dispositivo.
    /// </summary>
    /// <remarks>Utilizada para identificación y validación de licencia.</remarks>
    public string? Key { get; set; }
    
    /// <summary>
    /// Indica si la licencia es válida y está vigente.
    /// </summary>
    public bool IsValid { get; set; }
    
    /// <summary>
    /// Fecha de expiración de la licencia del dispositivo.
    /// </summary>
    public DateTime ExpirationDate { get; set; } = DateTime.MaxValue;
    
    /// <summary>
    /// Fecha de expiración del login CLSS.
    /// </summary>
    public DateTime? LoginExpiryDate { get; set; }
    
    /// <summary>
    /// Fecha de expiración del entrenamiento Fiplex (CLSS Training).
    /// </summary>
    /// <remarks>
    /// El training debe estar vigente para poder conectar con dispositivos.
    /// </remarks>
    public DateTime? TrainingExpiryDate { get; set; }
    
    /// <summary>
    /// Nombre del usuario licenciado.
    /// </summary>
    public string? UserName { get; set; }
    
    /// <summary>
    /// Organización del usuario.
    /// </summary>
    public string? Organization { get; set; }
    
    /// <summary>
    /// Identificador único de la licencia.
    /// </summary>
    public string? LicenseId { get; set; }
    
    /// <summary>
    /// Versión del formato del archivo de licencia.
    /// </summary>
    public int Version { get; set; } = 1;
    
    /// <summary>
    /// Indica si la licencia fue cargada correctamente desde el archivo.
    /// </summary>
    public bool IsLoaded { get; set; }
    
    /// <summary>
    /// Mensaje de error si la carga de licencia falló.
    /// </summary>
    public string? ErrorMessage { get; set; }
    
    /// <summary>
    /// Fecha de expiración de la suscripción del software.
    /// </summary>
    public DateTime? SubscriptionExpiryDate { get; set; }
    
    /// <summary>
    /// Fecha de última actualización del login.
    /// </summary>
    public DateTime? UpdatedOnDate { get; set; }
}
