namespace Fiplex.Control.Software.WinForms.Forms;

using System.ComponentModel;

/// <summary>
/// Progress dialog for long-running serial operations.
/// </summary>
/// <remarks>
/// <para>Displayed during:</para>
/// <list type="bullet">
///   <item><description>Saving/Loading calibration (.calr)</description></item>
///   <item><description>Saving/Loading configuration (.cfgr)</description></item>
///   <item><description>Applying configurations to the device</description></item>
/// </list>
/// <para>Features:</para>
/// <list type="bullet">
///   <item><description>Progressive dots animation (100ms timer)</description></item>
///   <item><description>Forced TopMost for visibility</description></item>
///   <item><description>Prevention of manual close by user</description></item>
///   <item><description>Externally queryable cancellation flag</description></item>
/// </list>
/// <para>Usage pattern:</para>
/// <code>
/// using var progress = new frmMessage();
/// progress.SetMessage("Applying Configuration");
/// progress.Show();
/// try { /* operation */ }
/// finally { progress.TryUnload(); }
/// </code>
/// </remarks>
public partial class frmMessage : Form
{
    #region Private Fields

    /// <summary>
    /// Indicates if the close was requested programmatically.
    /// </summary>
    private bool _programmaticClose;

    #endregion

    #region Public Properties

    /// <summary>
    /// Externally queryable cancellation flag.
    /// </summary>
    [Browsable(false)]
    [DesignerSerializationVisibility(DesignerSerializationVisibility.Hidden)]
    public bool CancelRequested { get; private set; }

    /// <summary>
    /// Gets or sets the main message text.
    /// </summary>
    [Browsable(false)]
    [DesignerSerializationVisibility(DesignerSerializationVisibility.Hidden)]
    public string MessageText
    {
        get => SafeGetText(lblMessage);
        set => SafeSetText(lblMessage, value);
    }

    /// <summary>
    /// Gets or sets the progress indicator text.
    /// </summary>
    [Browsable(false)]
    [DesignerSerializationVisibility(DesignerSerializationVisibility.Hidden)]
    public string ProgressText
    {
        get => SafeGetText(lblProgress);
        set => SafeSetText(lblProgress, value);
    }

    #endregion

    #region Constructor

    public frmMessage()
    {
        InitializeComponent();
    }

    #endregion

    #region Public Methods

    /// <summary>
    /// Updates the main message displayed and resets progress.
    /// Thread-safe.
    /// </summary>
    /// <param name="message">Message to display.</param>
    public void SetMessage(string message)
    {
        if (IsDisposed) return;

        try
        {
            if (InvokeRequired)
            {
                Invoke(() => SetMessage(message));
                return;
            }

            lblMessage.Text = message;
            lblProgress.Text = "";
        }
        catch (ObjectDisposedException)
        {
            // Form already disposed - ignore
        }
        catch (InvalidOperationException)
        {
            // Invalid handle - ignore
        }
    }

    /// <summary>
    /// Shows or hides the cancel button.
    /// Automatically adjusts form height.
    /// </summary>
    /// <param name="show">True to show.</param>
    public void ShowCancelButton(bool show = true)
    {
        if (IsDisposed) return;

        try
        {
            if (InvokeRequired)
            {
                Invoke(() => ShowCancelButton(show));
                return;
            }

            cmdCancel.Visible = show;
            ClientSize = show
                ? new Size(ClientSize.Width, 140)
                : new Size(304, 97);
        }
        catch (ObjectDisposedException)
        {
            // Form already disposed - ignore
        }
    }

    /// <summary>
    /// Resets form state for reuse.
    /// </summary>
    public void Reset()
    {
        if (IsDisposed) return;

        try
        {
            if (InvokeRequired)
            {
                Invoke(Reset);
                return;
            }

            CancelRequested = false;
            lblMessage.Text = "";
            lblProgress.Text = ".";
            cmdCancel.Visible = false;
            ClientSize = new Size(304, 97);
        }
        catch (ObjectDisposedException)
        {
            // Form already disposed - ignore
        }
    }

    /// <summary>
    /// Closes the form programmatically, bypassing FormClosing blocking.
    /// </summary>
    public void CloseProgress()
    {
        if (IsDisposed) return;

        try
        {
            if (InvokeRequired)
            {
                Invoke(CloseProgress);
                return;
            }

            _programmaticClose = true;
            tmrProgress.Enabled = false;
            Close();
        }
        catch (ObjectDisposedException)
        {
            // Already disposed
        }
        catch (InvalidOperationException)
        {
            // Invalid handle
        }
    }

    #endregion

    #region Form Events

    /// <summary>
    /// Initializes visual state and cancellation flag.
    /// </summary>
    protected override void OnLoad(EventArgs e)
    {
        base.OnLoad(e);
        
        CancelRequested = false;
        _programmaticClose = false;
        lblProgress.Text = ".";

        ApplyWhiteBackground();
    }

    /// <summary>
    /// Forces window as TopMost and centers on screen.
    /// </summary>
    protected override void OnActivated(EventArgs e)
    {
        base.OnActivated(e);
        TopMost = true;
        CenterToScreen();
    }

    /// <summary>
    /// Prevents manual close by user.
    /// </summary>
    /// <remarks>
    /// Only CloseProgress(), TryUnload() or programmatic close can close this form.
    /// Manual close by user (X button) is blocked.
    /// </remarks>
    protected override void OnFormClosing(FormClosingEventArgs e)
    {
        // Allow programmatic close
        if (_programmaticClose || e.CloseReason != CloseReason.UserClosing)
        {
            tmrProgress.Enabled = false;
            base.OnFormClosing(e);
            return;
        }

        // Block manual close by user
        e.Cancel = true;
    }

    /// <summary>
    /// Re-applies colors if resized.
    /// </summary>
    protected override void OnResize(EventArgs e)
    {
        base.OnResize(e);
        ApplyWhiteBackground();
    }

    #endregion

    #region Event Handlers

    /// <summary>
    /// Progressive dots animation (max 33 characters).
    /// </summary>
    private void tmrProgress_Tick(object sender, EventArgs e)
    {
        if (IsDisposed || lblProgress == null) return;

        try
        {
            if (lblProgress.Text.Length >= 33)
                lblProgress.Text = "";

            lblProgress.Text += ".";
        }
        catch (ObjectDisposedException)
        {
            // Control disposed during tick - stop timer
            tmrProgress.Enabled = false;
        }
    }

    /// <summary>
    /// Activates cancellation flag.
    /// </summary>
    private void cmdCancel_Click(object sender, EventArgs e)
    {
        CancelRequested = true;
    }

    #endregion

    #region Private Helper Methods

    /// <summary>
    /// Applies white background to main controls.
    /// </summary>
    private void ApplyWhiteBackground()
    {
        if (IsDisposed) return;

        BackColor = Color.White;
        
        if (lblProgress != null)
            lblProgress.BackColor = Color.White;
        
        if (lblMessage != null)
            lblMessage.BackColor = Color.White;
    }

    /// <summary>
    /// Gets text from a control in a thread-safe manner.
    /// </summary>
    private string SafeGetText(System.Windows.Forms.Control? control)
    {
        if (control == null || IsDisposed)
            return string.Empty;

        try
        {
            if (InvokeRequired)
                return (string)Invoke(() => SafeGetText(control));

            return control.Text;
        }
        catch (ObjectDisposedException)
        {
            return string.Empty;
        }
        catch (InvalidOperationException)
        {
            return string.Empty;
        }
    }

    /// <summary>
    /// Sets text on a control in a thread-safe manner.
    /// </summary>
    private void SafeSetText(System.Windows.Forms.Control? control, string value)
    {
        if (control == null || IsDisposed)
            return;

        try
        {
            if (InvokeRequired)
            {
                Invoke(() => SafeSetText(control, value));
                return;
            }

            control.Text = value;
        }
        catch (ObjectDisposedException)
        {
            // Control already disposed - ignore
        }
        catch (InvalidOperationException)
        {
            // Invalid handle - ignore
        }
    }

    #endregion
}
