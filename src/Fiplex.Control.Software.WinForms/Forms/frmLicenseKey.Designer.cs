namespace Fiplex.Control.Software.WinForms.Forms
{
    partial class frmLicenseKey
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
        /// <remarks>
        /// Layout:
        /// - Form: ~270x85 px (compacto)
        /// - GroupBox sin texto, borde sutil
        /// - Key + TextBox en fila superior
        /// - Dos botones centrados + indicador OK/KO
        /// </remarks>
        private void InitializeComponent()
        {
            components = new System.ComponentModel.Container();
            System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(frmLicenseKey));
            Frame1 = new GroupBox();
            lblKey = new Label();
            txtKey = new TextBox();
            btnEnableFeature = new Button();
            btnDisableFeature = new Button();
            pctOK = new PictureBox();
            pctKO = new PictureBox();
            tmrKey = new System.Windows.Forms.Timer(components);
            Frame1.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)pctOK).BeginInit();
            ((System.ComponentModel.ISupportInitialize)pctKO).BeginInit();
            SuspendLayout();
            // 
            // Frame1
            // 
            Frame1.Controls.Add(lblKey);
            Frame1.Controls.Add(txtKey);
            Frame1.Controls.Add(btnEnableFeature);
            Frame1.Controls.Add(btnDisableFeature);
            Frame1.Controls.Add(pctOK);
            Frame1.Controls.Add(pctKO);
            Frame1.Location = new Point(4, 4);
            Frame1.Name = "Frame1";
            Frame1.Size = new Size(360, 103);
            Frame1.TabIndex = 0;
            Frame1.TabStop = false;
            // 
            // lblKey
            // 
            lblKey.AutoSize = true;
            lblKey.Font = new Font("Segoe UI", 9F, FontStyle.Bold);
            lblKey.ForeColor = Color.FromArgb(34, 34, 34);
            lblKey.Location = new Point(8, 16);
            lblKey.Name = "lblKey";
            lblKey.Size = new Size(31, 15);
            lblKey.TabIndex = 0;
            lblKey.Text = "Key:";
            // 
            // txtKey
            // 
            txtKey.BackColor = Color.White;
            txtKey.BorderStyle = BorderStyle.FixedSingle;
            txtKey.CharacterCasing = CharacterCasing.Upper;
            txtKey.Font = new Font("Consolas", 9F);
            txtKey.ForeColor = Color.FromArgb(34, 34, 34);
            txtKey.Location = new Point(45, 13);
            txtKey.MaxLength = 64;
            txtKey.Name = "txtKey";
            txtKey.Size = new Size(305, 22);
            txtKey.TabIndex = 1;
            // 
            // btnEnableFeature
            // 
            btnEnableFeature.BackColor = Color.FromArgb(0, 88, 155);
            btnEnableFeature.Cursor = Cursors.Hand;
            btnEnableFeature.FlatAppearance.BorderColor = Color.FromArgb(0, 58, 112);
            btnEnableFeature.FlatStyle = FlatStyle.Flat;
            btnEnableFeature.Font = new Font("Segoe UI", 9F);
            btnEnableFeature.ForeColor = Color.White;
            btnEnableFeature.Location = new Point(57, 55);
            btnEnableFeature.Name = "btnEnableFeature";
            btnEnableFeature.Size = new Size(120, 30);
            btnEnableFeature.TabIndex = 2;
            btnEnableFeature.Text = "Enable Feature";
            btnEnableFeature.UseVisualStyleBackColor = false;
            // 
            // btnDisableFeature
            // 
            btnDisableFeature.BackColor = Color.White;
            btnDisableFeature.Cursor = Cursors.Hand;
            btnDisableFeature.FlatAppearance.BorderColor = Color.FromArgb(221, 221, 221);
            btnDisableFeature.FlatStyle = FlatStyle.Flat;
            btnDisableFeature.Font = new Font("Segoe UI", 9F);
            btnDisableFeature.ForeColor = Color.FromArgb(34, 34, 34);
            btnDisableFeature.Location = new Point(183, 55);
            btnDisableFeature.Name = "btnDisableFeature";
            btnDisableFeature.Size = new Size(120, 30);
            btnDisableFeature.TabIndex = 3;
            btnDisableFeature.Text = "Disable Feature";
            btnDisableFeature.UseVisualStyleBackColor = false;
            // 
            // pctOK
            // 
            pctOK.Image = (Image)resources.GetObject("pctOK.Image");
            pctOK.Location = new Point(318, 55);
            pctOK.Name = "pctOK";
            pctOK.Size = new Size(32, 32);
            pctOK.TabIndex = 4;
            pctOK.TabStop = false;
            pctOK.Visible = false;
            // 
            // pctKO
            // 
            pctKO.Image = (Image)resources.GetObject("pctKO.Image");
            pctKO.Location = new Point(318, 55);
            pctKO.Name = "pctKO";
            pctKO.Size = new Size(32, 32);
            pctKO.TabIndex = 5;
            pctKO.TabStop = false;
            pctKO.Visible = false;
            // 
            // tmrKey
            // 
            tmrKey.Interval = 200;
            tmrKey.Tick += TmrKey_Tick;
            // 
            // frmLicenseKey
            // 
            AutoScaleDimensions = new SizeF(7F, 15F);
            AutoScaleMode = AutoScaleMode.Font;
            BackColor = Color.FromArgb(245, 245, 245);
            ClientSize = new Size(369, 111);
            Controls.Add(Frame1);
            FormBorderStyle = FormBorderStyle.FixedSingle;
            Icon = (Icon)resources.GetObject("$this.Icon");
            MaximizeBox = false;
            MinimizeBox = false;
            Name = "frmLicenseKey";
            StartPosition = FormStartPosition.CenterParent;
            Text = "License";
            Frame1.ResumeLayout(false);
            Frame1.PerformLayout();
            ((System.ComponentModel.ISupportInitialize)pctOK).EndInit();
            ((System.ComponentModel.ISupportInitialize)pctKO).EndInit();
            ResumeLayout(false);
        }

        #endregion

        private GroupBox Frame1;
        private Label lblKey;
        private TextBox txtKey;
        private Button btnEnableFeature;
        private Button btnDisableFeature;
        private PictureBox pctOK;
        private PictureBox pctKO;
        private System.Windows.Forms.Timer tmrKey;
    }
}