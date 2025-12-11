using Microsoft.Extensions.Logging;
using Fiplex.Control.Software.WinForms.Core.Config.Interfaces;
using Fiplex.Control.Software.WinForms.Models;

namespace Fiplex.Control.Software.WinForms.Forms;

/// <summary>
/// Diálogo para configurar el módulo Ethernet Rabbit.
/// </summary>
/// <remarks>
/// Permite activar/desactivar el módulo Ethernet modificando el bit 7
/// de la posición 93-94 del factory string del dispositivo.
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
    
    // CancellationTokenSource para operaciones async
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
    /// Configura el dispositivo actual.
    /// Debe llamarse antes de ShowDialog().
    /// </summary>
    public void SetDevice(DeviceInfo device)
    {
        _device = device;
        _logger.LogDebug("Dispositivo configurado: {Device}", device.NameTypeDevice);
    }
    
    /// <summary>
    /// Carga los parámetros de fábrica al activar el formulario.
    /// </summary>
    protected override async void OnActivated(EventArgs e)
    {
        base.OnActivated(e);
        
        // Evitar recarga múltiple
        if (_isLoading || !string.IsNullOrEmpty(_factoryString))
            return;
        
        _isLoading = true;
        
        // Inicializar CancellationTokenSource
        _cts?.Dispose();
        _cts = new CancellationTokenSource();
        
        await LoadFactoryParametersAsync();
        _isLoading = false;
    }
    
    /// <summary>
    /// Lee los parámetros de fábrica del dispositivo.
    /// </summary>
    private async Task LoadFactoryParametersAsync()
    {
        _logger.LogInformation("Cargando parámetros de fábrica para Ethernet Module");
        
        chkEth.Enabled = false;
        cmdApply.Enabled = false;
        Cursor = Cursors.WaitCursor;
        
        try
        {
            var result = await _ethernetService.ReadFactoryStringAsync();
            
            // Verificar cancelación antes de actualizar UI
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
            
            // Actualizar checkbox según estado actual
            chkEth.Checked = result.EthernetInstalled;
            chkEth.Enabled = true;
            cmdApply.Enabled = true;
            
            _logger.LogInformation(
                "Parámetros cargados: Ethernet={Eth}, CommonUl={Cul}",
                result.EthernetInstalled, result.CommonUl);
        }
        catch (OperationCanceledException)
        {
            _logger.LogDebug("Carga de parámetros cancelada");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cargando parámetros de fábrica");
            
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
            _logger.LogWarning("Intento de aplicar sin factory string cargado");
            return;
        }
        
        // Evitar operaciones múltiples
        if (_isApplying)
            return;
            
        _isApplying = true;
        
        _logger.LogInformation(
            "Aplicando cambios: Ethernet={Installed}", 
            chkEth.Checked);
        
        cmdApply.Enabled = false;
        chkEth.Enabled = false;
        Cursor = Cursors.WaitCursor;
        
        try
        {
            // Modificar bit Ethernet en factory string
            var newFactoryString = _ethernetService.SetEthernetInstalled(
                _factoryString, 
                chkEth.Checked);
            
            // Determinar header para dispositivos 5dm (PSC Master)
            string? header = null;
            if (_device?.TDev == "5dm")
            {
                header = _isCommonUl ? "00" : "01";
                _logger.LogDebug("Dispositivo 5dm detectado, header={Header}", header);
            }
            
            // Enviar primer factory string
            var success = await _ethernetService.WriteFactoryStringAsync(
                newFactoryString, 
                header);
            
            if (!success)
            {
                ShowResultIndicator(false);
                return;
            }
            
            // Para dispositivos 5dm: segunda escritura con header alterno
            if (_device?.TDev == "5dm")
            {
                var secondHeader = _isCommonUl ? "01" : "00";
                _logger.LogDebug("Leyendo segundo factory string, header={Header}", secondHeader);
                
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
            _logger.LogDebug("Operación de aplicar cambios cancelada");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error aplicando cambios Ethernet");
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
    /// Muestra indicador visual de resultado y cierra el diálogo.
    /// </summary>
    private async void ShowResultIndicator(bool success)
    {
        // Verificar que el form no esté disposed
        if (IsDisposed)
            return;
        
        pctOK.Visible = success;
        pctKO.Visible = !success;
        
        _logger.LogInformation(
            "Resultado de operación Ethernet: {Result}",
            success ? "Éxito" : "Error");
        
        try
        {
            await Task.Delay(2000, _cts?.Token ?? CancellationToken.None);
        }
        catch (OperationCanceledException)
        {
            // Cancelado, no hacer nada
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
            // Señalar que se debe refrescar WebView
            DialogResult = DialogResult.OK;
            Close();
        }
    }

    /// <summary>
    /// Evento FormClosing del formulario.
    /// Cancela operaciones pendientes antes de cerrar.
    /// </summary>
    protected override void OnFormClosing(FormClosingEventArgs e)
    {
        CancelPendingOperations();
        base.OnFormClosing(e);
    }

    /// <summary>
    /// Cancela cualquier operación async pendiente.
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
