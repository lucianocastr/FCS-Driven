namespace Fiplex.Control.Software.WinForms.Forms;

partial class frmMessage
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
    /// 
    /// NOTE: Fiplex styles are applied using literal values at design time.
    /// Colors correspond to FiplexTheme:
    /// - PrimaryColor: RGB(0, 88, 155) = #00589B
    /// - BackgroundMain: RGB(255, 255, 255) = White
    /// - TextPrimary: RGB(34, 34, 34) = #222222
    /// - BorderSoft: RGB(221, 221, 221) = #DDDDDD
    /// 
    /// DO NOT use ControlStyleExtensions, ApplyFiplexStyles or ApplyFiplexFormStyle.
    /// </summary>
    private void InitializeComponent()
    {
        components = new System.ComponentModel.Container();
        System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(frmMessage));
        lblMessage = new Label();
        lblProgress = new Label();
        cmdCancel = new Button();
        tmrProgress = new System.Windows.Forms.Timer(components);
        toolTip1 = new ToolTip(components);
        SuspendLayout();
        // 
        // lblMessage
        // 
        lblMessage.BackColor = Color.White;
        lblMessage.Font = new Font("Segoe UI", 14.25F, FontStyle.Bold);
        lblMessage.ForeColor = Color.FromArgb(0, 88, 155);
        lblMessage.Location = new Point(16, 8);
        lblMessage.Name = "lblMessage";
        lblMessage.Size = new Size(265, 49);
        lblMessage.TabIndex = 0;
        lblMessage.TextAlign = ContentAlignment.TopCenter;
        // 
        // lblProgress
        // 
        lblProgress.BackColor = Color.White;
        lblProgress.Font = new Font("Segoe UI", 15.75F);
        lblProgress.ForeColor = Color.FromArgb(1, 83, 165);
        lblProgress.Location = new Point(16, 56);
        lblProgress.Name = "lblProgress";
        lblProgress.Size = new Size(356, 33);
        lblProgress.TabIndex = 1;
        lblProgress.Text = ".................................";
        // 
        // cmdCancel
        // 
        cmdCancel.Font = new Font("Segoe UI", 9F);
        cmdCancel.ForeColor = Color.FromArgb(34, 34, 34);
        cmdCancel.Location = new Point(147, 96);
        cmdCancel.Name = "cmdCancel";
        cmdCancel.Size = new Size(90, 30);
        cmdCancel.TabIndex = 2;
        cmdCancel.Text = "Cancel";
        cmdCancel.UseVisualStyleBackColor = false;
        cmdCancel.Visible = false;
        cmdCancel.Click += cmdCancel_Click;
        // 
        // tmrProgress
        // 
        tmrProgress.Enabled = true;
        tmrProgress.Tick += tmrProgress_Tick;
        // 
        // frmMessage
        // 
        AutoScaleMode = AutoScaleMode.None;
        BackColor = Color.White;
        ClientSize = new Size(384, 131);
        Controls.Add(cmdCancel);
        Controls.Add(lblProgress);
        Controls.Add(lblMessage);
        Font = new Font("Segoe UI", 8.25F);
        FormBorderStyle = FormBorderStyle.FixedSingle;
        Icon = (Icon)resources.GetObject("$this.Icon");
        MaximizeBox = false;
        Name = "frmMessage";
        StartPosition = FormStartPosition.CenterScreen;
        Text = "Progress";
        ResumeLayout(false);
    }

    #endregion

    /// <summary>
    /// Label for main message.
    /// </summary>
    private Label lblMessage;
    
    /// <summary>
    /// Label for animated progress indicator.
    /// </summary>
    private Label lblProgress;
    
    /// <summary>
    /// Cancel button (hidden by default).
    /// </summary>
    private Button cmdCancel;
    
    /// <summary>
    /// Timer for progress animation (100ms).
    /// </summary>
    private System.Windows.Forms.Timer tmrProgress;
    
    /// <summary>
    /// Auxiliary ToolTip.
    /// </summary>
    private ToolTip toolTip1;
}