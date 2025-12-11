using System.ComponentModel;
using Fiplex.Control.Software.WinForms.Core.Configuration;
using Fiplex.Control.Software.WinForms.Core.Serial.Interfaces;
using Fiplex.Control.Software.WinForms.Core.Serial.Models;
using Microsoft.Extensions.Logging;

namespace Fiplex.Control.Software.WinForms.Forms;

/// <summary>
/// Diálogo para visualización y edición de la licencia del dispositivo.
/// </summary>
/// <remarks>
/// <para>Funcionalidad:</para>
/// <list type="bullet">
///   <item><description>Modo lectura: Visualiza información de licencia actual</description></item>
///   <item><description>Modo edición: Permite escribir nueva licencia al dispositivo</description></item>
/// </list>
/// <para>Comando serial para escritura: <c>;0{Index:X2}{Key64}</c> donde Index es 00 o 01.</para>
/// </remarks>
public partial class LicenseKeyDialog : Form
{
    private readonly ISerialCommandPipeline? _pipeline;
    private readonly ILogger<LicenseKeyDialog>? _logger;
    
    private bool _isReadOnly;
    private bool _isApplying;
    private CancellationTokenSource? _cts;
    
    // Indicadores visuales de feedback (paneles verde/rojo)
    private Panel? _pctOK;
    private Panel? _pctKO;

    /// <summary>
    /// Evento disparado cuando se aplica la licencia exitosamente.
    /// </summary>
    /// <remarks>
    /// Permite a frmMain ejecutar WebRefresh para actualizar la UI del dispositivo.
    /// </remarks>
    public event EventHandler? LicenseApplied;

    /// <summary>
    /// Índice de licencia a aplicar (0 o 1).
    /// </summary>
    /// <remarks>
    /// Se usa en el comando serial: <c>;0{Index:X2}{Key64}</c>
    /// </remarks>
    [DesignerSerializationVisibility(DesignerSerializationVisibility.Hidden)]
    public int LicenseIndex { get; set; }

    /// <summary>
    /// Obtiene o establece la clave de licencia.
    /// </summary>
    [DesignerSerializationVisibility(DesignerSerializationVisibility.Hidden)]
    public string LicenseKey
    {
        get => txtLicenseKey.Text;
        set => txtLicenseKey.Text = value ?? string.Empty;
    }

    /// <summary>
    /// Obtiene o establece el nombre del dispositivo (solo lectura).
    /// </summary>
    [DesignerSerializationVisibility(DesignerSerializationVisibility.Hidden)]
    public string DeviceName
    {
        get => lblDeviceValue.Text;
        set => lblDeviceValue.Text = value ?? string.Empty;
    }

    /// <summary>
    /// Obtiene o establece el tipo de dispositivo (solo lectura).
    /// </summary>
    [DesignerSerializationVisibility(DesignerSerializationVisibility.Hidden)]
    public string DeviceType
    {
        get => lblTypeValue.Text;
        set => lblTypeValue.Text = value ?? string.Empty;
    }

    /// <summary>
    /// Obtiene o establece la versión del dispositivo (solo lectura).
    /// </summary>
    [DesignerSerializationVisibility(DesignerSerializationVisibility.Hidden)]
    public string DeviceVersion
    {
        get => lblVersionValue.Text;
        set => lblVersionValue.Text = value ?? string.Empty;
    }

    /// <summary>
    /// Obtiene o establece el estado de la licencia.
    /// </summary>
    [DesignerSerializationVisibility(DesignerSerializationVisibility.Hidden)]
    public string LicenseStatus
    {
        get => lblStatusValue.Text;
        set
        {
            lblStatusValue.Text = value ?? string.Empty;
            // Cambiar color según estado
            lblStatusValue.ForeColor = value?.Contains("Valid", StringComparison.OrdinalIgnoreCase) == true
                ? FiplexTheme.StateSuccess
                : FiplexTheme.StateError;
        }
    }

    /// <summary>
    /// Obtiene o establece la fecha de expiración.
    /// </summary>
    [DesignerSerializationVisibility(DesignerSerializationVisibility.Hidden)]
    public string ExpirationDate
    {
        get => lblExpirationValue.Text;
        set => lblExpirationValue.Text = value ?? string.Empty;
    }

    /// <summary>
    /// Indica si el diálogo está en modo solo lectura.
    /// </summary>
    [DesignerSerializationVisibility(DesignerSerializationVisibility.Hidden)]
    public bool IsReadOnly
    {
        get => _isReadOnly;
        set
        {
            _isReadOnly = value;
            UpdateReadOnlyMode();
        }
    }

    /// <summary>
    /// Constructor con inyección de dependencias para modo edición.
    /// </summary>
    public LicenseKeyDialog(
        ISerialCommandPipeline pipeline,
        ILogger<LicenseKeyDialog> logger)
    {
        _pipeline = pipeline;
        _logger = logger;
        
        InitializeComponent();
        InitializeFeedbackIndicators();
        SetupValidation();
    }

    /// <summary>
    /// Constructor sin parámetros para modo solo lectura (compatibilidad Designer).
    /// </summary>
    public LicenseKeyDialog()
    {
        InitializeComponent();
        InitializeFeedbackIndicators();
        SetupValidation();
    }
    
    /// <summary>
    /// Inicializa indicadores visuales de feedback (panel verde para éxito, rojo para error).
    /// </summary>
    private void InitializeFeedbackIndicators()
    {
        // Panel de éxito (verde)
        _pctOK = new Panel
        {
            Size = new Size(16, 16),
            BackColor = FiplexTheme.StateSuccess,
            Visible = false,
            Anchor = AnchorStyles.Top | AnchorStyles.Right
        };
        
        // Panel de error (rojo)
        _pctKO = new Panel
        {
            Size = new Size(16, 16),
            BackColor = FiplexTheme.StateError,
            Visible = false,
            Anchor = AnchorStyles.Top | AnchorStyles.Right
        };
        
        // Posicionar junto al botón Apply
        _pctOK.Location = new Point(btnApply.Left - 24, btnApply.Top + 7);
        _pctKO.Location = new Point(btnApply.Left - 24, btnApply.Top + 7);
        
        panelButtons.Controls.Add(_pctOK);
        panelButtons.Controls.Add(_pctKO);
    }
    
    /// <summary>
    /// Configura validación en tiempo real del campo de licencia.
    /// </summary>
    private void SetupValidation()
    {
        txtLicenseKey.TextChanged += TxtLicenseKey_TextChanged;
        txtLicenseKey.MaxLength = 64;
        txtLicenseKey.CharacterCasing = CharacterCasing.Upper;
    }
    
    /// <summary>
    /// Valida la clave en tiempo real al cambiar el texto.
    /// </summary>
    /// <remarks>
    /// Habilita el botón Apply solo si la clave tiene exactamente 64 caracteres hexadecimales.
    /// </remarks>
    private void TxtLicenseKey_TextChanged(object? sender, EventArgs e)
    {
        if (_isApplying) return;
        
        var isValid = IsValidHexKey(txtLicenseKey.Text);
        btnApply.Enabled = isValid && !_isReadOnly;
    }
    
    /// <summary>
    /// Valida que la clave sea exactamente 64 caracteres hexadecimales.
    /// </summary>
    private static bool IsValidHexKey(string key)
    {
        if (string.IsNullOrEmpty(key) || key.Length != 64)
            return false;
        
        return key.All(c => char.IsAsciiHexDigit(c));
    }

    /// <summary>
    /// Actualiza la UI según el modo (lectura vs edición).
    /// </summary>
    private void UpdateReadOnlyMode()
    {
        txtLicenseKey.ReadOnly = _isReadOnly;
        btnApply.Visible = !_isReadOnly;
        
        // Actualizar estado inicial del botón Apply según validación
        if (!_isReadOnly)
        {
            btnApply.Enabled = IsValidHexKey(txtLicenseKey.Text);
        }
        
        if (_isReadOnly)
        {
            Text = "License Information";
            btnClose.Text = "Close";
            grpLicenseKey.Text = "Current License Key";
        }
        else
        {
            Text = "Edit License Key";
            btnClose.Text = "Cancel";
            grpLicenseKey.Text = "Enter New License Key (64 hex characters)";
        }
    }

    /// <summary>
    /// Valida el formato de la clave de licencia.
    /// </summary>
    /// <returns><c>true</c> si la clave es válida (64 caracteres hex); <c>false</c> en caso contrario.</returns>
    private bool ValidateLicenseKey()
    {
        var key = txtLicenseKey.Text.Trim();
        
        if (string.IsNullOrWhiteSpace(key))
        {
            MessageBox.Show(
                "License key cannot be empty.",
                "Validation Error",
                MessageBoxButtons.OK,
                MessageBoxIcon.Warning);
            txtLicenseKey.Focus();
            return false;
        }

        // Validar longitud exacta de 64 caracteres
        if (key.Length != 64)
        {
            MessageBox.Show(
                $"License key must be exactly 64 hexadecimal characters.\nCurrent length: {key.Length}",
                "Validation Error",
                MessageBoxButtons.OK,
                MessageBoxIcon.Warning);
            txtLicenseKey.Focus();
            return false;
        }
        
        // Validar caracteres hexadecimales
        if (!IsValidHexKey(key))
        {
            MessageBox.Show(
                "License key must contain only hexadecimal characters (0-9, A-F).",
                "Validation Error",
                MessageBoxButtons.OK,
                MessageBoxIcon.Warning);
            txtLicenseKey.Focus();
            return false;
        }

        return true;
    }

    /// <summary>
    /// Aplica la licencia al dispositivo.
    /// </summary>
    /// <remarks>
    /// <para>Flujo de ejecución:</para>
    /// <list type="number">
    ///   <item><description>Validar clave (64 caracteres hexadecimales)</description></item>
    ///   <item><description>Deshabilitar controles durante la operación</description></item>
    ///   <item><description>Enviar comando <c>;0{Index:X2}{Key64}</c></description></item>
    ///   <item><description>Mostrar feedback visual (OK/KO)</description></item>
    ///   <item><description>Esperar 2000ms para visualizar resultado</description></item>
    ///   <item><description>Si éxito: disparar evento LicenseApplied y cerrar</description></item>
    /// </list>
    /// </remarks>
    private async void btnApply_Click(object sender, EventArgs e)
    {
        if (!ValidateLicenseKey())
        {
            return;
        }
        
        // Verificar que tenemos pipeline para enviar comandos
        if (_pipeline == null)
        {
            _logger?.LogWarning("Pipeline no disponible - cerrando con DialogResult.OK");
            DialogResult = DialogResult.OK;
            return;
        }

        _cts?.Cancel();
        _cts = new CancellationTokenSource();
        var ct = _cts.Token;
        
        try
        {
            _isApplying = true;
            
            // Deshabilitar controles durante operación
            SetControlsEnabled(false);
            
            // Mostrar cursor de espera
            Cursor = Cursors.WaitCursor;
            
            _logger?.LogDebug("Enviando licencia (Index: {Index})", LicenseIndex);
            
            // Formato: ;0{Index:X2}{Key64} - ej: ;000AABBCCDD...64chars
            var indexHex = LicenseIndex.ToString("X2");
            var command = new SerialCommand
            {
                Payload = $";0{indexHex}{txtLicenseKey.Text}",
                ExpectsAck = true,
                ExpectsData = false,  // Solo espera ACK
                CancellationToken = ct
            };
            
            var result = await _pipeline.EnqueueCommandAsync(command);
            
            ct.ThrowIfCancellationRequested();
            
            // Verificar resultado de la operación
            if (result.Success)
            {
                ShowSuccessFeedback();
                _logger?.LogInformation("Licencia aplicada exitosamente (Index: {Index})", LicenseIndex);
            }
            else
            {
                ShowFailureFeedback();
                _logger?.LogWarning("Error aplicando licencia. Status: {Status}", result.Status);
            }
            
            // Esperar para mostrar feedback visual
            await Task.Delay(2000, ct);
            
            // Ocultar indicadores de feedback
            HideFeedback();
            
            // Si fue exitoso, notificar y cerrar
            if (result.Success)
            {
                LicenseApplied?.Invoke(this, EventArgs.Empty);
                DialogResult = DialogResult.OK;
                Close();
            }
        }
        catch (OperationCanceledException)
        {
            _logger?.LogDebug("Operación de aplicación de licencia cancelada");
            HideFeedback();
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, "Error enviando licencia al dispositivo");
            ShowFailureFeedback();
            
            MessageBox.Show(
                $"Error applying license:\n\n{ex.Message}",
                "Error",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error);
            
            try
            {
                await Task.Delay(2000, ct);
            }
            catch (OperationCanceledException) { }
            
            HideFeedback();
        }
        finally
        {
            // Restaurar estado de controles
            _isApplying = false;
            Cursor = Cursors.Default;
            SetControlsEnabled(true);
        }
    }
    
    /// <summary>
    /// Habilita o deshabilita los controles del diálogo durante operaciones.
    /// </summary>
    /// <param name="enabled"><c>true</c> para habilitar; <c>false</c> para deshabilitar.</param>
    private void SetControlsEnabled(bool enabled)
    {
        btnApply.Enabled = enabled && IsValidHexKey(txtLicenseKey.Text);
        btnClose.Enabled = enabled;
        txtLicenseKey.Enabled = enabled;
        btnCopy.Enabled = enabled;
    }
    
    /// <summary>
    /// Muestra indicador visual de éxito (panel verde).
    /// </summary>
    private void ShowSuccessFeedback()
    {
        if (_pctOK != null) _pctOK.Visible = true;
        if (_pctKO != null) _pctKO.Visible = false;
    }
    
    /// <summary>
    /// Muestra indicador visual de fallo (panel rojo).
    /// </summary>
    private void ShowFailureFeedback()
    {
        if (_pctOK != null) _pctOK.Visible = false;
        if (_pctKO != null) _pctKO.Visible = true;
    }
    
    /// <summary>
    /// Oculta ambos indicadores visuales de feedback.
    /// </summary>
    private void HideFeedback()
    {
        if (_pctOK != null) _pctOK.Visible = false;
        if (_pctKO != null) _pctKO.Visible = false;
    }

    /// <summary>
    /// Maneja el click del botón Cerrar/Cancelar.
    /// </summary>
    private void btnClose_Click(object sender, EventArgs e)
    {
        _cts?.Cancel();
        DialogResult = _isReadOnly ? DialogResult.OK : DialogResult.Cancel;
    }

    /// <summary>
    /// Maneja el click del botón Copiar.
    /// </summary>
    private void btnCopy_Click(object sender, EventArgs e)
    {
        if (!string.IsNullOrWhiteSpace(txtLicenseKey.Text))
        {
            Clipboard.SetText(txtLicenseKey.Text);
            
            // Feedback visual temporal
            var originalText = btnCopy.Text;
            btnCopy.Text = "Copied!";
            btnCopy.Enabled = false;
            
            var timer = new System.Windows.Forms.Timer { Interval = 1500 };
            timer.Tick += (s, args) =>
            {
                btnCopy.Text = originalText;
                btnCopy.Enabled = true;
                timer.Stop();
                timer.Dispose();
            };
            timer.Start();
        }
    }
    
    /// <summary>
    /// Limpia recursos y cancela operaciones pendientes al cerrar el formulario.
    /// </summary>
    protected override void OnFormClosing(FormClosingEventArgs e)
    {
        _cts?.Cancel();
        _cts?.Dispose();
        _cts = null;
        
        // Desuscribir eventos
        txtLicenseKey.TextChanged -= TxtLicenseKey_TextChanged;
        
        base.OnFormClosing(e);
    }
    
    /// <summary>
    /// Inicializa el formulario al cargar.
    /// </summary>
    /// <remarks>
    /// En modo edición, limpia el campo si está vacío. El botón Apply solo se habilita
    /// cuando la clave cumple con la validación (64 caracteres hex).
    /// </remarks>
    protected override void OnLoad(EventArgs e)
    {
        base.OnLoad(e);
        
        // En modo edición, si no hay valor, limpiar; si hay valor, mantenerlo
        if (!_isReadOnly && string.IsNullOrWhiteSpace(txtLicenseKey.Text))
        {
            txtLicenseKey.Text = string.Empty;
        }
        
        // El botón Apply solo se habilita cuando la clave es válida (64 hex)
        btnApply.Enabled = !_isReadOnly && IsValidHexKey(txtLicenseKey.Text);
        
        // Dar foco al campo de texto en modo edición
        if (!_isReadOnly)
        {
            txtLicenseKey.Focus();
            txtLicenseKey.SelectAll();
        }
        
        _logger?.LogDebug("LicenseKeyDialog cargado - ReadOnly: {ReadOnly}, Index: {Index}", 
            _isReadOnly, LicenseIndex);
    }
}
