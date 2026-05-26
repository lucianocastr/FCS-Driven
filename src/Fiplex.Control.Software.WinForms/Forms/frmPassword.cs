using System.ComponentModel;

namespace Fiplex.Control.Software.WinForms.Forms;

public partial class frmPassword : Form
{
    private bool _isEditMode;
    private System.Windows.Forms.Timer? _errorTimer;

    [DesignerSerializationVisibility(DesignerSerializationVisibility.Hidden)]
    public Func<string, Task<string?>>? ChangePasswordCommand { get; set; }

    [DesignerSerializationVisibility(DesignerSerializationVisibility.Hidden)]
    public Func<string, Task<string?>>? AuthenticateCommand { get; set; }

    [DesignerSerializationVisibility(DesignerSerializationVisibility.Hidden)]
    public string Password
    {
        get => txtPassword.Text;
        set => txtPassword.Text = value ?? string.Empty;
    }

    [DesignerSerializationVisibility(DesignerSerializationVisibility.Hidden)]
    public string ConfirmPassword
    {
        get => txtConfirmPassword.Text;
        set => txtConfirmPassword.Text = value ?? string.Empty;
    }

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

    [DesignerSerializationVisibility(DesignerSerializationVisibility.Hidden)]
    public bool ShowCancel
    {
        get => btnCancel.Visible;
        set => btnCancel.Visible = value;
    }

    public frmPassword()
    {
        InitializeComponent();
        UpdateModeDisplay();
    }

    private void UpdateModeDisplay()
    {
        if (_isEditMode)
        {
            Text = "Change Device Password";
            lblPrompt.Text = "Enter new password:";
            txtPassword.MaxLength = 16;

            lblPasswordError.AutoSize = false;
            lblPasswordError.Size = new Size(318, 32);

            lblConfirm.Visible = true;
            txtConfirmPassword.Visible = true;
            lblPasswordError.Visible = true;
            lblPasswordError.Text = string.Empty;

            btnOK.Top = 162;
            btnCancel.Top = 162;
            ClientSize = new Size(ClientSize.Width, 200);
        }
        else
        {
            Text = "Device Authentication";
            lblPrompt.Text = "Enter device password:";
            txtPassword.MaxLength = 50;

            lblConfirm.Visible = false;
            txtConfirmPassword.Visible = false;

            lblPasswordError.AutoSize = true;
            lblPasswordError.Location = new Point(20, 76);
            lblPasswordError.Visible = false;

            btnOK.Top = 110;
            btnCancel.Top = 110;
            ClientSize = new Size(ClientSize.Width, 155);
        }
    }

    public void ShowValidationError(string errorMessage)
    {
        if (lblPasswordError == null) return;

        StopErrorTimer();

        lblPasswordError.ForeColor = Color.FromArgb(196, 32, 32);
        lblPasswordError.Text = errorMessage;
        lblPasswordError.Visible = true;
        // VB 1.9 parity: error persists until user succeeds or cancels — no auto-dismiss timer.
    }

    public void ClearValidationError()
    {
        StopErrorTimer();
        if (lblPasswordError != null)
        {
            lblPasswordError.Text = string.Empty;
            lblPasswordError.Visible = false;
        }
    }

    private void StopErrorTimer()
    {
        _errorTimer?.Stop();
        _errorTimer?.Dispose();
        _errorTimer = null;
    }

    private void SetControlsEnabled(bool enabled)
    {
        txtPassword.Enabled = enabled;
        txtConfirmPassword.Enabled = enabled;
        btnOK.Enabled = enabled;
        btnCancel.Enabled = enabled;
    }

    private async void btnOK_Click(object sender, EventArgs e)
    {
        ClearValidationError();

        // VB 1.9 parity (auth mode): any input — including empty string or spaces — is sent
        // directly to the device. The device responds "Wrong password" and the error persists.
        // Client-side empty validation only applies to Change Password (edit mode).
        if (_isEditMode && string.IsNullOrEmpty(txtPassword.Text))
        {
            MessageBox.Show("New password cannot be empty.", "Validation Error",
                MessageBoxButtons.OK, MessageBoxIcon.Warning);
            DialogResult = DialogResult.None;
            txtPassword.Focus();
            return;
        }

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
                ShowValidationError("Passwords do not match.");
                DialogResult = DialogResult.None;
                txtConfirmPassword.Focus();
                txtConfirmPassword.SelectAll();
                return;
            }

            if (ChangePasswordCommand != null)
            {
                SetControlsEnabled(false);
                lblPasswordError.ForeColor = SystemColors.GrayText;
                lblPasswordError.Text = "Sending...";

                string? error = await ChangePasswordCommand(txtPassword.Text);

                if (error == null)
                {
                    lblPasswordError.ForeColor = Color.FromArgb(0, 140, 60);
                    lblPasswordError.Text = "Password changed successfully.";
                    await Task.Delay(1500);
                    DialogResult = DialogResult.OK;
                    Close();
                }
                else
                {
                    SetControlsEnabled(true);
                    ShowValidationError(error);
                    DialogResult = DialogResult.None;
                    txtPassword.Focus();
                }
                return;
            }
        }

        if (AuthenticateCommand != null)
        {
            SetControlsEnabled(false);
            lblPasswordError.ForeColor = SystemColors.GrayText;
            lblPasswordError.Text = "Verifying...";
            lblPasswordError.Visible = true;

            string? error = await AuthenticateCommand(txtPassword.Text);

            if (error == null)
            {
                DialogResult = DialogResult.OK;
                Close();
            }
            else
            {
                SetControlsEnabled(true);
                ShowValidationError(error);
                DialogResult = DialogResult.None;
                txtPassword.SelectAll();
                txtPassword.Focus();
            }
            return;
        }

        DialogResult = DialogResult.OK;
    }

    private void btnCancel_Click(object sender, EventArgs e)
    {
        DialogResult = DialogResult.Cancel;
    }

    protected override void OnFormClosing(FormClosingEventArgs e)
    {
        StopErrorTimer();
        base.OnFormClosing(e);
    }
}
