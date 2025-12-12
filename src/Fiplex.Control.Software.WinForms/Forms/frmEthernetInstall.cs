using Microsoft.Extensions.Logging;
using Fiplex.Control.Software.WinForms.Core.Config.Interfaces;
using Fiplex.Control.Software.WinForms.Models;

namespace Fiplex.Control.Software.WinForms.Forms;

/// <summary>
/// Dialog to configure the Ethernet Rabbit module.
/// </summary>
/// <remarks>
/// Allows enabling/disabling the Ethernet module by modifying bit 7
/// of position 93-94 in the device's factory string.
/// </remarks>
public partial class frmEthernetInstall : Form
{
    private readonly IEthernetModuleService _ethernetService;
    private readonly ILogger<frmEthernetInstall> _logger;
    
    private DeviceInfo? _device;
    private string _factoryString = string.Empty;
    private bool _isCommonUl;
    private bool _isLoading;
    private bool _isApplying;
    
    // CancellationTokenSource for async operations
    private CancellationTokenSource? _cts;
    
    public frmEthernetInstall(
        IEthernetModuleService ethernetService,
        ILogger<frmEthernetInstall> logger)
    {
        _ethernetService = ethernetService;
        _logger = logger;
        
        InitializeComponent();
    }
    
    /// <summary>
    /// Configures the current device.
    /// Must be called before ShowDialog().
    /// </summary>
    public void SetDevice(DeviceInfo device)
    {
        _device = device;
        _logger.LogDebug("Device configured: {Device}", device.NameTypeDevice);
    }
    
    /// <summary>
    /// Loads factory parameters when the form is activated.
    /// </summary>
    protected override async void OnActivated(EventArgs e)
    {
        base.OnActivated(e);
        
        // Avoid multiple reloads
        if (_isLoading || !string.IsNullOrEmpty(_factoryString))
            return;
        
        _isLoading = true;
        
        // Initialize CancellationTokenSource
        _cts?.Dispose();
        _cts = new CancellationTokenSource();
        
        await LoadFactoryParametersAsync();
        _isLoading = false;
    }
    
    /// <summary>
    /// Reads factory parameters from the device.
    /// </summary>
    private async Task LoadFactoryParametersAsync()
    {
        _logger.LogInformation("Loading factory parameters for Ethernet Module");
        
        chkEth.Enabled = false;
        cmdApply.Enabled = false;
        Cursor = Cursors.WaitCursor;
        
        try
        {
            var result = await _ethernetService.ReadFactoryStringAsync();
            
            // Verify cancellation before updating UI
            if (_cts?.Token.IsCancellationRequested == true || IsDisposed)
                return;
            
            if (!result.IsSuccess)
            {
                _logger.LogError("Error leyendo factory string: {Error}", result.ErrorMessage);
                MessageBox.Show(
                    "Error retrieving device information",
                    "Error",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error);
                Close();
                return;
            }
            
            _factoryString = result.FactoryString;
            _isCommonUl = result.CommonUl;
            
            // Update checkbox according to current state
            chkEth.Checked = result.EthernetInstalled;
            chkEth.Enabled = true;
            cmdApply.Enabled = true;
            
            _logger.LogInformation(
                "Parameters loaded: Ethernet={Eth}, CommonUl={Cul}",
                result.EthernetInstalled, result.CommonUl);
        }
        catch (OperationCanceledException)
        {
            _logger.LogDebug("Parameters loading cancelled");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error loading factory parameters");
            
            if (!IsDisposed)
            {
                MessageBox.Show(
                    $"Error: {ex.Message}",
                    "Error",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error);
                Close();
            }
        }
        finally
        {
            if (!IsDisposed)
            {
                Cursor = Cursors.Default;
            }
        }
    }
    
    /// <summary>
    /// Aplica los cambios al dispositivo.
    /// </summary>
    private async void cmdApply_Click(object sender, EventArgs e)
    {
        if (string.IsNullOrEmpty(_factoryString))
        {
            _logger.LogWarning("Attempt to apply without factory string loaded");
            return;
        }
        
        // Avoid multiple operations
        if (_isApplying)
            return;
            
        _isApplying = true;
        
        _logger.LogInformation(
            "Applying changes: Ethernet={Installed}", 
            chkEth.Checked);
        
        cmdApply.Enabled = false;
        chkEth.Enabled = false;
        Cursor = Cursors.WaitCursor;
        
        try
        {
            // Modify Ethernet bit in factory string
            var newFactoryString = _ethernetService.SetEthernetInstalled(
                _factoryString, 
                chkEth.Checked);
            
            // Determine header for 5dm devices (PSC Master)
            string? header = null;
            if (_device?.TDev == "5dm")
            {
                header = _isCommonUl ? "00" : "01";
                _logger.LogDebug("5dm device detected, header={Header}", header);
            }
            
            // Send first factory string
            var success = await _ethernetService.WriteFactoryStringAsync(
                newFactoryString, 
                header);
            
            if (!success)
            {
                ShowResultIndicator(false);
                return;
            }
            
            // For 5dm devices: second write with alternate header
            if (_device?.TDev == "5dm")
            {
                var secondHeader = _isCommonUl ? "01" : "00";
                _logger.LogDebug("Reading second factory string, header={Header}", secondHeader);
                
                var result2 = await _ethernetService.ReadFactoryStringAsync(secondHeader);
                
                if (result2.IsSuccess)
                {
                    var newFactoryString2 = _ethernetService.SetEthernetInstalled(
                        result2.FactoryString, 
                        chkEth.Checked);
                    
                    await _ethernetService.WriteFactoryStringAsync(
                        newFactoryString2, 
                        secondHeader);
                }
            }
            
            ShowResultIndicator(true);
        }
        catch (OperationCanceledException)
        {
            _logger.LogDebug("Apply changes operation cancelled");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error applying Ethernet changes");
            ShowResultIndicator(false);
        }
        finally
        {
            _isApplying = false;
            
            if (!IsDisposed)
            {
                Cursor = Cursors.Default;
            }
        }
    }
    
    /// <summary>
    /// Shows visual result indicator and closes the dialog.
    /// </summary>
    private async void ShowResultIndicator(bool success)
    {
        // Verify that the form is not disposed
        if (IsDisposed)
            return;
        
        pctOK.Visible = success;
        pctKO.Visible = !success;
        
        _logger.LogInformation(
            "Ethernet operation result: {Result}",
            success ? "Success" : "Error");
        
        try
        {
            await Task.Delay(2000, _cts?.Token ?? CancellationToken.None);
        }
        catch (OperationCanceledException)
        {
            // Cancelled, do nothing
            return;
        }
        
        if (IsDisposed)
            return;
        
        pctOK.Visible = false;
        pctKO.Visible = false;
        
        chkEth.Enabled = true;
        cmdApply.Enabled = true;
        
        if (success)
        {
            // Signal that WebView should be refreshed
            DialogResult = DialogResult.OK;
            Close();
        }
    }

    /// <summary>
    /// Evento FormClosing del formulario.
    /// Cancels pending operations before closing.
    /// </summary>
    protected override void OnFormClosing(FormClosingEventArgs e)
    {
        CancelPendingOperations();
        base.OnFormClosing(e);
    }

    /// <summary>
    /// Cancels any pending async operation.
    /// </summary>
    private void CancelPendingOperations()
    {
        try
        {
            if (_cts != null && !_cts.IsCancellationRequested)
            {
                _cts.Cancel();
            }
        }
        catch (ObjectDisposedException)
        {
            // CTS ya fue disposed, ignorar
        }
    }

    /// <summary>
    /// Dispose del formulario - libera CancellationTokenSource.
    /// </summary>
    protected override void Dispose(bool disposing)
    {
        if (disposing)
        {
            CancelPendingOperations();
            _cts?.Dispose();
            _cts = null;
            
            components?.Dispose();
        }
        base.Dispose(disposing);
    }
}
