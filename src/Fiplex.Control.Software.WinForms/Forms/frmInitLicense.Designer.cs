namespace Fiplex.Control.Software.WinForms.Forms
{
    partial class frmInitLicense
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        // Note: The Dispose method is implemented in frmInitLicense.cs
        // to handle the release of CancellationTokenSource

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            components = new System.ComponentModel.Container();
            System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(frmInitLicense));
            lblTitle = new Label();
            linkTerms = new LinkLabel();
            btnAccept = new Button();
            btnDecline = new Button();
            toolTip1 = new ToolTip(components);
            SuspendLayout();
            // 
            // lblTitle
            // 
            lblTitle.BackColor = Color.FromArgb(255, 255, 255);
            lblTitle.Font = new Font("Segoe UI", 11F, FontStyle.Bold);
            lblTitle.ForeColor = Color.FromArgb(34, 34, 34);
            lblTitle.Location = new Point(12, 9);
            lblTitle.Name = "lblTitle";
            lblTitle.Size = new Size(645, 28);
            lblTitle.TabIndex = 0;
            lblTitle.Text = "TERMS AND CONDITIONS";
            // 
            // linkTerms
            // 
            linkTerms.ActiveLinkColor = Color.FromArgb(0, 58, 112);
            linkTerms.BackColor = Color.FromArgb(255, 255, 255);
            linkTerms.Font = new Font("Segoe UI", 9F, FontStyle.Bold);
            linkTerms.ForeColor = Color.FromArgb(34, 34, 34);
            linkTerms.LinkArea = new LinkArea(101, 11);
            linkTerms.LinkBehavior = LinkBehavior.HoverUnderline;
            linkTerms.LinkColor = Color.FromArgb(0, 88, 155);
            linkTerms.Location = new Point(12, 37);
            linkTerms.Name = "linkTerms";
            linkTerms.Size = new Size(645, 170);
            linkTerms.TabIndex = 1;
            linkTerms.TabStop = true;
            linkTerms.Text = resources.GetString("linkTerms.Text");
            linkTerms.UseCompatibleTextRendering = true;
            linkTerms.VisitedLinkColor = Color.FromArgb(0, 88, 155);
            linkTerms.LinkClicked += linkTerms_LinkClicked;
            // 
            // btnAccept
            // 
            btnAccept.BackColor = Color.FromArgb(0, 88, 155);
            btnAccept.Cursor = Cursors.Hand;
            btnAccept.FlatAppearance.BorderSize = 0;
            btnAccept.FlatAppearance.MouseDownBackColor = Color.FromArgb(0, 58, 112);
            btnAccept.FlatAppearance.MouseOverBackColor = Color.FromArgb(0, 58, 112);
            btnAccept.FlatStyle = FlatStyle.Flat;
            btnAccept.Font = new Font("Segoe UI", 9F);
            btnAccept.ForeColor = Color.White;
            btnAccept.Location = new Point(12, 220);
            btnAccept.MinimumSize = new Size(90, 30);
            btnAccept.Name = "btnAccept";
            btnAccept.Size = new Size(120, 30);
            btnAccept.TabIndex = 2;
            btnAccept.Text = "&Accept";
            btnAccept.UseVisualStyleBackColor = false;
            btnAccept.Click += btnAccept_Click;
            // 
            // btnDecline
            // 
            btnDecline.BackColor = Color.FromArgb(255, 255, 255);
            btnDecline.Cursor = Cursors.Hand;
            btnDecline.FlatAppearance.BorderColor = Color.FromArgb(221, 221, 221);
            btnDecline.FlatAppearance.MouseDownBackColor = Color.FromArgb(245, 245, 245);
            btnDecline.FlatAppearance.MouseOverBackColor = Color.FromArgb(245, 245, 245);
            btnDecline.FlatStyle = FlatStyle.Flat;
            btnDecline.Font = new Font("Segoe UI", 9F);
            btnDecline.ForeColor = Color.FromArgb(34, 34, 34);
            btnDecline.Location = new Point(140, 220);
            btnDecline.MinimumSize = new Size(90, 30);
            btnDecline.Name = "btnDecline";
            btnDecline.Size = new Size(120, 30);
            btnDecline.TabIndex = 3;
            btnDecline.Text = "&Decline";
            btnDecline.UseVisualStyleBackColor = false;
            btnDecline.Click += btnDecline_Click;
            // 
            // frmInitLicense
            // 
            AutoScaleDimensions = new SizeF(96F, 96F);
            AutoScaleMode = AutoScaleMode.Dpi;
            BackColor = Color.FromArgb(255, 255, 255);
            ClientSize = new Size(669, 270);
            Controls.Add(btnDecline);
            Controls.Add(btnAccept);
            Controls.Add(linkTerms);
            Controls.Add(lblTitle);
            Font = new Font("Segoe UI", 9F);
            FormBorderStyle = FormBorderStyle.FixedSingle;
            Icon = (Icon)resources.GetObject("$this.Icon");
            MaximizeBox = false;
            MinimizeBox = false;
            Name = "frmInitLicense";
            StartPosition = FormStartPosition.CenterScreen;
            Text = "Fiplex Control Software";
            ResumeLayout(false);
        }

        #endregion

        private Label lblTitle;
        private LinkLabel linkTerms;
        private Button btnAccept;
        private Button btnDecline;
        private ToolTip toolTip1;
    }
}