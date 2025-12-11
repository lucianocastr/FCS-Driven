namespace Fiplex.Control.Software.WinForms.Forms;

partial class SubscriptionInfo
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
        System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(SubscriptionInfo));
        lblTitle = new Label();
        lblDescription = new Label();
        lblSubscriptionExpiry = new Label();
        lblSubscriptionExpiryValue = new Label();
        lblTrainingExpiry = new Label();
        lblTrainingExpiryValue = new Label();
        lblUpdatedOn = new Label();
        lblUpdatedOnValue = new Label();
        lblUser = new Label();
        lblUserValue = new Label();
        lblOrganization = new Label();
        lblOrganizationValue = new Label();
        btnOk = new Button();
        pnlContent = new Panel();
        pnlContent.SuspendLayout();
        SuspendLayout();
        // 
        // lblTitle
        // 
        lblTitle.AccessibleDescription = "Dialog title";
        lblTitle.AccessibleName = "Title Label";
        lblTitle.AutoSize = true;
        lblTitle.Font = new Font("Segoe UI", 14F, FontStyle.Bold);
        lblTitle.ForeColor = Color.FromArgb(34, 34, 34);
        lblTitle.Location = new Point(27, 20);
        lblTitle.Name = "lblTitle";
        lblTitle.Size = new Size(150, 25);
        lblTitle.TabIndex = 0;
        lblTitle.Text = "Training Details";
        // 
        // lblDescription
        // 
        lblDescription.AccessibleDescription = "Dialog description";
        lblDescription.AccessibleName = "Description Label";
        lblDescription.AutoSize = true;
        lblDescription.Font = new Font("Segoe UI", 9F);
        lblDescription.ForeColor = Color.FromArgb(85, 85, 85);
        lblDescription.Location = new Point(27, 45);
        lblDescription.Name = "lblDescription";
        lblDescription.Size = new Size(233, 15);
        lblDescription.TabIndex = 1;
        lblDescription.Text = "Below are the details of your Fiplex training";
        // 
        // lblSubscriptionExpiry
        // 
        lblSubscriptionExpiry.AccessibleDescription = "Subscription expiry date label";
        lblSubscriptionExpiry.AccessibleName = "Subscription Expiry Label";
        lblSubscriptionExpiry.AutoSize = true;
        lblSubscriptionExpiry.Font = new Font("Segoe UI", 9F, FontStyle.Bold);
        lblSubscriptionExpiry.ForeColor = Color.FromArgb(34, 34, 34);
        lblSubscriptionExpiry.Location = new Point(12, 15);
        lblSubscriptionExpiry.Name = "lblSubscriptionExpiry";
        lblSubscriptionExpiry.Size = new Size(145, 15);
        lblSubscriptionExpiry.TabIndex = 2;
        lblSubscriptionExpiry.Text = "Subscription expiry date:";
        lblSubscriptionExpiry.Visible = false;
        // 
        // lblSubscriptionExpiryValue
        // 
        lblSubscriptionExpiryValue.AccessibleDescription = "Subscription expiry date value";
        lblSubscriptionExpiryValue.AccessibleName = "Subscription Expiry Value";
        lblSubscriptionExpiryValue.AutoSize = true;
        lblSubscriptionExpiryValue.Font = new Font("Segoe UI", 9F);
        lblSubscriptionExpiryValue.ForeColor = Color.FromArgb(34, 34, 34);
        lblSubscriptionExpiryValue.Location = new Point(220, 15);
        lblSubscriptionExpiryValue.Name = "lblSubscriptionExpiryValue";
        lblSubscriptionExpiryValue.Size = new Size(29, 15);
        lblSubscriptionExpiryValue.TabIndex = 3;
        lblSubscriptionExpiryValue.Text = "N/A";
        lblSubscriptionExpiryValue.Visible = false;
        // 
        // lblTrainingExpiry
        // 
        lblTrainingExpiry.AccessibleDescription = "Training expiry date label";
        lblTrainingExpiry.AccessibleName = "Training Expiry Label";
        lblTrainingExpiry.AutoSize = true;
        lblTrainingExpiry.Font = new Font("Segoe UI", 9F, FontStyle.Bold);
        lblTrainingExpiry.ForeColor = Color.FromArgb(34, 34, 34);
        lblTrainingExpiry.Location = new Point(12, 47);
        lblTrainingExpiry.Name = "lblTrainingExpiry";
        lblTrainingExpiry.Size = new Size(120, 15);
        lblTrainingExpiry.TabIndex = 4;
        lblTrainingExpiry.Text = "Training expiry date:";
        // 
        // lblTrainingExpiryValue
        // 
        lblTrainingExpiryValue.AccessibleDescription = "Training expiry date value";
        lblTrainingExpiryValue.AccessibleName = "Training Expiry Value";
        lblTrainingExpiryValue.AutoSize = true;
        lblTrainingExpiryValue.Font = new Font("Segoe UI", 9F);
        lblTrainingExpiryValue.ForeColor = Color.FromArgb(34, 34, 34);
        lblTrainingExpiryValue.Location = new Point(220, 47);
        lblTrainingExpiryValue.Name = "lblTrainingExpiryValue";
        lblTrainingExpiryValue.Size = new Size(29, 15);
        lblTrainingExpiryValue.TabIndex = 5;
        lblTrainingExpiryValue.Text = "N/A";
        // 
        // lblUpdatedOn
        // 
        lblUpdatedOn.AccessibleDescription = "Last login update date label";
        lblUpdatedOn.AccessibleName = "Updated On Label";
        lblUpdatedOn.AutoSize = true;
        lblUpdatedOn.Font = new Font("Segoe UI", 9F, FontStyle.Bold);
        lblUpdatedOn.ForeColor = Color.FromArgb(34, 34, 34);
        lblUpdatedOn.Location = new Point(12, 79);
        lblUpdatedOn.Name = "lblUpdatedOn";
        lblUpdatedOn.Size = new Size(138, 15);
        lblUpdatedOn.TabIndex = 6;
        lblUpdatedOn.Text = "Updated last login date:";
        // 
        // lblUpdatedOnValue
        // 
        lblUpdatedOnValue.AccessibleDescription = "Last login update date value";
        lblUpdatedOnValue.AccessibleName = "Updated On Value";
        lblUpdatedOnValue.AutoSize = true;
        lblUpdatedOnValue.Font = new Font("Segoe UI", 9F);
        lblUpdatedOnValue.ForeColor = Color.FromArgb(34, 34, 34);
        lblUpdatedOnValue.Location = new Point(220, 79);
        lblUpdatedOnValue.Name = "lblUpdatedOnValue";
        lblUpdatedOnValue.Size = new Size(29, 15);
        lblUpdatedOnValue.TabIndex = 7;
        lblUpdatedOnValue.Text = "N/A";
        // 
        // lblUser
        // 
        lblUser.AccessibleDescription = "User name label";
        lblUser.AccessibleName = "User Label";
        lblUser.AutoSize = true;
        lblUser.Font = new Font("Segoe UI", 9F, FontStyle.Bold);
        lblUser.ForeColor = Color.FromArgb(34, 34, 34);
        lblUser.Location = new Point(12, 111);
        lblUser.Name = "lblUser";
        lblUser.Size = new Size(36, 15);
        lblUser.TabIndex = 8;
        lblUser.Text = "User:";
        // 
        // lblUserValue
        // 
        lblUserValue.AccessibleDescription = "User name value";
        lblUserValue.AccessibleName = "User Value";
        lblUserValue.AutoSize = true;
        lblUserValue.Font = new Font("Segoe UI", 9F);
        lblUserValue.ForeColor = Color.FromArgb(34, 34, 34);
        lblUserValue.Location = new Point(220, 111);
        lblUserValue.Name = "lblUserValue";
        lblUserValue.Size = new Size(58, 15);
        lblUserValue.TabIndex = 9;
        lblUserValue.Text = "Unknown";
        // 
        // lblOrganization
        // 
        lblOrganization.AccessibleDescription = "Organization name label";
        lblOrganization.AccessibleName = "Organization Label";
        lblOrganization.AutoSize = true;
        lblOrganization.Font = new Font("Segoe UI", 9F, FontStyle.Bold);
        lblOrganization.ForeColor = Color.FromArgb(34, 34, 34);
        lblOrganization.Location = new Point(12, 143);
        lblOrganization.Name = "lblOrganization";
        lblOrganization.Size = new Size(81, 15);
        lblOrganization.TabIndex = 10;
        lblOrganization.Text = "Organization:";
        // 
        // lblOrganizationValue
        // 
        lblOrganizationValue.AccessibleDescription = "Organization name value";
        lblOrganizationValue.AccessibleName = "Organization Value";
        lblOrganizationValue.AutoSize = true;
        lblOrganizationValue.Font = new Font("Segoe UI", 9F);
        lblOrganizationValue.ForeColor = Color.FromArgb(34, 34, 34);
        lblOrganizationValue.Location = new Point(220, 143);
        lblOrganizationValue.Name = "lblOrganizationValue";
        lblOrganizationValue.Size = new Size(58, 15);
        lblOrganizationValue.TabIndex = 11;
        lblOrganizationValue.Text = "Unknown";
        // 
        // btnOk
        // 
        btnOk.AccessibleDescription = "Close the training details dialog";
        btnOk.AccessibleName = "OK Button";
        btnOk.BackColor = Color.FromArgb(0, 88, 155);
        btnOk.Cursor = Cursors.Hand;
        btnOk.FlatAppearance.BorderSize = 0;
        btnOk.FlatAppearance.MouseDownBackColor = Color.FromArgb(0, 58, 112);
        btnOk.FlatAppearance.MouseOverBackColor = Color.FromArgb(0, 58, 112);
        btnOk.FlatStyle = FlatStyle.Flat;
        btnOk.Font = new Font("Segoe UI", 9F);
        btnOk.ForeColor = Color.FromArgb(255, 255, 255);
        btnOk.Location = new Point(202, 257);
        btnOk.MinimumSize = new Size(90, 30);
        btnOk.Name = "btnOk";
        btnOk.Size = new Size(100, 30);
        btnOk.TabIndex = 12;
        btnOk.Text = "OK";
        btnOk.UseVisualStyleBackColor = false;
        btnOk.Click += BtnOk_Click;
        // 
        // pnlContent
        // 
        pnlContent.AccessibleDescription = "Content panel with subscription details";
        pnlContent.AccessibleName = "Content Panel";
        pnlContent.BackColor = Color.FromArgb(245, 245, 245);
        pnlContent.Controls.Add(lblSubscriptionExpiry);
        pnlContent.Controls.Add(lblSubscriptionExpiryValue);
        pnlContent.Controls.Add(lblTrainingExpiry);
        pnlContent.Controls.Add(lblTrainingExpiryValue);
        pnlContent.Controls.Add(lblUpdatedOn);
        pnlContent.Controls.Add(lblUpdatedOnValue);
        pnlContent.Controls.Add(lblUser);
        pnlContent.Controls.Add(lblUserValue);
        pnlContent.Controls.Add(lblOrganization);
        pnlContent.Controls.Add(lblOrganizationValue);
        pnlContent.Location = new Point(27, 74);
        pnlContent.Name = "pnlContent";
        pnlContent.Padding = new Padding(12);
        pnlContent.Size = new Size(450, 177);
        pnlContent.TabIndex = 13;
        // 
        // SubscriptionInfo
        // 
        AcceptButton = btnOk;
        AccessibleDescription = "Dialog showing subscription and training details";
        AccessibleName = "Training Details Dialog";
        AutoScaleDimensions = new SizeF(96F, 96F);
        AutoScaleMode = AutoScaleMode.Dpi;
        BackColor = Color.White;
        ClientSize = new Size(504, 301);
        Controls.Add(lblTitle);
        Controls.Add(lblDescription);
        Controls.Add(pnlContent);
        Controls.Add(btnOk);
        FormBorderStyle = FormBorderStyle.FixedDialog;
        Icon = (Icon)resources.GetObject("$this.Icon");
        MaximizeBox = false;
        MinimizeBox = false;
        Name = "SubscriptionInfo";
        Padding = new Padding(16);
        ShowInTaskbar = false;
        StartPosition = FormStartPosition.CenterScreen;
        Text = "Training Details";
        Load += SubscriptionInfoDialog_Load;
        pnlContent.ResumeLayout(false);
        pnlContent.PerformLayout();
        ResumeLayout(false);
        PerformLayout();
    }

    #endregion

    private Label lblTitle;
    private Label lblDescription;
    private Label lblSubscriptionExpiry;
    private Label lblSubscriptionExpiryValue;
    private Label lblTrainingExpiry;
    private Label lblTrainingExpiryValue;
    private Label lblUpdatedOn;
    private Label lblUpdatedOnValue;
    private Label lblUser;
    private Label lblUserValue;
    private Label lblOrganization;
    private Label lblOrganizationValue;
    private Button btnOk;
    private Panel pnlContent;
}
