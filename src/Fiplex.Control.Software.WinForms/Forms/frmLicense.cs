using Fiplex.Control.Software.WinForms.Core.Serial.Interfaces;
using Fiplex.Control.Software.WinForms.Core.Serial.Models;
using Fiplex.Control.Software.WinForms.Models;
using Microsoft.Extensions.Logging;

namespace Fiplex.Control.Software.WinForms.Forms;

/// <summary>
/// Formulario para configurar opciones de licencia de hardware (dispositivos de 2 bandas).
/// </summary>
/// <remarks>
/// Comandos serial:
///   M1 - Lectura de opciones actuales (respuesta: 6 caracteres hex)
///   M0 - Escritura de nuevas opciones (envío: M0 + 6 caracteres hex)
/// 
/// Formato hex de 6 caracteres (dispositivos 2 bandas):
///   [1-2] mask:     bit0=chEnabled[0], bit1=adjEnabled[0], bit2=chEnabled[1], 
///                   bit3=adjEnabled[1], bit4=singleEnabled[0], bit5=singleEnabled[1]
///   [3-4] powerDL[0]: Signed byte (-128..127)
///   [5-6] powerDL[1]: Signed byte (-128..127)
/// 
/// Bandas:
///   0 = BAND0
///   1 = BAND1
/// </remarks>
public partial class frmLicense : Form
{
    // Constantes de configuración
    private const int ExpectedHexLength = 6;
    private const int FeedbackDelayMs = 2000;
    private const int CommandTimeoutMs = 5000;
    
    private readonly ISerialCommandPipeline _pipeline;
    private readonly ILogger<frmLicense> _logger;

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

    public frmLicense(
        ISerialCommandPipeline pipeline,
        ILogger<frmLicense> logger)
    {
        _pipeline = pipeline;
        _logger = logger;

        InitializeComponent();
        InitializeControlArrays();
        SetupInputValidation();
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
        // Solo 2 bandas para este formulario (BAND0, BAND1)
        _chkNarrow = [chkNbEn0, chkNbEn1];
        _chkAdjBw = [chkAdjEn0, chkAdjEn1];
        _chkSingle = [chkSingEn0, chkSingEn1];
        _txtPowerDL = [txtPowDL0, txtPowDL1];
    }

    /// <summary>
    /// Carga opciones actuales del dispositivo al activar el formulario.
    /// </summary>
    protected override async void OnActivated(EventArgs e)
    {
        base.OnActivated(e);

        // Evitar carga múltiple (patrón consistente con otros diálogos)
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
                DataTimeout = TimeSpan.FromMilliseconds(CommandTimeoutMs),
                MaxRetries = 2,
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
            
            // Validar formato hex de respuesta
            if (!IsValidHexResponse(result.Data))
            {
                _logger.LogWarning("Respuesta M1 con formato hex inválido: {Data}", result.Data);
                ShowErrorFeedback("Invalid response format from device.");
                return;
            }

            _logger.LogDebug("Respuesta M1: {Response}", result.Data);

            _currentOptions = ParseFor2Bands(result.Data);

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
        for (int i = 0; i < 2; i++)
        {
            _chkNarrow[i].Checked = options.NarrowFiltersEnabled[i];
            _chkAdjBw[i].Checked = options.AdjBwFiltersEnabled[i];
            _chkSingle[i].Checked = options.SingleBandEnabled[i];
            _txtPowerDL[i].Text = options.PowerLimitDownlink[i].ToString();
        }
    }

    /// <summary>
    /// Lee opciones desde controles UI.
    /// </summary>
    private LicenseOptions ReadOptionsFromUI()
    {
        var options = new LicenseOptions();

        for (int i = 0; i < 2; i++)
        {
            options.NarrowFiltersEnabled[i] = _chkNarrow[i].Checked;
            options.AdjBwFiltersEnabled[i] = _chkAdjBw[i].Checked;
            options.SingleBandEnabled[i] = _chkSingle[i].Checked;

            // Parsear Power DL con validación de rango (ya validado en TxtPowerDL_Validating)
            options.PowerLimitDownlink[i] = ParsePowerValue(_txtPowerDL[i].Text);
        }

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

            var hexData = ToHexFor2Bands(optionsToSend);

            if (string.IsNullOrEmpty(hexData) || hexData.Length != ExpectedHexLength)
            {
                _logger.LogError("Error codificando opciones: longitud inválida ({Length}), esperada {Expected}", 
                    hexData?.Length ?? 0, ExpectedHexLength);
                ShowErrorFeedback("Error encoding license options.");
                return;
            }

            _logger.LogDebug("Datos a enviar: M0{Hex}", hexData);

            var command = new SerialCommand
            {
                Payload = $"M0{hexData}",
                ExpectsAck = true,
                ExpectsData = false,  // M0 solo espera ACK
                DataTimeout = TimeSpan.FromMilliseconds(CommandTimeoutMs),
                MaxRetries = 1,  // Solo 1 reintento para escritura
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

            await Task.Delay(FeedbackDelayMs, ct);

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
                await Task.Delay(FeedbackDelayMs, ct);
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

    #region Validación y Parsing para dispositivos de 2 bandas

    /// <summary>
    /// Valida si una cadena es un hex válido para respuesta M1 (2 bandas).
    /// </summary>
    /// <param name="hexResponse">Respuesta a validar</param>
    /// <returns>True si es válido</returns>
    private bool IsValidHexResponse(string? hexResponse)
    {
        if (string.IsNullOrEmpty(hexResponse) || hexResponse.Length < ExpectedHexLength)
            return false;
        
        // Verificar que los primeros 6 caracteres sean hex válidos
        return hexResponse.Take(ExpectedHexLength).All(c =>
            (c >= '0' && c <= '9') ||
            (c >= 'A' && c <= 'F') ||
            (c >= 'a' && c <= 'f'));
    }

    /// <summary>
    /// Decodifica respuesta hex del comando M1 para formato de 2 bandas (6 caracteres).
    /// </summary>
    /// <remarks>
    /// Formato:
    ///   [1-2] mask:     bit0=chEnabled[0], bit1=adjEnabled[0], bit2=chEnabled[1],
    ///                   bit3=adjEnabled[1], bit4=singleEnabled[0], bit5=singleEnabled[1]
    ///   [3-4] powerDL[0]: Signed byte (-128..127)
    ///   [5-6] powerDL[1]: Signed byte (-128..127)
    /// </remarks>
    private LicenseOptions ParseFor2Bands(string hexResponse)
    {
        var result = new LicenseOptions();

        if (!IsValidHexResponse(hexResponse))
        {
            _logger.LogWarning("ParseFor2Bands: respuesta hex inválida: '{Response}'", hexResponse ?? "null");
            return result;
        }

        try
        {
            // [1-2] Máscara de opciones
            int mask = Convert.ToInt32(hexResponse.Substring(0, 2), 16);

            result.NarrowFiltersEnabled[0] = (mask & 0x01) != 0;
            result.AdjBwFiltersEnabled[0] = (mask & 0x02) != 0;
            result.NarrowFiltersEnabled[1] = (mask & 0x04) != 0;
            result.AdjBwFiltersEnabled[1] = (mask & 0x08) != 0;
            result.SingleBandEnabled[0] = (mask & 0x10) != 0;
            result.SingleBandEnabled[1] = (mask & 0x20) != 0;

            // [3-4] Power DL 0
            int power0 = Convert.ToInt32(hexResponse.Substring(2, 2), 16);
            result.PowerLimitDownlink[0] = (short)(power0 > 127 ? power0 - 256 : power0);

            // [5-6] Power DL 1
            int power1 = Convert.ToInt32(hexResponse.Substring(4, 2), 16);
            result.PowerLimitDownlink[1] = (short)(power1 > 127 ? power1 - 256 : power1);

            _logger.LogDebug("ParseFor2Bands: Narrow=[{N0},{N1}], AdjBw=[{A0},{A1}], " +
                           "Single=[{S0},{S1}], Power=[{P0},{P1}]",
                result.NarrowFiltersEnabled[0], result.NarrowFiltersEnabled[1],
                result.AdjBwFiltersEnabled[0], result.AdjBwFiltersEnabled[1],
                result.SingleBandEnabled[0], result.SingleBandEnabled[1],
                result.PowerLimitDownlink[0], result.PowerLimitDownlink[1]);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error parseando opciones hex: {Hex}", hexResponse);
        }

        return result;
    }

    /// <summary>
    /// Codifica opciones a string hex para comando M0 (formato 2 bandas, 6 caracteres).
    /// </summary>
    private string ToHexFor2Bands(LicenseOptions options)
    {
        try
        {
            // Construir máscara de opciones
            int mask = 0;
            if (options.NarrowFiltersEnabled[0]) mask |= 0x01;
            if (options.AdjBwFiltersEnabled[0]) mask |= 0x02;
            if (options.NarrowFiltersEnabled[1]) mask |= 0x04;
            if (options.AdjBwFiltersEnabled[1]) mask |= 0x08;
            if (options.SingleBandEnabled[0]) mask |= 0x10;
            if (options.SingleBandEnabled[1]) mask |= 0x20;

            // Power DL como unsigned bytes
            int p0 = options.PowerLimitDownlink[0];
            if (p0 < 0) p0 += 256;

            int p1 = options.PowerLimitDownlink[1];
            if (p1 < 0) p1 += 256;

            var hexResult = $"{mask:X2}{p0:X2}{p1:X2}";
            _logger.LogDebug("ToHexFor2Bands: {Hex}", hexResult);
            return hexResult;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error codificando opciones");
            return string.Empty;
        }
    }

    #endregion

    #region Feedback Visual

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

    #endregion
}
