namespace Fiplex.Control.Software.WinForms.Core.Security.Interfaces;

/// <summary>
/// Servicio para validar estado de entrenamiento/licencia Fiplex.
/// </summary>
public interface ITrainingValidationService
{
    /// <summary>
    /// Fecha de expiración del entrenamiento Fiplex.
    /// </summary>
    DateTime? TrainingExpiryDate { get; }
    
    /// <summary>
    /// Días restantes hasta expiración. Negativo si ya expiró.
    /// Nota: Usa TrainingExpiryDate para cmdConnect.Enabled
    /// </summary>
    int DaysRemaining { get; }
    
    /// <summary>
    /// Días restantes hasta expiración del login/token.
    /// Se calcula desde LoginExpiryDate (token JWT Exp), NO TrainingExpiryDate.
    /// </summary>
    int LoginDaysRemaining { get; }
    
    /// <summary>
    /// Indica si el entrenamiento está vigente (no expirado).
    /// </summary>
    bool IsTrainingValid { get; }
    
    /// <summary>
    /// Lee la información de token/licencia desde CLSS o archivo local.
    /// </summary>
    Task ReadTokenInformationAsync(CancellationToken ct = default);
    
    /// <summary>
    /// Obtiene mensaje descriptivo del estado del entrenamiento.
    /// </summary>
    string GetStatusMessage();
    
    /// <summary>
    /// Obtiene tooltip para mostrar si el entrenamiento expiró.
    /// </summary>
    string GetExpiredTooltip();
    
    /// <summary>
    /// Fecha de expiración de suscripción (diferente a training).
    /// </summary>
    DateTime? SubscriptionExpiryDate { get; }
    
    /// <summary>
    /// Fecha de última actualización de login.
    /// </summary>
    DateTime? UpdatedOnDate { get; }
    
    /// <summary>
    /// Nombre del usuario autenticado.
    /// </summary>
    string? UserName { get; }
    
    /// <summary>
    /// Organización del usuario.
    /// </summary>
    string? Organization { get; }
    
    /// <summary>
    /// Limpia datos de licencia para logout.
    /// </summary>
    void ClearLicenseData();
}
