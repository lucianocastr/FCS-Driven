namespace Fiplex.Control.Software.WinForms.Core.Security.Interfaces;

/// <summary>
/// Service to validate Fiplex training/license status.
/// </summary>
public interface ITrainingValidationService
{
    /// <summary>
    /// Fiplex training expiration date.
    /// </summary>
    DateTime? TrainingExpiryDate { get; }
    
    /// <summary>
    /// Days remaining until expiration. Negative if already expired.
    /// Note: Uses TrainingExpiryDate for cmdConnect.Enabled
    /// </summary>
    int DaysRemaining { get; }
    
    /// <summary>
    /// Days remaining until login/token expiration.
    /// Calculated from LoginExpiryDate (JWT Exp token), NOT TrainingExpiryDate.
    /// </summary>
    int LoginDaysRemaining { get; }
    
    /// <summary>
    /// Indicates if the training is valid (not expired).
    /// </summary>
    bool IsTrainingValid { get; }

    /// <summary>
    /// True if the CLSS login window has expired (offline-window enforcement).
    /// Fail-secure: returns true when no login window is known (no LoginExpiryDate).
    /// </summary>
    bool IsLoginWindowExpired();

    /// <summary>
    /// Reads token/license information from CLSS or local file.
    /// </summary>
    Task ReadTokenInformationAsync(CancellationToken ct = default);
    
    /// <summary>
    /// Gets descriptive message of training status.
    /// </summary>
    string GetStatusMessage();
    
    /// <summary>
    /// Gets tooltip to show if training expired.
    /// </summary>
    string GetExpiredTooltip();
    
    /// <summary>
    /// Subscription expiration date (different from training).
    /// </summary>
    DateTime? SubscriptionExpiryDate { get; }
    
    /// <summary>
    /// Last login update date.
    /// </summary>
    DateTime? UpdatedOnDate { get; }
    
    /// <summary>
    /// Authenticated user name.
    /// </summary>
    string? UserName { get; }
    
    /// <summary>
    /// User organization.
    /// </summary>
    string? Organization { get; }
    
    /// <summary>
    /// Clears license data for logout.
    /// </summary>
    void ClearLicenseData();
}
