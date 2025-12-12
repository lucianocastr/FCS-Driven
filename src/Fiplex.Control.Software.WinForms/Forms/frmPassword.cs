using System.ComponentModel;

namespace Fiplex.Control.Software.WinForms.Forms;

/// <summary>
/// Modal dialog for secure device password capture.
/// </summary>
/// <remarks>
/// Supports two modes of operation:
/// <list type="bullet">
///   <item><description>Capture mode: Standard device authentication</description></item>
///   <item><description>Edit mode: Password change (shows confirmation field)</description></item>
/// </list>
/// </remarks>
public partial class frmPassword : Form
{
    private bool _isEditMode;
    
    /// <summary>
    /// Gets or sets the password entered by the user.
    /// Allows pre-population of the field for improved UX.
    /// </summary>
    [DesignerSerializationVisibility(DesignerSerializationVisibility.Hidden)]
    public string Password 
    { 
        get => txtPassword.Text;
        set => txtPassword.Text = value ?? string.Empty;
    }

    /// <summary>
    /// Gets or sets the confirmation password in edit mode.
    /// </summary>
    [DesignerSerializationVisibility(DesignerSerializationVisibility.Hidden)]
    public string ConfirmPassword
    {
        get => txtConfirmPassword.Text;
        set => txtConfirmPassword.Text = value ?? string.Empty;
    }

    /// <summary>
    /// Indicates whether the user selected to remember the password.
    /// </summary>
    public bool RememberPassword => chkRemember.Checked;

    /// <summary>
    /// Indicates whether the dialog is in edit mode (password change).
    /// </summary>
    /// <remarks>
    /// In edit mode: Title and prompt change, chkRemember is hidden,
    /// confirmation field is shown.
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
    /// Controls Cancel button visibility.
    /// Visible by default. Hide to force password entry.
    /// </summary>
    [DesignerSerializationVisibility(DesignerSerializationVisibility.Hidden)]
    public bool ShowCancel
    {
        get => btnCancel.Visible;
        set => btnCancel.Visible = value;
    }

    /// <summary>
    /// Password form constructor.
    /// </summary>
    public frmPassword()
    {
        InitializeComponent();
    }

    /// <summary>
    /// Updates the display according to the mode (capture vs edit).
    /// </summary>
    private void UpdateModeDisplay()
    {
        if (_isEditMode)
        {
            // Edit mode: Change device password
            Text = "Change Device Password";
            lblPrompt.Text = "Enter new password:";
            chkRemember.Visible = false;
            
            // Show confirmation field and adjust height
            lblConfirm.Visible = true;
            txtConfirmPassword.Visible = true;
            lblPasswordError.Visible = true;
            lblPasswordError.Text = string.Empty;
            
            // Adjust button position for edit mode
            Height = 210;
            btnOK.Top = 135;
            btnCancel.Top = 135;
        }
        else
        {
            // Capture mode: Standard authentication
            Text = "Device Authentication";
            lblPrompt.Text = "Enter device password:";
            chkRemember.Visible = true;
            
            // Hide confirmation field
            lblConfirm.Visible = false;
            txtConfirmPassword.Visible = false;
            lblPasswordError.Visible = false;
            
            // Adjust height for authentication mode
            Height = 160;
            btnOK.Top = 85;
            btnCancel.Top = 85;
        }
    }

    /// <summary>
    /// Displays a validation error message.
    /// </summary>
    /// <param name="errorMessage">Error message to display.</param>
    public void ShowValidationError(string errorMessage)
    {
        if (_isEditMode && lblPasswordError != null)
        {
            lblPasswordError.Text = errorMessage;
            lblPasswordError.Visible = true;
        }
    }

    /// <summary>
    /// Clears error messages.
    /// </summary>
    public void ClearValidationError()
    {
        if (lblPasswordError != null)
        {
            lblPasswordError.Text = string.Empty;
        }
    }

    /// <summary>
    /// Handles OK button click with validation.
    /// </summary>
    /// <remarks>
    /// In edit mode validates that passwords match before closing.
    /// </remarks>
    private void btnOK_Click(object sender, EventArgs e)
    {
        ClearValidationError();
        
        // Validate that the password is not empty
        if (string.IsNullOrWhiteSpace(txtPassword.Text))
        {
            MessageBox.Show(
                _isEditMode 
                    ? "New password cannot be empty." 
                    : "Password cannot be empty.", 
                "Validation Error", 
                MessageBoxButtons.OK, 
                MessageBoxIcon.Warning);
            
            // Prevent dialog close
            DialogResult = DialogResult.None;
            txtPassword.Focus();
            return;
        }

        // Match validation in edit mode
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

        // Successful validation - allow close
        DialogResult = DialogResult.OK;
    }

    /// <summary>
    /// Handles Cancel button click.
    /// </summary>
    private void btnCancel_Click(object sender, EventArgs e)
    {
        DialogResult = DialogResult.Cancel;
    }
}
