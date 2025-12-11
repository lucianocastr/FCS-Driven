namespace Fiplex.Control.Software.WinForms.Models;

/// <summary>
/// Result codes for device authentication requirement check.
/// </summary>
/// <remarks>
/// Returned by <c>IAuthService.CheckAuthenticationRequirementAsync</c> to indicate
/// whether a password dialog should be shown.
/// </remarks>
/// <seealso cref="IAuthService"/>
public enum AuthResult
{
    /// <summary>
    /// V1 response valid without "INVALID" - connect directly without authentication.
    /// The device doesn't require a password or the session is already authenticated.
    /// </summary>
    NoAuthRequired = 0,

    /// <summary>
    /// V1 response contains "INVALID" - prompt user for password.
    /// The device requires authentication before allowing operations.
    /// </summary>
    PasswordRequired = -1,

    /// <summary>
    /// V1 timeout or empty - device not responding.
    /// Communication error or device not available on the port.
    /// </summary>
    DeviceNotResponding = -2
}
