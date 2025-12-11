using System.ComponentModel;
using Microsoft.Web.WebView2.WinForms;

namespace Fiplex.Control.Software.WinForms.Forms
{
    partial class frmMain
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
            components = new Container();
            ComponentResourceManager resources = new ComponentResourceManager(typeof(frmMain));
            ToolTip1 = new ToolTip(components);
            cmdIDPort = new Button();
            cmdConnect = new Button();
            cmbCOM = new ComboBox();
            cmdRefresh = new Button();
            MainMenu1 = new MenuStrip();
            mnuFile = new ToolStripMenuItem();
            mnuConfig = new ToolStripMenuItem();
            mnuLoadConfig = new ToolStripMenuItem();
            mnuSaveConfig = new ToolStripMenuItem();
            mnuCal = new ToolStripMenuItem();
            mnuLoadCal = new ToolStripMenuItem();
            mnuSaveCal = new ToolStripMenuItem();
            mnuPassword = new ToolStripMenuItem();
            mnuLicense = new ToolStripMenuItem();
            mnuFactDefault = new ToolStripMenuItem();
            mnuExit = new ToolStripMenuItem();
            mnuProd = new ToolStripMenuItem();
            mnuClear = new ToolStripMenuItem();
            mnuOneCH = new ToolStripMenuItem();
            mnuTwoCH = new ToolStripMenuItem();
            mnuTwoCHStart = new ToolStripMenuItem();
            mnuTwoCHCenter = new ToolStripMenuItem();
            mnuTwoCHStop = new ToolStripMenuItem();
            mnuSixCH = new ToolStripMenuItem();
            mnuFirstNet = new ToolStripMenuItem();
            mnuEth = new ToolStripMenuItem();
            mnuEthInstall = new ToolStripMenuItem();
            mnuAbout = new ToolStripMenuItem();
            mnuSWInfo = new ToolStripMenuItem();
            mnuSWver = new ToolStripMenuItem();
            mnuFWInfo = new ToolStripMenuItem();
            mnuFWVer = new ToolStripMenuItem();
            CLSSToolStripMenuItem = new ToolStripMenuItem();
            LogoutToolStripMenuItem = new ToolStripMenuItem();
            SubscriptionInformationToolStripMenuItem = new ToolStripMenuItem();
            mnuDebug = new ToolStripMenuItem();
            mnuEnableHttpLogging = new ToolStripMenuItem();
            mnuOpenLogDirectory = new ToolStripMenuItem();
            tlpMainLayout = new TableLayoutPanel();
            tlpTopControls = new TableLayoutPanel();
            lblHyperLink = new LinkLabel();
            webView = new WebView2();
            pnlStatusBar = new Panel();
            lblStatus = new Label();
            lbldaysRemaining = new Label();
            cdiCalOpen = new OpenFileDialog();
            cdiCalSave = new SaveFileDialog();
            cdiConfOpen = new OpenFileDialog();
            cdiConfSave = new SaveFileDialog();
            MainMenu1.SuspendLayout();
            tlpMainLayout.SuspendLayout();
            tlpTopControls.SuspendLayout();
            ((ISupportInitialize)webView).BeginInit();
            pnlStatusBar.SuspendLayout();
            SuspendLayout();
            // 
            // cmdIDPort
            // 
            cmdIDPort.AccessibleDescription = "Scans for available devices on serial ports";
            cmdIDPort.AccessibleName = "Scan Devices Button";
            cmdIDPort.BackColor = Color.FromArgb(255, 255, 255);
            cmdIDPort.Dock = DockStyle.Fill;
            cmdIDPort.FlatStyle = FlatStyle.Flat;
            cmdIDPort.Font = new Font("Segoe UI", 9F);
            cmdIDPort.ForeColor = Color.FromArgb(0, 88, 155);
            cmdIDPort.Location = new Point(3, 3);
            cmdIDPort.MinimumSize = new Size(90, 30);
            cmdIDPort.Name = "cmdIDPort";
            cmdIDPort.Size = new Size(139, 30);
            cmdIDPort.TabIndex = 1;
            cmdIDPort.Text = "&Scan Devices";
            ToolTip1.SetToolTip(cmdIDPort, "Scan for available devices (Alt+S)");
            cmdIDPort.UseVisualStyleBackColor = false;
            cmdIDPort.Click += cmdIDPort_Click;
            // 
            // cmdConnect
            // 
            cmdConnect.AccessibleDescription = "Connects or disconnects from the selected device";
            cmdConnect.AccessibleName = "Connect Button";
            cmdConnect.BackColor = Color.FromArgb(0, 88, 155);
            cmdConnect.Dock = DockStyle.Fill;
            cmdConnect.Enabled = false;
            cmdConnect.FlatAppearance.BorderColor = Color.FromArgb(0, 88, 155);
            cmdConnect.FlatAppearance.BorderSize = 0;
            cmdConnect.FlatAppearance.MouseOverBackColor = Color.FromArgb(0, 58, 112);
            cmdConnect.FlatStyle = FlatStyle.Flat;
            cmdConnect.Font = new Font("Segoe UI", 9F, FontStyle.Bold);
            cmdConnect.ForeColor = Color.FromArgb(255, 255, 255);
            cmdConnect.Location = new Point(148, 3);
            cmdConnect.MinimumSize = new Size(90, 30);
            cmdConnect.Name = "cmdConnect";
            cmdConnect.Size = new Size(139, 30);
            cmdConnect.TabIndex = 2;
            cmdConnect.Text = "&Connect";
            ToolTip1.SetToolTip(cmdConnect, "Connect to selected device (Alt+C)");
            cmdConnect.UseVisualStyleBackColor = false;
            cmdConnect.Click += cmdConnect_Click;
            // 
            // cmbCOM
            // 
            cmbCOM.AccessibleDescription = "Select the COM port to connect to";
            cmbCOM.AccessibleName = "COM Port Selection";
            cmbCOM.BackColor = SystemColors.Window;
            cmbCOM.Dock = DockStyle.Fill;
            cmbCOM.DropDownStyle = ComboBoxStyle.DropDownList;
            cmbCOM.FlatStyle = FlatStyle.Flat;
            cmbCOM.Font = new Font("Segoe UI", 9F, FontStyle.Bold);
            cmbCOM.ForeColor = SystemColors.WindowText;
            cmbCOM.Location = new Point(8, 44);
            cmbCOM.Margin = new Padding(8, 3, 8, 3);
            cmbCOM.Name = "cmbCOM";
            cmbCOM.Size = new Size(1008, 23);
            cmbCOM.TabIndex = 3;
            ToolTip1.SetToolTip(cmbCOM, "Select COM port for device connection");
            // 
            // cmdRefresh
            // 
            cmdRefresh.BackColor = Color.FromArgb(255, 255, 255);
            cmdRefresh.Dock = DockStyle.Fill;
            cmdRefresh.FlatAppearance.BorderColor = Color.FromArgb(221, 221, 221);
            cmdRefresh.FlatAppearance.MouseOverBackColor = Color.FromArgb(245, 245, 245);
            cmdRefresh.FlatStyle = FlatStyle.Flat;
            cmdRefresh.Font = new Font("Segoe UI", 9F);
            cmdRefresh.ForeColor = Color.FromArgb(34, 34, 34);
            cmdRefresh.Location = new Point(293, 3);
            cmdRefresh.MinimumSize = new Size(90, 30);
            cmdRefresh.Name = "cmdRefresh";
            cmdRefresh.Size = new Size(139, 30);
            cmdRefresh.TabIndex = 4;
            cmdRefresh.Text = "&Refresh";
            ToolTip1.SetToolTip(cmdRefresh, "Refresh interface (Alt+R)");
            cmdRefresh.UseVisualStyleBackColor = false;
            cmdRefresh.Visible = false;
            cmdRefresh.Click += cmdRefresh_Click;
            // 
            // MainMenu1
            // 
            MainMenu1.ImageScalingSize = new Size(20, 20);
            MainMenu1.Items.AddRange(new ToolStripItem[] { mnuFile, mnuProd, mnuEth, mnuAbout, CLSSToolStripMenuItem, mnuDebug });
            MainMenu1.Location = new Point(0, 0);
            MainMenu1.Name = "MainMenu1";
            MainMenu1.RenderMode = ToolStripRenderMode.Professional;
            MainMenu1.Size = new Size(1024, 24);
            MainMenu1.TabIndex = 10;
            // 
            // mnuFile
            // 
            mnuFile.DropDownItems.AddRange(new ToolStripItem[] { mnuConfig, mnuCal, mnuPassword, mnuLicense, mnuFactDefault, mnuExit });
            mnuFile.Name = "mnuFile";
            mnuFile.Size = new Size(37, 20);
            mnuFile.Text = "&File";
            // 
            // mnuConfig
            // 
            mnuConfig.DropDownItems.AddRange(new ToolStripItem[] { mnuLoadConfig, mnuSaveConfig });
            mnuConfig.Enabled = false;
            mnuConfig.Name = "mnuConfig";
            mnuConfig.Size = new Size(201, 22);
            mnuConfig.Text = "&Configurations";
            // 
            // mnuLoadConfig
            // 
            mnuLoadConfig.Enabled = false;
            mnuLoadConfig.Name = "mnuLoadConfig";
            mnuLoadConfig.Size = new Size(223, 22);
            mnuLoadConfig.Text = "&Load configuration from file";
            mnuLoadConfig.Click += mnuLoadConfig_Click;
            // 
            // mnuSaveConfig
            // 
            mnuSaveConfig.Enabled = false;
            mnuSaveConfig.Name = "mnuSaveConfig";
            mnuSaveConfig.Size = new Size(223, 22);
            mnuSaveConfig.Text = "&Save configuration to file";
            mnuSaveConfig.Click += mnuSaveConfig_Click;
            // 
            // mnuCal
            // 
            mnuCal.DropDownItems.AddRange(new ToolStripItem[] { mnuLoadCal, mnuSaveCal });
            mnuCal.Enabled = false;
            mnuCal.Name = "mnuCal";
            mnuCal.Size = new Size(201, 22);
            mnuCal.Text = "C&alibrations";
            mnuCal.Visible = false;
            // 
            // mnuLoadCal
            // 
            mnuLoadCal.Name = "mnuLoadCal";
            mnuLoadCal.Size = new Size(207, 22);
            mnuLoadCal.Text = "&Load calibration from file";
            mnuLoadCal.Click += mnuLoadCal_Click;
            // 
            // mnuSaveCal
            // 
            mnuSaveCal.Name = "mnuSaveCal";
            mnuSaveCal.Size = new Size(207, 22);
            mnuSaveCal.Text = "&Save calibration to file";
            mnuSaveCal.Click += mnuSaveCal_Click;
            // 
            // mnuPassword
            // 
            mnuPassword.Name = "mnuPassword";
            mnuPassword.Size = new Size(201, 22);
            mnuPassword.Text = "&Edit Password";
            mnuPassword.Visible = false;
            mnuPassword.Click += mnuPassword_Click;
            // 
            // mnuLicense
            // 
            mnuLicense.Name = "mnuLicense";
            mnuLicense.Size = new Size(201, 22);
            mnuLicense.Text = "&License";
            mnuLicense.Visible = false;
            mnuLicense.Click += mnuLicense_Click;
            // 
            // mnuFactDefault
            // 
            mnuFactDefault.Name = "mnuFactDefault";
            mnuFactDefault.Size = new Size(201, 22);
            mnuFactDefault.Text = "&Reset To Factory Default";
            mnuFactDefault.Visible = false;
            mnuFactDefault.Click += mnuFactDefault_Click;
            // 
            // mnuExit
            // 
            mnuExit.Name = "mnuExit";
            mnuExit.Size = new Size(201, 22);
            mnuExit.Text = "&Exit";
            mnuExit.Click += mnuExit_Click;
            // 
            // mnuProd
            // 
            mnuProd.DropDownItems.AddRange(new ToolStripItem[] { mnuClear, mnuOneCH, mnuTwoCH, mnuSixCH, mnuFirstNet });
            mnuProd.Name = "mnuProd";
            mnuProd.Size = new Size(107, 20);
            mnuProd.Text = "&Production Tests";
            mnuProd.Visible = false;
            // 
            // mnuClear
            // 
            mnuClear.Name = "mnuClear";
            mnuClear.Size = new Size(150, 22);
            mnuClear.Text = "Clear EEPROM";
            mnuClear.Visible = false;
            mnuClear.Click += mnuClear_Click;
            // 
            // mnuOneCH
            // 
            mnuOneCH.Name = "mnuOneCH";
            mnuOneCH.Size = new Size(150, 22);
            mnuOneCH.Text = "1 CH";
            mnuOneCH.Click += mnuOneCH_Click;
            // 
            // mnuTwoCH
            // 
            mnuTwoCH.DropDownItems.AddRange(new ToolStripItem[] { mnuTwoCHStart, mnuTwoCHCenter, mnuTwoCHStop });
            mnuTwoCH.Name = "mnuTwoCH";
            mnuTwoCH.Size = new Size(150, 22);
            mnuTwoCH.Text = "2 CH";
            // 
            // mnuTwoCHStart
            // 
            mnuTwoCHStart.Enabled = false;
            mnuTwoCHStart.Name = "mnuTwoCHStart";
            mnuTwoCHStart.Size = new Size(137, 22);
            mnuTwoCHStart.Text = "Band start";
            mnuTwoCHStart.Click += mnuTwoCHStart_Click;
            // 
            // mnuTwoCHCenter
            // 
            mnuTwoCHCenter.Name = "mnuTwoCHCenter";
            mnuTwoCHCenter.Size = new Size(137, 22);
            mnuTwoCHCenter.Text = "Band center";
            mnuTwoCHCenter.Click += mnuTwoCHCenter_Click;
            // 
            // mnuTwoCHStop
            // 
            mnuTwoCHStop.Enabled = false;
            mnuTwoCHStop.Name = "mnuTwoCHStop";
            mnuTwoCHStop.Size = new Size(137, 22);
            mnuTwoCHStop.Text = "Band stop";
            mnuTwoCHStop.Click += mnuTwoCHStop_Click;
            // 
            // mnuSixCH
            // 
            mnuSixCH.Name = "mnuSixCH";
            mnuSixCH.Size = new Size(150, 22);
            mnuSixCH.Text = "6 CH";
            mnuSixCH.Click += mnuSixCH_Click;
            // 
            // mnuFirstNet
            // 
            mnuFirstNet.Name = "mnuFirstNet";
            mnuFirstNet.Size = new Size(150, 22);
            mnuFirstNet.Text = "&FirstNet Filter";
            mnuFirstNet.Visible = false;
            mnuFirstNet.Click += mnuFirstNet_Click;
            // 
            // mnuEth
            // 
            mnuEth.DropDownItems.AddRange(new ToolStripItem[] { mnuEthInstall });
            mnuEth.Name = "mnuEth";
            mnuEth.Size = new Size(63, 20);
            mnuEth.Text = "&Ethernet";
            mnuEth.Visible = false;
            // 
            // mnuEthInstall
            // 
            mnuEthInstall.Name = "mnuEthInstall";
            mnuEthInstall.Size = new Size(105, 22);
            mnuEthInstall.Text = "&Install";
            mnuEthInstall.Click += mnuEthInstall_Click;
            // 
            // mnuAbout
            // 
            mnuAbout.DropDownItems.AddRange(new ToolStripItem[] { mnuSWInfo, mnuFWInfo });
            mnuAbout.Name = "mnuAbout";
            mnuAbout.Size = new Size(52, 20);
            mnuAbout.Text = "&About";
            // 
            // mnuSWInfo
            // 
            mnuSWInfo.DropDownItems.AddRange(new ToolStripItem[] { mnuSWver });
            mnuSWInfo.Name = "mnuSWInfo";
            mnuSWInfo.Size = new Size(115, 22);
            mnuSWInfo.Text = "SW Info";
            // 
            // mnuSWver
            // 
            mnuSWver.Name = "mnuSWver";
            mnuSWver.Size = new Size(67, 22);
            // 
            // mnuFWInfo
            // 
            mnuFWInfo.DropDownItems.AddRange(new ToolStripItem[] { mnuFWVer });
            mnuFWInfo.Name = "mnuFWInfo";
            mnuFWInfo.Size = new Size(115, 22);
            mnuFWInfo.Text = "FW Info";
            mnuFWInfo.Visible = false;
            // 
            // mnuFWVer
            // 
            mnuFWVer.Name = "mnuFWVer";
            mnuFWVer.Size = new Size(67, 22);
            // 
            // CLSSToolStripMenuItem
            // 
            CLSSToolStripMenuItem.DropDownItems.AddRange(new ToolStripItem[] { LogoutToolStripMenuItem, SubscriptionInformationToolStripMenuItem });
            CLSSToolStripMenuItem.Name = "CLSSToolStripMenuItem";
            CLSSToolStripMenuItem.Size = new Size(45, 20);
            CLSSToolStripMenuItem.Text = "CLSS";
            // 
            // LogoutToolStripMenuItem
            // 
            LogoutToolStripMenuItem.Name = "LogoutToolStripMenuItem";
            LogoutToolStripMenuItem.Size = new Size(155, 22);
            LogoutToolStripMenuItem.Text = "Logout";
            // 
            // SubscriptionInformationToolStripMenuItem
            // 
            SubscriptionInformationToolStripMenuItem.Name = "SubscriptionInformationToolStripMenuItem";
            SubscriptionInformationToolStripMenuItem.Size = new Size(155, 22);
            SubscriptionInformationToolStripMenuItem.Text = "Training Details";
            // 
            // mnuDebug
            // 
            mnuDebug.DropDownItems.AddRange(new ToolStripItem[] { mnuEnableHttpLogging, mnuOpenLogDirectory });
            mnuDebug.Enabled = false;
            mnuDebug.Name = "mnuDebug";
            mnuDebug.Size = new Size(54, 20);
            mnuDebug.Text = "&Debug";
            mnuDebug.Visible = false;
            // 
            // mnuEnableHttpLogging
            // 
            mnuEnableHttpLogging.Name = "mnuEnableHttpLogging";
            mnuEnableHttpLogging.Size = new Size(249, 22);
            mnuEnableHttpLogging.Text = "Enable HTTP Command Logging";
            // 
            // mnuOpenLogDirectory
            // 
            mnuOpenLogDirectory.Name = "mnuOpenLogDirectory";
            mnuOpenLogDirectory.Size = new Size(249, 22);
            mnuOpenLogDirectory.Text = "Open Log Directory";
            // 
            // tlpMainLayout
            // 
            tlpMainLayout.ColumnCount = 1;
            tlpMainLayout.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100F));
            tlpMainLayout.Controls.Add(tlpTopControls, 0, 0);
            tlpMainLayout.Controls.Add(cmbCOM, 0, 1);
            tlpMainLayout.Controls.Add(webView, 0, 2);
            tlpMainLayout.Controls.Add(pnlStatusBar, 0, 3);
            tlpMainLayout.Dock = DockStyle.Fill;
            tlpMainLayout.Location = new Point(0, 24);
            tlpMainLayout.Name = "tlpMainLayout";
            tlpMainLayout.RowCount = 4;
            tlpMainLayout.RowStyles.Add(new RowStyle(SizeType.Absolute, 41F));
            tlpMainLayout.RowStyles.Add(new RowStyle(SizeType.Absolute, 35F));
            tlpMainLayout.RowStyles.Add(new RowStyle(SizeType.Percent, 100F));
            tlpMainLayout.RowStyles.Add(new RowStyle(SizeType.Absolute, 25F));
            tlpMainLayout.Size = new Size(1024, 696);
            tlpMainLayout.TabIndex = 0;
            // 
            // tlpTopControls
            // 
            tlpTopControls.ColumnCount = 4;
            tlpTopControls.ColumnStyles.Add(new ColumnStyle(SizeType.Absolute, 145F));
            tlpTopControls.ColumnStyles.Add(new ColumnStyle(SizeType.Absolute, 145F));
            tlpTopControls.ColumnStyles.Add(new ColumnStyle(SizeType.Absolute, 145F));
            tlpTopControls.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100F));
            tlpTopControls.Controls.Add(cmdIDPort, 0, 0);
            tlpTopControls.Controls.Add(cmdConnect, 1, 0);
            tlpTopControls.Controls.Add(cmdRefresh, 2, 0);
            tlpTopControls.Controls.Add(lblHyperLink, 3, 0);
            tlpTopControls.Dock = DockStyle.Fill;
            tlpTopControls.Location = new Point(3, 3);
            tlpTopControls.Name = "tlpTopControls";
            tlpTopControls.RowCount = 1;
            tlpTopControls.RowStyles.Add(new RowStyle(SizeType.Absolute, 35F));
            tlpTopControls.Size = new Size(1018, 35);
            tlpTopControls.TabIndex = 0;
            // 
            // lblHyperLink
            // 
            lblHyperLink.AccessibleDescription = "Link to download the latest version of the application";
            lblHyperLink.AccessibleName = "Download Update Link";
            lblHyperLink.ActiveLinkColor = Color.FromArgb(0, 58, 112);
            lblHyperLink.BackColor = Color.Transparent;
            lblHyperLink.Dock = DockStyle.Fill;
            lblHyperLink.Enabled = false;
            lblHyperLink.Font = new Font("Segoe UI", 9F);
            lblHyperLink.LinkBehavior = LinkBehavior.HoverUnderline;
            lblHyperLink.LinkColor = Color.FromArgb(0, 88, 155);
            lblHyperLink.Location = new Point(438, 0);
            lblHyperLink.Name = "lblHyperLink";
            lblHyperLink.Size = new Size(577, 35);
            lblHyperLink.TabIndex = 3;
            lblHyperLink.TabStop = true;
            lblHyperLink.Text = "New version is available. Click for download";
            lblHyperLink.TextAlign = ContentAlignment.MiddleRight;
            lblHyperLink.Visible = false;
            lblHyperLink.VisitedLinkColor = Color.FromArgb(0, 88, 155);
            lblHyperLink.LinkClicked += lblHyperLink_LinkClicked;
            // 
            // webView
            // 
            webView.AccessibleDescription = "Main application content and device interface";
            webView.AccessibleName = "Main Content Area";
            webView.AllowExternalDrop = true;
            webView.CreationProperties = null;
            webView.DefaultBackgroundColor = Color.White;
            webView.Dock = DockStyle.Fill;
            webView.Location = new Point(8, 79);
            webView.Margin = new Padding(8, 3, 8, 3);
            webView.Name = "webView";
            webView.Size = new Size(1008, 589);
            webView.TabIndex = 5;
            webView.ZoomFactor = 1D;
            // 
            // pnlStatusBar
            // 
            pnlStatusBar.BackColor = Color.FromArgb(245, 245, 245);
            pnlStatusBar.Controls.Add(lblStatus);
            pnlStatusBar.Controls.Add(lbldaysRemaining);
            pnlStatusBar.Dock = DockStyle.Fill;
            pnlStatusBar.Location = new Point(3, 674);
            pnlStatusBar.Name = "pnlStatusBar";
            pnlStatusBar.Size = new Size(1018, 19);
            pnlStatusBar.TabIndex = 3;
            // 
            // lblStatus
            // 
            lblStatus.AutoSize = true;
            lblStatus.BackColor = Color.Transparent;
            lblStatus.Font = new Font("Segoe UI", 9F);
            lblStatus.ForeColor = Color.FromArgb(85, 85, 85);
            lblStatus.Location = new Point(3, 2);
            lblStatus.Name = "lblStatus";
            lblStatus.Size = new Size(39, 15);
            lblStatus.TabIndex = 13;
            lblStatus.Text = "Ready";
            // 
            // lbldaysRemaining
            // 
            lbldaysRemaining.Anchor = AnchorStyles.Top | AnchorStyles.Right;
            lbldaysRemaining.AutoSize = true;
            lbldaysRemaining.BackColor = Color.LightSkyBlue;
            lbldaysRemaining.Font = new Font("Segoe UI", 9F);
            lbldaysRemaining.ForeColor = Color.FromArgb(0, 0, 0);
            lbldaysRemaining.Location = new Point(788, 2);
            lbldaysRemaining.Name = "lbldaysRemaining";
            lbldaysRemaining.Padding = new Padding(4, 0, 4, 0);
            lbldaysRemaining.Size = new Size(105, 15);
            lbldaysRemaining.TabIndex = 12;
            lbldaysRemaining.Text = "CLSS login status";
            // 
            // frmMain
            // 
            AccessibleDescription = "Main application window for Fiplex Control Software";
            AccessibleName = "Fiplex Control Software Main Window";
            AutoScaleDimensions = new SizeF(96F, 96F);
            AutoScaleMode = AutoScaleMode.Dpi;
            BackColor = Color.FromArgb(255, 255, 255);
            ClientSize = new Size(1024, 720);
            Controls.Add(tlpMainLayout);
            Controls.Add(MainMenu1);
            Icon = (Icon)resources.GetObject("$this.Icon");
            MinimumSize = new Size(1024, 720);
            Name = "frmMain";
            StartPosition = FormStartPosition.CenterScreen;
            Text = "Fiplex Control Software";
            FormClosing += frmMain2_FormClosing;
            MainMenu1.ResumeLayout(false);
            MainMenu1.PerformLayout();
            tlpMainLayout.ResumeLayout(false);
            tlpTopControls.ResumeLayout(false);
            ((ISupportInitialize)webView).EndInit();
            pnlStatusBar.ResumeLayout(false);
            pnlStatusBar.PerformLayout();
            ResumeLayout(false);
            PerformLayout();

        }

        #endregion

        #region Declaraciones de campos para controles - Modernizadas para .NET 9

        public System.Windows.Forms.ToolTip ToolTip1;
        public System.Windows.Forms.ToolStripMenuItem mnuLoadConfig;
        public System.Windows.Forms.ToolStripMenuItem mnuSaveConfig;
        public System.Windows.Forms.ToolStripMenuItem mnuConfig;
        public System.Windows.Forms.ToolStripMenuItem mnuLoadCal;
        public System.Windows.Forms.ToolStripMenuItem mnuSaveCal;
        public System.Windows.Forms.ToolStripMenuItem mnuCal;
        public System.Windows.Forms.ToolStripMenuItem mnuPassword;
        public System.Windows.Forms.ToolStripMenuItem mnuLicense;
        public System.Windows.Forms.ToolStripMenuItem mnuFactDefault;
        public System.Windows.Forms.ToolStripMenuItem mnuExit;
        public System.Windows.Forms.ToolStripMenuItem mnuFile;
        public System.Windows.Forms.ToolStripMenuItem mnuClear;
        public System.Windows.Forms.ToolStripMenuItem mnuOneCH;
        public System.Windows.Forms.ToolStripMenuItem mnuTwoCHStart;
        public System.Windows.Forms.ToolStripMenuItem mnuTwoCHCenter;
        public System.Windows.Forms.ToolStripMenuItem mnuTwoCHStop;
        public System.Windows.Forms.ToolStripMenuItem mnuTwoCH;
        public System.Windows.Forms.ToolStripMenuItem mnuSixCH;
        public System.Windows.Forms.ToolStripMenuItem mnuFirstNet;
        public System.Windows.Forms.ToolStripMenuItem mnuProd;
        public System.Windows.Forms.ToolStripMenuItem mnuEthInstall;
        public System.Windows.Forms.ToolStripMenuItem mnuEth;
        public System.Windows.Forms.ToolStripMenuItem mnuSWver;
        public System.Windows.Forms.ToolStripMenuItem mnuSWInfo;
        public System.Windows.Forms.ToolStripMenuItem mnuFWVer;
        public System.Windows.Forms.ToolStripMenuItem mnuFWInfo;
        public System.Windows.Forms.ToolStripMenuItem mnuAbout;
        public System.Windows.Forms.MenuStrip MainMenu1;

        // Controles principales modernizados
        public System.Windows.Forms.Button cmdIDPort;
        public WebView2 webView;
        public System.Windows.Forms.Button cmdRefresh;
        public System.Windows.Forms.ComboBox cmbCOM;
        public System.Windows.Forms.Button cmdConnect;
        public System.Windows.Forms.OpenFileDialog cdiCalOpen;
        public System.Windows.Forms.SaveFileDialog cdiCalSave;
        public System.Windows.Forms.OpenFileDialog cdiConfOpen;
        public System.Windows.Forms.SaveFileDialog cdiConfSave;
        public System.Windows.Forms.LinkLabel lblHyperLink;
        public System.Windows.Forms.ToolStripMenuItem CLSSToolStripMenuItem;
        public System.Windows.Forms.ToolStripMenuItem LogoutToolStripMenuItem;
        public System.Windows.Forms.Label lbldaysRemaining;
        public System.Windows.Forms.Label lblStatus;
        public System.Windows.Forms.ToolStripMenuItem SubscriptionInformationToolStripMenuItem;
        public System.Windows.Forms.ToolStripMenuItem mnuDebug;
        public System.Windows.Forms.ToolStripMenuItem mnuEnableHttpLogging;
        public System.Windows.Forms.ToolStripMenuItem mnuOpenLogDirectory;

        // Layout moderno con TableLayoutPanel
        private TableLayoutPanel tlpMainLayout;
        private TableLayoutPanel tlpTopControls;
        private Panel pnlStatusBar;

        #endregion

    }
}