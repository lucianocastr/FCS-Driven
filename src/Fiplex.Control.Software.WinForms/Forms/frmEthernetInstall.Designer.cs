using System.ComponentModel;

namespace Fiplex.Control.Software.WinForms.Forms;

partial class frmEthernetInstall
{
    /// <summary>
    /// Required designer variable.
    /// </summary>
    private IContainer components = null;

    // Nota: El método Dispose está implementado en EthernetModuleDialog.cs
    // para manejar la liberación de CancellationTokenSource

    #region Windows Form Designer generated code

    /// <summary>
    /// Required method for Designer support - do not modify
    /// the contents of this method with the code editor.
    /// </summary>
    private void InitializeComponent()
    {
        ComponentResourceManager resources = new ComponentResourceManager(typeof(frmEthernetInstall));
        grpFrame = new GroupBox();
        pctKO = new PictureBox();
        pctOK = new PictureBox();
        cmdApply = new Button();
        chkEth = new CheckBox();
        grpFrame.SuspendLayout();
        ((ISupportInitialize)pctKO).BeginInit();
        ((ISupportInitialize)pctOK).BeginInit();
        SuspendLayout();
        // 
        // grpFrame
        // 
        grpFrame.AccessibleDescription = "Ethernet module configuration options";
        grpFrame.AccessibleName = "Ethernet Configuration Group";
        grpFrame.Controls.Add(pctKO);
        grpFrame.Controls.Add(pctOK);
        grpFrame.Controls.Add(cmdApply);
        grpFrame.Controls.Add(chkEth);
        grpFrame.Font = new Font("Segoe UI", 9F, FontStyle.Bold);
        grpFrame.ForeColor = Color.FromArgb(34, 34, 34);
        grpFrame.Location = new Point(16, 16);
        grpFrame.Name = "grpFrame";
        grpFrame.Padding = new Padding(10);
        grpFrame.Size = new Size(312, 102);
        grpFrame.TabIndex = 0;
        grpFrame.TabStop = false;
        grpFrame.Text = "Ethernet Module Configuration";
        // 
        // pctKO
        // 
        pctKO.AccessibleDescription = "Error indicator icon";
        pctKO.AccessibleName = "Error Icon";
        pctKO.BackColor = Color.Transparent;
        pctKO.Image = (Image)resources.GetObject("pctKO.Image");
        pctKO.Location = new Point(267, 65);
        pctKO.Name = "pctKO";
        pctKO.Size = new Size(32, 32);
        pctKO.SizeMode = PictureBoxSizeMode.Zoom;
        pctKO.TabIndex = 4;
        pctKO.TabStop = false;
        pctKO.Visible = false;
        // 
        // pctOK
        // 
        pctOK.AccessibleDescription = "Success indicator icon";
        pctOK.AccessibleName = "Success Icon";
        pctOK.BackColor = Color.Transparent;
        pctOK.Image = (Image)resources.GetObject("pctOK.Image");
        pctOK.Location = new Point(267, 65);
        pctOK.Name = "pctOK";
        pctOK.Size = new Size(32, 32);
        pctOK.SizeMode = PictureBoxSizeMode.Zoom;
        pctOK.TabIndex = 3;
        pctOK.TabStop = false;
        pctOK.Visible = false;
        // 
        // cmdApply
        // 
        cmdApply.AccessibleDescription = "Apply the Ethernet module configuration changes";
        cmdApply.AccessibleName = "Apply Changes Button";
        cmdApply.BackColor = Color.FromArgb(0, 88, 155);
        cmdApply.Cursor = Cursors.Hand;
        cmdApply.Enabled = false;
        cmdApply.FlatAppearance.BorderSize = 0;
        cmdApply.FlatAppearance.MouseDownBackColor = Color.FromArgb(0, 58, 112);
        cmdApply.FlatAppearance.MouseOverBackColor = Color.FromArgb(0, 58, 112);
        cmdApply.FlatStyle = FlatStyle.Flat;
        cmdApply.Font = new Font("Segoe UI", 9F);
        cmdApply.ForeColor = Color.White;
        cmdApply.Location = new Point(96, 65);
        cmdApply.MinimumSize = new Size(120, 30);
        cmdApply.Name = "cmdApply";
        cmdApply.Size = new Size(120, 30);
        cmdApply.TabIndex = 2;
        cmdApply.Text = "Apply Changes";
        cmdApply.UseVisualStyleBackColor = false;
        cmdApply.Click += cmdApply_Click;
        // 
        // chkEth
        // 
        chkEth.AccessibleDescription = "Toggle to indicate if Ethernet module is installed";
        chkEth.AccessibleName = "Ethernet Module Checkbox";
        chkEth.AutoSize = true;
        chkEth.Enabled = false;
        chkEth.Font = new Font("Segoe UI", 9F);
        chkEth.ForeColor = Color.FromArgb(34, 34, 34);
        chkEth.Location = new Point(30, 32);
        chkEth.Name = "chkEth";
        chkEth.Size = new Size(198, 19);
        chkEth.TabIndex = 1;
        chkEth.Text = "Ethernet Rabbit Module Installed";
        chkEth.UseVisualStyleBackColor = true;
        // 
        // frmEthernetInstall
        // 
        AccessibleDescription = "Dialog for configuring Ethernet module settings";
        AccessibleName = "Ethernet Module Configuration Dialog";
        AutoScaleDimensions = new SizeF(96F, 96F);
        AutoScaleMode = AutoScaleMode.Dpi;
        BackColor = Color.White;
        ClientSize = new Size(344, 136);
        Controls.Add(grpFrame);
        FormBorderStyle = FormBorderStyle.FixedDialog;
        Icon = (Icon)resources.GetObject("$this.Icon");
        MaximizeBox = false;
        MinimizeBox = false;
        Name = "frmEthernetInstall";
        Padding = new Padding(16);
        ShowInTaskbar = false;
        StartPosition = FormStartPosition.CenterParent;
        Text = "Ethernet Module";
        grpFrame.ResumeLayout(false);
        grpFrame.PerformLayout();
        ((ISupportInitialize)pctKO).EndInit();
        ((ISupportInitialize)pctOK).EndInit();
        ResumeLayout(false);
    }

    #endregion

    private GroupBox grpFrame;
    private PictureBox pctKO;
    private PictureBox pctOK;
    private Button cmdApply;
    private CheckBox chkEth;
}
