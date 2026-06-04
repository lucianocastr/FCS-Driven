using System.ComponentModel;
using Fiplex.Control.Software.WinForms.Models;

namespace Fiplex.Control.Software.WinForms.Forms;

/// <summary>
/// Password reset dialog for SDRP devices (PassLevel = 2).
/// Implements the challenge-response reset protocol from VB6 1.12 frmResetPass.frm.
///
/// Flow (VB6 1.12 parity):
///   1. On load: RequestResetKeyCommand → device returns encrypted key.
///   2. User copies key, decrypts externally, pastes decrypted value into txtDecryptedPassword.
///   3. Accept: ExecutePasswordResetCommand(decryptedPassword) → device responds ACK or error.
/// </summary>
public partial class frmResetPass : Form
{
    private readonly CancellationTokenSource _cts = new();
    private ResetKeyStatus _currentStatus = new();
    private DateTime _lastRefresh = DateTime.Now;

    [DesignerSerializationVisibility(DesignerSerializationVisibility.Hidden)]
    public Func<CancellationToken, Task<ResetKeyStatus>>? RequestResetKeyCommand { get; set; }

    [DesignerSerializationVisibility(DesignerSerializationVisibility.Hidden)]
    public Func<string, CancellationToken, Task<ResetKeyStatus>>? ExecutePasswordResetCommand { get; set; }

    public frmResetPass()
    {
        InitializeComponent();
    }

    protected override void OnLoad(EventArgs e)
    {
        base.OnLoad(e);
        txtEncryptedKey.Text = "Loading...";
        // Fire-and-forget: runs on UI thread via async state machine
        _ = LoadAndInitializeAsync();
    }

    private async Task LoadAndInitializeAsync()
    {
        if (RequestResetKeyCommand == null)
        {
            MessageBox.Show("Device is not responding.", Text, MessageBoxButtons.OK, MessageBoxIcon.Warning);
            Close();
            return;
        }

        try
        {
            var status = await RequestResetKeyCommand(_cts.Token);

            if (IsDisposed) return;

            // VB6 1.12 Form_Activate: if not validData or throttling → show error and close
            if (!status.ValidData || status.ThrottlingPassRequest)
            {
                var msg = status.ThrottlingPassRequest
                    ? "Waiting 30 seconds. Try again."
                    : "Device is not responding.";
                MessageBox.Show(msg, Text, MessageBoxButtons.OK, MessageBoxIcon.Warning);
                Close();
                return;
            }

            _currentStatus = status;
            txtEncryptedKey.Text = string.IsNullOrWhiteSpace(status.Key)
                ? "XXXX-XXXX-XXXX-XXXX-XXXX"
                : status.Key;
            UpdateCounters();
            _lastRefresh = DateTime.Now;
            tmrUI.Start();
        }
        catch (OperationCanceledException) { }
        catch
        {
            if (!IsDisposed)
            {
                MessageBox.Show("Device is not responding.", Text, MessageBoxButtons.OK, MessageBoxIcon.Warning);
                Close();
            }
        }
    }

    private void UpdateCounters()
    {
        lblRemainingTime.Text = SecondsToTimeString(_currentStatus.RemainingSeconds);
        lblRemainingAttempts.Text = _currentStatus.RemainingAttempts.ToString();
    }

    private static string SecondsToTimeString(long seconds)
    {
        var totalMinutes = seconds / 60;
        var hours = totalMinutes / 60;
        var minutes = totalMinutes % 60;
        return $"{hours}:{minutes:D2}";
    }

    private async void BtnAccept_Click(object sender, EventArgs e)
    {
        if (ExecutePasswordResetCommand == null) return;

        var decrypted = txtDecryptedPassword.Text;
        txtDecryptedPassword.Text = string.Empty;
        btnAccept.Enabled = false;
        lblStatus.Visible = false;
        tmrThrottle.Stop();

        try
        {
            var result = await ExecutePasswordResetCommand(decrypted, _cts.Token);
            if (IsDisposed) return;
            _lastRefresh = DateTime.Now;

            if (result.AckReceived)
            {
                // VB6 1.12: success → green message, Sleep 5000, Unload
                lblStatus.ForeColor = Color.FromArgb(0, 140, 60);
                lblStatus.Text = "USB password was successfully reset to default. " +
                                 "Please connect, enter the default USB password and then change it.";
                lblStatus.Visible = true;
                await Task.Delay(5000, _cts.Token);
                if (!IsDisposed) { DialogResult = DialogResult.OK; Close(); }
                return;
            }

            // Preserve current key on error response (updateKey=False in VB6)
            if (result.ValidData)
                _currentStatus = result with { Key = _currentStatus.Key };

            UpdateCounters();

            string errorMsg;
            int throttleMs = 0;

            if (result.PassNotMatch)
            {
                errorMsg = "Wrong password";
                throttleMs = result.ThrottlingSeconds <= 3 ? 3000 : 30000;
                errorMsg += throttleMs == 3000 ? ". Wait 3 seconds." : ". Wait 30 seconds.";
            }
            else if (result.Throttling3Seconds)  { errorMsg = "Wait 3 seconds.";  throttleMs = 3000; }
            else if (result.Throttling30Seconds) { errorMsg = "Wait 30 seconds."; throttleMs = 30000; }
            else if (!result.ValidData)          { errorMsg = "Device is not responding."; }
            else                                 { errorMsg = "Unexpected error. Try again."; }

            // VB6 1.12: exhausted attempts → message, Sleep 5000, Unload
            if (result.PassNotMatchExhaustedAttempts || result.ExhaustedAttempts)
            {
                lblStatus.ForeColor = Color.FromArgb(196, 32, 32);
                lblStatus.Text = "No remaining attempts.";
                lblStatus.Visible = true;
                await Task.Delay(5000, _cts.Token);
                if (!IsDisposed) { DialogResult = DialogResult.Cancel; Close(); }
                return;
            }

            if (!result.ValidData)
            {
                MessageBox.Show(errorMsg, Text, MessageBoxButtons.OK, MessageBoxIcon.Warning);
                DialogResult = DialogResult.Cancel;
                Close();
                return;
            }

            lblStatus.ForeColor = Color.FromArgb(196, 32, 32);
            lblStatus.Text = errorMsg;
            lblStatus.Visible = true;

            if (throttleMs > 0)
            {
                tmrThrottle.Interval = throttleMs;
                tmrThrottle.Start();
            }
        }
        catch (OperationCanceledException) { }
    }

    private void BtnCancel_Click(object sender, EventArgs e)
    {
        DialogResult = DialogResult.Cancel;
        Close();
    }

    private void TxtDecryptedPassword_TextChanged(object? sender, EventArgs e)
    {
        // State managed by tmrUI
    }

    private void TxtDecryptedPassword_KeyPress(object? sender, KeyPressEventArgs e)
    {
        if (e.KeyChar == (char)Keys.Return && btnAccept.Enabled)
        {
            e.Handled = true;
            BtnAccept_Click(sender!, EventArgs.Empty);
        }
    }

    private async void TmrUI_Tick(object? sender, EventArgs e)
    {
        // VB6 1.12 tmrResetPass: enable Accept if text present and not throttling
        btnAccept.Enabled = txtDecryptedPassword.Text.Length > 0 && !tmrThrottle.Enabled;

        // VB6 1.12: refresh status every 40 seconds
        if ((DateTime.Now - _lastRefresh).TotalSeconds > 40)
        {
            tmrUI.Stop();
            try
            {
                if (RequestResetKeyCommand == null) { Close(); return; }

                var status = await RequestResetKeyCommand(_cts.Token);
                if (IsDisposed) return;

                if (!status.ValidData)
                {
                    MessageBox.Show("Device is not responding.", Text,
                        MessageBoxButtons.OK, MessageBoxIcon.Warning);
                    DialogResult = DialogResult.Cancel;
                    Close();
                    return;
                }

                // updateKey=False on refresh: keep existing key
                _currentStatus = status with { Key = _currentStatus.Key };
                UpdateCounters();
                _lastRefresh = DateTime.Now;
            }
            catch (OperationCanceledException) { return; }
            finally
            {
                if (!IsDisposed) tmrUI.Start();
            }
        }
    }

    private void TmrThrottle_Tick(object? sender, EventArgs e)
    {
        // VB6 1.12 tmrAns: hide error message after throttle period
        tmrThrottle.Stop();
        lblStatus.Visible = false;
    }

    private void LnkCopyKey_LinkClicked(object? sender, LinkLabelLinkClickedEventArgs e)
    {
        if (!string.IsNullOrEmpty(txtEncryptedKey.Text) && txtEncryptedKey.Text != "Loading...")
            Clipboard.SetText(txtEncryptedKey.Text);
    }

    private void LnkPasteKey_LinkClicked(object? sender, LinkLabelLinkClickedEventArgs e)
    {
        txtDecryptedPassword.Text = Clipboard.GetText();
    }
}
