using Fiplex.Control.Software.WinForms.Core.Configuration;

namespace Fiplex.Control.Software.WinForms.Forms;

partial class frmLicense
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
        components = new System.ComponentModel.Container();
        System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(frmLicense));
        ToolTip1 = new ToolTip(components);
        chkNbEn0 = new CheckBox();
        chkNbEn1 = new CheckBox();
        chkAdjEn0 = new CheckBox();
        chkAdjEn1 = new CheckBox();
        chkSingEn0 = new CheckBox();
        chkSingEn1 = new CheckBox();
        txtPowDL0 = new TextBox();
        txtPowDL1 = new TextBox();
        cmdApply = new Button();
        pctOK = new PictureBox();
        pctKO = new PictureBox();
        Frame1 = new GroupBox();
        Label1 = new Label();
        Label2 = new Label();
        Label3 = new Label();
        Label4 = new Label();
        Label5 = new Label();
        Label6 = new Label();
        ((System.ComponentModel.ISupportInitialize)pctOK).BeginInit();
        ((System.ComponentModel.ISupportInitialize)pctKO).BeginInit();
        Frame1.SuspendLayout();
        SuspendLayout();
        // 
        // chkNbEn0
        // 
        chkNbEn0.BackColor = Color.FromArgb(255, 255, 255);
        chkNbEn0.Font = new Font("Segoe UI", 9F);
        chkNbEn0.ForeColor = Color.FromArgb(34, 34, 34);
        chkNbEn0.Location = new Point(206, 38);
        chkNbEn0.Name = "chkNbEn0";
        chkNbEn0.Size = new Size(20, 20);
        chkNbEn0.TabIndex = 8;
        ToolTip1.SetToolTip(chkNbEn0, "Enable Narrow Filters for Band 0");
        chkNbEn0.UseVisualStyleBackColor = false;
        // 
        // chkNbEn1
        // 
        chkNbEn1.BackColor = Color.FromArgb(255, 255, 255);
        chkNbEn1.Font = new Font("Segoe UI", 9F);
        chkNbEn1.ForeColor = Color.FromArgb(34, 34, 34);
        chkNbEn1.Location = new Point(270, 38);
        chkNbEn1.Name = "chkNbEn1";
        chkNbEn1.Size = new Size(20, 20);
        chkNbEn1.TabIndex = 9;
        ToolTip1.SetToolTip(chkNbEn1, "Enable Narrow Filters for Band 1");
        chkNbEn1.UseVisualStyleBackColor = false;
        // 
        // chkAdjEn0
        // 
        chkAdjEn0.BackColor = Color.FromArgb(255, 255, 255);
        chkAdjEn0.Font = new Font("Segoe UI", 9F);
        chkAdjEn0.ForeColor = Color.FromArgb(34, 34, 34);
        chkAdjEn0.Location = new Point(206, 62);
        chkAdjEn0.Name = "chkAdjEn0";
        chkAdjEn0.Size = new Size(20, 20);
        chkAdjEn0.TabIndex = 10;
        ToolTip1.SetToolTip(chkAdjEn0, "Enable Adjacent Bandwidth Filters for Band 0");
        chkAdjEn0.UseVisualStyleBackColor = false;
        // 
        // chkAdjEn1
        // 
        chkAdjEn1.BackColor = Color.FromArgb(255, 255, 255);
        chkAdjEn1.Font = new Font("Segoe UI", 9F);
        chkAdjEn1.ForeColor = Color.FromArgb(34, 34, 34);
        chkAdjEn1.Location = new Point(270, 62);
        chkAdjEn1.Name = "chkAdjEn1";
        chkAdjEn1.Size = new Size(20, 20);
        chkAdjEn1.TabIndex = 11;
        ToolTip1.SetToolTip(chkAdjEn1, "Enable Adjacent Bandwidth Filters for Band 1");
        chkAdjEn1.UseVisualStyleBackColor = false;
        // 
        // chkSingEn0
        // 
        chkSingEn0.BackColor = Color.FromArgb(255, 255, 255);
        chkSingEn0.Font = new Font("Segoe UI", 9F);
        chkSingEn0.ForeColor = Color.FromArgb(34, 34, 34);
        chkSingEn0.Location = new Point(206, 86);
        chkSingEn0.Name = "chkSingEn0";
        chkSingEn0.Size = new Size(20, 20);
        chkSingEn0.TabIndex = 12;
        ToolTip1.SetToolTip(chkSingEn0, "Enable Single Band mode for Band 0");
        chkSingEn0.UseVisualStyleBackColor = false;
        // 
        // chkSingEn1
        // 
        chkSingEn1.BackColor = Color.FromArgb(255, 255, 255);
        chkSingEn1.Font = new Font("Segoe UI", 9F);
        chkSingEn1.ForeColor = Color.FromArgb(34, 34, 34);
        chkSingEn1.Location = new Point(270, 86);
        chkSingEn1.Name = "chkSingEn1";
        chkSingEn1.Size = new Size(20, 20);
        chkSingEn1.TabIndex = 13;
        ToolTip1.SetToolTip(chkSingEn1, "Enable Single Band mode for Band 1");
        chkSingEn1.UseVisualStyleBackColor = false;
        // 
        // txtPowDL0
        // 
        txtPowDL0.BackColor = Color.FromArgb(255, 255, 255);
        txtPowDL0.BorderStyle = BorderStyle.FixedSingle;
        txtPowDL0.Font = new Font("Consolas", 9F);
        txtPowDL0.ForeColor = Color.FromArgb(34, 34, 34);
        txtPowDL0.Location = new Point(195, 108);
        txtPowDL0.MaxLength = 4;
        txtPowDL0.Name = "txtPowDL0";
        txtPowDL0.Size = new Size(41, 22);
        txtPowDL0.TabIndex = 14;
        txtPowDL0.TextAlign = HorizontalAlignment.Center;
        ToolTip1.SetToolTip(txtPowDL0, "Power Limit Downlink for Band 0 (-128 to 127 dBm)");
        // 
        // txtPowDL1
        // 
        txtPowDL1.BackColor = Color.FromArgb(255, 255, 255);
        txtPowDL1.BorderStyle = BorderStyle.FixedSingle;
        txtPowDL1.Font = new Font("Consolas", 9F);
        txtPowDL1.ForeColor = Color.FromArgb(34, 34, 34);
        txtPowDL1.Location = new Point(259, 108);
        txtPowDL1.MaxLength = 4;
        txtPowDL1.Name = "txtPowDL1";
        txtPowDL1.Size = new Size(41, 22);
        txtPowDL1.TabIndex = 15;
        txtPowDL1.TextAlign = HorizontalAlignment.Center;
        ToolTip1.SetToolTip(txtPowDL1, "Power Limit Downlink for Band 1 (-128 to 127 dBm)");
        // 
        // cmdApply
        // 
        cmdApply.BackColor = Color.FromArgb(0, 88, 155);
        cmdApply.Cursor = Cursors.Hand;
        cmdApply.FlatAppearance.BorderSize = 0;
        cmdApply.FlatAppearance.MouseDownBackColor = Color.FromArgb(0, 58, 112);
        cmdApply.FlatAppearance.MouseOverBackColor = Color.FromArgb(0, 58, 112);
        cmdApply.FlatStyle = FlatStyle.Flat;
        cmdApply.Font = new Font("Segoe UI", 9F);
        cmdApply.ForeColor = Color.White;
        cmdApply.Location = new Point(103, 152);
        cmdApply.MinimumSize = new Size(90, 30);
        cmdApply.Name = "cmdApply";
        cmdApply.Size = new Size(120, 30);
        cmdApply.TabIndex = 7;
        cmdApply.Text = "Apply Changes";
        ToolTip1.SetToolTip(cmdApply, "Send changes to device");
        cmdApply.UseVisualStyleBackColor = false;
        cmdApply.Click += cmdApply_Click;
        // 
        // pctOK
        // 
        pctOK.Image = (Image)resources.GetObject("pctOK.Image");
        pctOK.Location = new Point(231, 152);
        pctOK.Name = "pctOK";
        pctOK.Size = new Size(33, 33);
        pctOK.SizeMode = PictureBoxSizeMode.Zoom;
        pctOK.TabIndex = 16;
        pctOK.TabStop = false;
        ToolTip1.SetToolTip(pctOK, "Changes applied successfully");
        pctOK.Visible = false;
        // 
        // pctKO
        // 
        pctKO.Image = (Image)resources.GetObject("pctKO.Image");
        pctKO.Location = new Point(231, 152);
        pctKO.Name = "pctKO";
        pctKO.Size = new Size(33, 33);
        pctKO.SizeMode = PictureBoxSizeMode.Zoom;
        pctKO.TabIndex = 17;
        pctKO.TabStop = false;
        ToolTip1.SetToolTip(pctKO, "Error applying changes");
        pctKO.Visible = false;
        // 
        // Frame1
        // 
        Frame1.BackColor = Color.FromArgb(255, 255, 255);
        Frame1.Controls.Add(Label1);
        Frame1.Controls.Add(Label2);
        Frame1.Controls.Add(Label3);
        Frame1.Controls.Add(Label4);
        Frame1.Controls.Add(Label5);
        Frame1.Controls.Add(Label6);
        Frame1.Controls.Add(chkNbEn0);
        Frame1.Controls.Add(chkNbEn1);
        Frame1.Controls.Add(chkAdjEn0);
        Frame1.Controls.Add(chkAdjEn1);
        Frame1.Controls.Add(chkSingEn0);
        Frame1.Controls.Add(chkSingEn1);
        Frame1.Controls.Add(txtPowDL0);
        Frame1.Controls.Add(txtPowDL1);
        Frame1.Controls.Add(cmdApply);
        Frame1.Controls.Add(pctOK);
        Frame1.Controls.Add(pctKO);
        Frame1.Font = new Font("Segoe UI", 11F, FontStyle.Bold);
        Frame1.ForeColor = Color.FromArgb(34, 34, 34);
        Frame1.Location = new Point(8, 8);
        Frame1.Name = "Frame1";
        Frame1.Size = new Size(326, 193);
        Frame1.TabIndex = 0;
        Frame1.TabStop = false;
        Frame1.Text = "Device Options:";
        // 
        // Label1
        // 
        Label1.Font = new Font("Segoe UI", 9F);
        Label1.ForeColor = Color.FromArgb(34, 34, 34);
        Label1.Location = new Point(16, 40);
        Label1.Name = "Label1";
        Label1.Size = new Size(181, 17);
        Label1.TabIndex = 1;
        Label1.Text = "NARROW FILTERS ENABLED";
        // 
        // Label2
        // 
        Label2.Font = new Font("Segoe UI", 9F);
        Label2.ForeColor = Color.FromArgb(34, 34, 34);
        Label2.Location = new Point(16, 64);
        Label2.Name = "Label2";
        Label2.Size = new Size(193, 17);
        Label2.TabIndex = 2;
        Label2.Text = "ADJBW FILTERS ENABLED";
        // 
        // Label3
        // 
        Label3.Font = new Font("Segoe UI", 9F);
        Label3.ForeColor = Color.FromArgb(34, 34, 34);
        Label3.Location = new Point(16, 88);
        Label3.Name = "Label3";
        Label3.Size = new Size(153, 17);
        Label3.TabIndex = 3;
        Label3.Text = "SINGLE BAND ENABLED";
        // 
        // Label4
        // 
        Label4.Font = new Font("Segoe UI", 9F);
        Label4.ForeColor = Color.FromArgb(34, 34, 34);
        Label4.Location = new Point(16, 112);
        Label4.Name = "Label4";
        Label4.Size = new Size(177, 17);
        Label4.TabIndex = 4;
        Label4.Text = "POWER LIMIT DOWNLINK";
        // 
        // Label5
        // 
        Label5.Font = new Font("Segoe UI", 9F, FontStyle.Bold);
        Label5.ForeColor = Color.FromArgb(34, 34, 34);
        Label5.Location = new Point(184, 16);
        Label5.Name = "Label5";
        Label5.Size = new Size(64, 17);
        Label5.TabIndex = 5;
        Label5.Text = "BAND0";
        Label5.TextAlign = ContentAlignment.TopCenter;
        //
        // Label6
        //
        Label6.Font = new Font("Segoe UI", 9F, FontStyle.Bold);
        Label6.ForeColor = Color.FromArgb(34, 34, 34);
        Label6.Location = new Point(248, 16);
        Label6.Name = "Label6";
        Label6.Size = new Size(64, 17);
        Label6.TabIndex = 6;
        Label6.Text = "BAND1";
        Label6.TextAlign = ContentAlignment.TopCenter;
        // 
        // frmLicense
        // 
        AutoScaleDimensions = new SizeF(96F, 96F);
        AutoScaleMode = AutoScaleMode.Dpi;
        BackColor = Color.FromArgb(255, 255, 255);
        ClientSize = new Size(342, 213);
        Controls.Add(Frame1);
        Font = new Font("Segoe UI", 9F);
        FormBorderStyle = FormBorderStyle.FixedDialog;
        Icon = (Icon)resources.GetObject("$this.Icon");
        MaximizeBox = false;
        MinimizeBox = false;
        Name = "frmLicense";
        ShowInTaskbar = false;
        StartPosition = FormStartPosition.CenterParent;
        Text = "License Options";
        ((System.ComponentModel.ISupportInitialize)pctOK).EndInit();
        ((System.ComponentModel.ISupportInitialize)pctKO).EndInit();
        Frame1.ResumeLayout(false);
        Frame1.PerformLayout();
        ResumeLayout(false);
    }

    #endregion

    private ToolTip ToolTip1;
    private GroupBox Frame1;

    // Checkboxes for Narrow Filters
    private CheckBox chkNbEn0;
    private CheckBox chkNbEn1;

    // Checkboxes for AdjBW Filters
    private CheckBox chkAdjEn0;
    private CheckBox chkAdjEn1;

    // Checkboxes for Single Band
    private CheckBox chkSingEn0;
    private CheckBox chkSingEn1;

    // TextBoxes for Power Limit Downlink
    private TextBox txtPowDL0;
    private TextBox txtPowDL1;

    // Labels
    private Label Label1;  // NARROW FILTERS ENABLED
    private Label Label2;  // ADJBW FILTERS ENABLED
    private Label Label3;  // SINGLE BAND ENABLED
    private Label Label4;  // POWER LIMIT DOWNLINK
    private Label Label5;  // BAND0
    private Label Label6;  // BAND1

    // Apply Button
    private Button cmdApply;

    // Visual feedback OK/KO
    private PictureBox pctOK;
    private PictureBox pctKO;
}
