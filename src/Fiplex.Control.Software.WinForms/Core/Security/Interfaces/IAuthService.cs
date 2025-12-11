using Fiplex.Control.Software.WinForms.Models;

namespace Fiplex.Control.Software.WinForms.Core.Security.Interfaces;

/// <summary>
/// Service for device authentication and version validation.
/// </summary>
/// <remarks>
/// <para>
/// Handles the *0 password authentication protocol and extracts ucVersion from V1 responses.
/// The ucVersion determines available features (e.g., license menu requires &gt;= 0x10B).
/// </para>
/// <para>
/// Authentication flow: V1 query → Check if password required → *0{password} → Verify
/// </para>
/// </remarks>
/// <example>
/// Authentication flow:
/// <code>
/// var authResult = await authService.CheckAuthenticationRequirementAsync(ct);
/// if (authResult == AuthResult.PasswordRequired)
/// {
///     bool success = await authService.AuthenticateAsync(password, ct);
/// }
/// int version = authService.UcVersion; // 0x10B = 267
/// </code>
/// </example>
/// <seealso cref="AuthResult"/>
/// <seealso cref="ISerialCommandPipeline"/>
public interface IAuthService
{
    /// <summary>
    /// Gets the microcontroller version extracted from V1 response.
    /// </summary>
    /// <remarks>
    /// Used to validate menu conditions (e.g., license menu &gt;= 0x10B).
    /// Value is 0 if not yet read or parsing failed.
    /// </remarks>
    int UcVersion { get; }

    /// <summary>
    /// Gets the last raw V1 response for diagnostics.
    /// </summary>
    string LastV1Response { get; }

    /// <summary>
    /// Authenticates with the device using the *0 password command.
    /// </summary>
    /// <param name="password">The device password.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns><c>true</c> if authentication succeeded.</returns>
    Task<bool> AuthenticateAsync(string password, CancellationToken ct = default);

    /// <summary>
    /// Gets the device version string via the V1 command.
    /// </summary>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>The version string from the device.</returns>
    Task<string> GetVersionAsync(CancellationToken ct = default);

    /// <summary>
    /// Checks if the device is responding to commands.
    /// </summary>
    /// <param name="ct">Cancellation token.</param>
    /// <returns><c>true</c> if the device responds.</returns>
    Task<bool> CheckDeviceAliveAsync(CancellationToken ct = default);

    /// <summary>
    /// Checks whether the device requires password authentication.
    /// </summary>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>
    /// <see cref="AuthResult.NoAuthRequired"/> if no password needed;
    /// <see cref="AuthResult.PasswordRequired"/> if authentication required;
    /// <see cref="AuthResult.DeviceNotResponding"/> on communication error.
    /// </returns>
    /// <seealso cref="AuthResult"/>
    Task<AuthResult> CheckAuthenticationRequirementAsync(CancellationToken ct = default);
}
