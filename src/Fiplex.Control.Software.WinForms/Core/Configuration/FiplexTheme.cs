namespace Fiplex.Control.Software.WinForms.Core.Configuration;

/// <summary>
/// Constantes de diseño UI basadas en la guía corporativa Fiplex by Honeywell.
/// Modo Claro - Windows Forms.
/// </summary>
/// <remarks>
/// Esta clase centraliza todos los valores de la paleta corporativa para facilitar
/// el mantenimiento y asegurar consistencia visual en toda la aplicación.
/// </remarks>
public static class FiplexTheme
{
    #region Colores Primarios

    /// <summary>Color primario Fiplex: #00589B - RGB(0, 88, 155)</summary>
    public static readonly Color PrimaryColor = Color.FromArgb(0, 88, 155);

    /// <summary>Color primario oscuro para hover: #003A70 - RGB(0, 58, 112)</summary>
    public static readonly Color PrimaryDarkColor = Color.FromArgb(0, 58, 112);

    /// <summary>Color de acento rojo Fiplex: #E2231A - RGB(226, 35, 26)</summary>
    public static readonly Color AccentRedColor = Color.FromArgb(226, 35, 26);

    #endregion

    #region Fondos

    /// <summary>Fondo principal blanco: #FFFFFF - RGB(255, 255, 255)</summary>
    public static readonly Color BackgroundMain = Color.FromArgb(255, 255, 255);

    /// <summary>Fondo de panel secundario: #F5F5F5 - RGB(245, 245, 245)</summary>
    public static readonly Color BackgroundPanel = Color.FromArgb(245, 245, 245);

    /// <summary>Fondo de elementos deshabilitados: #E9ECEF - RGB(233, 236, 239)</summary>
    public static readonly Color BackgroundDisabled = Color.FromArgb(233, 236, 239);

    #endregion

    #region Texto

    /// <summary>Texto principal: #222222 - RGB(34, 34, 34)</summary>
    public static readonly Color TextPrimary = Color.FromArgb(34, 34, 34);

    /// <summary>Texto secundario: #555555 - RGB(85, 85, 85)</summary>
    public static readonly Color TextSecondary = Color.FromArgb(85, 85, 85);

    /// <summary>Texto deshabilitado: #9A9A9A - RGB(154, 154, 154)</summary>
    public static readonly Color TextDisabled = Color.FromArgb(154, 154, 154);

    /// <summary>Texto de enlace: #00589B - RGB(0, 88, 155)</summary>
    public static readonly Color TextLink = Color.FromArgb(0, 88, 155);

    /// <summary>Texto de enlace hover: #003A70 - RGB(0, 58, 112)</summary>
    public static readonly Color TextLinkHover = Color.FromArgb(0, 58, 112);

    /// <summary>Texto blanco para botones primarios</summary>
    public static readonly Color TextWhite = Color.White;

    #endregion

    #region Bordes

    /// <summary>Borde suave: #DDDDDD - RGB(221, 221, 221)</summary>
    public static readonly Color BorderSoft = Color.FromArgb(221, 221, 221);

    /// <summary>Borde con foco: #00589B - RGB(0, 88, 155)</summary>
    public static readonly Color BorderFocus = Color.FromArgb(0, 88, 155);

    #endregion

    #region Estados

    /// <summary>Estado de éxito: #198754 - RGB(25, 135, 84)</summary>
    public static readonly Color StateSuccess = Color.FromArgb(25, 135, 84);

    /// <summary>Estado de advertencia: #FFC107 - RGB(255, 193, 7)</summary>
    public static readonly Color StateWarning = Color.FromArgb(255, 193, 7);

    /// <summary>Estado de error: #E2231A - RGB(226, 35, 26)</summary>
    public static readonly Color StateError = Color.FromArgb(226, 35, 26);

    #endregion

    #region Tipografía

    /// <summary>Fuente regular: Segoe UI 9pt</summary>
    public static readonly Font FontRegular = new("Segoe UI", 9F);

    /// <summary>Fuente negrita: Segoe UI 9pt Bold</summary>
    public static readonly Font FontBold = new("Segoe UI", 9F, FontStyle.Bold);

    /// <summary>Fuente de encabezado: Segoe UI 11pt Bold</summary>
    public static readonly Font FontHeading = new("Segoe UI", 11F, FontStyle.Bold);

    /// <summary>Fuente de título principal: Segoe UI 14pt Bold</summary>
    public static readonly Font FontTitle = new("Segoe UI", 14F, FontStyle.Bold);

    /// <summary>Fuente monoespaciada: Consolas 9pt</summary>
    public static readonly Font FontMono = new("Consolas", 9F);

    /// <summary>Fuente monoespaciada 10pt: Consolas 10pt</summary>
    public static readonly Font FontMono10 = new("Consolas", 10F);

    #endregion

    #region Espaciado

    /// <summary>Padding pequeño: 8px</summary>
    public const int PaddingSmall = 8;

    /// <summary>Padding medio: 12px</summary>
    public const int PaddingMedium = 12;

    /// <summary>Padding grande: 16px</summary>
    public const int PaddingLarge = 16;

    /// <summary>Padding extra grande: 20px</summary>
    public const int PaddingXLarge = 20;

    /// <summary>Margen de formulario: 16px</summary>
    public const int MarginForm = 16;

    #endregion

    #region Tamaños Mínimos

    /// <summary>Tamaño mínimo de botón: 90x30</summary>
    public static readonly Size MinButtonSize = new(90, 30);

    /// <summary>Tamaño mínimo de botón grande: 120x35</summary>
    public static readonly Size MinButtonSizeLarge = new(120, 35);

    /// <summary>Tamaño mínimo de botón CTA: 200x42</summary>
    public static readonly Size MinButtonSizeCTA = new(200, 42);

    #endregion
}
