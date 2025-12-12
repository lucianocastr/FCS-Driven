using Fiplex.Control.Software.WinForms.Core.Configuration;

namespace Fiplex.Control.Software.WinForms.Utilities.Extensions;

/// <summary>
/// Extensions to apply Fiplex styles to WinForms controls.
/// </summary>
/// <remarks>
/// These extensions facilitate consistent application of the Fiplex by Honeywell
/// corporate palette to user interface controls.
/// </remarks>
public static class ControlStyleExtensions
{
    /// <summary>
    /// Applies Fiplex primary button style.
    /// </summary>
    /// <param name="button">The button to style.</param>
    /// <remarks>
    /// Button with Fiplex blue background (#00589B), white text and dark hover effect.
    /// </remarks>
    public static void ApplyPrimaryStyle(this Button button)
    {
        button.BackColor = FiplexTheme.PrimaryColor;
        button.ForeColor = FiplexTheme.TextWhite;
        button.FlatStyle = FlatStyle.Flat;
        button.FlatAppearance.BorderSize = 0;
        button.FlatAppearance.MouseOverBackColor = FiplexTheme.PrimaryDarkColor;
        button.FlatAppearance.MouseDownBackColor = FiplexTheme.PrimaryDarkColor;
        button.Font = FiplexTheme.FontRegular;
        button.Cursor = Cursors.Hand;
        button.MinimumSize = FiplexTheme.MinButtonSize;
        button.UseVisualStyleBackColor = false;
    }

    /// <summary>
    /// Applies Fiplex secondary button style.
    /// </summary>
    /// <param name="button">The button to style.</param>
    /// <remarks>
    /// Button with white background, dark text and soft gray border.
    /// </remarks>
    public static void ApplySecondaryStyle(this Button button)
    {
        button.BackColor = FiplexTheme.BackgroundMain;
        button.ForeColor = FiplexTheme.TextPrimary;
        button.FlatStyle = FlatStyle.Flat;
        button.FlatAppearance.BorderColor = FiplexTheme.BorderSoft;
        button.FlatAppearance.BorderSize = 1;
        button.FlatAppearance.MouseOverBackColor = FiplexTheme.BackgroundPanel;
        button.FlatAppearance.MouseDownBackColor = FiplexTheme.BackgroundPanel;
        button.Font = FiplexTheme.FontRegular;
        button.Cursor = Cursors.Hand;
        button.MinimumSize = FiplexTheme.MinButtonSize;
        button.UseVisualStyleBackColor = false;
    }

    /// <summary>
    /// Applies outline button style (primary with border).
    /// </summary>
    /// <param name="button">The button to style.</param>
    /// <remarks>
    /// Button with white background, Fiplex blue text and blue border.
    /// </remarks>
    public static void ApplyOutlineStyle(this Button button)
    {
        button.BackColor = FiplexTheme.BackgroundMain;
        button.ForeColor = FiplexTheme.PrimaryColor;
        button.FlatStyle = FlatStyle.Flat;
        button.FlatAppearance.BorderColor = FiplexTheme.PrimaryColor;
        button.FlatAppearance.BorderSize = 1;
        button.FlatAppearance.MouseOverBackColor = FiplexTheme.BackgroundPanel;
        button.FlatAppearance.MouseDownBackColor = FiplexTheme.BackgroundPanel;
        button.Font = FiplexTheme.FontRegular;
        button.Cursor = Cursors.Hand;
        button.MinimumSize = FiplexTheme.MinButtonSize;
        button.UseVisualStyleBackColor = false;
    }

    /// <summary>
    /// Applies danger/error button style.
    /// </summary>
    /// <param name="button">The button to style.</param>
    /// <remarks>
    /// Button with Fiplex red background (#E2231A), white text.
    /// </remarks>
    public static void ApplyDangerStyle(this Button button)
    {
        button.BackColor = FiplexTheme.AccentRedColor;
        button.ForeColor = FiplexTheme.TextWhite;
        button.FlatStyle = FlatStyle.Flat;
        button.FlatAppearance.BorderSize = 0;
        button.FlatAppearance.MouseOverBackColor = Color.FromArgb(200, 30, 20);
        button.FlatAppearance.MouseDownBackColor = Color.FromArgb(180, 25, 18);
        button.Font = FiplexTheme.FontRegular;
        button.Cursor = Cursors.Hand;
        button.MinimumSize = FiplexTheme.MinButtonSize;
        button.UseVisualStyleBackColor = false;
    }

    /// <summary>
    /// Applies Fiplex LinkLabel style.
    /// </summary>
    /// <param name="link">The LinkLabel to style.</param>
    public static void ApplyFiplexStyle(this LinkLabel link)
    {
        link.LinkColor = FiplexTheme.TextLink;
        link.ActiveLinkColor = FiplexTheme.TextLinkHover;
        link.VisitedLinkColor = FiplexTheme.TextLink;
        link.LinkBehavior = LinkBehavior.HoverUnderline;
        link.Font = FiplexTheme.FontRegular;
    }

    /// <summary>
    /// Applies Fiplex base form configuration.
    /// </summary>
    /// <param name="form">The form to style.</param>
    /// <param name="isDialog">True if it is a modal dialog.</param>
    public static void ApplyFiplexFormStyle(this Form form, bool isDialog = false)
    {
        form.BackColor = FiplexTheme.BackgroundMain;
        form.Font = FiplexTheme.FontRegular;

        if (isDialog)
        {
            form.FormBorderStyle = FormBorderStyle.FixedDialog;
            form.MaximizeBox = false;
            form.MinimizeBox = false;
            form.StartPosition = FormStartPosition.CenterParent;
            form.ShowInTaskbar = false;
        }
    }

    /// <summary>
    /// Applies Fiplex GroupBox style.
    /// </summary>
    /// <param name="groupBox">The GroupBox to style.</param>
    public static void ApplyFiplexStyle(this GroupBox groupBox)
    {
        groupBox.Font = FiplexTheme.FontBold;
        groupBox.ForeColor = FiplexTheme.TextPrimary;
    }

    /// <summary>
    /// Applies Fiplex secondary Panel style.
    /// </summary>
    /// <param name="panel">The Panel to style.</param>
    public static void ApplyPanelStyle(this Panel panel)
    {
        panel.BackColor = FiplexTheme.BackgroundPanel;
    }

    /// <summary>
    /// Applies Fiplex primary Label style.
    /// </summary>
    /// <param name="label">The Label to style.</param>
    /// <param name="isHeading">True if it is a heading.</param>
    public static void ApplyFiplexStyle(this Label label, bool isHeading = false)
    {
        label.ForeColor = FiplexTheme.TextPrimary;
        label.Font = isHeading ? FiplexTheme.FontHeading : FiplexTheme.FontRegular;
    }

    /// <summary>
    /// Applies Fiplex secondary Label style.
    /// </summary>
    /// <param name="label">The Label to style.</param>
    public static void ApplySecondaryStyle(this Label label)
    {
        label.ForeColor = FiplexTheme.TextSecondary;
        label.Font = FiplexTheme.FontRegular;
    }

    /// <summary>
    /// Applies Fiplex TextBox style.
    /// </summary>
    /// <param name="textBox">The TextBox to style.</param>
    public static void ApplyFiplexStyle(this TextBox textBox)
    {
        textBox.BorderStyle = BorderStyle.FixedSingle;
        textBox.Font = FiplexTheme.FontRegular;
        textBox.ForeColor = FiplexTheme.TextPrimary;
    }

    /// <summary>
    /// Applies Fiplex CheckBox style.
    /// </summary>
    /// <param name="checkBox">The CheckBox to style.</param>
    public static void ApplyFiplexStyle(this CheckBox checkBox)
    {
        checkBox.Font = FiplexTheme.FontRegular;
        checkBox.ForeColor = FiplexTheme.TextPrimary;
    }

    /// <summary>
    /// Applies Fiplex main title style.
    /// </summary>
    /// <param name="label">The Label to style as title.</param>
    public static void ApplyTitleStyle(this Label label)
    {
        label.Font = FiplexTheme.FontTitle;
        label.ForeColor = FiplexTheme.TextPrimary;
    }

    /// <summary>
    /// Applies success state style.
    /// </summary>
    /// <param name="label">The Label to style.</param>
    public static void ApplySuccessStyle(this Label label)
    {
        label.ForeColor = FiplexTheme.StateSuccess;
        label.Font = FiplexTheme.FontBold;
    }

    /// <summary>
    /// Applies error state style.
    /// </summary>
    /// <param name="label">The Label to style.</param>
    public static void ApplyErrorStyle(this Label label)
    {
        label.ForeColor = FiplexTheme.StateError;
        label.Font = FiplexTheme.FontBold;
    }

    /// <summary>
    /// Applies warning state style.
    /// </summary>
    /// <param name="label">The Label to style.</param>
    public static void ApplyWarningStyle(this Label label)
    {
        label.ForeColor = FiplexTheme.StateWarning;
        label.Font = FiplexTheme.FontBold;
    }
}
