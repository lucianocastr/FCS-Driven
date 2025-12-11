using System.ComponentModel;

namespace Fiplex.Control.Software.WinForms.Forms;

/// <summary>
/// Diálogo modal para captura segura de contraseña del dispositivo.
/// </summary>
/// <remarks>
/// Soporta dos modos de operación:
/// <list type="bullet">
///   <item><description>Modo captura: Autenticación estándar del dispositivo</description></item>
///   <item><description>Modo edición: Cambio de contraseña (muestra campo de confirmación)</description></item>
/// </list>
/// </remarks>
public partial class frmPassword : Form
{
    private bool _isEditMode;
    
    /// <summary>
    /// Obtiene o establece la contraseña ingresada por el usuario.
    /// Permite pre-población del campo para UX mejorada.
    /// </summary>
    [DesignerSerializationVisibility(DesignerSerializationVisibility.Hidden)]
    public string Password 
    { 
        get => txtPassword.Text;
        set => txtPassword.Text = value ?? string.Empty;
    }

    /// <summary>
    /// Obtiene o establece la contraseña de confirmación en modo edición.
    /// </summary>
    [DesignerSerializationVisibility(DesignerSerializationVisibility.Hidden)]
    public string ConfirmPassword
    {
        get => txtConfirmPassword.Text;
        set => txtConfirmPassword.Text = value ?? string.Empty;
    }

    /// <summary>
    /// Indica si el usuario seleccionó recordar la contraseña.
    /// </summary>
    public bool RememberPassword => chkRemember.Checked;

    /// <summary>
    /// Indica si el diálogo está en modo edición (cambio de contraseña).
    /// </summary>
    /// <remarks>
    /// En modo edición: Título y prompt cambian, chkRemember se oculta, 
    /// campo de confirmación se muestra.
    /// </remarks>
    [DesignerSerializationVisibility(DesignerSerializationVisibility.Hidden)]
    public bool IsEditMode
    {
        get => _isEditMode;
        set
        {
            _isEditMode = value;
            UpdateModeDisplay();
        }
    }

    /// <summary>
    /// Controla visibilidad del botón Cancelar.
    /// Por defecto visible. Ocultar para forzar ingreso de contraseña.
    /// </summary>
    [DesignerSerializationVisibility(DesignerSerializationVisibility.Hidden)]
    public bool ShowCancel
    {
        get => btnCancel.Visible;
        set => btnCancel.Visible = value;
    }

    /// <summary>
    /// Constructor del formulario de contraseña.
    /// </summary>
    public frmPassword()
    {
        InitializeComponent();
    }

    /// <summary>
    /// Actualiza la visualización según el modo (captura vs edición).
    /// </summary>
    private void UpdateModeDisplay()
    {
        if (_isEditMode)
        {
            // Modo edición: Cambiar contraseña del dispositivo
            Text = "Change Device Password";
            lblPrompt.Text = "Enter new password:";
            chkRemember.Visible = false;
            
            // Mostrar campo de confirmación y ajustar altura
            lblConfirm.Visible = true;
            txtConfirmPassword.Visible = true;
            lblPasswordError.Visible = true;
            lblPasswordError.Text = string.Empty;
            
            // Ajustar posición de botones para modo edición
            Height = 210;
            btnOK.Top = 135;
            btnCancel.Top = 135;
        }
        else
        {
            // Modo captura: Autenticación estándar
            Text = "Device Authentication";
            lblPrompt.Text = "Enter device password:";
            chkRemember.Visible = true;
            
            // Ocultar campo de confirmación
            lblConfirm.Visible = false;
            txtConfirmPassword.Visible = false;
            lblPasswordError.Visible = false;
            
            // Ajustar altura para modo autenticación
            Height = 160;
            btnOK.Top = 85;
            btnCancel.Top = 85;
        }
    }

    /// <summary>
    /// Muestra un mensaje de error de validación.
    /// </summary>
    /// <param name="errorMessage">Mensaje de error a mostrar.</param>
    public void ShowValidationError(string errorMessage)
    {
        if (_isEditMode && lblPasswordError != null)
        {
            lblPasswordError.Text = errorMessage;
            lblPasswordError.Visible = true;
        }
    }

    /// <summary>
    /// Limpia los mensajes de error.
    /// </summary>
    public void ClearValidationError()
    {
        if (lblPasswordError != null)
        {
            lblPasswordError.Text = string.Empty;
        }
    }

    /// <summary>
    /// Maneja el click del botón Aceptar con validación.
    /// </summary>
    /// <remarks>
    /// En modo edición valida que las contraseñas coincidan antes de cerrar.
    /// </remarks>
    private void btnOK_Click(object sender, EventArgs e)
    {
        ClearValidationError();
        
        // Validar que la contraseña no esté vacía
        if (string.IsNullOrWhiteSpace(txtPassword.Text))
        {
            MessageBox.Show(
                _isEditMode 
                    ? "New password cannot be empty." 
                    : "Password cannot be empty.", 
                "Validation Error", 
                MessageBoxButtons.OK, 
                MessageBoxIcon.Warning);
            
            // Prevenir cierre del diálogo
            DialogResult = DialogResult.None;
            txtPassword.Focus();
            return;
        }

        // Validación de coincidencia en modo edición
        if (_isEditMode)
        {
            if (string.IsNullOrWhiteSpace(txtConfirmPassword.Text))
            {
                ShowValidationError("Please confirm the new password.");
                DialogResult = DialogResult.None;
                txtConfirmPassword.Focus();
                return;
            }
            
            if (txtPassword.Text != txtConfirmPassword.Text)
            {
                ShowValidationError("Passwords are different");
                DialogResult = DialogResult.None;
                txtConfirmPassword.Focus();
                txtConfirmPassword.SelectAll();
                return;
            }
        }

        // Validación exitosa - permitir cierre
        DialogResult = DialogResult.OK;
    }

    /// <summary>
    /// Maneja el click del botón Cancelar.
    /// </summary>
    private void btnCancel_Click(object sender, EventArgs e)
    {
        DialogResult = DialogResult.Cancel;
    }
}
