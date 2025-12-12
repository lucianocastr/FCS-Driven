namespace Fiplex.Control.Software.WinForms.Forms
{
    partial class Login
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        // Note: The Dispose method is implemented in Login.cs
        // to handle CancellationTokenSource disposal

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            components = new System.ComponentModel.Container();
            System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(Login));
            toolTip = new ToolTip(components);
            picLogo = new PictureBox();
            linkLabelRequestAccess = new LinkLabel();
            LinkLabelTermsConditions = new LinkLabel();
            BtnLogin = new Button();
            tableLayoutPanelContent = new TableLayoutPanel();
            tableLayoutPanelHead = new TableLayoutPanel();
            panelLogo = new Panel();
            panelHeader = new Panel();
            lblWelcome = new Label();
            panelContent = new Panel();
            progLoginInProcess = new ProgressBar();
            label2 = new Label();
            LblContactAdmin = new Label();
            LblDontHaveCredentials = new Label();
            Label3 = new Label();
            ((System.ComponentModel.ISupportInitialize)picLogo).BeginInit();
            tableLayoutPanelContent.SuspendLayout();
            tableLayoutPanelHead.SuspendLayout();
            panelLogo.SuspendLayout();
            panelHeader.SuspendLayout();
            panelContent.SuspendLayout();
            SuspendLayout();
            // 
            // picLogo
            // 
            picLogo.AccessibleDescription = "Fiplex logo";
            picLogo.AccessibleName = "Company Logo";
            picLogo.BackColor = Color.White;
            picLogo.Image = Properties.Resources.logo;
            picLogo.Location = new Point(3, 2);
            picLogo.Name = "picLogo";
            picLogo.Padding = new Padding(4);
            picLogo.Size = new Size(148, 81);
            picLogo.SizeMode = PictureBoxSizeMode.Zoom;
            picLogo.TabIndex = 20;
            picLogo.TabStop = false;
            toolTip.SetToolTip(picLogo, "Fiplex by Honeywell");
            // 
            // linkLabelRequestAccess
            // 
            linkLabelRequestAccess.AccessibleDescription = "Request access to the application";
            linkLabelRequestAccess.AccessibleName = "Request Access Link";
            linkLabelRequestAccess.ActiveLinkColor = Color.FromArgb(0, 58, 112);
            linkLabelRequestAccess.AutoSize = true;
            linkLabelRequestAccess.Font = new Font("Segoe UI", 9F);
            linkLabelRequestAccess.LinkBehavior = LinkBehavior.HoverUnderline;
            linkLabelRequestAccess.LinkColor = Color.FromArgb(0, 88, 155);
            linkLabelRequestAccess.Location = new Point(205, 222);
            linkLabelRequestAccess.Name = "linkLabelRequestAccess";
            linkLabelRequestAccess.Size = new Size(88, 15);
            linkLabelRequestAccess.TabIndex = 3;
            linkLabelRequestAccess.TabStop = true;
            linkLabelRequestAccess.Text = "Request Access";
            toolTip.SetToolTip(linkLabelRequestAccess, "Click to request admin access");
            linkLabelRequestAccess.VisitedLinkColor = Color.FromArgb(0, 88, 155);
            linkLabelRequestAccess.LinkClicked += linkLabelRequestAccess_LinkClicked;
            // 
            // LinkLabelTermsConditions
            // 
            LinkLabelTermsConditions.AccessibleDescription = "View terms and conditions";
            LinkLabelTermsConditions.AccessibleName = "Terms and Conditions Link";
            LinkLabelTermsConditions.ActiveLinkColor = Color.FromArgb(0, 58, 112);
            LinkLabelTermsConditions.AutoSize = true;
            LinkLabelTermsConditions.Font = new Font("Segoe UI", 9F);
            LinkLabelTermsConditions.LinkBehavior = LinkBehavior.HoverUnderline;
            LinkLabelTermsConditions.LinkColor = Color.FromArgb(0, 88, 155);
            LinkLabelTermsConditions.Location = new Point(280, 7);
            LinkLabelTermsConditions.Name = "LinkLabelTermsConditions";
            LinkLabelTermsConditions.Size = new Size(123, 15);
            LinkLabelTermsConditions.TabIndex = 2;
            LinkLabelTermsConditions.TabStop = true;
            LinkLabelTermsConditions.Text = "Terms and Conditions";
            toolTip.SetToolTip(LinkLabelTermsConditions, "Click to view the license agreement");
            LinkLabelTermsConditions.VisitedLinkColor = Color.FromArgb(0, 88, 155);
            LinkLabelTermsConditions.LinkClicked += LinkLabelTermsConditions_LinkClicked;
            // 
            // BtnLogin
            // 
            BtnLogin.AccessibleDescription = "Click to log in with your credentials";
            BtnLogin.AccessibleName = "Login Button";
            BtnLogin.BackColor = Color.FromArgb(0, 88, 155);
            BtnLogin.Cursor = Cursors.Hand;
            BtnLogin.FlatAppearance.BorderSize = 0;
            BtnLogin.FlatAppearance.MouseDownBackColor = Color.FromArgb(0, 58, 112);
            BtnLogin.FlatAppearance.MouseOverBackColor = Color.FromArgb(0, 58, 112);
            BtnLogin.FlatStyle = FlatStyle.Flat;
            BtnLogin.Font = new Font("Segoe UI", 11F, FontStyle.Bold);
            BtnLogin.ForeColor = Color.FromArgb(255, 255, 255);
            BtnLogin.Location = new Point(149, 64);
            BtnLogin.MinimumSize = new Size(200, 42);
            BtnLogin.Name = "BtnLogin";
            BtnLogin.Size = new Size(200, 42);
            BtnLogin.TabIndex = 1;
            BtnLogin.Text = "Login";
            toolTip.SetToolTip(BtnLogin, "Click to authenticate with your account (Enter)");
            BtnLogin.UseVisualStyleBackColor = false;
            BtnLogin.Click += BtnLogin_Click;
            // 
            // tableLayoutPanelContent
            // 
            tableLayoutPanelContent.ColumnCount = 1;
            tableLayoutPanelContent.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 50F));
            tableLayoutPanelContent.Controls.Add(tableLayoutPanelHead, 0, 0);
            tableLayoutPanelContent.Controls.Add(panelContent, 0, 1);
            tableLayoutPanelContent.Dock = DockStyle.Fill;
            tableLayoutPanelContent.Location = new Point(0, 0);
            tableLayoutPanelContent.Name = "tableLayoutPanelContent";
            tableLayoutPanelContent.RowCount = 2;
            tableLayoutPanelContent.RowStyles.Add(new RowStyle(SizeType.Percent, 29.032259F));
            tableLayoutPanelContent.RowStyles.Add(new RowStyle(SizeType.Percent, 70.96774F));
            tableLayoutPanelContent.Size = new Size(504, 361);
            tableLayoutPanelContent.TabIndex = 10;
            // 
            // tableLayoutPanelHead
            // 
            tableLayoutPanelHead.CellBorderStyle = TableLayoutPanelCellBorderStyle.Single;
            tableLayoutPanelHead.ColumnCount = 2;
            tableLayoutPanelHead.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 33.0543938F));
            tableLayoutPanelHead.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 66.94561F));
            tableLayoutPanelHead.Controls.Add(panelLogo, 0, 0);
            tableLayoutPanelHead.Controls.Add(panelHeader, 1, 0);
            tableLayoutPanelHead.Dock = DockStyle.Bottom;
            tableLayoutPanelHead.Location = new Point(3, 8);
            tableLayoutPanelHead.Name = "tableLayoutPanelHead";
            tableLayoutPanelHead.RowCount = 1;
            tableLayoutPanelHead.RowStyles.Add(new RowStyle(SizeType.Percent, 50F));
            tableLayoutPanelHead.Size = new Size(498, 93);
            tableLayoutPanelHead.TabIndex = 10;
            // 
            // panelLogo
            // 
            panelLogo.BackColor = Color.White;
            panelLogo.Controls.Add(picLogo);
            panelLogo.Dock = DockStyle.Fill;
            panelLogo.Location = new Point(4, 4);
            panelLogo.Name = "panelLogo";
            panelLogo.Size = new Size(157, 85);
            panelLogo.TabIndex = 100;
            // 
            // panelHeader
            // 
            panelHeader.BackColor = Color.FromArgb(0, 58, 112);
            panelHeader.Controls.Add(lblWelcome);
            panelHeader.Dock = DockStyle.Fill;
            panelHeader.Location = new Point(168, 4);
            panelHeader.Name = "panelHeader";
            panelHeader.Size = new Size(326, 85);
            panelHeader.TabIndex = 21;
            // 
            // lblWelcome
            // 
            lblWelcome.AccessibleDescription = "Application title";
            lblWelcome.AccessibleName = "Welcome Label";
            lblWelcome.AutoSize = true;
            lblWelcome.Font = new Font("Segoe UI", 20F, FontStyle.Bold);
            lblWelcome.ForeColor = Color.FromArgb(255, 255, 255);
            lblWelcome.Location = new Point(6, 24);
            lblWelcome.Name = "lblWelcome";
            lblWelcome.Size = new Size(322, 37);
            lblWelcome.TabIndex = 5;
            lblWelcome.Text = "Fiplex Control Software";
            // 
            // panelContent
            // 
            panelContent.BackColor = Color.White;
            panelContent.Controls.Add(progLoginInProcess);
            panelContent.Controls.Add(label2);
            panelContent.Controls.Add(LblContactAdmin);
            panelContent.Controls.Add(LblDontHaveCredentials);
            panelContent.Controls.Add(Label3);
            panelContent.Controls.Add(BtnLogin);
            panelContent.Controls.Add(LinkLabelTermsConditions);
            panelContent.Controls.Add(linkLabelRequestAccess);
            panelContent.Dock = DockStyle.Fill;
            panelContent.Location = new Point(3, 107);
            panelContent.Name = "panelContent";
            panelContent.Padding = new Padding(20);
            panelContent.Size = new Size(498, 251);
            panelContent.TabIndex = 8;
            // 
            // progLoginInProcess
            // 
            progLoginInProcess.AccessibleDescription = "Shows login progress";
            progLoginInProcess.AccessibleName = "Login Progress";
            progLoginInProcess.Location = new Point(99, 123);
            progLoginInProcess.MarqueeAnimationSpeed = 30;
            progLoginInProcess.Name = "progLoginInProcess";
            progLoginInProcess.Size = new Size(300, 4);
            progLoginInProcess.Style = ProgressBarStyle.Marquee;
            progLoginInProcess.TabIndex = 99;
            progLoginInProcess.Visible = false;
            // 
            // label2
            // 
            label2.AccessibleDescription = "Instructions for administrators";
            label2.AccessibleName = "Admin Instructions";
            label2.AutoSize = true;
            label2.Font = new Font("Segoe UI", 9F);
            label2.ForeColor = Color.FromArgb(85, 85, 85);
            label2.Location = new Point(194, 204);
            label2.Margin = new Padding(2, 0, 2, 0);
            label2.Name = "label2";
            label2.Size = new Size(111, 15);
            label2.TabIndex = 17;
            label2.Text = "If you are an Admin";
            // 
            // LblContactAdmin
            // 
            LblContactAdmin.AccessibleDescription = "Instructions for technicians";
            LblContactAdmin.AccessibleName = "Technician Instructions";
            LblContactAdmin.AutoSize = true;
            LblContactAdmin.Font = new Font("Segoe UI", 9F);
            LblContactAdmin.ForeColor = Color.FromArgb(85, 85, 85);
            LblContactAdmin.Location = new Point(133, 182);
            LblContactAdmin.Margin = new Padding(2, 0, 2, 0);
            LblContactAdmin.Name = "LblContactAdmin";
            LblContactAdmin.Size = new Size(233, 15);
            LblContactAdmin.TabIndex = 16;
            LblContactAdmin.Text = "If you are a technician contact your admin.";
            // 
            // LblDontHaveCredentials
            // 
            LblDontHaveCredentials.AccessibleDescription = "Help section for users without credentials";
            LblDontHaveCredentials.AccessibleName = "No Credentials Label";
            LblDontHaveCredentials.AutoSize = true;
            LblDontHaveCredentials.Font = new Font("Segoe UI", 11F, FontStyle.Bold);
            LblDontHaveCredentials.ForeColor = Color.FromArgb(34, 34, 34);
            LblDontHaveCredentials.Location = new Point(144, 159);
            LblDontHaveCredentials.Margin = new Padding(2, 0, 2, 0);
            LblDontHaveCredentials.Name = "LblDontHaveCredentials";
            LblDontHaveCredentials.Size = new Size(210, 20);
            LblDontHaveCredentials.TabIndex = 15;
            LblDontHaveCredentials.Text = "Don't have login credentials?";
            // 
            // Label3
            // 
            Label3.AccessibleDescription = "Terms agreement notice";
            Label3.AccessibleName = "Agreement Label";
            Label3.AutoSize = true;
            Label3.Font = new Font("Segoe UI", 9F);
            Label3.ForeColor = Color.FromArgb(85, 85, 85);
            Label3.Location = new Point(95, 7);
            Label3.Margin = new Padding(2, 0, 2, 0);
            Label3.Name = "Label3";
            Label3.Size = new Size(190, 15);
            Label3.TabIndex = 14;
            Label3.Text = "By clicking Login, you agree to our";
            // 
            // Login
            // 
            AcceptButton = BtnLogin;
            AccessibleDescription = "Login form for Fiplex Control Software";
            AccessibleName = "Fiplex Login";
            AutoScaleDimensions = new SizeF(96F, 96F);
            AutoScaleMode = AutoScaleMode.Dpi;
            BackColor = Color.White;
            ClientSize = new Size(504, 361);
            Controls.Add(tableLayoutPanelContent);
            FormBorderStyle = FormBorderStyle.FixedSingle;
            Icon = (Icon)resources.GetObject("$this.Icon");
            MaximizeBox = false;
            MinimizeBox = false;
            Name = "Login";
            StartPosition = FormStartPosition.CenterScreen;
            Text = "Fiplex Control Software";
            ((System.ComponentModel.ISupportInitialize)picLogo).EndInit();
            tableLayoutPanelContent.ResumeLayout(false);
            tableLayoutPanelHead.ResumeLayout(false);
            panelLogo.ResumeLayout(false);
            panelHeader.ResumeLayout(false);
            panelHeader.PerformLayout();
            panelContent.ResumeLayout(false);
            panelContent.PerformLayout();
            ResumeLayout(false);
        }

        #endregion
        private ToolTip toolTip;
        private TableLayoutPanel tableLayoutPanelContent;
        private TableLayoutPanel tableLayoutPanelHead;
        private Panel panelHeader;
        private Label lblWelcome;
        private PictureBox picLogo;
        private LinkLabel linkLabelRequestAccess;
        private LinkLabel LinkLabelTermsConditions;
        private Button BtnLogin;
        private Label Label3;
        private Label LblDontHaveCredentials;
        private Label LblContactAdmin;
        private Label label2;
        private ProgressBar progLoginInProcess;
        private Panel panelContent;
        private Panel panelLogo;
    }
}