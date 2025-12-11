namespace Fiplex.Control.Software.WinForms.Forms;

using System.ComponentModel;

/// <summary>
/// Diálogo de progreso para operaciones seriales prolongadas.
/// </summary>
/// <remarks>
/// <para>Se muestra durante:</para>
/// <list type="bullet">
///   <item><description>Guardado/Carga de calibración (.calr)</description></item>
///   <item><description>Guardado/Carga de configuración (.cfgr)</description></item>
///   <item><description>Aplicación de configuraciones al dispositivo</description></item>
/// </list>
/// <para>Características:</para>
/// <list type="bullet">
///   <item><description>Animación de puntos progresivos (timer 100ms)</description></item>
///   <item><description>TopMost forzado para visibilidad</description></item>
///   <item><description>Prevención de cierre manual por usuario</description></item>
///   <item><description>Bandera de cancelación consultable externamente</description></item>
/// </list>
/// <para>Patrón de uso:</para>
/// <code>
/// using var progress = new frmMessage();
/// progress.SetMessage("Applying Configuration");
/// progress.Show();
/// try { /* operación */ }
/// finally { progress.TryUnload(); }
/// </code>
/// </remarks>
public partial class frmMessage : Form
{
    #region Campos privados

    /// <summary>
    /// Indica si el cierre fue solicitado programáticamente.
    /// </summary>
    private bool _programmaticClose;

    #endregion

    #region Propiedades públicas

    /// <summary>
    /// Bandera de cancelación consultable externamente.
    /// </summary>
    [Browsable(false)]
    [DesignerSerializationVisibility(DesignerSerializationVisibility.Hidden)]
    public bool CancelRequested { get; private set; }

    /// <summary>
    /// Obtiene o establece el texto del mensaje principal.
    /// </summary>
    [Browsable(false)]
    [DesignerSerializationVisibility(DesignerSerializationVisibility.Hidden)]
    public string MessageText
    {
        get => SafeGetText(lblMessage);
        set => SafeSetText(lblMessage, value);
    }

    /// <summary>
    /// Obtiene o establece el texto del indicador de progreso.
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

    #region Métodos públicos

    /// <summary>
    /// Actualiza el mensaje principal mostrado y resetea el progreso.
    /// Thread-safe.
    /// </summary>
    /// <param name="message">Mensaje a mostrar.</param>
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
            // Formulario ya dispuesto - ignorar
        }
        catch (InvalidOperationException)
        {
            // Handle no válido - ignorar
        }
    }

    /// <summary>
    /// Muestra u oculta el botón de cancelación.
    /// Ajusta automáticamente la altura del formulario.
    /// </summary>
    /// <param name="show">True para mostrar.</param>
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
            // Formulario ya dispuesto - ignorar
        }
    }

    /// <summary>
    /// Resetea el estado del formulario para reutilización.
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
            // Formulario ya dispuesto - ignorar
        }
    }

    /// <summary>
    /// Cierra el formulario programáticamente, evitando el bloqueo de FormClosing.
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
            // Ya dispuesto
        }
        catch (InvalidOperationException)
        {
            // Handle no válido
        }
    }

    #endregion

    #region Eventos del formulario

    /// <summary>
    /// Inicializa estado visual y bandera de cancelación.
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
    /// Fuerza ventana como TopMost y centra en pantalla.
    /// </summary>
    protected override void OnActivated(EventArgs e)
    {
        base.OnActivated(e);
        TopMost = true;
        CenterToScreen();
    }

    /// <summary>
    /// Impide cierre manual por el usuario.
    /// </summary>
    /// <remarks>
    /// Solo CloseProgress(), TryUnload() o cierre programático puede cerrar este formulario.
    /// El cierre manual por el usuario (botón X) es bloqueado.
    /// </remarks>
    protected override void OnFormClosing(FormClosingEventArgs e)
    {
        // Permitir cierre programático
        if (_programmaticClose || e.CloseReason != CloseReason.UserClosing)
        {
            tmrProgress.Enabled = false;
            base.OnFormClosing(e);
            return;
        }

        // Bloquear cierre manual por usuario
        e.Cancel = true;
    }

    /// <summary>
    /// Re-aplica colores si se redimensiona.
    /// </summary>
    protected override void OnResize(EventArgs e)
    {
        base.OnResize(e);
        ApplyWhiteBackground();
    }

    #endregion

    #region Event Handlers

    /// <summary>
    /// Animación de puntos progresivos (máx 33 caracteres).
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
            // Control dispuesto durante tick - detener timer
            tmrProgress.Enabled = false;
        }
    }

    /// <summary>
    /// Activa bandera de cancelación.
    /// </summary>
    private void cmdCancel_Click(object sender, EventArgs e)
    {
        CancelRequested = true;
    }

    #endregion

    #region Métodos privados auxiliares

    /// <summary>
    /// Aplica fondo blanco a controles principales.
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
    /// Obtiene texto de un control de forma thread-safe.
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
    /// Establece texto de un control de forma thread-safe.
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
            // Control ya dispuesto - ignorar
        }
        catch (InvalidOperationException)
        {
            // Handle no válido - ignorar
        }
    }

    #endregion
}
