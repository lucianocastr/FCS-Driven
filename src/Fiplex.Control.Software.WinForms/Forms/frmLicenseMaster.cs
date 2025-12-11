using Fiplex.Control.Software.WinForms.Core.Commands;
using Fiplex.Control.Software.WinForms.Core.Serial.Interfaces;
using Fiplex.Control.Software.WinForms.Core.Serial.Models;
using Fiplex.Control.Software.WinForms.Models;
using Microsoft.Extensions.Logging;

namespace Fiplex.Control.Software.WinForms.Forms;

/// <summary>
/// Formulario para configurar opciones de licencia de hardware multi-banda.
/// </summary>
/// <remarks>
/// Comandos serial:
///   M1 - Lectura de opciones actuales
///   M0 - Escritura de nuevas opciones
/// 
/// Bandas:
///   0 = FW0 BAND0 (700 MHz)
///   1 = FW0 BAND1 (800 MHz)
///   2 = FW1 BAND0 (VHF)
///   3 = FW1 BAND1 (UHF)
/// </remarks>
public partial class frmLicenseMaster : Form
{
    private readonly ISerialCommandPipeline _pipeline;
    private readonly LicenseOptionsParser _parser;
    private readonly ILogger<frmLicenseMaster> _logger;
    
    // Flag para evitar carga múltiple
    private bool _isLoading;
    private bool _isLoaded;
    
    // CancellationTokenSource para operaciones async
    private CancellationTokenSource? _cts;

    private LicenseOptions _currentOptions = new();

    // Arrays de controles para acceso indexado (equivalente VB6 control arrays)
    private CheckBox[] _chkNarrow = null!;
    private CheckBox[] _chkAdjBw = null!;
    private CheckBox[] _chkSingle = null!;
    private TextBox[] _txtPowerDL = null!;

    /// <summary>
    /// Evento disparado cuando se aplican cambios exitosamente.
    /// Permite a frmMain ejecutar WebRefresh(True).
    /// </summary>
    public event EventHandler? ChangesApplied;

    public frmLicenseMaster(
        ISerialCommandPipeline pipeline,
        LicenseOptionsParser parser,
        ILogger<frmLicenseMaster> logger)
    {
        _pipeline = pipeline;
        _parser = parser;
        _logger = logger;

        InitializeComponent();
        InitializeControlArrays();
        SetupInputValidation();

        // Seleccionar primer elemento del combo por defecto
        if (cmbBoot.Items.Count > 0)
        {
            cmbBoot.SelectedIndex = 0;
        }
    }
    
    /// <summary>
    /// Configura validación de entrada para los TextBox de Power.
    /// </summary>
    private void SetupInputValidation()
    {
        foreach (var txt in _txtPowerDL)
        {
            txt.KeyPress += TxtPowerDL_KeyPress;
            txt.Validating += TxtPowerDL_Validating;
        }
    }
    
    /// <summary>
    /// Valida que solo se ingresen dígitos y signo negativo.
    /// </summary>
    private void TxtPowerDL_KeyPress(object? sender, KeyPressEventArgs e)
    {
        // Permitir: dígitos, backspace, signo negativo al inicio
        if (!char.IsDigit(e.KeyChar) && e.KeyChar != '\b')
        {
            if (e.KeyChar == '-' && sender is TextBox txt && txt.SelectionStart == 0)
            {
                // Permitir signo negativo solo al inicio
                return;
            }
            e.Handled = true;
        }
    }
    
    /// <summary>
    /// Valida rango al perder foco (-128 a 127).
    /// </summary>
    private void TxtPowerDL_Validating(object? sender, System.ComponentModel.CancelEventArgs e)
    {
        if (sender is not TextBox txt) return;
        
        if (string.IsNullOrWhiteSpace(txt.Text))
        {
            txt.Text = "0";
            return;
        }
        
        if (short.TryParse(txt.Text, out short value))
        {
            // Clamp al rango válido de signed byte
            value = Math.Clamp(value, (short)-128, (short)127);
            txt.Text = value.ToString();
        }
        else
        {
            txt.Text = "0";
        }
    }

    /// <summary>
    /// Inicializa arrays de controles para acceso indexado.
    /// </summary>
    private void InitializeControlArrays()
    {
        // Orden: [700, 800, VHF, UHF] = índices [0, 1, 2, 3]
        _chkNarrow = [chkNbEn0, chkNbEn1, chkNbEn2, chkNbEn3];
        _chkAdjBw = [chkAdjEn0, chkAdjEn1, chkAdjEn2, chkAdjEn3];
        _chkSingle = [chkSingEn0, chkSingEn1, chkSingEn2, chkSingEn3];
        _txtPowerDL = [txtPowDL0, txtPowDL1, txtPowDL2, txtPowDL3];
    }

    /// <summary>
    /// Carga opciones actuales del dispositivo al activar el formulario.
    /// </summary>
    protected override async void OnActivated(EventArgs e)
    {
        base.OnActivated(e);

        // Evitar carga múltiple (patrón consistente con EthernetModuleDialog)
        if (_isLoading || _isLoaded)
            return;
        
        _isLoading = true;
        try
        {
            await LoadLicenseOptionsAsync();
            _isLoaded = true;
        }
        finally
        {
            _isLoading = false;
        }
    }
    
    /// <summary>
    /// Limpia recursos al cerrar el formulario.
    /// </summary>
    protected override void OnFormClosing(FormClosingEventArgs e)
    {
        _cts?.Cancel();
        _cts?.Dispose();
        _cts = null;
        
        // Desuscribir eventos de validación
        foreach (var txt in _txtPowerDL)
        {
            txt.KeyPress -= TxtPowerDL_KeyPress;
            txt.Validating -= TxtPowerDL_Validating;
        }
        
        base.OnFormClosing(e);
    }

    /// <summary>
    /// Carga las opciones de licencia desde el dispositivo.
    /// </summary>
    private async Task LoadLicenseOptionsAsync()
    {
        _cts?.Cancel();
        _cts = new CancellationTokenSource();
        var ct = _cts.Token;
        
        try
        {
            Cursor = Cursors.WaitCursor;
            cmdApply.Enabled = false;
            SetControlsEnabled(false);

            _logger.LogDebug("Cargando opciones de licencia (M1)");

            var command = new SerialCommand
            {
                Payload = "M1",
                ExpectsAck = true,
                ExpectsData = true,
                CancellationToken = ct
            };
            var result = await _pipeline.EnqueueCommandAsync(command);
            
            ct.ThrowIfCancellationRequested();

            if (!result.Success || string.IsNullOrEmpty(result.Data))
            {
                _logger.LogWarning("Respuesta vacía o fallida del comando M1: {Status}", result.Status);
                ShowErrorFeedback("Could not read license options from device.");
                return;
            }

            _logger.LogDebug("Respuesta M1: {Response}", result.Data);

            _currentOptions = _parser.Parse(result.Data);

            DisplayOptions(_currentOptions);

            _logger.LogInformation("Opciones de licencia cargadas exitosamente");
        }
        catch (OperationCanceledException)
        {
            _logger.LogDebug("Operación de carga cancelada");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cargando opciones de licencia");
            ShowErrorFeedback($"Error reading license options: {ex.Message}");
        }
        finally
        {
            Cursor = Cursors.Default;
            cmdApply.Enabled = true;
            SetControlsEnabled(true);
        }
    }
    
    /// <summary>
    /// Habilita/deshabilita controles de entrada.
    /// </summary>
    private void SetControlsEnabled(bool enabled)
    {
        foreach (var chk in _chkNarrow) chk.Enabled = enabled;
        foreach (var chk in _chkAdjBw) chk.Enabled = enabled;
        foreach (var chk in _chkSingle) chk.Enabled = enabled;
        foreach (var txt in _txtPowerDL) txt.Enabled = enabled;
        cmbBoot.Enabled = enabled;
    }
    
    /// <summary>
    /// Muestra feedback visual de error.
    /// </summary>
    private void ShowErrorFeedback(string message)
    {
        MessageBox.Show(
            message,
            "Error",
            MessageBoxButtons.OK,
            MessageBoxIcon.Error);
    }

    /// <summary>
    /// Muestra opciones en controles UI.
    /// </summary>
    private void DisplayOptions(LicenseOptions options)
    {
        for (int i = 0; i < LicenseOptions.NumBands; i++)
        {
            _chkNarrow[i].Checked = options.NarrowFiltersEnabled[i];
            _chkAdjBw[i].Checked = options.AdjBwFiltersEnabled[i];
            _chkSingle[i].Checked = options.SingleBandEnabled[i];
            _txtPowerDL[i].Text = options.PowerLimitDownlink[i].ToString();
        }

        cmbBoot.SelectedIndex = Math.Clamp(options.BootFirmware, (short)0, (short)1);
    }

    /// <summary>
    /// Lee opciones desde controles UI.
    /// </summary>
    private LicenseOptions ReadOptionsFromUI()
    {
        var options = new LicenseOptions();

        for (int i = 0; i < LicenseOptions.NumBands; i++)
        {
            options.NarrowFiltersEnabled[i] = _chkNarrow[i].Checked;
            options.AdjBwFiltersEnabled[i] = _chkAdjBw[i].Checked;
            options.SingleBandEnabled[i] = _chkSingle[i].Checked;

            // Parsear Power DL con validación de rango (ya validado en TxtPowerDL_Validating)
            options.PowerLimitDownlink[i] = ParsePowerValue(_txtPowerDL[i].Text);
        }

        options.BootFirmware = (short)Math.Max(0, cmbBoot.SelectedIndex);

        return options;
    }
    
    /// <summary>
    /// Parsea valor de potencia con validación de rango (-128 a 127).
    /// </summary>
    private static short ParsePowerValue(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
            return 0;
        
        if (short.TryParse(text, out short power))
            return Math.Clamp(power, (short)-128, (short)127);
        
        return 0;
    }

    /// <summary>
    /// Aplica cambios al dispositivo.
    /// </summary>
    private async void cmdApply_Click(object sender, EventArgs e)
    {
        _cts?.Cancel();
        _cts = new CancellationTokenSource();
        var ct = _cts.Token;
        
        try
        {
            cmdApply.Enabled = false;
            SetControlsEnabled(false);

            Cursor = Cursors.WaitCursor;

            var optionsToSend = ReadOptionsFromUI();

            _logger.LogDebug("Aplicando opciones de licencia (M0)");

            var hexData = _parser.ToHexString(optionsToSend);
            
            if (string.IsNullOrEmpty(hexData) || hexData.Length != 14)
            {
                _logger.LogError("Error codificando opciones: longitud inválida ({Length})", hexData?.Length ?? 0);
                ShowErrorFeedback("Error encoding license options.");
                return;
            }
            
            _logger.LogDebug("Datos a enviar: M0{Hex}", hexData);

            var command = new SerialCommand
            {
                Payload = $"M0{hexData}",
                ExpectsAck = true,
                ExpectsData = false,  // M0 solo espera ACK
                CancellationToken = ct
            };
            var result = await _pipeline.EnqueueCommandAsync(command);
            
            ct.ThrowIfCancellationRequested();

            _logger.LogDebug("Respuesta M0: {Status} - {Data}", result.Status, result.Data);

            if (result.Success)
            {
                ShowSuccessFeedback();
                _logger.LogInformation("Opciones de licencia aplicadas exitosamente");
                
                // Actualizar opciones actuales
                _currentOptions = optionsToSend;
            }
            else
            {
                ShowFailureFeedback();
                _logger.LogWarning("Error aplicando opciones. Status: {Status}", result.Status);
            }

            await Task.Delay(2000, ct);

            HideFeedback();

            if (result.Success)
            {
                ChangesApplied?.Invoke(this, EventArgs.Empty);
            }
        }
        catch (OperationCanceledException)
        {
            _logger.LogDebug("Operación de aplicación cancelada");
            HideFeedback();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error aplicando opciones de licencia");
            ShowFailureFeedback();

            ShowErrorFeedback($"Error applying changes: {ex.Message}");

            try
            {
                await Task.Delay(2000, ct);
            }
            catch (OperationCanceledException) { }
            
            HideFeedback();
        }
        finally
        {
            Cursor = Cursors.Default;
            cmdApply.Enabled = true;
            SetControlsEnabled(true);
        }
    }
    
    /// <summary>
    /// Muestra indicador visual de éxito.
    /// </summary>
    private void ShowSuccessFeedback()
    {
        pctOK.Visible = true;
        pctKO.Visible = false;
    }
    
    /// <summary>
    /// Muestra indicador visual de fallo.
    /// </summary>
    private void ShowFailureFeedback()
    {
        pctOK.Visible = false;
        pctKO.Visible = true;
    }
    
    /// <summary>
    /// Oculta indicadores visuales de feedback.
    /// </summary>
    private void HideFeedback()
    {
        pctOK.Visible = false;
        pctKO.Visible = false;
    }
}
