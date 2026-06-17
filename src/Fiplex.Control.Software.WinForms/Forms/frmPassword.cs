using System.ComponentModel;

namespace Fiplex.Control.Software.WinForms.Forms;

public partial class frmPassword : Form
{
    private bool _isEditMode;
    private System.Windows.Forms.Timer? _errorTimer;
    private LinkLabel? _lnkForgotPassword;

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

    /// <summary>
    /// Password level of the connected device (0=none, 1=standard, 2=SDRP reset).
    /// Set before ShowDialog. When >= 2, shows the "Forgot Password" link (VB6 1.12 parity).
    /// </summary>
    [DesignerSerializationVisibility(DesignerSerializationVisibility.Hidden)]
    public int PassLevel { get; set; }

    /// <summary>True when the user clicked the "Forgot Password" link (not a normal Cancel).</summary>
    [DesignerSerializationVisibility(DesignerSerializationVisibility.Hidden)]
    public bool ForgotPasswordClicked { get; private set; }

    public frmPassword()
    {
        InitializeComponent();
        AddForgotPasswordLink();
        UpdateModeDisplay();
    }

    private void AddForgotPasswordLink()
    {
        _lnkForgotPassword = new LinkLabel
        {
            Name = "lnkForgotPassword",
            Text = "Forgot password / Reset password to default",
            Font = new Font("Segoe UI", 9F),
            TextAlign = ContentAlignment.MiddleCenter,
            Location = new Point(20, 82),
            Size = new Size(318, 18),
            Visible = false,
            Cursor = Cursors.Hand
        };
        _lnkForgotPassword.LinkClicked += LnkForgotPassword_LinkClicked;
        Controls.Add(_lnkForgotPassword);
    }

    private void LnkForgotPassword_LinkClicked(object? sender, LinkLabelLinkClickedEventArgs e)
    {
        ForgotPasswordClicked = true;
        DialogResult = DialogResult.Cancel;
        Close();
    }

    private void UpdateModeDisplay()
    {
        if (_isEditMode)
        {
            Text = "Change Device Password";
            lblPrompt.Text = "Enter new password:";
            txtPassword.MaxLength = 16;

            lblPasswordError.AutoSize = false;
            lblPasswordError.Location = new Point(20, 122);
            lblPasswordError.Size = new Size(318, 32);

            lblConfirm.Visible = true;
            txtConfirmPassword.Visible = true;
            lblPasswordError.Visible = false;
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

            // VB6 1.12 parity: show "Forgot Password" link when PassLevel >= NEW_PROC_DEF_PASS (2)
            var showForgotLink = _lnkForgotPassword != null && PassLevel >= 2;
            if (_lnkForgotPassword != null)
                _lnkForgotPassword.Visible = showForgotLink;

            if (showForgotLink)
            {
                lblPasswordError.AutoSize = true;
                lblPasswordError.Location = new Point(20, 108);
                lblPasswordError.Visible = false;
                btnOK.Top = 143;
                btnCancel.Top = 143;
                ClientSize = new Size(ClientSize.Width, 190);
            }
            else
            {
                lblPasswordError.AutoSize = true;
                lblPasswordError.Location = new Point(20, 76);
                lblPasswordError.Visible = false;
                btnOK.Top = 110;
                btnCancel.Top = 110;
                ClientSize = new Size(ClientSize.Width, 155);
            }
        }
    }

    public void ShowValidationError(string errorMessage)
    {
        if (lblPasswordError == null) return;

        StopErrorTimer();

        lblPasswordError.ForeColor = Color.FromArgb(196, 32, 32);
        lblPasswordError.Text = errorMessage;
        lblPasswordError.Visible = true;

        if (!_isEditMode)
        {
            // VB 1.9 parity: "Wrong password" auto-dismisses after a short period.
            _errorTimer = new System.Windows.Forms.Timer { Interval = 4000 };
            _errorTimer.Tick += (s, e) =>
            {
                lblPasswordError.Visible = false;
                StopErrorTimer();
            };
            _errorTimer.Start();
        }
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
                lblPasswordError.Visible = true;
                lblPasswordError.ForeColor = SystemColors.GrayText;
                lblPasswordError.Text = "Sending...";

                string? error = await ChangePasswordCommand(txtPassword.Text);

                if (error == null)
                {
                    lblPasswordError.Visible = true;
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
            // Set DialogResult.None before the await to prevent WinForms from closing
            // the form via AcceptButton mechanics while the serial call is in flight.
            DialogResult = DialogResult.None;
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
