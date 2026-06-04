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

    // Delegate set by caller in edit mode. Sends password to device.
    // Returns null on success, error message string on failure (VB 1.9 parity).
    [DesignerSerializationVisibility(DesignerSerializationVisibility.Hidden)]
    public Func<string, Task<string?>>? ChangePasswordCommand { get; set; }

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
            txtPassword.MaxLength = 16;  // device hard limit

            // Label must not overflow dialog width
            lblPasswordError.AutoSize = false;
            lblPasswordError.Size = new Size(318, 32);

            // Show confirmation field and adjust height
            lblConfirm.Visible = true;
            txtConfirmPassword.Visible = true;
            lblPasswordError.Visible = true;
            lblPasswordError.Text = string.Empty;

            // Adjust button position for edit mode
            Height = 235;
            btnOK.Top = 162;
            btnCancel.Top = 162;
        }
        else
        {
            // Capture mode: Standard authentication
            Text = "Device Authentication";
            lblPrompt.Text = "Enter device password:";
            txtPassword.MaxLength = 50;

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
    /// Displays a validation error message in red.
    /// </summary>
    public void ShowValidationError(string errorMessage)
    {
        if (_isEditMode && lblPasswordError != null)
        {
            lblPasswordError.ForeColor = Color.Red;
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

    private void SetControlsEnabled(bool enabled)
    {
        txtPassword.Enabled = enabled;
        txtConfirmPassword.Enabled = enabled;
        btnOK.Enabled = enabled;
        btnCancel.Enabled = enabled;
    }

    /// <summary>
    /// Handles OK button click with validation.
    /// </summary>
    /// <remarks>
    /// In edit mode validates that passwords match, then delegates to device
    /// via ChangePasswordCommand (VB 1.9 parity: dialog stays open, errors inline).
    /// </remarks>
    private async void btnOK_Click(object sender, EventArgs e)
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

            DialogResult = DialogResult.None;
            txtPassword.Focus();
            return;
        }

        if (_isEditMode)
        {
            // Client-side: only check passwords match (VB 1.9 — device validates complexity)
            if (string.IsNullOrWhiteSpace(txtConfirmPassword.Text))
            {
                ShowValidationError("Please confirm the new password.");
                DialogResult = DialogResult.None;
                txtConfirmPassword.Focus();
                return;
            }

            if (txtPassword.Text != txtConfirmPassword.Text)
            {
                ShowValidationError("Passwords do not match.");
                DialogResult = DialogResult.None;
                txtConfirmPassword.Focus();
                txtConfirmPassword.SelectAll();
                return;
            }

            // Send to device; dialog stays open while awaiting (VB 1.9 parity)
            if (ChangePasswordCommand != null)
            {
                SetControlsEnabled(false);
                lblPasswordError.ForeColor = SystemColors.GrayText;
                lblPasswordError.Text = "Sending...";

                string? error = await ChangePasswordCommand(txtPassword.Text);

                if (error == null)
                {
                    // Success: green feedback for 1.5s, then close (VB 1.9 parity)
                    lblPasswordError.ForeColor = Color.Green;
                    lblPasswordError.Text = "Password changed successfully.";
                    await Task.Delay(1500);
                    DialogResult = DialogResult.OK;
                    Close();
                }
                else
                {
                    // Device rejected — show inline, stay open (VB 1.9 parity)
                    SetControlsEnabled(true);
                    ShowValidationError(error);
                    DialogResult = DialogResult.None;
                    txtPassword.Focus();
                }
                return;
            }
        }

        // Capture mode or no delegate — standard close
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
