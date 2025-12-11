namespace Fiplex.Control.Software.WinForms.Forms
{
    partial class LicenseKeyDialog
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
            System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(LicenseKeyDialog));
            grpDeviceInfo = new GroupBox();
            tableLayoutPanel1 = new TableLayoutPanel();
            lblDevice = new Label();
            lblDeviceValue = new Label();
            lblType = new Label();
            lblTypeValue = new Label();
            lblVersion = new Label();
            lblVersionValue = new Label();
            grpLicenseInfo = new GroupBox();
            tableLayoutPanel2 = new TableLayoutPanel();
            lblStatus = new Label();
            lblStatusValue = new Label();
            lblExpiration = new Label();
            lblExpirationValue = new Label();
            grpLicenseKey = new GroupBox();
            txtLicenseKey = new TextBox();
            btnCopy = new Button();
            panelButtons = new Panel();
            btnApply = new Button();
            btnClose = new Button();
            grpDeviceInfo.SuspendLayout();
            tableLayoutPanel1.SuspendLayout();
            grpLicenseInfo.SuspendLayout();
            tableLayoutPanel2.SuspendLayout();
            grpLicenseKey.SuspendLayout();
            panelButtons.SuspendLayout();
            SuspendLayout();
            // 
            // grpDeviceInfo
            // 
            grpDeviceInfo.AccessibleDescription = "Device information group";
            grpDeviceInfo.AccessibleName = "Device Information Group";
            grpDeviceInfo.Controls.Add(tableLayoutPanel1);
            grpDeviceInfo.Dock = DockStyle.Top;
            grpDeviceInfo.Font = new Font("Segoe UI", 9F, FontStyle.Bold);
            grpDeviceInfo.ForeColor = Color.FromArgb(34, 34, 34);
            grpDeviceInfo.Location = new Point(16, 16);
            grpDeviceInfo.Name = "grpDeviceInfo";
            grpDeviceInfo.Padding = new Padding(10);
            grpDeviceInfo.Size = new Size(368, 100);
            grpDeviceInfo.TabIndex = 0;
            grpDeviceInfo.TabStop = false;
            grpDeviceInfo.Text = "Device Information";
            // 
            // tableLayoutPanel1
            // 
            tableLayoutPanel1.ColumnCount = 2;
            tableLayoutPanel1.ColumnStyles.Add(new ColumnStyle(SizeType.Absolute, 80F));
            tableLayoutPanel1.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100F));
            tableLayoutPanel1.Controls.Add(lblDevice, 0, 0);
            tableLayoutPanel1.Controls.Add(lblDeviceValue, 1, 0);
            tableLayoutPanel1.Controls.Add(lblType, 0, 1);
            tableLayoutPanel1.Controls.Add(lblTypeValue, 1, 1);
            tableLayoutPanel1.Controls.Add(lblVersion, 0, 2);
            tableLayoutPanel1.Controls.Add(lblVersionValue, 1, 2);
            tableLayoutPanel1.Dock = DockStyle.Fill;
            tableLayoutPanel1.Location = new Point(10, 26);
            tableLayoutPanel1.Name = "tableLayoutPanel1";
            tableLayoutPanel1.RowCount = 3;
            tableLayoutPanel1.RowStyles.Add(new RowStyle(SizeType.Percent, 33.33F));
            tableLayoutPanel1.RowStyles.Add(new RowStyle(SizeType.Percent, 33.33F));
            tableLayoutPanel1.RowStyles.Add(new RowStyle(SizeType.Percent, 33.34F));
            tableLayoutPanel1.Size = new Size(348, 64);
            tableLayoutPanel1.TabIndex = 0;
            // 
            // lblDevice
            // 
            lblDevice.AutoSize = true;
            lblDevice.Dock = DockStyle.Fill;
            lblDevice.Location = new Point(3, 0);
            lblDevice.Name = "lblDevice";
            lblDevice.Size = new Size(74, 21);
            lblDevice.TabIndex = 0;
            lblDevice.Text = "Device:";
            lblDevice.TextAlign = ContentAlignment.MiddleLeft;
            // 
            // lblDeviceValue
            // 
            lblDeviceValue.AutoSize = true;
            lblDeviceValue.Dock = DockStyle.Fill;
            lblDeviceValue.Font = new Font("Segoe UI", 9F, FontStyle.Bold);
            lblDeviceValue.Location = new Point(83, 0);
            lblDeviceValue.Name = "lblDeviceValue";
            lblDeviceValue.Size = new Size(262, 21);
            lblDeviceValue.TabIndex = 1;
            lblDeviceValue.Text = "-";
            lblDeviceValue.TextAlign = ContentAlignment.MiddleLeft;
            // 
            // lblType
            // 
            lblType.AutoSize = true;
            lblType.Dock = DockStyle.Fill;
            lblType.Location = new Point(3, 21);
            lblType.Name = "lblType";
            lblType.Size = new Size(74, 21);
            lblType.TabIndex = 2;
            lblType.Text = "Type:";
            lblType.TextAlign = ContentAlignment.MiddleLeft;
            // 
            // lblTypeValue
            // 
            lblTypeValue.AutoSize = true;
            lblTypeValue.Dock = DockStyle.Fill;
            lblTypeValue.Font = new Font("Segoe UI", 9F, FontStyle.Bold);
            lblTypeValue.Location = new Point(83, 21);
            lblTypeValue.Name = "lblTypeValue";
            lblTypeValue.Size = new Size(262, 21);
            lblTypeValue.TabIndex = 3;
            lblTypeValue.Text = "-";
            lblTypeValue.TextAlign = ContentAlignment.MiddleLeft;
            // 
            // lblVersion
            // 
            lblVersion.AutoSize = true;
            lblVersion.Dock = DockStyle.Fill;
            lblVersion.Location = new Point(3, 42);
            lblVersion.Name = "lblVersion";
            lblVersion.Size = new Size(74, 22);
            lblVersion.TabIndex = 4;
            lblVersion.Text = "Version:";
            lblVersion.TextAlign = ContentAlignment.MiddleLeft;
            // 
            // lblVersionValue
            // 
            lblVersionValue.AutoSize = true;
            lblVersionValue.Dock = DockStyle.Fill;
            lblVersionValue.Font = new Font("Segoe UI", 9F, FontStyle.Bold);
            lblVersionValue.Location = new Point(83, 42);
            lblVersionValue.Name = "lblVersionValue";
            lblVersionValue.Size = new Size(262, 22);
            lblVersionValue.TabIndex = 5;
            lblVersionValue.Text = "-";
            lblVersionValue.TextAlign = ContentAlignment.MiddleLeft;
            // 
            // grpLicenseInfo
            // 
            grpLicenseInfo.AccessibleDescription = "License status information group";
            grpLicenseInfo.AccessibleName = "License Status Group";
            grpLicenseInfo.Controls.Add(tableLayoutPanel2);
            grpLicenseInfo.Dock = DockStyle.Top;
            grpLicenseInfo.Font = new Font("Segoe UI", 9F, FontStyle.Bold);
            grpLicenseInfo.ForeColor = Color.FromArgb(34, 34, 34);
            grpLicenseInfo.Location = new Point(16, 116);
            grpLicenseInfo.Name = "grpLicenseInfo";
            grpLicenseInfo.Padding = new Padding(10);
            grpLicenseInfo.Size = new Size(368, 75);
            grpLicenseInfo.TabIndex = 1;
            grpLicenseInfo.TabStop = false;
            grpLicenseInfo.Text = "License Status";
            // 
            // tableLayoutPanel2
            // 
            tableLayoutPanel2.ColumnCount = 2;
            tableLayoutPanel2.ColumnStyles.Add(new ColumnStyle(SizeType.Absolute, 80F));
            tableLayoutPanel2.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100F));
            tableLayoutPanel2.Controls.Add(lblStatus, 0, 0);
            tableLayoutPanel2.Controls.Add(lblStatusValue, 1, 0);
            tableLayoutPanel2.Controls.Add(lblExpiration, 0, 1);
            tableLayoutPanel2.Controls.Add(lblExpirationValue, 1, 1);
            tableLayoutPanel2.Dock = DockStyle.Fill;
            tableLayoutPanel2.Location = new Point(10, 26);
            tableLayoutPanel2.Name = "tableLayoutPanel2";
            tableLayoutPanel2.RowCount = 2;
            tableLayoutPanel2.RowStyles.Add(new RowStyle(SizeType.Percent, 50F));
            tableLayoutPanel2.RowStyles.Add(new RowStyle(SizeType.Percent, 50F));
            tableLayoutPanel2.Size = new Size(348, 39);
            tableLayoutPanel2.TabIndex = 0;
            // 
            // lblStatus
            // 
            lblStatus.AutoSize = true;
            lblStatus.Dock = DockStyle.Fill;
            lblStatus.Location = new Point(3, 0);
            lblStatus.Name = "lblStatus";
            lblStatus.Size = new Size(74, 19);
            lblStatus.TabIndex = 0;
            lblStatus.Text = "Status:";
            lblStatus.TextAlign = ContentAlignment.MiddleLeft;
            // 
            // lblStatusValue
            // 
            lblStatusValue.AutoSize = true;
            lblStatusValue.Dock = DockStyle.Fill;
            lblStatusValue.Font = new Font("Segoe UI", 9F, FontStyle.Bold);
            lblStatusValue.ForeColor = Color.FromArgb(25, 135, 84);
            lblStatusValue.Location = new Point(83, 0);
            lblStatusValue.Name = "lblStatusValue";
            lblStatusValue.Size = new Size(262, 19);
            lblStatusValue.TabIndex = 1;
            lblStatusValue.Text = "-";
            lblStatusValue.TextAlign = ContentAlignment.MiddleLeft;
            // 
            // lblExpiration
            // 
            lblExpiration.AutoSize = true;
            lblExpiration.Dock = DockStyle.Fill;
            lblExpiration.Location = new Point(3, 19);
            lblExpiration.Name = "lblExpiration";
            lblExpiration.Size = new Size(74, 20);
            lblExpiration.TabIndex = 2;
            lblExpiration.Text = "Expires:";
            lblExpiration.TextAlign = ContentAlignment.MiddleLeft;
            // 
            // lblExpirationValue
            // 
            lblExpirationValue.AutoSize = true;
            lblExpirationValue.Dock = DockStyle.Fill;
            lblExpirationValue.Font = new Font("Segoe UI", 9F, FontStyle.Bold);
            lblExpirationValue.Location = new Point(83, 19);
            lblExpirationValue.Name = "lblExpirationValue";
            lblExpirationValue.Size = new Size(262, 20);
            lblExpirationValue.TabIndex = 3;
            lblExpirationValue.Text = "-";
            lblExpirationValue.TextAlign = ContentAlignment.MiddleLeft;
            // 
            // grpLicenseKey
            // 
            grpLicenseKey.AccessibleDescription = "License key input group";
            grpLicenseKey.AccessibleName = "License Key Group";
            grpLicenseKey.Controls.Add(txtLicenseKey);
            grpLicenseKey.Controls.Add(btnCopy);
            grpLicenseKey.Dock = DockStyle.Top;
            grpLicenseKey.Font = new Font("Segoe UI", 9F, FontStyle.Bold);
            grpLicenseKey.ForeColor = Color.FromArgb(34, 34, 34);
            grpLicenseKey.Location = new Point(16, 191);
            grpLicenseKey.Name = "grpLicenseKey";
            grpLicenseKey.Padding = new Padding(10);
            grpLicenseKey.Size = new Size(368, 70);
            grpLicenseKey.TabIndex = 2;
            grpLicenseKey.TabStop = false;
            grpLicenseKey.Text = "License Key";
            // 
            // txtLicenseKey
            // 
            txtLicenseKey.AccessibleDescription = "Enter or view the license key";
            txtLicenseKey.AccessibleName = "License Key Input";
            txtLicenseKey.Font = new Font("Consolas", 10F);
            txtLicenseKey.Location = new Point(10, 26);
            txtLicenseKey.Name = "txtLicenseKey";
            txtLicenseKey.Size = new Size(272, 23);
            txtLicenseKey.TabIndex = 0;
            // 
            // btnCopy
            // 
            btnCopy.AccessibleDescription = "Copy license key to clipboard";
            btnCopy.AccessibleName = "Copy Button";
            btnCopy.Anchor = AnchorStyles.Top | AnchorStyles.Right;
            btnCopy.BackColor = Color.FromArgb(255, 255, 255);
            btnCopy.Cursor = Cursors.Hand;
            btnCopy.FlatAppearance.BorderColor = Color.FromArgb(221, 221, 221);
            btnCopy.FlatAppearance.MouseOverBackColor = Color.FromArgb(245, 245, 245);
            btnCopy.FlatStyle = FlatStyle.Flat;
            btnCopy.Font = new Font("Segoe UI", 9F);
            btnCopy.ForeColor = Color.FromArgb(34, 34, 34);
            btnCopy.Location = new Point(288, 26);
            btnCopy.MinimumSize = new Size(70, 30);
            btnCopy.Name = "btnCopy";
            btnCopy.Size = new Size(70, 30);
            btnCopy.TabIndex = 1;
            btnCopy.Text = "Copy";
            btnCopy.UseVisualStyleBackColor = false;
            btnCopy.Click += btnCopy_Click;
            // 
            // panelButtons
            // 
            panelButtons.Controls.Add(btnApply);
            panelButtons.Controls.Add(btnClose);
            panelButtons.Dock = DockStyle.Bottom;
            panelButtons.Location = new Point(16, 259);
            panelButtons.Name = "panelButtons";
            panelButtons.Padding = new Padding(0, 10, 0, 0);
            panelButtons.Size = new Size(368, 45);
            panelButtons.TabIndex = 3;
            // 
            // btnApply
            // 
            btnApply.AccessibleDescription = "Apply the license key to the device";
            btnApply.AccessibleName = "Apply Button";
            btnApply.Anchor = AnchorStyles.Top | AnchorStyles.Right;
            btnApply.BackColor = Color.FromArgb(0, 88, 155);
            btnApply.Cursor = Cursors.Hand;
            btnApply.FlatAppearance.BorderSize = 0;
            btnApply.FlatAppearance.MouseDownBackColor = Color.FromArgb(0, 58, 112);
            btnApply.FlatAppearance.MouseOverBackColor = Color.FromArgb(0, 58, 112);
            btnApply.FlatStyle = FlatStyle.Flat;
            btnApply.Font = new Font("Segoe UI", 9F);
            btnApply.ForeColor = Color.White;
            btnApply.Location = new Point(183, 10);
            btnApply.MinimumSize = new Size(90, 30);
            btnApply.Name = "btnApply";
            btnApply.Size = new Size(90, 30);
            btnApply.TabIndex = 0;
            btnApply.Text = "&Apply";
            btnApply.UseVisualStyleBackColor = false;
            btnApply.Click += btnApply_Click;
            // 
            // btnClose
            // 
            btnClose.AccessibleDescription = "Close the license dialog";
            btnClose.AccessibleName = "Close Button";
            btnClose.Anchor = AnchorStyles.Top | AnchorStyles.Right;
            btnClose.BackColor = Color.FromArgb(255, 255, 255);
            btnClose.Cursor = Cursors.Hand;
            btnClose.DialogResult = DialogResult.Cancel;
            btnClose.FlatAppearance.BorderColor = Color.FromArgb(221, 221, 221);
            btnClose.FlatAppearance.MouseOverBackColor = Color.FromArgb(245, 245, 245);
            btnClose.FlatStyle = FlatStyle.Flat;
            btnClose.Font = new Font("Segoe UI", 9F);
            btnClose.ForeColor = Color.FromArgb(34, 34, 34);
            btnClose.Location = new Point(278, 10);
            btnClose.MinimumSize = new Size(90, 30);
            btnClose.Name = "btnClose";
            btnClose.Size = new Size(90, 30);
            btnClose.TabIndex = 1;
            btnClose.Text = "&Close";
            btnClose.UseVisualStyleBackColor = false;
            btnClose.Click += btnClose_Click;
            // 
            // LicenseKeyDialog
            // 
            AcceptButton = btnApply;
            AccessibleDescription = "Dialog for viewing and managing device license information";
            AccessibleName = "License Information Dialog";
            AutoScaleDimensions = new SizeF(96F, 96F);
            AutoScaleMode = AutoScaleMode.Dpi;
            BackColor = Color.White;
            CancelButton = btnClose;
            ClientSize = new Size(400, 320);
            Controls.Add(panelButtons);
            Controls.Add(grpLicenseKey);
            Controls.Add(grpLicenseInfo);
            Controls.Add(grpDeviceInfo);
            FormBorderStyle = FormBorderStyle.FixedDialog;
            Icon = (Icon)resources.GetObject("$this.Icon");
            MaximizeBox = false;
            MinimizeBox = false;
            Name = "LicenseKeyDialog";
            Padding = new Padding(16);
            ShowInTaskbar = false;
            StartPosition = FormStartPosition.CenterParent;
            Text = "License Information";
            grpDeviceInfo.ResumeLayout(false);
            tableLayoutPanel1.ResumeLayout(false);
            tableLayoutPanel1.PerformLayout();
            grpLicenseInfo.ResumeLayout(false);
            tableLayoutPanel2.ResumeLayout(false);
            tableLayoutPanel2.PerformLayout();
            grpLicenseKey.ResumeLayout(false);
            grpLicenseKey.PerformLayout();
            panelButtons.ResumeLayout(false);
            ResumeLayout(false);
        }

        #endregion

        private GroupBox grpDeviceInfo;
        private TableLayoutPanel tableLayoutPanel1;
        private Label lblDevice;
        private Label lblDeviceValue;
        private Label lblType;
        private Label lblTypeValue;
        private Label lblVersion;
        private Label lblVersionValue;
        private GroupBox grpLicenseInfo;
        private TableLayoutPanel tableLayoutPanel2;
        private Label lblStatus;
        private Label lblStatusValue;
        private Label lblExpiration;
        private Label lblExpirationValue;
        private GroupBox grpLicenseKey;
        private TextBox txtLicenseKey;
        private Button btnCopy;
        private Panel panelButtons;
        private Button btnApply;
        private Button btnClose;
    }
}
