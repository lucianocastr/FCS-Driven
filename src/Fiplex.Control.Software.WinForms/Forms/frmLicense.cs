using Fiplex.Control.Software.WinForms.Core.Serial.Interfaces;
using Fiplex.Control.Software.WinForms.Core.Serial.Models;
using Fiplex.Control.Software.WinForms.Models;
using Microsoft.Extensions.Logging;

namespace Fiplex.Control.Software.WinForms.Forms;

/// <summary>
/// Form for configuring hardware license options (2-band devices).
/// </summary>
/// <remarks>
/// Serial commands:
///   M1 - Read current options (response: 6 hex characters)
///   M0 - Write new options (send: M0 + 6 hex characters)
/// 
/// 6 hex character format (2-band devices):
///   [1-2] mask:     bit0=chEnabled[0], bit1=adjEnabled[0], bit2=chEnabled[1], 
///                   bit3=adjEnabled[1], bit4=singleEnabled[0], bit5=singleEnabled[1]
///   [3-4] powerDL[0]: Signed byte (-128..127)
///   [5-6] powerDL[1]: Signed byte (-128..127)
/// 
/// Bands:
///   0 = BAND0
///   1 = BAND1
/// </remarks>
public partial class frmLicense : Form
{
    // Configuration constants
    private const int ExpectedHexLength = 6;
    private const int FeedbackDelayMs = 2000;
    private const int CommandTimeoutMs = 5000;
    
    private readonly ISerialCommandPipeline _pipeline;
    private readonly ILogger<frmLicense> _logger;

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
                // Allow negative sign only at start
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
        // Only 2 bands for this form (BAND0, BAND1)
        _chkNarrow = [chkNbEn0, chkNbEn1];
        _chkAdjBw = [chkAdjEn0, chkAdjEn1];
        _chkSingle = [chkSingEn0, chkSingEn1];
        _txtPowerDL = [txtPowDL0, txtPowDL1];
    }

    /// <summary>
    /// Loads current options from the device when the form is activated.
    /// </summary>
    protected override async void OnActivated(EventArgs e)
    {
        base.OnActivated(e);

        // Prevent multiple loads (consistent pattern with other dialogs)
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
    /// Cleans up resources when closing the form.
    /// </summary>
    protected override void OnFormClosing(FormClosingEventArgs e)
    {
        _cts?.Cancel();
        _cts?.Dispose();
        _cts = null;

        // Unsubscribe from validation events
        foreach (var txt in _txtPowerDL)
        {
            txt.KeyPress -= TxtPowerDL_KeyPress;
            txt.Validating -= TxtPowerDL_Validating;
        }

        base.OnFormClosing(e);
    }

    /// <summary>
    /// Loads license options from the device.
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
                DataTimeout = TimeSpan.FromMilliseconds(CommandTimeoutMs),
                MaxRetries = 2,
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
            
            // Validate hex format of response
            if (!IsValidHexResponse(result.Data))
            {
                _logger.LogWarning("M1 response with invalid hex format: {Data}", result.Data);
                ShowErrorFeedback("Invalid response format from device.");
                return;
            }

            _logger.LogDebug("M1 Response: {Response}", result.Data);

            _currentOptions = ParseFor2Bands(result.Data);

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
        for (int i = 0; i < 2; i++)
        {
            _chkNarrow[i].Checked = options.NarrowFiltersEnabled[i];
            _chkAdjBw[i].Checked = options.AdjBwFiltersEnabled[i];
            _chkSingle[i].Checked = options.SingleBandEnabled[i];
            _txtPowerDL[i].Text = options.PowerLimitDownlink[i].ToString();
        }
    }

    /// <summary>
    /// Reads options from UI controls.
    /// </summary>
    private LicenseOptions ReadOptionsFromUI()
    {
        var options = new LicenseOptions();

        for (int i = 0; i < 2; i++)
        {
            options.NarrowFiltersEnabled[i] = _chkNarrow[i].Checked;
            options.AdjBwFiltersEnabled[i] = _chkAdjBw[i].Checked;
            options.SingleBandEnabled[i] = _chkSingle[i].Checked;

            // Parse Power DL with range validation (already validated in TxtPowerDL_Validating)
            options.PowerLimitDownlink[i] = ParsePowerValue(_txtPowerDL[i].Text);
        }

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

            var hexData = ToHexFor2Bands(optionsToSend);

            if (string.IsNullOrEmpty(hexData) || hexData.Length != ExpectedHexLength)
            {
                _logger.LogError("Error encoding options: invalid length ({Length}), expected {Expected}", 
                    hexData?.Length ?? 0, ExpectedHexLength);
                ShowErrorFeedback("Error encoding license options.");
                return;
            }

            _logger.LogDebug("Data to send: M0{Hex}", hexData);

            var command = new SerialCommand
            {
                Payload = $"M0{hexData}",
                ExpectsAck = true,
                ExpectsData = false,  // M0 only expects ACK
                DataTimeout = TimeSpan.FromMilliseconds(CommandTimeoutMs),
                MaxRetries = 1,  // Only 1 retry for write
                CancellationToken = ct
            };
            var result = await _pipeline.EnqueueCommandAsync(command);

            ct.ThrowIfCancellationRequested();

            _logger.LogDebug("M0 Response: {Status} - {Data}", result.Status, result.Data);

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

            await Task.Delay(FeedbackDelayMs, ct);

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

    #region Validation and Parsing for 2-band devices

    /// <summary>
    /// Validates if a string is valid hex for M1 response (2 bands).
    /// </summary>
    /// <param name="hexResponse">Response to validate</param>
    /// <returns>True if valid</returns>
    private bool IsValidHexResponse(string? hexResponse)
    {
        if (string.IsNullOrEmpty(hexResponse) || hexResponse.Length < ExpectedHexLength)
            return false;
        
        // Verify that the first 6 characters are valid hex
        return hexResponse.Take(ExpectedHexLength).All(c =>
            (c >= '0' && c <= '9') ||
            (c >= 'A' && c <= 'F') ||
            (c >= 'a' && c <= 'f'));
    }

    /// <summary>
    /// Decodes hex response from M1 command for 2-band format (6 characters).
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
            _logger.LogWarning("ParseFor2Bands: invalid hex response: '{Response}'", hexResponse ?? "null");
            return result;
        }

        try
        {
            // [1-2] Options mask
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
            _logger.LogError(ex, "Error parsing hex options: {Hex}", hexResponse);
        }

        return result;
    }

    /// <summary>
    /// Encodes options to hex string for M0 command (2-band format, 6 characters).
    /// </summary>
    private string ToHexFor2Bands(LicenseOptions options)
    {
        try
        {
            // Build options mask
            int mask = 0;
            if (options.NarrowFiltersEnabled[0]) mask |= 0x01;
            if (options.AdjBwFiltersEnabled[0]) mask |= 0x02;
            if (options.NarrowFiltersEnabled[1]) mask |= 0x04;
            if (options.AdjBwFiltersEnabled[1]) mask |= 0x08;
            if (options.SingleBandEnabled[0]) mask |= 0x10;
            if (options.SingleBandEnabled[1]) mask |= 0x20;

            // Power DL as unsigned bytes
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
            _logger.LogError(ex, "Error encoding options");
            return string.Empty;
        }
    }

    #endregion

    #region Visual Feedback

    /// <summary>
    /// Shows visual success indicator.
    /// </summary>
    private void ShowSuccessFeedback()
    {
        pctOK.Visible = true;
        pctKO.Visible = false;
    }

    /// <summary>
    /// Shows visual failure indicator.
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

    #endregion
}
