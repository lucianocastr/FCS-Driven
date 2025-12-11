namespace Fiplex.Control.Software.WinForms.Models;

/// <summary>
/// Representa los permisos y estado de licencia del usuario autenticado.
/// </summary>
/// <remarks>
/// Esta clase centraliza la información de autorización incluyendo:
/// <list type="bullet">
///   <item>Estado de validez del token</item>
///   <item>Estado de login</item>
///   <item>Tipo de usuario (básico/privilegiado)</item>
/// </list>
/// </remarks>
public class ToolsLicensePermissions
{
    /// <summary>
    /// Constante que indica autorización exitosa del token.
    /// </summary>
    /// <value>Valor 1 indica token válido y autorizado.</value>
    public const int TOKEN_AUTHORIZATION_SUCCESS = 1;

    /// <summary>
    /// Estado de validez del token de licencia.
    /// 0 = No válido, 1 = Válido/Autorizado
    /// </summary>
    public int IsLicenseTokenValid { get; set; }

    /// <summary>
    /// Indica si el usuario ha iniciado sesión correctamente.
    /// </summary>
    public bool LoginStatus { get; set; }

    /// <summary>
    /// Nombre del usuario autenticado.
    /// </summary>
    public string? UserName { get; set; }

    /// <summary>
    /// Indica si el usuario es un usuario básico con permisos limitados.
    /// </summary>
    /// <remarks>
    /// Los usuarios básicos tienen restricciones en funcionalidades avanzadas
    /// como calibración, configuración de fábrica y gestión de licencias.
    /// </remarks>
    public bool IsBasicUser { get; set; }

    /// <summary>
    /// Indica si es el primer inicio de la aplicación en la sesión actual.
    /// </summary>
    /// <value><c>true</c> durante el arranque inicial; <c>false</c> después.</value>
    public bool IsStartup { get; set; } = true;

    /// <summary>
    /// Reinicia el estado de permisos.
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
