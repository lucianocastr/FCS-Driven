using Fiplex.Control.Software.WinForms.Core.Configuration;
using Fiplex.Control.Software.WinForms.Core.Serial.Interfaces;
using Fiplex.Control.Software.WinForms.Core.Serial.Models;
using Microsoft.Extensions.Logging;

namespace Fiplex.Control.Software.WinForms.Forms;

/// <summary>
/// Form for writing license keys to the device.
/// </summary>
/// <remarks>
/// Functionality:
///   - License key input (64 hexadecimal characters)
///   - Two buttons: "Enable Feature" (Index=1) and "Disable Feature" (Index=0)
///   - Sends command ;0{Index:X2}{Key64} to the device
///   - Visual feedback OK/KO with 2000ms delay
/// </remarks>
public partial class frmLicenseKey : Form
{
    private readonly ISerialCommandPipeline _pipeline;
    private readonly ILogger<frmLicenseKey> _logger;
    
    private bool _configuring = false;
    
    private CancellationTokenSource? _cts;

    /// <summary>
    /// Event fired when the license is applied successfully.
    /// </summary>
    public event EventHandler? LicenseApplied;

    /// <summary>
    /// Constructor with dependency injection.
    /// </summary>
    /// <param name="pipeline">Serial command pipeline</param>
    /// <param name="logger">Logger</param>
    public frmLicenseKey(
        ISerialCommandPipeline pipeline,
        ILogger<frmLicenseKey> logger)
    {
        _pipeline = pipeline ?? throw new ArgumentNullException(nameof(pipeline));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        
        InitializeComponent();
        
        // Subscribe to button events
        btnEnableFeature.Click += (s, e) => CmdLicense_Click(1);
        btnDisableFeature.Click += (s, e) => CmdLicense_Click(0);
    }

    /// <summary>
    /// Initializes the form with disabled controls.
    /// </summary>
    protected override void OnLoad(EventArgs e)
    {
        base.OnLoad(e);
        
        txtKey.Text = string.Empty;
        btnEnableFeature.Enabled = false;
        btnDisableFeature.Enabled = false;

        // Ensure indicators are visible regardless of RESX image loading
        pctOK.BackColor = Color.FromArgb(0, 155, 0);
        pctOK.SizeMode = PictureBoxSizeMode.Zoom;
        pctKO.BackColor = Color.FromArgb(210, 0, 0);
        pctKO.SizeMode = PictureBoxSizeMode.Zoom;

        tmrKey.Interval = 200;
        tmrKey.Enabled = true;

        _logger.LogDebug("frmLicenseKey loaded. pctOK.Image={OkImg} pctKO.Image={KoImg}",
            pctOK.Image != null ? "loaded" : "null",
            pctKO.Image != null ? "loaded" : "null");
    }

    /// <summary>
    /// Validates the key length every 200ms and enables/disables buttons.
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
    /// Sends the license command to the device.
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
            
            _logger.LogDebug("Sending license with Index={Index}", index);
            
            // Format: ;0{xx}{64_chars_hex_key}
            var indexHex = index.ToString("X2");
            var command = new SerialCommand
            {
                Payload = $";0{indexHex}{txtKey.Text}",
                ExpectsAck = true,
                ExpectsData = false,
                MaxRetries = 1,  // VB 1.9: single retry only
                CancellationToken = ct
            };

            var result = await _pipeline.EnqueueCommandAsync(command);

            ct.ThrowIfCancellationRequested();

            bool ucOk = result.Success;

            if (ucOk)
            {
                pctOK.Visible = true;
                _logger.LogInformation("License applied successfully (Index={Index})", index);
            }
            else
            {
                pctKO.Visible = true;
                _logger.LogWarning("License key rejected by device (Index={Index}). Status: {Status}",
                    index, result.Status);
            }

            Application.DoEvents(); // VB 1.9: DoEvents() after setting pctOK/pctKO visible
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
            _logger.LogDebug("License operation cancelled");
            pctOK.Visible = false;
            pctKO.Visible = false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending license command");
            pctKO.Visible = true;
            Application.DoEvents();

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
            
            // Re-evaluate button state based on key length
            bool keyOk = txtKey.Text.Length == 64;
            btnEnableFeature.Enabled = keyOk;
            btnDisableFeature.Enabled = keyOk;
        }
    }

    /// <summary>
    /// Cleans up resources on close.
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
