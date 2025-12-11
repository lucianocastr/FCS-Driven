using Fiplex.Control.Software.WinForms.Core.Configuration;

namespace Fiplex.Control.Software.WinForms.Utilities.Extensions;

/// <summary>
/// Extensiones para aplicar estilos Fiplex a controles WinForms.
/// </summary>
/// <remarks>
/// Estas extensiones facilitan la aplicación consistente de la paleta corporativa
/// Fiplex by Honeywell a los controles de la interfaz de usuario.
/// </remarks>
public static class ControlStyleExtensions
{
    /// <summary>
    /// Aplica estilo de botón primario Fiplex.
    /// </summary>
    /// <param name="button">El botón a estilizar.</param>
    /// <remarks>
    /// Botón con fondo azul Fiplex (#00589B), texto blanco y efecto hover oscuro.
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
    /// Aplica estilo de botón secundario Fiplex.
    /// </summary>
    /// <param name="button">El botón a estilizar.</param>
    /// <remarks>
    /// Botón con fondo blanco, texto oscuro y borde suave gris.
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
    /// Aplica estilo de botón outline (primario con borde).
    /// </summary>
    /// <param name="button">El botón a estilizar.</param>
    /// <remarks>
    /// Botón con fondo blanco, texto azul Fiplex y borde azul.
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
    /// Aplica estilo de botón de peligro/error.
    /// </summary>
    /// <param name="button">El botón a estilizar.</param>
    /// <remarks>
    /// Botón con fondo rojo Fiplex (#E2231A), texto blanco.
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
    /// Aplica estilo de LinkLabel Fiplex.
    /// </summary>
    /// <param name="link">El LinkLabel a estilizar.</param>
    public static void ApplyFiplexStyle(this LinkLabel link)
    {
        link.LinkColor = FiplexTheme.TextLink;
        link.ActiveLinkColor = FiplexTheme.TextLinkHover;
        link.VisitedLinkColor = FiplexTheme.TextLink;
        link.LinkBehavior = LinkBehavior.HoverUnderline;
        link.Font = FiplexTheme.FontRegular;
    }

    /// <summary>
    /// Aplica configuración de formulario base Fiplex.
    /// </summary>
    /// <param name="form">El formulario a estilizar.</param>
    /// <param name="isDialog">True si es un diálogo modal.</param>
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
    /// Aplica estilo de GroupBox Fiplex.
    /// </summary>
    /// <param name="groupBox">El GroupBox a estilizar.</param>
    public static void ApplyFiplexStyle(this GroupBox groupBox)
    {
        groupBox.Font = FiplexTheme.FontBold;
        groupBox.ForeColor = FiplexTheme.TextPrimary;
    }

    /// <summary>
    /// Aplica estilo de Panel secundario Fiplex.
    /// </summary>
    /// <param name="panel">El Panel a estilizar.</param>
    public static void ApplyPanelStyle(this Panel panel)
    {
        panel.BackColor = FiplexTheme.BackgroundPanel;
    }

    /// <summary>
    /// Aplica estilo de Label primario Fiplex.
    /// </summary>
    /// <param name="label">El Label a estilizar.</param>
    /// <param name="isHeading">True si es un encabezado.</param>
    public static void ApplyFiplexStyle(this Label label, bool isHeading = false)
    {
        label.ForeColor = FiplexTheme.TextPrimary;
        label.Font = isHeading ? FiplexTheme.FontHeading : FiplexTheme.FontRegular;
    }

    /// <summary>
    /// Aplica estilo de Label secundario Fiplex.
    /// </summary>
    /// <param name="label">El Label a estilizar.</param>
    public static void ApplySecondaryStyle(this Label label)
    {
        label.ForeColor = FiplexTheme.TextSecondary;
        label.Font = FiplexTheme.FontRegular;
    }

    /// <summary>
    /// Aplica estilo de TextBox Fiplex.
    /// </summary>
    /// <param name="textBox">El TextBox a estilizar.</param>
    public static void ApplyFiplexStyle(this TextBox textBox)
    {
        textBox.BorderStyle = BorderStyle.FixedSingle;
        textBox.Font = FiplexTheme.FontRegular;
        textBox.ForeColor = FiplexTheme.TextPrimary;
    }

    /// <summary>
    /// Aplica estilo de CheckBox Fiplex.
    /// </summary>
    /// <param name="checkBox">El CheckBox a estilizar.</param>
    public static void ApplyFiplexStyle(this CheckBox checkBox)
    {
        checkBox.Font = FiplexTheme.FontRegular;
        checkBox.ForeColor = FiplexTheme.TextPrimary;
    }

    /// <summary>
    /// Aplica estilo de título principal Fiplex.
    /// </summary>
    /// <param name="label">El Label a estilizar como título.</param>
    public static void ApplyTitleStyle(this Label label)
    {
        label.Font = FiplexTheme.FontTitle;
        label.ForeColor = FiplexTheme.TextPrimary;
    }

    /// <summary>
    /// Aplica estilo de estado de éxito.
    /// </summary>
    /// <param name="label">El Label a estilizar.</param>
    public static void ApplySuccessStyle(this Label label)
    {
        label.ForeColor = FiplexTheme.StateSuccess;
        label.Font = FiplexTheme.FontBold;
    }

    /// <summary>
    /// Aplica estilo de estado de error.
    /// </summary>
    /// <param name="label">El Label a estilizar.</param>
    public static void ApplyErrorStyle(this Label label)
    {
        label.ForeColor = FiplexTheme.StateError;
        label.Font = FiplexTheme.FontBold;
    }

    /// <summary>
    /// Aplica estilo de estado de advertencia.
    /// </summary>
    /// <param name="label">El Label a estilizar.</param>
    public static void ApplyWarningStyle(this Label label)
    {
        label.ForeColor = FiplexTheme.StateWarning;
        label.Font = FiplexTheme.FontBold;
    }
}
