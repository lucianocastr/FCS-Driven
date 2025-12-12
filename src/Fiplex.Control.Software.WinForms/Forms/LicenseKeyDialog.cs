using System.ComponentModel;
using Fiplex.Control.Software.WinForms.Core.Configuration;
using Fiplex.Control.Software.WinForms.Core.Serial.Interfaces;
using Fiplex.Control.Software.WinForms.Core.Serial.Models;
using Microsoft.Extensions.Logging;

namespace Fiplex.Control.Software.WinForms.Forms;

/// <summary>
/// Dialog for viewing and editing device license.
/// </summary>
/// <remarks>
/// <para>Functionality:</para>
/// <list type="bullet">
///   <item><description>Read mode: Displays current license information</description></item>
///   <item><description>Edit mode: Allows writing new license to device</description></item>
/// </list>
/// <para>Serial command for writing: <c>;0{Index:X2}{Key64}</c> where Index is 00 or 01.</para>
/// </remarks>
public partial class LicenseKeyDialog : Form
{
    private readonly ISerialCommandPipeline? _pipeline;
    private readonly ILogger<LicenseKeyDialog>? _logger;
    
    private bool _isReadOnly;
    private bool _isApplying;
    private CancellationTokenSource? _cts;
    
    // Visual feedback indicators (green/red panels)
    private Panel? _pctOK;
    private Panel? _pctKO;

    /// <summary>
    /// Event fired when the license is successfully applied.
    /// </summary>
    /// <remarks>
    /// Allows frmMain to execute WebRefresh to update the device UI.
    /// </remarks>
    public event EventHandler? LicenseApplied;

    /// <summary>
    /// License index to apply (0 or 1).
    /// </summary>
    /// <remarks>
    /// Used in serial command: <c>;0{Index:X2}{Key64}</c>
    /// </remarks>
    [DesignerSerializationVisibility(DesignerSerializationVisibility.Hidden)]
    public int LicenseIndex { get; set; }

    /// <summary>
    /// Gets or sets the license key.
    /// </summary>
    [DesignerSerializationVisibility(DesignerSerializationVisibility.Hidden)]
    public string LicenseKey
    {
        get => txtLicenseKey.Text;
        set => txtLicenseKey.Text = value ?? string.Empty;
    }

    /// <summary>
    /// Gets or sets the device name (read-only).
    /// </summary>
    [DesignerSerializationVisibility(DesignerSerializationVisibility.Hidden)]
    public string DeviceName
    {
        get => lblDeviceValue.Text;
        set => lblDeviceValue.Text = value ?? string.Empty;
    }

    /// <summary>
    /// Gets or sets the device type (read-only).
    /// </summary>
    [DesignerSerializationVisibility(DesignerSerializationVisibility.Hidden)]
    public string DeviceType
    {
        get => lblTypeValue.Text;
        set => lblTypeValue.Text = value ?? string.Empty;
    }

    /// <summary>
    /// Gets or sets the device version (read-only).
    /// </summary>
    [DesignerSerializationVisibility(DesignerSerializationVisibility.Hidden)]
    public string DeviceVersion
    {
        get => lblVersionValue.Text;
        set => lblVersionValue.Text = value ?? string.Empty;
    }

    /// <summary>
    /// Gets or sets the license status.
    /// </summary>
    [DesignerSerializationVisibility(DesignerSerializationVisibility.Hidden)]
    public string LicenseStatus
    {
        get => lblStatusValue.Text;
        set
        {
            lblStatusValue.Text = value ?? string.Empty;
            // Change color based on status
            lblStatusValue.ForeColor = value?.Contains("Valid", StringComparison.OrdinalIgnoreCase) == true
                ? FiplexTheme.StateSuccess
                : FiplexTheme.StateError;
        }
    }

    /// <summary>
    /// Gets or sets the expiration date.
    /// </summary>
    [DesignerSerializationVisibility(DesignerSerializationVisibility.Hidden)]
    public string ExpirationDate
    {
        get => lblExpirationValue.Text;
        set => lblExpirationValue.Text = value ?? string.Empty;
    }

    /// <summary>
    /// Indicates whether the dialog is in read-only mode.
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
    /// Constructor with dependency injection for edit mode.
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
    /// Parameterless constructor for read-only mode (Designer compatibility).
    /// </summary>
    public LicenseKeyDialog()
    {
        InitializeComponent();
        InitializeFeedbackIndicators();
        SetupValidation();
    }
    
    /// <summary>
    /// Initializes visual feedback indicators (green panel for success, red for error).
    /// </summary>
    private void InitializeFeedbackIndicators()
    {
        // Success panel (green)
        _pctOK = new Panel
        {
            Size = new Size(16, 16),
            BackColor = FiplexTheme.StateSuccess,
            Visible = false,
            Anchor = AnchorStyles.Top | AnchorStyles.Right
        };
        
        // Error panel (red)
        _pctKO = new Panel
        {
            Size = new Size(16, 16),
            BackColor = FiplexTheme.StateError,
            Visible = false,
            Anchor = AnchorStyles.Top | AnchorStyles.Right
        };
        
        // Position next to Apply button
        _pctOK.Location = new Point(btnApply.Left - 24, btnApply.Top + 7);
        _pctKO.Location = new Point(btnApply.Left - 24, btnApply.Top + 7);
        
        panelButtons.Controls.Add(_pctOK);
        panelButtons.Controls.Add(_pctKO);
    }
    
    /// <summary>
    /// Configures real-time validation for the license field.
    /// </summary>
    private void SetupValidation()
    {
        txtLicenseKey.TextChanged += TxtLicenseKey_TextChanged;
        txtLicenseKey.MaxLength = 64;
        txtLicenseKey.CharacterCasing = CharacterCasing.Upper;
    }
    
    /// <summary>
    /// Validates the key in real-time when text changes.
    /// </summary>
    /// <remarks>
    /// Enables Apply button only if key has exactly 64 hexadecimal characters.
    /// </remarks>
    private void TxtLicenseKey_TextChanged(object? sender, EventArgs e)
    {
        if (_isApplying) return;
        
        var isValid = IsValidHexKey(txtLicenseKey.Text);
        btnApply.Enabled = isValid && !_isReadOnly;
    }
    
    /// <summary>
    /// Validates that the key is exactly 64 hexadecimal characters.
    /// </summary>
    private static bool IsValidHexKey(string key)
    {
        if (string.IsNullOrEmpty(key) || key.Length != 64)
            return false;
        
        return key.All(c => char.IsAsciiHexDigit(c));
    }

    /// <summary>
    /// Updates the UI according to mode (read vs edit).
    /// </summary>
    private void UpdateReadOnlyMode()
    {
        txtLicenseKey.ReadOnly = _isReadOnly;
        btnApply.Visible = !_isReadOnly;
        
        // Update initial Apply button state based on validation
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
    /// Validates the license key format.
    /// </summary>
    /// <returns><c>true</c> if the key is valid (64 hex characters); <c>false</c> otherwise.</returns>
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

        // Validate exact length of 64 characters
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
        
        // Validate hexadecimal characters
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
    /// Applies the license to the device.
    /// </summary>
    /// <remarks>
    /// <para>Execution flow:</para>
    /// <list type="number">
    ///   <item><description>Validate key (64 hexadecimal characters)</description></item>
    ///   <item><description>Disable controls during operation</description></item>
    ///   <item><description>Send command <c>;0{Index:X2}{Key64}</c></description></item>
    ///   <item><description>Show visual feedback (OK/KO)</description></item>
    ///   <item><description>Wait 2000ms to display result</description></item>
    ///   <item><description>If success: fire LicenseApplied event and close</description></item>
    /// </list>
    /// </remarks>
    private async void btnApply_Click(object sender, EventArgs e)
    {
        if (!ValidateLicenseKey())
        {
            return;
        }
        
        // Verify that we have pipeline to send commands
        if (_pipeline == null)
        {
            _logger?.LogWarning("Pipeline not available - closing with DialogResult.OK");
            DialogResult = DialogResult.OK;
            return;
        }

        _cts?.Cancel();
        _cts = new CancellationTokenSource();
        var ct = _cts.Token;
        
        try
        {
            _isApplying = true;
            
            // Disable controls during operation
            SetControlsEnabled(false);
            
            // Show wait cursor
            Cursor = Cursors.WaitCursor;
            
            _logger?.LogDebug("Sending license (Index: {Index})", LicenseIndex);
            
            // Format: ;0{Index:X2}{Key64} - e.g.: ;000AABBCCDD...64chars
            var indexHex = LicenseIndex.ToString("X2");
            var command = new SerialCommand
            {
                Payload = $";0{indexHex}{txtLicenseKey.Text}",
                ExpectsAck = true,
                ExpectsData = false,  // Only expects ACK
                CancellationToken = ct
            };
            
            var result = await _pipeline.EnqueueCommandAsync(command);
            
            ct.ThrowIfCancellationRequested();
            
            // Verify operation result
            if (result.Success)
            {
                ShowSuccessFeedback();
                _logger?.LogInformation("License applied successfully (Index: {Index})", LicenseIndex);
            }
            else
            {
                ShowFailureFeedback();
                _logger?.LogWarning("Error applying license. Status: {Status}", result.Status);
            }
            
            // Wait to show visual feedback
            await Task.Delay(2000, ct);
            
            // Hide feedback indicators
            HideFeedback();
            
            // If successful, notify and close
            if (result.Success)
            {
                LicenseApplied?.Invoke(this, EventArgs.Empty);
                DialogResult = DialogResult.OK;
                Close();
            }
        }
        catch (OperationCanceledException)
        {
            _logger?.LogDebug("License apply operation cancelled");
            HideFeedback();
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, "Error sending license to device");
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
            // Restore control state
            _isApplying = false;
            Cursor = Cursors.Default;
            SetControlsEnabled(true);
        }
    }
    
    /// <summary>
    /// Enables or disables dialog controls during operations.
    /// </summary>
    /// <param name="enabled"><c>true</c> to enable; <c>false</c> to disable.</param>
    private void SetControlsEnabled(bool enabled)
    {
        btnApply.Enabled = enabled && IsValidHexKey(txtLicenseKey.Text);
        btnClose.Enabled = enabled;
        txtLicenseKey.Enabled = enabled;
        btnCopy.Enabled = enabled;
    }
    
    /// <summary>
    /// Shows success visual indicator (green panel).
    /// </summary>
    private void ShowSuccessFeedback()
    {
        if (_pctOK != null) _pctOK.Visible = true;
        if (_pctKO != null) _pctKO.Visible = false;
    }
    
    /// <summary>
    /// Shows failure visual indicator (red panel).
    /// </summary>
    private void ShowFailureFeedback()
    {
        if (_pctOK != null) _pctOK.Visible = false;
        if (_pctKO != null) _pctKO.Visible = true;
    }
    
    /// <summary>
    /// Hides both visual feedback indicators.
    /// </summary>
    private void HideFeedback()
    {
        if (_pctOK != null) _pctOK.Visible = false;
        if (_pctKO != null) _pctKO.Visible = false;
    }

    /// <summary>
    /// Handles Close/Cancel button click.
    /// </summary>
    private void btnClose_Click(object sender, EventArgs e)
    {
        _cts?.Cancel();
        DialogResult = _isReadOnly ? DialogResult.OK : DialogResult.Cancel;
    }

    /// <summary>
    /// Handles Copy button click.
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
    /// Cleans up resources and cancels pending operations when closing the form.
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
    /// Initializes the form on load.
    /// </summary>
    /// <remarks>
    /// In edit mode, clears the field if empty. Apply button is only enabled
    /// when the key meets validation (64 hex characters).
    /// </remarks>
    protected override void OnLoad(EventArgs e)
    {
        base.OnLoad(e);
        
        // In edit mode, if no value, clear; if there's a value, keep it
        if (!_isReadOnly && string.IsNullOrWhiteSpace(txtLicenseKey.Text))
        {
            txtLicenseKey.Text = string.Empty;
        }
        
        // Apply button is only enabled when key is valid (64 hex)
        btnApply.Enabled = !_isReadOnly && IsValidHexKey(txtLicenseKey.Text);
        
        // Focus text field in edit mode
        if (!_isReadOnly)
        {
            txtLicenseKey.Focus();
            txtLicenseKey.SelectAll();
        }
        
        _logger?.LogDebug("LicenseKeyDialog loaded - ReadOnly: {ReadOnly}, Index: {Index}", 
            _isReadOnly, LicenseIndex);
    }
}
