namespace Fiplex.Control.Software.WinForms.Core.Configuration;

/// <summary>
/// UI design constants based on the Fiplex by Honeywell corporate guide.
/// Light Mode - Windows Forms.
/// </summary>
/// <remarks>
/// This class centralizes all corporate palette values to facilitate
/// maintenance and ensure visual consistency throughout the application.
/// </remarks>
public static class FiplexTheme
{
    #region Primary Colors

    /// <summary>Fiplex primary color: #00589B - RGB(0, 88, 155)</summary>
    public static readonly Color PrimaryColor = Color.FromArgb(0, 88, 155);

    /// <summary>Dark primary color for hover: #003A70 - RGB(0, 58, 112)</summary>
    public static readonly Color PrimaryDarkColor = Color.FromArgb(0, 58, 112);

    /// <summary>Fiplex red accent color: #E2231A - RGB(226, 35, 26)</summary>
    public static readonly Color AccentRedColor = Color.FromArgb(226, 35, 26);

    #endregion

    #region Backgrounds

    /// <summary>White main background: #FFFFFF - RGB(255, 255, 255)</summary>
    public static readonly Color BackgroundMain = Color.FromArgb(255, 255, 255);

    /// <summary>Secondary panel background: #F5F5F5 - RGB(245, 245, 245)</summary>
    public static readonly Color BackgroundPanel = Color.FromArgb(245, 245, 245);

    /// <summary>Disabled elements background: #E9ECEF - RGB(233, 236, 239)</summary>
    public static readonly Color BackgroundDisabled = Color.FromArgb(233, 236, 239);

    #endregion

    #region Text

    /// <summary>Primary text: #222222 - RGB(34, 34, 34)</summary>
    public static readonly Color TextPrimary = Color.FromArgb(34, 34, 34);

    /// <summary>Secondary text: #555555 - RGB(85, 85, 85)</summary>
    public static readonly Color TextSecondary = Color.FromArgb(85, 85, 85);

    /// <summary>Disabled text: #9A9A9A - RGB(154, 154, 154)</summary>
    public static readonly Color TextDisabled = Color.FromArgb(154, 154, 154);

    /// <summary>Link text: #00589B - RGB(0, 88, 155)</summary>
    public static readonly Color TextLink = Color.FromArgb(0, 88, 155);

    /// <summary>Link text hover: #003A70 - RGB(0, 58, 112)</summary>
    public static readonly Color TextLinkHover = Color.FromArgb(0, 58, 112);

    /// <summary>White text for primary buttons</summary>
    public static readonly Color TextWhite = Color.White;

    #endregion

    #region Borders

    /// <summary>Soft border: #DDDDDD - RGB(221, 221, 221)</summary>
    public static readonly Color BorderSoft = Color.FromArgb(221, 221, 221);

    /// <summary>Focus border: #00589B - RGB(0, 88, 155)</summary>
    public static readonly Color BorderFocus = Color.FromArgb(0, 88, 155);

    #endregion

    #region States

    /// <summary>Success state: #198754 - RGB(25, 135, 84)</summary>
    public static readonly Color StateSuccess = Color.FromArgb(25, 135, 84);

    /// <summary>Warning state: #FFC107 - RGB(255, 193, 7)</summary>
    public static readonly Color StateWarning = Color.FromArgb(255, 193, 7);

    /// <summary>Error state: #E2231A - RGB(226, 35, 26)</summary>
    public static readonly Color StateError = Color.FromArgb(226, 35, 26);

    #endregion

    #region Typography

    /// <summary>Regular font: Segoe UI 9pt</summary>
    public static readonly Font FontRegular = new("Segoe UI", 9F);

    /// <summary>Bold font: Segoe UI 9pt Bold</summary>
    public static readonly Font FontBold = new("Segoe UI", 9F, FontStyle.Bold);

    /// <summary>Heading font: Segoe UI 11pt Bold</summary>
    public static readonly Font FontHeading = new("Segoe UI", 11F, FontStyle.Bold);

    /// <summary>Main title font: Segoe UI 14pt Bold</summary>
    public static readonly Font FontTitle = new("Segoe UI", 14F, FontStyle.Bold);

    /// <summary>Monospace font: Consolas 9pt</summary>
    public static readonly Font FontMono = new("Consolas", 9F);

    /// <summary>Monospace font 10pt: Consolas 10pt</summary>
    public static readonly Font FontMono10 = new("Consolas", 10F);

    #endregion

    #region Spacing

    /// <summary>Small padding: 8px</summary>
    public const int PaddingSmall = 8;

    /// <summary>Medium padding: 12px</summary>
    public const int PaddingMedium = 12;

    /// <summary>Large padding: 16px</summary>
    public const int PaddingLarge = 16;

    /// <summary>Extra large padding: 20px</summary>
    public const int PaddingXLarge = 20;

    /// <summary>Form margin: 16px</summary>
    public const int MarginForm = 16;

    #endregion

    #region Minimum Sizes

    /// <summary>Minimum button size: 90x30</summary>
    public static readonly Size MinButtonSize = new(90, 30);

    /// <summary>Minimum large button size: 120x35</summary>
    public static readonly Size MinButtonSizeLarge = new(120, 35);

    /// <summary>Minimum CTA button size: 200x42</summary>
    public static readonly Size MinButtonSizeCTA = new(200, 42);

    #endregion
}


