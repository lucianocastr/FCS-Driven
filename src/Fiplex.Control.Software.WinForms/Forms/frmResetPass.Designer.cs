namespace Fiplex.Control.Software.WinForms.Forms
{
    partial class frmResetPass
    {
        private System.ComponentModel.IContainer components = null;

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                components?.Dispose();
                _cts?.Cancel();
                _cts?.Dispose();
            }
            base.Dispose(disposing);
        }

        private void InitializeComponent()
        {
            components = new System.ComponentModel.Container();
            lblEncryptedLabel = new Label();
            txtEncryptedKey = new TextBox();
            lnkCopyKey = new LinkLabel();
            lblDecryptedLabel = new Label();
            txtDecryptedPassword = new TextBox();
            lnkPasteKey = new LinkLabel();
            lblTimeLabel = new Label();
            lblRemainingTime = new Label();
            lblAttemptsLabel = new Label();
            lblRemainingAttempts = new Label();
            lblStatus = new Label();
            btnAccept = new Button();
            btnCancel = new Button();
            tmrUI = new System.Windows.Forms.Timer(components);
            tmrThrottle = new System.Windows.Forms.Timer(components);
            SuspendLayout();

            // lblEncryptedLabel
            lblEncryptedLabel.AutoSize = true;
            lblEncryptedLabel.Font = new Font("Segoe UI", 9F);
            lblEncryptedLabel.Location = new Point(16, 16);
            lblEncryptedLabel.Text = "Encrypted password:";

            // txtEncryptedKey
            txtEncryptedKey.BackColor = SystemColors.Control;
            txtEncryptedKey.BorderStyle = BorderStyle.FixedSingle;
            txtEncryptedKey.Font = new Font("Segoe UI", 9F);
            txtEncryptedKey.Location = new Point(16, 36);
            txtEncryptedKey.ReadOnly = true;
            txtEncryptedKey.Size = new Size(370, 23);
            txtEncryptedKey.TabStop = false;
            txtEncryptedKey.Text = "XXXX-XXXX-XXXX-XXXX-XXXX";

            // lnkCopyKey
            lnkCopyKey.AutoSize = true;
            lnkCopyKey.Font = new Font("Segoe UI", 9F);
            lnkCopyKey.Location = new Point(394, 38);
            lnkCopyKey.Text = "Copy";
            lnkCopyKey.Cursor = Cursors.Hand;
            lnkCopyKey.LinkClicked += LnkCopyKey_LinkClicked;

            // lblDecryptedLabel
            lblDecryptedLabel.AutoSize = true;
            lblDecryptedLabel.Font = new Font("Segoe UI", 9F);
            lblDecryptedLabel.Location = new Point(16, 72);
            lblDecryptedLabel.Text = "Enter decrypted password:";

            // txtDecryptedPassword
            txtDecryptedPassword.BorderStyle = BorderStyle.FixedSingle;
            txtDecryptedPassword.Font = new Font("Segoe UI", 9F);
            txtDecryptedPassword.Location = new Point(16, 92);
            txtDecryptedPassword.Size = new Size(370, 23);
            txtDecryptedPassword.TextChanged += TxtDecryptedPassword_TextChanged;
            txtDecryptedPassword.KeyPress += TxtDecryptedPassword_KeyPress;

            // lnkPasteKey
            lnkPasteKey.AutoSize = true;
            lnkPasteKey.Font = new Font("Segoe UI", 9F);
            lnkPasteKey.Location = new Point(394, 94);
            lnkPasteKey.Text = "Paste";
            lnkPasteKey.Cursor = Cursors.Hand;
            lnkPasteKey.LinkClicked += LnkPasteKey_LinkClicked;

            // lblTimeLabel
            lblTimeLabel.AutoSize = true;
            lblTimeLabel.Font = new Font("Segoe UI", 9F);
            lblTimeLabel.Location = new Point(16, 132);
            lblTimeLabel.Text = "Remaining time:";

            // lblRemainingTime
            lblRemainingTime.AutoSize = true;
            lblRemainingTime.Font = new Font("Segoe UI", 9F, FontStyle.Bold);
            lblRemainingTime.Location = new Point(160, 132);
            lblRemainingTime.Text = "—";

            // lblAttemptsLabel
            lblAttemptsLabel.AutoSize = true;
            lblAttemptsLabel.Font = new Font("Segoe UI", 9F);
            lblAttemptsLabel.Location = new Point(16, 156);
            lblAttemptsLabel.Text = "Remaining attempts:";

            // lblRemainingAttempts
            lblRemainingAttempts.AutoSize = true;
            lblRemainingAttempts.Font = new Font("Segoe UI", 9F, FontStyle.Bold);
            lblRemainingAttempts.Location = new Point(160, 156);
            lblRemainingAttempts.Text = "—";

            // lblStatus
            lblStatus.AutoSize = false;
            lblStatus.Font = new Font("Segoe UI", 9F);
            lblStatus.ForeColor = Color.FromArgb(196, 32, 32);
            lblStatus.Location = new Point(16, 184);
            lblStatus.Size = new Size(420, 32);
            lblStatus.TextAlign = ContentAlignment.MiddleLeft;
            lblStatus.Visible = false;

            // btnAccept
            btnAccept.BackColor = Color.FromArgb(0, 88, 155);
            btnAccept.Cursor = Cursors.Hand;
            btnAccept.Enabled = false;
            btnAccept.FlatAppearance.BorderSize = 0;
            btnAccept.FlatStyle = FlatStyle.Flat;
            btnAccept.Font = new Font("Segoe UI", 9F);
            btnAccept.ForeColor = Color.White;
            btnAccept.Location = new Point(244, 226);
            btnAccept.Size = new Size(90, 30);
            btnAccept.Text = "Accept";
            btnAccept.Click += BtnAccept_Click;

            // btnCancel
            btnCancel.BackColor = Color.White;
            btnCancel.Cursor = Cursors.Hand;
            btnCancel.FlatAppearance.BorderColor = Color.FromArgb(221, 221, 221);
            btnCancel.FlatStyle = FlatStyle.Flat;
            btnCancel.Font = new Font("Segoe UI", 9F);
            btnCancel.ForeColor = Color.FromArgb(34, 34, 34);
            btnCancel.Location = new Point(344, 226);
            btnCancel.Size = new Size(90, 30);
            btnCancel.Text = "Cancel";
            btnCancel.Click += BtnCancel_Click;

            // tmrUI — 100ms loop: enables Accept button, triggers 40s refresh
            tmrUI.Interval = 100;
            tmrUI.Tick += TmrUI_Tick;

            // tmrThrottle — disabled; activated for 3s or 30s to hide error messages
            tmrThrottle.Enabled = false;
            tmrThrottle.Tick += TmrThrottle_Tick;

            // frmResetPass
            AutoScaleDimensions = new SizeF(96F, 96F);
            AutoScaleMode = AutoScaleMode.Dpi;
            BackColor = Color.White;
            ClientSize = new Size(452, 272);
            Controls.Add(lblEncryptedLabel);
            Controls.Add(txtEncryptedKey);
            Controls.Add(lnkCopyKey);
            Controls.Add(lblDecryptedLabel);
            Controls.Add(txtDecryptedPassword);
            Controls.Add(lnkPasteKey);
            Controls.Add(lblTimeLabel);
            Controls.Add(lblRemainingTime);
            Controls.Add(lblAttemptsLabel);
            Controls.Add(lblRemainingAttempts);
            Controls.Add(lblStatus);
            Controls.Add(btnAccept);
            Controls.Add(btnCancel);
            FormBorderStyle = FormBorderStyle.FixedDialog;
            MaximizeBox = false;
            MinimizeBox = false;
            Name = "frmResetPass";
            Padding = new Padding(16);
            ShowInTaskbar = false;
            StartPosition = FormStartPosition.CenterParent;
            Text = "Reset Password";
            ResumeLayout(false);
            PerformLayout();
        }

        private Label lblEncryptedLabel;
        private TextBox txtEncryptedKey;
        private LinkLabel lnkCopyKey;
        private Label lblDecryptedLabel;
        private TextBox txtDecryptedPassword;
        private LinkLabel lnkPasteKey;
        private Label lblTimeLabel;
        private Label lblRemainingTime;
        private Label lblAttemptsLabel;
        private Label lblRemainingAttempts;
        private Label lblStatus;
        private Button btnAccept;
        private Button btnCancel;
        private System.Windows.Forms.Timer tmrUI;
        private System.Windows.Forms.Timer tmrThrottle;
    }
}
