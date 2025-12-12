using Fiplex.Control.Software.WinForms.Core.Commands;
using Fiplex.Control.Software.WinForms.Core.Serial.Interfaces;
using Fiplex.Control.Software.WinForms.Core.Serial.Models;
using Fiplex.Control.Software.WinForms.Models;
using Microsoft.Extensions.Logging;

namespace Fiplex.Control.Software.WinForms.Forms;

/// <summary>
/// Form to configure multi-band hardware license options.
/// </summary>
/// <remarks>
/// Serial commands:
///   M1 - Read current options
///   M0 - Write new options
/// 
/// Bands:
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
    
    // Flag to prevent multiple loads
    private bool _isLoading;
    private bool _isLoaded;
    
    // CancellationTokenSource for async operations
    private CancellationTokenSource? _cts;

    private LicenseOptions _currentOptions = new();

    // Control arrays for indexed access (VB6 control arrays equivalent)
    private CheckBox[] _chkNarrow = null!;
    private CheckBox[] _chkAdjBw = null!;
    private CheckBox[] _chkSingle = null!;
    private TextBox[] _txtPowerDL = null!;

    /// <summary>
    /// Event fired when changes are applied successfully.
    /// Allows frmMain to execute WebRefresh(True).
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

        // Select first combo item by default
        if (cmbBoot.Items.Count > 0)
        {
            cmbBoot.SelectedIndex = 0;
        }
    }
    
    /// <summary>
    /// Configures input validation for Power TextBoxes.
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
    /// Validates that only digits and negative sign are entered.
    /// </summary>
    private void TxtPowerDL_KeyPress(object? sender, KeyPressEventArgs e)
    {
        // Allow: digits, backspace, negative sign at start
        if (!char.IsDigit(e.KeyChar) && e.KeyChar != '\b')
        {
            if (e.KeyChar == '-' && sender is TextBox txt && txt.SelectionStart == 0)
            {
                // Allow negative sign only at the beginning
                return;
            }
            e.Handled = true;
        }
    }
    
    /// <summary>
    /// Validates range on focus lost (-128 to 127).
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
            // Clamp to valid signed byte range
            value = Math.Clamp(value, (short)-128, (short)127);
            txt.Text = value.ToString();
        }
        else
        {
            txt.Text = "0";
        }
    }

    /// <summary>
    /// Initializes control arrays for indexed access.
    /// </summary>
    private void InitializeControlArrays()
    {
        // Order: [700, 800, VHF, UHF] = indexes [0, 1, 2, 3]
        _chkNarrow = [chkNbEn0, chkNbEn1, chkNbEn2, chkNbEn3];
        _chkAdjBw = [chkAdjEn0, chkAdjEn1, chkAdjEn2, chkAdjEn3];
        _chkSingle = [chkSingEn0, chkSingEn1, chkSingEn2, chkSingEn3];
        _txtPowerDL = [txtPowDL0, txtPowDL1, txtPowDL2, txtPowDL3];
    }

    /// <summary>
    /// Loads current device options when the form is activated.
    /// </summary>
    protected override async void OnActivated(EventArgs e)
    {
        base.OnActivated(e);

        // Prevent multiple loads (pattern consistent with EthernetModuleDialog)
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
    /// Cleans up resources when form closes.
    /// </summary>
    protected override void OnFormClosing(FormClosingEventArgs e)
    {
        _cts?.Cancel();
        _cts?.Dispose();
        _cts = null;
        
        // Unsubscribe validation events
        foreach (var txt in _txtPowerDL)
        {
            txt.KeyPress -= TxtPowerDL_KeyPress;
            txt.Validating -= TxtPowerDL_Validating;
        }
        
        base.OnFormClosing(e);
    }

    /// <summary>
    /// Loads the license options from the device.
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

            _logger.LogDebug("Loading license options (M1)");

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
                _logger.LogWarning("Empty or failed response from M1 command: {Status}", result.Status);
                ShowErrorFeedback("Could not read license options from device.");
                return;
            }

            _logger.LogDebug("M1 response: {Response}", result.Data);

            _currentOptions = _parser.Parse(result.Data);

            DisplayOptions(_currentOptions);

            _logger.LogInformation("License options loaded successfully");
        }
        catch (OperationCanceledException)
        {
            _logger.LogDebug("Load operation cancelled");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error loading license options");
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
    /// Enables/disables input controls.
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
    /// Shows visual error feedback.
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
    /// Displays options in UI controls.
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
    /// Reads options from UI controls.
    /// </summary>
    private LicenseOptions ReadOptionsFromUI()
    {
        var options = new LicenseOptions();

        for (int i = 0; i < LicenseOptions.NumBands; i++)
        {
            options.NarrowFiltersEnabled[i] = _chkNarrow[i].Checked;
            options.AdjBwFiltersEnabled[i] = _chkAdjBw[i].Checked;
            options.SingleBandEnabled[i] = _chkSingle[i].Checked;

            // Parse Power DL with range validation (already validated in TxtPowerDL_Validating)
            options.PowerLimitDownlink[i] = ParsePowerValue(_txtPowerDL[i].Text);
        }

        options.BootFirmware = (short)Math.Max(0, cmbBoot.SelectedIndex);

        return options;
    }
    
    /// <summary>
    /// Parses power value with range validation (-128 to 127).
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
    /// Applies changes to the device.
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

            _logger.LogDebug("Applying license options (M0)");

            var hexData = _parser.ToHexString(optionsToSend);
            
            if (string.IsNullOrEmpty(hexData) || hexData.Length != 14)
            {
                _logger.LogError("Error encoding options: invalid length ({Length})", hexData?.Length ?? 0);
                ShowErrorFeedback("Error encoding license options.");
                return;
            }
            
            _logger.LogDebug("Data to send: M0{Hex}", hexData);

            var command = new SerialCommand
            {
                Payload = $"M0{hexData}",
                ExpectsAck = true,
                ExpectsData = false,  // M0 solo espera ACK
                CancellationToken = ct
            };
            var result = await _pipeline.EnqueueCommandAsync(command);
            
            ct.ThrowIfCancellationRequested();

            _logger.LogDebug("M0 response: {Status} - {Data}", result.Status, result.Data);

            if (result.Success)
            {
                ShowSuccessFeedback();
                _logger.LogInformation("License options applied successfully");
                
                // Update current options
                _currentOptions = optionsToSend;
            }
            else
            {
                ShowFailureFeedback();
                _logger.LogWarning("Error applying options. Status: {Status}", result.Status);
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
            _logger.LogDebug("Apply operation cancelled");
            HideFeedback();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error applying license options");
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
    /// Shows success visual indicator.
    /// </summary>
    private void ShowSuccessFeedback()
    {
        pctOK.Visible = true;
        pctKO.Visible = false;
    }
    
    /// <summary>
    /// Shows a visual failure indicator.
    /// </summary>
    private void ShowFailureFeedback()
    {
        pctOK.Visible = false;
        pctKO.Visible = true;
    }
    
    /// <summary>
    /// Hides visual feedback indicators.
    /// </summary>
    private void HideFeedback()
    {
        pctOK.Visible = false;
        pctKO.Visible = false;
    }
}
