using Fiplex.Control.Software.WinForms.Core.Configuration;
using Fiplex.Control.Software.WinForms.Core.Serial.Interfaces;
using Fiplex.Control.Software.WinForms.Core.Serial.Models;
using Microsoft.Extensions.Logging;

namespace Fiplex.Control.Software.WinForms.Forms;

/// <summary>
/// Formulario para escribir claves de licencia al dispositivo.
/// </summary>
/// <remarks>
/// Funcionalidad:
///   - Entrada de clave de licencia (64 caracteres hexadecimales)
///   - Dos botones: "Enable Feature" (Index=1) y "Disable Feature" (Index=0)
///   - Envía comando ;0{Index:X2}{Key64} al dispositivo
///   - Feedback visual OK/KO con delay 2000ms
/// </remarks>
public partial class frmLicenseKey : Form
{
    private readonly ISerialCommandPipeline _pipeline;
    private readonly ILogger<frmLicenseKey> _logger;
    
    private bool _configuring = false;
    
    private CancellationTokenSource? _cts;

    /// <summary>
    /// Evento disparado cuando se aplica la licencia exitosamente.
    /// </summary>
    public event EventHandler? LicenseApplied;

    /// <summary>
    /// Constructor con inyección de dependencias.
    /// </summary>
    /// <param name="pipeline">Pipeline de comandos serial</param>
    /// <param name="logger">Logger</param>
    public frmLicenseKey(
        ISerialCommandPipeline pipeline,
        ILogger<frmLicenseKey> logger)
    {
        _pipeline = pipeline ?? throw new ArgumentNullException(nameof(pipeline));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        
        InitializeComponent();
        
        // Suscribir eventos de botones
        btnEnableFeature.Click += (s, e) => CmdLicense_Click(1);
        btnDisableFeature.Click += (s, e) => CmdLicense_Click(0);
    }

    /// <summary>
    /// Inicializa el formulario con controles deshabilitados.
    /// </summary>
    protected override void OnLoad(EventArgs e)
    {
        base.OnLoad(e);
        
        txtKey.Text = string.Empty;
        btnEnableFeature.Enabled = false;
        btnDisableFeature.Enabled = false;
        
        tmrKey.Interval = 200;
        tmrKey.Enabled = true;
        
        _logger.LogDebug("frmLicenseKey cargado");
    }

    /// <summary>
    /// Valida la longitud de la clave cada 200ms y habilita/deshabilita botones.
    /// </summary>
    private void TmrKey_Tick(object? sender, EventArgs e)
    {
        if (!_configuring)
        {
            bool keyOk = txtKey.Text.Length == 64;
            btnEnableFeature.Enabled = keyOk;
            btnDisableFeature.Enabled = keyOk;
        }
    }

    /// <summary>
    /// Envía el comando de licencia al dispositivo.
    /// </summary>
    /// <param name="index">0 = Disable Feature, 1 = Enable Feature</param>
    private async void CmdLicense_Click(int index)
    {
        if (txtKey.Text.Length != 64)
            return;

        _cts?.Cancel();
        _cts = new CancellationTokenSource();
        var ct = _cts.Token;
        
        try
        {
            btnEnableFeature.Enabled = false;
            btnDisableFeature.Enabled = false;
            Cursor = Cursors.WaitCursor;
            _configuring = true;
            
            _logger.LogDebug("Enviando licencia con Index={Index}", index);
            
            // Formato: ;0{xx}{64_chars_hex_key}
            var indexHex = index.ToString("X2");
            var command = new SerialCommand
            {
                Payload = $";0{indexHex}{txtKey.Text}",
                ExpectsAck = true,
                ExpectsData = false,
                CancellationToken = ct
            };
            
            var result = await _pipeline.EnqueueCommandAsync(command);
            
            ct.ThrowIfCancellationRequested();
            
            bool ucOk = result.Success;
            
            if (ucOk)
            {
                pctOK.Visible = true;
                _logger.LogInformation("Licencia aplicada exitosamente (Index={Index})", index);
            }
            else
            {
                pctKO.Visible = true;
                _logger.LogWarning("Error aplicando licencia (Index={Index}). Status: {Status}", 
                    index, result.Status);
            }
            
            Application.DoEvents();
            await Task.Delay(2000, ct);
            
            pctOK.Visible = false;
            pctKO.Visible = false;
            _configuring = false;
            Cursor = Cursors.Default;
            btnEnableFeature.Enabled = true;
            btnDisableFeature.Enabled = true;
            
            if (ucOk)
            {
                LicenseApplied?.Invoke(this, EventArgs.Empty);
                Close();
            }
        }
        catch (OperationCanceledException)
        {
            _logger.LogDebug("Operación de licencia cancelada");
            pctOK.Visible = false;
            pctKO.Visible = false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error enviando comando de licencia");
            pctKO.Visible = true;
            
            try
            {
                await Task.Delay(2000, ct);
            }
            catch (OperationCanceledException) { }
            
            pctKO.Visible = false;
        }
        finally
        {
            _configuring = false;
            Cursor = Cursors.Default;
            
            // Re-evaluar estado de botones según longitud de clave
            bool keyOk = txtKey.Text.Length == 64;
            btnEnableFeature.Enabled = keyOk;
            btnDisableFeature.Enabled = keyOk;
        }
    }

    /// <summary>
    /// Limpia recursos al cerrar.
    /// </summary>
    protected override void OnFormClosing(FormClosingEventArgs e)
    {
        _cts?.Cancel();
        _cts?.Dispose();
        _cts = null;
        
        tmrKey.Enabled = false;
        
        base.OnFormClosing(e);
    }
}
