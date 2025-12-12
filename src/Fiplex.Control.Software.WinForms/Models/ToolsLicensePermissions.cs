namespace Fiplex.Control.Software.WinForms.Models;

/// <summary>
/// Represents the permissions and license status of the authenticated user.
/// </summary>
/// <remarks>
/// This class centralizes authorization information including:
/// <list type="bullet">
///   <item>Token validity status</item>
///   <item>Login status</item>
///   <item>User type (basic/privileged)</item>
/// </list>
/// </remarks>
public class ToolsLicensePermissions
{
    /// <summary>
    /// Constant indicating successful token authorization.
    /// </summary>
    /// <value>Value 1 indicates valid and authorized token.</value>
    public const int TOKEN_AUTHORIZATION_SUCCESS = 1;

    /// <summary>
    /// License token validity status.
    /// 0 = Not valid, 1 = Valid/Authorized
    /// </summary>
    public int IsLicenseTokenValid { get; set; }

    /// <summary>
    /// Indicates whether the user has logged in successfully.
    /// </summary>
    public bool LoginStatus { get; set; }

    /// <summary>
    /// Authenticated user name.
    /// </summary>
    public string? UserName { get; set; }

    /// <summary>
    /// Indicates whether the user is a basic user with limited permissions.
    /// </summary>
    /// <remarks>
    /// Basic users have restrictions on advanced functionalities
    /// such as calibration, factory configuration, and license management.
    /// </remarks>
    public bool IsBasicUser { get; set; }

    /// <summary>
    /// Indicates whether this is the first application start in the current session.
    /// </summary>
    /// <value><c>true</c> during initial startup; <c>false</c> afterwards.</value>
    public bool IsStartup { get; set; } = true;

    /// <summary>
    /// Resets the permissions state.
    /// </summary>
    public void Reset()
    {
        IsLicenseTokenValid = 0;
        LoginStatus = false;
        UserName = null;
        IsBasicUser = false;
        IsStartup = true;
    }
}
