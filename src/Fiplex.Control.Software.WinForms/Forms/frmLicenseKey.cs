using System.Drawing.Drawing2D;
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

        // FlatStyle.Flat ignores ForeColor when Enabled=false; redraw text manually
        btnEnableFeature.Paint += (s, e) =>
        {
            if (btnEnableFeature.Enabled) return;
            var r = btnEnableFeature.ClientRectangle;
            using var bg     = new SolidBrush(Color.FromArgb(0, 88, 155));
            using var border = new Pen(Color.FromArgb(0, 58, 112));
            e.Graphics.FillRectangle(bg, r);
            e.Graphics.DrawRectangle(border, 0, 0, r.Width - 1, r.Height - 1);
            TextRenderer.DrawText(e.Graphics, btnEnableFeature.Text, btnEnableFeature.Font,
                r, Color.FromArgb(160, 200, 230),
                TextFormatFlags.HorizontalCenter | TextFormatFlags.VerticalCenter);
        };

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

        var bg = BackColor;
        pctOK.Image = CreateStatusIcon(success: true,  bg);
        pctOK.BackColor = bg;
        pctOK.SizeMode = PictureBoxSizeMode.CenterImage;

        pctKO.Image = CreateStatusIcon(success: false, bg);
        pctKO.BackColor = bg;
        pctKO.SizeMode = PictureBoxSizeMode.CenterImage;

        tmrKey.Interval = 200;
        tmrKey.Enabled = true;

        _logger.LogDebug("frmLicenseKey loaded");
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

    private static Bitmap CreateStatusIcon(bool success, Color background)
    {
        const int size = 32;
        var bmp = new Bitmap(size, size, System.Drawing.Imaging.PixelFormat.Format32bppArgb);
        using var g = Graphics.FromImage(bmp);
        g.Clear(background);
        g.SmoothingMode = SmoothingMode.AntiAlias;

        var circleColor = success ? Color.FromArgb(40, 167, 69) : Color.FromArgb(220, 53, 69);
        using var fill = new SolidBrush(circleColor);
        g.FillEllipse(fill, 1, 1, size - 2, size - 2);

        using var pen = new Pen(Color.White, 3.5f)
        {
            StartCap = LineCap.Round,
            EndCap   = LineCap.Round,
            LineJoin = LineJoin.Round
        };

        if (success)
            g.DrawLines(pen, new PointF[] { new(9, 17), new(14, 23), new(23, 11) });
        else
        {
            g.DrawLine(pen, 10, 10, 22, 22);
            g.DrawLine(pen, 22, 10, 10, 22);
        }

        return bmp;
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
