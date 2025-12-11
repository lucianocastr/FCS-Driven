namespace Fiplex.Control.Software.WinForms.Forms
{
    partial class frmPassword
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(frmPassword));
            lblPrompt = new Label();
            txtPassword = new TextBox();
            lblConfirm = new Label();
            txtConfirmPassword = new TextBox();
            lblPasswordError = new Label();
            chkRemember = new CheckBox();
            btnOK = new Button();
            btnCancel = new Button();
            SuspendLayout();
            // 
            // lblPrompt
            // 
            lblPrompt.AccessibleDescription = "Prompt for password input";
            lblPrompt.AccessibleName = "Password Prompt";
            lblPrompt.AutoSize = true;
            lblPrompt.Font = new Font("Segoe UI", 9F);
            lblPrompt.ForeColor = Color.FromArgb(34, 34, 34);
            lblPrompt.Location = new Point(20, 20);
            lblPrompt.Name = "lblPrompt";
            lblPrompt.Size = new Size(127, 15);
            lblPrompt.TabIndex = 0;
            lblPrompt.Text = "Enter device password:";
            // 
            // txtPassword
            // 
            txtPassword.AccessibleDescription = "Enter the device password";
            txtPassword.AccessibleName = "Password Input";
            txtPassword.BackColor = SystemColors.Window;
            txtPassword.BorderStyle = BorderStyle.FixedSingle;
            txtPassword.Font = new Font("Segoe UI", 9F);
            txtPassword.Location = new Point(20, 45);
            txtPassword.MaxLength = 50;
            txtPassword.Name = "txtPassword";
            txtPassword.PasswordChar = '•';
            txtPassword.Size = new Size(318, 23);
            txtPassword.TabIndex = 1;
            // 
            // lblConfirm
            // 
            lblConfirm.AccessibleDescription = "Prompt for password confirmation";
            lblConfirm.AccessibleName = "Confirm Password Prompt";
            lblConfirm.AutoSize = true;
            lblConfirm.Font = new Font("Segoe UI", 9F);
            lblConfirm.ForeColor = Color.FromArgb(34, 34, 34);
            lblConfirm.Location = new Point(20, 75);
            lblConfirm.Name = "lblConfirm";
            lblConfirm.Size = new Size(104, 15);
            lblConfirm.TabIndex = 2;
            lblConfirm.Text = "Confirm password:";
            lblConfirm.Visible = false;
            // 
            // txtConfirmPassword
            // 
            txtConfirmPassword.AccessibleDescription = "Confirm the new password";
            txtConfirmPassword.AccessibleName = "Confirm Password Input";
            txtConfirmPassword.BackColor = SystemColors.Window;
            txtConfirmPassword.BorderStyle = BorderStyle.FixedSingle;
            txtConfirmPassword.Font = new Font("Segoe UI", 9F);
            txtConfirmPassword.Location = new Point(20, 95);
            txtConfirmPassword.MaxLength = 50;
            txtConfirmPassword.Name = "txtConfirmPassword";
            txtConfirmPassword.PasswordChar = '•';
            txtConfirmPassword.Size = new Size(318, 23);
            txtConfirmPassword.TabIndex = 3;
            txtConfirmPassword.Visible = false;
            // 
            // lblPasswordError
            // 
            lblPasswordError.AccessibleDescription = "Password validation error message";
            lblPasswordError.AccessibleName = "Password Error Label";
            lblPasswordError.AutoSize = true;
            lblPasswordError.Font = new Font("Segoe UI", 9F);
            lblPasswordError.ForeColor = Color.FromArgb(200, 0, 0);
            lblPasswordError.Location = new Point(20, 122);
            lblPasswordError.Name = "lblPasswordError";
            lblPasswordError.Size = new Size(0, 15);
            lblPasswordError.TabIndex = 7;
            lblPasswordError.Text = "";
            lblPasswordError.Visible = false;
            // 
            // chkRemember
            // 
            chkRemember.AccessibleDescription = "Option to save password for future use";
            chkRemember.AccessibleName = "Remember Password Checkbox";
            chkRemember.AutoSize = true;
            chkRemember.Font = new Font("Segoe UI", 9F);
            chkRemember.ForeColor = Color.FromArgb(34, 34, 34);
            chkRemember.Location = new Point(20, 80);
            chkRemember.Name = "chkRemember";
            chkRemember.Size = new Size(137, 19);
            chkRemember.TabIndex = 4;
            chkRemember.Text = "Remember password";
            chkRemember.UseVisualStyleBackColor = true;
            // 
            // btnOK
            // 
            btnOK.AccessibleDescription = "Accept the password and authenticate";
            btnOK.AccessibleName = "Accept Button";
            btnOK.BackColor = Color.FromArgb(0, 88, 155);
            btnOK.Cursor = Cursors.Hand;
            btnOK.FlatAppearance.BorderSize = 0;
            btnOK.FlatAppearance.MouseDownBackColor = Color.FromArgb(0, 58, 112);
            btnOK.FlatAppearance.MouseOverBackColor = Color.FromArgb(0, 58, 112);
            btnOK.FlatStyle = FlatStyle.Flat;
            btnOK.Font = new Font("Segoe UI", 9F);
            btnOK.ForeColor = Color.White;
            btnOK.Location = new Point(150, 110);
            btnOK.MinimumSize = new Size(90, 30);
            btnOK.Name = "btnOK";
            btnOK.Size = new Size(90, 30);
            btnOK.TabIndex = 5;
            btnOK.Text = "Accept";
            btnOK.UseVisualStyleBackColor = false;
            btnOK.Click += btnOK_Click;
            // 
            // btnCancel
            // 
            btnCancel.AccessibleDescription = "Cancel and close the dialog";
            btnCancel.AccessibleName = "Cancel Button";
            btnCancel.BackColor = Color.FromArgb(255, 255, 255);
            btnCancel.Cursor = Cursors.Hand;
            btnCancel.DialogResult = DialogResult.Cancel;
            btnCancel.FlatAppearance.BorderColor = Color.FromArgb(221, 221, 221);
            btnCancel.FlatAppearance.MouseOverBackColor = Color.FromArgb(245, 245, 245);
            btnCancel.FlatStyle = FlatStyle.Flat;
            btnCancel.Font = new Font("Segoe UI", 9F);
            btnCancel.ForeColor = Color.FromArgb(34, 34, 34);
            btnCancel.Location = new Point(248, 110);
            btnCancel.MinimumSize = new Size(90, 30);
            btnCancel.Name = "btnCancel";
            btnCancel.Size = new Size(90, 30);
            btnCancel.TabIndex = 6;
            btnCancel.Text = "Cancel";
            btnCancel.UseVisualStyleBackColor = false;
            btnCancel.Click += btnCancel_Click;
            // 
            // frmPassword
            // 
            AcceptButton = btnOK;
            AccessibleDescription = "Dialog for entering device authentication password";
            AccessibleName = "Password Dialog";
            AutoScaleDimensions = new SizeF(96F, 96F);
            AutoScaleMode = AutoScaleMode.Dpi;
            BackColor = Color.FromArgb(255, 255, 255);
            CancelButton = btnCancel;
            ClientSize = new Size(358, 160);
            Controls.Add(lblPasswordError);
            Controls.Add(btnCancel);
            Controls.Add(btnOK);
            Controls.Add(chkRemember);
            Controls.Add(txtConfirmPassword);
            Controls.Add(lblConfirm);
            Controls.Add(txtPassword);
            Controls.Add(lblPrompt);
            FormBorderStyle = FormBorderStyle.FixedDialog;
            Icon = (Icon)resources.GetObject("$this.Icon");
            MaximizeBox = false;
            MinimizeBox = false;
            Name = "frmPassword";
            Padding = new Padding(16);
            ShowInTaskbar = false;
            StartPosition = FormStartPosition.CenterParent;
            Text = "Device Authentication";
            ResumeLayout(false);
            PerformLayout();
        }

        #endregion

        private System.Windows.Forms.Label lblPrompt;
        private System.Windows.Forms.TextBox txtPassword;
        private System.Windows.Forms.Label lblConfirm;
        private System.Windows.Forms.TextBox txtConfirmPassword;
        private System.Windows.Forms.Label lblPasswordError;
        private System.Windows.Forms.CheckBox chkRemember;
        private System.Windows.Forms.Button btnOK;
        private System.Windows.Forms.Button btnCancel;
    }
}
