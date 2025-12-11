using Fiplex.Control.Software.WinForms.Core.Commands.Interfaces;
using Fiplex.Control.Software.WinForms.Core.Commands;
using Fiplex.Control.Software.WinForms.Core.Config.Interfaces;
using Fiplex.Control.Software.WinForms.Core.Config;
using Fiplex.Control.Software.WinForms.Core.Configuration;
using Fiplex.Control.Software.WinForms.Core.Configuration.Interfaces;
using Fiplex.Control.Software.WinForms.Core.Devices;
using Fiplex.Control.Software.WinForms.Core.Devices.Interfaces;
using Fiplex.Control.Software.WinForms.Core.Http;
using Fiplex.Control.Software.WinForms.Core.Http.Interfaces;
using Fiplex.Control.Software.WinForms.Core.Security.Interfaces;
using Fiplex.Control.Software.WinForms.Core.Serial.Interfaces;
using Fiplex.Control.Software.WinForms.Core.Serial.Models;
using Fiplex.Control.Software.WinForms.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Web.WebView2.Core;
using System.Reflection;

namespace Fiplex.Control.Software.WinForms.Forms;

public partial class frmMain : Form
{
    private readonly ISerialCommandPipeline _pipeline;
    private readonly IDeviceDiscoveryService _discovery;
    private readonly IDeviceCatalogService _catalog;
    private readonly ISerialPort _serialPort;
    private readonly IAuthService _authService;
    private readonly IWatchdogService _watchdog;
    private readonly IAppSettingsService _appSettings;
    private readonly IEmbeddedHttpServer _httpServer;
    private readonly IDeviceCommandRouter _commandRouter;
    private readonly IConfigService _configService;
    private readonly ISettingsParser _settingsParser;
    private readonly IFileOperationService _fileOperationService;
    private readonly ITrainingValidationService _trainingValidation;
    private readonly IVersionCheckService _versionCheck;
    private readonly IServiceProvider _serviceProvider;
    private readonly IConfiguration _configuration;
    private readonly ILogger<frmMain> _logger;

    private List<DeviceInfo> _foundDevices = new();
    private CancellationTokenSource? _scanCts;
    private CancellationTokenSource? _cts;
    private SessionContext _sessionContext = new();
    private bool _httpServerIsRunning = false;
    private int _httpPort = 8000;
    private DevelopmentModeSettings? _devModeSettings;

    // Configuración del dispositivo actual (comandos FILE)
    private DeviceConfiguration? _currentDeviceConfig;
    private bool _waitingLF = false;
    private short _chTestActivated = -1;
    private string _confSCA = "";
    private bool _pendingAnswer = false;

    // Contador para combinación de teclas factory mode
    private short _cntmode = 0;

    // Contraseña validada para reintentos INVALID CREDENTIALS
    private string? _validatedPassword;

    // Ruta de la página predeterminada para carga inicial y desconexión
    // Se utiliza cuando no hay dispositivo conectado o al ejecutar Disconnect
    private static readonly string DefaultPagePath = Path.Combine(
        AppDomain.CurrentDomain.BaseDirectory,
        "pages", "htdocs_default", "index.html");

    // Versión del software para mostrar en About > SW Info
    // Usa InformationalVersion para incluir sufijo semántico (-alpha, -beta, etc.)
    // Split('+')[0] elimina el hash de Git que .NET agrega automáticamente
    private static readonly string SoftwareVersion =
        (Assembly.GetExecutingAssembly()
            .GetCustomAttribute<AssemblyInformationalVersionAttribute>()
            ?.InformationalVersion ?? "3.0.0-alpha")
        .Split('+')[0];

    public frmMain(
        ISerialCommandPipeline pipeline,
        IDeviceDiscoveryService discovery,
        IDeviceCatalogService catalog,
        ISerialPort serialPort,
        IAuthService authService,
        IWatchdogService watchdog,
        IAppSettingsService appSettings,
        IEmbeddedHttpServer httpServer,
        IDeviceCommandRouter commandRouter,
        IConfigService configService,
        ISettingsParser settingsParser,
        IFileOperationService fileOperationService,
        ITrainingValidationService trainingValidation,
        IVersionCheckService versionCheck,
        IServiceProvider serviceProvider,
        IConfiguration configuration,
        ILogger<frmMain> logger)
    {
        _pipeline = pipeline;
        _discovery = discovery;
        _catalog = catalog;
        _serialPort = serialPort;
        _authService = authService;
        _watchdog = watchdog;
        _appSettings = appSettings;
        _httpServer = httpServer;
        _commandRouter = commandRouter;
        _configService = configService;
        _settingsParser = settingsParser;
        _fileOperationService = fileOperationService;
        _trainingValidation = trainingValidation;
        _versionCheck = versionCheck;
        _serviceProvider = serviceProvider;
        _configuration = configuration;
        _logger = logger;

        InitializeComponent();

        // Configurar menú de Debug/Tools para logging y diagnósticos
        ConfigureDebugMenu();

        // Cargar configuración modo desarrollo
        _devModeSettings = _configuration
            .GetSection("DevelopmentMode")
            .Get<DevelopmentModeSettings>();

        if (_devModeSettings?.NoUSB == true)
        {
            _logger.LogWarning(
                "?? MODO DESARROLLO ACTIVO (noUSB=true) - Dispositivo simulado: {Device}",
                _devModeSettings.SimulatedDevice);
        }

        InitializeAsync();

        // Suscribir al evento HTTP para procesar comandos
        _httpServer.CommandReceived += OnHttpCommandReceived;

        // Suscribir al evento BaseJsLoaded para limpiar comandos pendientes
        // al cargar base.js, evitando comandos huérfanos
        _httpServer.BaseJsLoaded += OnHttpServerBaseJsLoaded;

        // Suscribir al evento de credenciales requeridas del pipeline
        // Esto permite reintento automático cuando el dispositivo responde INVALID CREDENTIALS
        _pipeline.CredentialsRequired += OnPipelineCredentialsRequired;

        // Suscribir al evento de cambio de selección de COM
        cmbCOM.SelectedIndexChanged += cmbCOM_SelectedIndexChanged;

        // Suscribir eventos del menú CLSS
        LogoutToolStripMenuItem.Click += LogoutToolStripMenuItem_Click;
        SubscriptionInformationToolStripMenuItem.Click += SubscriptionInformationToolStripMenuItem_Click;
    }

    /// <summary>
    /// Obtiene un puerto TCP disponible en el rango especificado
    /// </summary>
    private int GetAvailablePort(int startPort = 8080, int endPort = 8090)
    {
        for (int port = startPort; port <= endPort; port++)
        {
            try
            {
                var listener = new System.Net.Sockets.TcpListener(
                    System.Net.IPAddress.Loopback, port);
                listener.Start();
                listener.Stop();
                return port;
            }
            catch (System.Net.Sockets.SocketException)
            {
                // Puerto ocupado, continuar con el siguiente
            }
        }

        throw new InvalidOperationException(
            $"No se encontraron puertos disponibles entre {startPort} y {endPort}");
    }

    private async void InitializeAsync()
    {
        try
        {
            // Asignar versión del software al menú About > SW Info
            mnuSWver.Text = SoftwareVersion;

            LogStatus("Initializing services...");

            await _catalog.LoadCatalogAsync();
            await _pipeline.StartAsync();

            // Leer información de token CLSS
            await _trainingValidation.ReadTokenInformationAsync();

            // Mostrar estado de licencia en lbldaysRemaining
            lbldaysRemaining.Text = _trainingValidation.GetStatusMessage();

            // Validar training y configurar cmdConnect 
            ValidateTrainingAndUpdateUI();

            _sessionContext = _sessionContext with { State = ConnectionState.Disconnected };

            // Inicializar WebView2
            await InitializeWebView2Async();

            // Verificar actualizaciones en background sin bloquear la UI
            await CheckForUpdatesAsync();

            // Escaneo rápido de dispositivos al cargar el formulario
            // Se detiene al encontrar el primer dispositivo válido (QuickScan)
            await PerformQuickScanAsync();

            LogStatus("Services initialized successfully");
            _logger.LogInformation("Form initialized");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Initialization failed");
            MessageBox.Show(
                $"Fatal initialization error: {ex.Message}",
                "Error",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error);
        }
    }

    /// <summary>
    /// Valida el estado de training y actualiza UI correspondiente.
    /// </summary>
    /// <remarks>
    /// Si el training está vigente, habilita el botón de conexión.
    /// Si está expirado, deshabilita el botón y muestra tooltip informativo.
    /// </remarks>
    private void ValidateTrainingAndUpdateUI()
    {
        if (_trainingValidation.IsTrainingValid)
        {
            // Training válido: habilitar conexión
            // Nota: cmdConnect.Enabled también depende de tener dispositivos en la lista
            ToolTip1.SetToolTip(cmdConnect, "");
            _logger.LogDebug("Training valid, connection enabled. Days remaining: {Days}",
                _trainingValidation.DaysRemaining);
        }
        else
        {
            // Training expirado: deshabilitar conexión y mostrar tooltip
            cmdConnect.Enabled = false;
            ToolTip1.SetToolTip(cmdConnect, _trainingValidation.GetExpiredTooltip());
            _logger.LogWarning("Training expired, connection disabled");

            MessageBox.Show(
                "Your training has expired. You are not permitted to connect to any device.\n\n" +
                "Please contact Fiplex to renew your training certification.",
                "Training Expired",
                MessageBoxButtons.OK,
                MessageBoxIcon.Warning);
        }
    }

    /// <summary>
    /// Configura el menú de Debug/Tools para logging y diagnósticos.
    /// Agrega opciones para habilitar/deshabilitar el logging de comandos HTTP.
    /// El menú solo se muestra si FeatureFlags:EnableDebugMenu está habilitado en appsettings.json.
    /// </summary>
    private void ConfigureDebugMenu()
    {
        // Verificar si el menú Debug está habilitado en la configuración
        var enableDebugMenu = _configuration.GetValue<bool>("FeatureFlags:EnableDebugMenu");

        if (!enableDebugMenu)
        {
            _logger.LogDebug("Debug menu disabled by configuration (FeatureFlags:EnableDebugMenu = false)");
            return;
        }

        // Crear menú Debug
        var mnuDebug = new ToolStripMenuItem("&Debug");

        // Opción: Enable HTTP Command Logging
        var mnuEnableLogging = new ToolStripMenuItem("Enable HTTP Command &Logging");
        mnuEnableLogging.ToolTipText = "Enable detailed logging of HTTP GET commands";
        mnuEnableLogging.Click += (sender, e) =>
        {
            if (_commandRouter.IsCommandLoggingEnabled)
            {
                _commandRouter.DisableCommandLogging();
                mnuEnableLogging.Text = "Enable HTTP Command &Logging";
                mnuEnableLogging.Checked = false;
                LogStatus("HTTP Command logging disabled");

                var logFile = _commandRouter.GetCommandLogFile();
                if (!string.IsNullOrEmpty(logFile) && File.Exists(logFile))
                {
                    var result = MessageBox.Show(
                        $"Log file saved to:\n{logFile}\n\nDo you want to open the log file?",
                        "HTTP Command Logging",
                        MessageBoxButtons.YesNo,
                        MessageBoxIcon.Information);

                    if (result == DialogResult.Yes)
                    {
                        System.Diagnostics.Process.Start("explorer.exe", $"/select,\"{logFile}\"");
                    }
                }
            }
            else
            {
                _commandRouter.EnableCommandLogging();
                mnuEnableLogging.Text = "Disable HTTP Command &Logging";
                mnuEnableLogging.Checked = true;
                LogStatus($"HTTP Command logging enabled: {_commandRouter.GetCommandLogFile()}");
            }
        };
        mnuDebug.DropDownItems.Add(mnuEnableLogging);

        // Separador
        mnuDebug.DropDownItems.Add(new ToolStripSeparator());

        // Opción: Open Log Directory
        var mnuOpenLogDir = new ToolStripMenuItem("Open Log &Directory");
        mnuOpenLogDir.ToolTipText = "Open the folder containing HTTP command logs";
        mnuOpenLogDir.Click += (sender, e) =>
        {
            var logDir = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "Fiplex.Control.Software",
                "HttpCommandLogs");

            if (!Directory.Exists(logDir))
            {
                Directory.CreateDirectory(logDir);
            }

            System.Diagnostics.Process.Start("explorer.exe", logDir);
        };
        mnuDebug.DropDownItems.Add(mnuOpenLogDir);

        // Agregar al menú principal
        MainMenu1.Items.Add(mnuDebug);

        _logger.LogDebug("Debug menu configured");
    }

    private async Task InitializeWebView2Async()
    {
        try
        {
            await webView.EnsureCoreWebView2Async();

            // Configurar eventos de navegación
            webView.CoreWebView2.NavigationStarting += CoreWebView2_NavigationStarting;
            webView.CoreWebView2.NavigationCompleted += CoreWebView2_NavigationCompleted;
            webView.CoreWebView2.NewWindowRequested += CoreWebView2_NewWindowRequested;
            // Nota: No suscribimos DownloadStarting porque .zhtml ahora se sirve como text/html

            // Deshabilitar funciones que no necesitamos
            webView.AllowExternalDrop = false;

            // Configurar permisos de contenido local
            webView.CoreWebView2.Settings.IsScriptEnabled = true;
            webView.CoreWebView2.Settings.AreDefaultScriptDialogsEnabled = true;
            webView.CoreWebView2.Settings.IsWebMessageEnabled = true;
            webView.CoreWebView2.Settings.AreDevToolsEnabled = true;

            _logger.LogInformation("WebView2 initialized successfully");

            // Navegar a la página predeterminada en la carga inicial
            await NavigateToDefaultPageAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "WebView2 initialization failed");
            MessageBox.Show($"WebView2 initialization failed: {ex.Message}", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }

    /// <summary>
    /// Navega a la página predeterminada (htdocs_default/index.html).
    /// Se utiliza en la carga inicial del formulario y al ejecutar Disconnect.
    /// </summary>
    private async Task NavigateToDefaultPageAsync()
    {
        if (webView?.CoreWebView2 == null)
        {
            _logger.LogWarning("WebView2 no inicializado, no se puede navegar a página predeterminada");
            return;
        }

        try
        {
            if (File.Exists(DefaultPagePath))
            {
                var defaultUrl = $"file:///{DefaultPagePath.Replace("\\", "/")}";
                webView.CoreWebView2.Navigate(defaultUrl);
                _logger.LogInformation("Navegando a página predeterminada: {Url}", defaultUrl);
            }
            else
            {
                _logger.LogWarning("Página predeterminada no encontrada: {Path}", DefaultPagePath);
                webView.CoreWebView2.Navigate("about:blank");
            }

            // Pequeña pausa para asegurar que la navegación se complete
            await Task.Delay(50);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error navegando a página predeterminada");
        }
    }

    private void CoreWebView2_NewWindowRequested(object? sender, CoreWebView2NewWindowRequestedEventArgs e)
    {
        e.Handled = true;
        webView.CoreWebView2.Navigate(e.Uri);
    }

    private void CoreWebView2_NavigationStarting(object? sender, CoreWebView2NavigationStartingEventArgs e)
    {
        // Placeholder para validaciones
    }

    private void CoreWebView2_NavigationCompleted(object? sender, CoreWebView2NavigationCompletedEventArgs e)
    {
        if (!e.IsSuccess)
        {
            LogStatus($"Navigation error: {e.WebErrorStatus}");
        }
    }

    /// <summary>
    /// Navega a la interfaz del dispositivo.
    /// </summary>
    /// <remarks>
    /// <para>Flujo de navegación:</para>
    /// <list type="bullet">
    ///   <item><description>Detiene navegación actual antes de iniciar nueva</description></item>
    ///   <item><description>Dispositivos 2C con forceADV → navega a /std.html</description></item>
    ///   <item><description>Otros dispositivos → navega a raíz (index.html implícito)</description></item>
    /// </list>
    /// </remarks>
    /// <param name="forceAdvanced">True para forzar UI avanzada en dispositivos 2C.</param>
    private async Task NavigateToDeviceUIAsync(bool forceAdvanced = false)
    {
        if (webView?.CoreWebView2 == null)
        {
            _logger.LogWarning("WebView2 no inicializado, no se puede navegar");
            return;
        }

        // Reset contador factory mode
        _cntmode = 0;

        // Si desconectado, no navegar
        if (_sessionContext.State != ConnectionState.Connected)
        {
            _logger.LogDebug("No conectado, navegación cancelada");
            return;
        }

        try
        {
            // Detener cualquier carga pendiente antes de navegar
            // En WebView2, usamos CoreWebView2.Stop()
            webView.CoreWebView2.Stop();

            // Pequeña pausa para asegurar que Stop() se complete
            await Task.Delay(50);

            // Determinar URL según tipo de dispositivo
            string url;
            var currentDevice = _sessionContext.Device;

            // Dispositivo 2c con forceAdvanced navega a /std.html
            if (currentDevice?.TDev == "2c" && forceAdvanced)
            {
                url = $"http://localhost:{_httpPort}/std.html";
                _logger.LogDebug("Dispositivo 2C con forceAdvanced, navegando a std.html");
            }
            else
            {
                url = $"http://localhost:{_httpPort}";
            }

            _logger.LogInformation("WebRefresh: Navegando a {Url}", url);
            webView.CoreWebView2.Navigate(url);

            // NOTA: La lógica de ajuste de tamaño del formulario se maneja en
            // UpdateUIForConnectedState (1350×800 al conectar) y 
            // UpdateUIForDisconnectedState (1024×720 al desconectar).
            // Refresh NO modifica el tamaño ni la posición del formulario.
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en NavigateToDeviceUIAsync");
        }
    }

    /// <summary>
    /// Refresca la página web del dispositivo.
    /// Llamado por botón cmdRefresh.
    /// </summary>
    private async Task RefreshDeviceUIAsync()
    {
        await NavigateToDeviceUIAsync(false);
    }

    /// <summary>
    /// Handler para evento BaseJsLoaded del servidor HTTP.
    /// </summary>
    /// <remarks>
    /// Limpia todos los comandos pendientes del pipeline cuando la UI carga base.js,
    /// evitando que comandos huérfanos interfieran con la nueva sesión de navegación.
    /// </remarks>
    private void OnHttpServerBaseJsLoaded(object? sender, EventArgs e)
    {
        try
        {
            _logger.LogDebug("base.js cargado - cancelando comandos pendientes");
            _pipeline.CancelPendingCommands();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al limpiar comandos tras carga de base.js");
        }
    }

    /// <summary>
    /// Handler para eventos de comandos HTTP recibidos
    /// Procesa comandos HTTP y los enruta al dispositivo serial
    /// </summary>
    private async void OnHttpCommandReceived(object? sender, HttpCommandEventArgs e)
    {
        try
        {
            _logger.LogDebug("Comando HTTP recibido: {Command}, Params: {Params}",
                e.CommandName, string.Join(", ", e.Parameters.Select(kvp => $"{kvp.Key}={kvp.Value}")));

            // Validar que estamos conectados
            if (_sessionContext.State != ConnectionState.Connected)
            {
                _logger.LogWarning("Comando recibido pero no conectado");
                e.SetResponse("ERROR: Not connected");
                return;
            }

            // Delegar a IDeviceCommandRouter
            var response = await _commandRouter.ProcessGetRequestAsync(
                e.CommandName,
                e.Parameters,
                _cts?.Token ?? default);

            e.SetResponse(response);

            _logger.LogDebug("Respuesta enviada: {Response}",
                response.Length > 100 ? $"{response[..100]}..." : response);
        }
        catch (OperationCanceledException)
        {
            _logger.LogWarning("Comando cancelado: {Command}", e.CommandName);
            e.SetResponse("ERROR: Operation cancelled");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error procesando comando {Command}", e.CommandName);
            e.SetResponse($"ERROR: {ex.Message}");
        }
    }

    private async void cmdIDPort_Click(object sender, EventArgs e)
    {
        // Escaneo completo invocado manualmente por el usuario
        await ExecuteDeviceScanAsync(DeviceScanMode.FullScan);
    }

    /// <summary>
    /// Escaneo rápido para carga inicial del formulario.
    /// Se detiene al encontrar el primer dispositivo válido.
    /// </summary>
    public async Task PerformQuickScanAsync()
    {
        await ExecuteDeviceScanAsync(DeviceScanMode.QuickScan);
    }

    /// <summary>
    /// Handler para cambio de selección en ComboBox de puertos COM.
    /// </summary>
    /// <remarks>
    /// Habilita cmdConnect cuando hay un dispositivo válido seleccionado y el training está vigente.
    /// </remarks>
    private void cmbCOM_SelectedIndexChanged(object? sender, EventArgs e)
    {
        // Solo procesar si hay dispositivos encontrados y el índice es válido
        if (_foundDevices.Count == 0 || cmbCOM.SelectedIndex < 0)
        {
            cmdConnect.Enabled = false;
            return;
        }

        // Verificar que la selección sea un dispositivo válido (no un mensaje de estado)
        if (cmbCOM.SelectedIndex < _foundDevices.Count)
        {
            var device = _foundDevices[cmbCOM.SelectedIndex];

            // Habilitar botón Connect solo si training es válido
            cmdConnect.Enabled = _trainingValidation.IsTrainingValid;

            _logger.LogDebug("Dispositivo seleccionado: {Device} en COM{Port}",
                device.NameTypeDevice, device.ComPort);

            LogStatus($"Selected: {device.NameTypeDevice}");
        }
        else
        {
            cmdConnect.Enabled = false;
        }
    }

    /// <summary>
    /// Ejecuta el escaneo de dispositivos según el modo especificado.
    /// Separa lógica de UI de la lógica de escaneo delegando al servicio.
    /// </summary>
    /// <param name="mode">QuickScan: detiene al primer dispositivo. FullScan: todos los puertos.</param>
    private async Task ExecuteDeviceScanAsync(DeviceScanMode mode = DeviceScanMode.FullScan)
    {
        _scanCts?.Cancel();
        _scanCts = new CancellationTokenSource();

        SetUIState(isScanning: true);
        PrepareComboBoxForScan();
        LogStatus(mode == DeviceScanMode.QuickScan 
            ? "Quick scan: searching for first device..." 
            : "Starting full device scan...");

        try
        {
            var progress = new Progress<ScanProgress>(UpdateScanProgress);
            _foundDevices = await _discovery.ScanPortsAsync(mode, progress, _scanCts.Token);

            UpdateDeviceList();
            LogScanCompleteStatus(mode);
        }
        catch (OperationCanceledException)
        {
            HandleScanCancelled();
        }
        catch (Exception ex)
        {
            HandleScanError(ex);
        }
        finally
        {
            SetUIState(isScanning: false);
        }
    }

    /// <summary>
    /// Prepara el ComboBox para mostrar estado de escaneo en progreso.
    /// </summary>
    private void PrepareComboBoxForScan()
    {
        cmbCOM.DataSource = null;
        cmbCOM.DisplayMember = string.Empty;
        cmbCOM.ValueMember = string.Empty;
        cmbCOM.Items.Clear();
        cmbCOM.Items.Add("Scanning ports...");
        cmbCOM.SelectedIndex = 0;
    }

    /// <summary>
    /// Registra mensaje de escaneo completado según modo.
    /// </summary>
    private void LogScanCompleteStatus(DeviceScanMode mode)
    {
        var modeLabel = mode == DeviceScanMode.QuickScan ? "Quick scan" : "Full scan";
        LogStatus($"{modeLabel} complete: {_foundDevices.Count} device(s) found");
        _logger.LogInformation("{Mode} completed: {Count} devices", modeLabel, _foundDevices.Count);
    }

    /// <summary>
    /// Maneja cancelación del escaneo por usuario.
    /// </summary>
    private void HandleScanCancelled()
    {
        LogStatus("Scan cancelled by user");
        SetComboBoxMessage("Scan cancelled");
    }

    /// <summary>
    /// Maneja errores durante el escaneo.
    /// </summary>
    private void HandleScanError(Exception ex)
    {
        _logger.LogError(ex, "Scan failed");
        MessageBox.Show(
            $"Scan failed: {ex.Message}",
            "Error",
            MessageBoxButtons.OK,
            MessageBoxIcon.Error);
        SetComboBoxMessage("Scan failed");
    }

    /// <summary>
    /// Establece un mensaje único en el ComboBox (estados de error/cancelación).
    /// </summary>
    private void SetComboBoxMessage(string message)
    {
        cmbCOM.DataSource = null;
        cmbCOM.Items.Clear();
        cmbCOM.Items.Add(message);
        cmbCOM.SelectedIndex = 0;
    }

    private void UpdateScanProgress(ScanProgress p)
    {
        if (InvokeRequired)
        {
            Invoke(() => UpdateScanProgress(p));
            return;
        }

        // Solo actualizar el status bar, no el ComboBox
        LogStatus($"Scanning {p.CurrentPort} ({p.Completed}/{p.Total}) - Found: {p.DevicesFound}");
    }

    private void UpdateDeviceList()
    {
        if (InvokeRequired)
        {
            Invoke(UpdateDeviceList);
            return;
        }

        // Limpieza completa del ComboBox
        cmbCOM.DataSource = null;
        cmbCOM.DisplayMember = string.Empty;
        cmbCOM.ValueMember = string.Empty;
        cmbCOM.Items.Clear();

        if (_foundDevices.Any())
        {
            // Usar BindingList para mejor comportamiento con ComboBox
            var bindingList = new System.ComponentModel.BindingList<DeviceInfo>(_foundDevices);
            cmbCOM.DataSource = bindingList;
            cmbCOM.DisplayMember = nameof(DeviceInfo.NameTypeDevice);
            cmbCOM.ValueMember = nameof(DeviceInfo.ComPort);

            // Selecci�n autom�tica del �ltimo puerto usado
            _ = SelectLastUsedPortAsync();
        }
        else
        {
            cmbCOM.Items.Add("No Fiplex devices found");
            cmbCOM.SelectedIndex = 0;
        }

        LogStatus(_foundDevices.Any()
            ? $"Found {_foundDevices.Count} device(s)"
            : "No devices found");
    }

    private async Task SelectLastUsedPortAsync()
    {
        try
        {
            var lastUsedPort = await _appSettings.GetLastUsedComPortAsync();
            if (lastUsedPort > 0)
            {
                var matchingIndex = _foundDevices
                    .Select((device, index) => new { device, index })
                    .FirstOrDefault(x => x.device.ComPort == lastUsedPort)
                    ?.index;

                if (matchingIndex.HasValue)
                {
                    cmbCOM.SelectedIndex = matchingIndex.Value;
                    _logger.LogDebug("Auto-selected last used port: COM{Port}", lastUsedPort);
                }
                else
                {
                    cmbCOM.SelectedIndex = 0;
                    _logger.LogDebug("Last used port COM{Port} not found, selecting first device", lastUsedPort);
                }
            }
            else
            {
                cmbCOM.SelectedIndex = 0;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to load last used port, selecting first device");
            cmbCOM.SelectedIndex = 0;
        }
    }

    private async void cmdConnect_Click(object sender, EventArgs e)
    {
        if (_serialPort.IsOpen)
        {
            await DisconnectAsync();
        }
        else
        {
            await ConnectAsync();
        }
    }

    /// <summary>
    /// Conecta al dispositivo con flujo completo de 8 fases
    /// PROMPT 6: Implementación completa de conexión orquestada
    /// </summary>
    private async Task ConnectAsync()
    {
        try
        {
            _logger.LogInformation("=== INICIANDO CONEXIÓN DISPOSITIVO ===");

            // FASE 0: Reset de estado inicial 
            _waitingLF = false;
            _pendingAnswer = false;

            // VALIDACIÓN TRAINING: Verificar que el entrenamiento esté vigente
            if (!_trainingValidation.IsTrainingValid)
            {
                _logger.LogWarning("Connection blocked: Training expired");
                MessageBox.Show(
                    _trainingValidation.GetExpiredTooltip(),
                    "Connection Blocked",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Warning);
                return;
            }

            // FASE 1: Validación selección dispositivo
            _logger.LogInformation("FASE 1: Validando selección dispositivo");
            if (!ValidateDeviceSelection())
            {
                MessageBox.Show("Please select a device first", "Warning",
                    MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            var selectedDevice = GetSelectedDevice();
            var portName = GetSelectedComPort();

            if (selectedDevice == null || string.IsNullOrEmpty(portName))
            {
                MessageBox.Show("Invalid device selection", "Error",
                    MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }

            // Deshabilitar controles inmediatamente 
            cmdConnect.Enabled = false;
            await Task.Yield();

            SetUIState(isConnecting: true);
            LogStatus($"Connecting to {selectedDevice.NameTypeDevice} on {portName}...");

            // Crear CancellationTokenSource para toda la conexión
            _cts = new CancellationTokenSource();
            _sessionContext = _sessionContext with { State = ConnectionState.Connecting };

            // FASE 2: Apertura puerto serial
            _logger.LogInformation("FASE 2: Abriendo puerto serial {Port}", portName);
            LogStatus($"Opening port {portName}...");

            // CRÍTICO: Cerrar puerto previo si está abierto
            if (_serialPort.IsOpen)
            {
                _logger.LogWarning("Puerto previamente abierto, cerrando antes de reconectar...");
                try
                {
                    await _serialPort.CloseAsync();
                    await Task.Delay(100); // Pequeña pausa para asegurar cierre completo
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error cerrando puerto previo, continuando...");
                }
            }

            bool opened;

            // Modo noUSB: Bypass apertura física del puerto
            if (_devModeSettings?.NoUSB == true)
            {
                _logger.LogWarning("Modo noUSB: Simulando apertura puerto {Port}", portName);
                opened = true; // Simular éxito
                LogStatus($"Puerto {portName} simulado (noUSB)");
            }
            else
            {
                // Apertura real del puerto
                opened = await _serialPort.OpenAsync(portName);
            }

            if (!opened)
            {
                throw new InvalidOperationException($"Failed to open serial port {portName}");
            }

            _logger.LogInformation("Puerto serial {Status}",
                _devModeSettings?.NoUSB == true ? "simulado" : "abierto correctamente");

            // FASE 3: Determinar PathShared
            _logger.LogInformation("FASE 3: Determinando PathShared");
            LogStatus("Locating device files...");

            var devicePath = await GetDevicePathShared(selectedDevice);
            if (string.IsNullOrEmpty(devicePath))
            {
                throw new DirectoryNotFoundException(
                    $"Device path not found for {selectedDevice.NameTypeDevice}");
            }

            if (!Directory.Exists(devicePath))
            {
                throw new DirectoryNotFoundException(
                    $"Device directory does not exist: {devicePath}");
            }

            // FASE 4: Cargar settings.cfg
            _logger.LogInformation("FASE 4: Cargando configuración dispositivo");
            LogStatus("Loading device configuration...");

            var settingsPath = Path.Combine(devicePath, "settings.cfg");

            // Fallback a settingsW.cfg si settings.cfg no existe O está vacío
            if (!File.Exists(settingsPath) || new FileInfo(settingsPath).Length == 0)
            {
                var fallbackPath = Path.Combine(devicePath, "settingsW.cfg");
                if (File.Exists(fallbackPath) && new FileInfo(fallbackPath).Length > 0)
                {
                    settingsPath = fallbackPath;
                    _logger.LogDebug("settings.cfg no existe o vacío, usando settingsW.cfg");
                }
            }

            if (!File.Exists(settingsPath))
            {
                throw new FileNotFoundException(
                    $"Configuration file not found in {devicePath}");
            }

            var deviceConfig = await LoadDeviceConfigurationAsync(settingsPath, _cts.Token);
            if (deviceConfig == null)
            {
                throw new InvalidOperationException("Failed to load device configuration");
            }

            // Guardar configuración para operaciones FILE (SaveCFG, LoadCFG)
            _currentDeviceConfig = deviceConfig;

            // FASE 5: Cargar configuración en router
            _logger.LogInformation("FASE 5: Cargando configuración en router");
            LogStatus("Configuring command router...");

            _commandRouter.LoadConfiguration(deviceConfig);

            // ETAPA 7: Configurar parámetros de dispositivo
            _logger.LogInformation("Configurando parámetros de dispositivo: {Type} v{Version}",
                selectedDevice.TDev, selectedDevice.NDev);
            await _commandRouter.ConfigureDeviceAsync(
                selectedDevice.TDev,
                selectedDevice.NDev,
                _cts.Token);
            _logger.LogDebug("Device parameters configured");

            // FASE 6: Verificar autenticaci�n ?? CR�TICO
            _logger.LogInformation("FASE 6: Verificando autenticaci�n");
            LogStatus("Checking authentication...");

            AuthResult authResult;

            // Modo noUSB: Simular sin autenticaci�n
            if (_devModeSettings?.NoUSB == true)
            {
                _logger.LogInformation("Modo noUSB: Simulando NoAuthRequired");
                authResult = AuthResult.NoAuthRequired;
            }
            else
            {
                // Verificaci�n real
                authResult = await _authService.CheckAuthenticationRequirementAsync(_cts.Token);
            }

            _logger.LogInformation("Resultado autenticaci�n: {Result}", authResult);

            switch (authResult)
            {
                case AuthResult.DeviceNotResponding:
                    _logger.LogError("Device not responding during authentication check");
                    await DisconnectAsync();
                    MessageBox.Show(
                        "Device is not responding.\nPlease check the connection and try again.",
                        "Connection Error",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Error);
                    return;

                case AuthResult.PasswordRequired:
                    _logger.LogInformation("Device requires authentication");
                    LogStatus("Password required...");

                    // ETAPA 3: Intentar recuperar password guardada
                    string? savedPassword = null;
                    try
                    {
                        savedPassword = await _appSettings.GetSettingAsync<string>("DevicePassword");
                        if (!string.IsNullOrEmpty(savedPassword))
                        {
                            _logger.LogDebug("Password recuperada desde configuraci�n");
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogDebug(ex, "No hay password guardada o error recuperando");
                    }

                    // ETAPA 3: Autenticaci�n autom�tica si hay password guardada
                    if (!string.IsNullOrEmpty(savedPassword))
                    {
                        _logger.LogInformation("Intentando autenticaci�n autom�tica con password guardada");
                        var autoAuth = await _authService.AuthenticateAsync(savedPassword, _cts.Token);

                        if (autoAuth)
                        {
                            _logger.LogInformation("Autenticación automática exitosa");
                            LogStatus("Auto-authentication successful");

                            // Almacenar password validada y configurar en pipeline y router
                            _validatedPassword = savedPassword;
                            _pipeline.SetStoredPassword(savedPassword);
                            _commandRouter.SetStoredPassword(savedPassword);
                            break; // Salir del switch, continuar flujo
                        }

                        _logger.LogWarning("Autenticaci�n autom�tica fall�, solicitando password manual");
                    }

                    // Di�logo manual (preservar c�digo existente)
                    using (var passwordDialog = _serviceProvider.GetRequiredService<frmPassword>())
                    {
                        // ETAPA 3: Pre-popular con password guardada si existe (UX mejorada)
                        if (!string.IsNullOrEmpty(savedPassword))
                        {
                            passwordDialog.Password = savedPassword;
                        }

                        if (passwordDialog.ShowDialog(this) != DialogResult.OK)
                        {
                            _logger.LogInformation("User cancelled password dialog");
                            await DisconnectAsync();
                            return;
                        }

                        var authenticated = await _authService.AuthenticateAsync(
                            passwordDialog.Password, _cts.Token);

                        if (!authenticated)
                        {
                            _logger.LogWarning("Authentication failed - incorrect password");
                            await DisconnectAsync();
                            MessageBox.Show(
                                "Incorrect password.\nPlease try again.",
                                "Authentication Failed",
                                MessageBoxButtons.OK,
                                MessageBoxIcon.Warning);
                            return;
                        }

                        // Guardar password si RememberPassword est� marcado
                        if (passwordDialog.RememberPassword)
                        {
                            try
                            {
                                await _appSettings.SaveSettingAsync("DevicePassword", passwordDialog.Password);
                                _logger.LogInformation("Password guardada para futuras conexiones");
                            }
                            catch (Exception ex)
                            {
                                _logger.LogWarning(ex, "Error guardando password");
                            }
                        }

                        _logger.LogInformation("Authentication successful");
                        LogStatus("Authentication successful");

                        // Almacenar password validada y configurar en pipeline y router
                        _validatedPassword = passwordDialog.Password;
                        _pipeline.SetStoredPassword(passwordDialog.Password);
                        _commandRouter.SetStoredPassword(passwordDialog.Password);
                    }
                    break;

                case AuthResult.NoAuthRequired:
                    _logger.LogInformation("No authentication required");
                    LogStatus("No authentication required");
                    break;
            }

            // FASE 7: Iniciar servidor HTTP
            _logger.LogInformation("FASE 7: Iniciando servidor HTTP");
            LogStatus("Starting HTTP server...");

            try
            {
                var port = GetAvailablePort();
                await _httpServer.StartAsync(port, devicePath, _cts.Token);
                _httpServerIsRunning = true;
                _httpPort = port;

                _logger.LogInformation("Servidor HTTP iniciado en puerto {Port}", port);
                _logger.LogInformation("Ruta ra�z: {RootPath}", devicePath);

                // Navegar WebView2 a la p�gina principal
                if (webView?.CoreWebView2 != null)
                {
                    var url = $"http://localhost:{port}/index.html";
                    webView.CoreWebView2.Navigate(url);
                    _logger.LogDebug("WebView2 navegando a {Url}", url);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error iniciando servidor HTTP");
                await DisconnectAsync();
                MessageBox.Show(
                    $"Error starting HTTP server: {ex.Message}",
                    "Connection Error",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error);
                return;
            }

            // FASE 8: Watchdog + WebView + Menús post-autenticación
            _logger.LogInformation("FASE 8: Inicializando watchdog y navegador");

            // Configurar menús según deviceWithPass
            if (selectedDevice.DeviceWithPass)
            {
                mnuPassword.Visible = true;
                mnuEth.Visible = true;
                _logger.LogDebug("Menús password y ethernet habilitados");
            }

            // Condición de licencia : (tdev="1c" AND ndev=7 AND ucVersion>=0x10B) OR tdev="2c"
            // CRÍTICO: Ahora usa ucVersion real extraído de respuesta V1
            var ucVersion = _authService.UcVersion;
            var showLicenseMenu = (selectedDevice.TDev == "1c" && (int)selectedDevice.NDev == 7 && ucVersion >= 0x10B)
                                   || selectedDevice.TDev == "2c";

            if (showLicenseMenu)
            {
                mnuLicense.Visible = true;
                _logger.LogDebug("Menú licencia habilitado (ucVersion=0x{UcVersion:X}, condición cumplida)", ucVersion);
            }
            else
            {
                _logger.LogDebug("Menú licencia NO habilitado (tdev={TDev}, ndev={NDev}, ucVersion=0x{UcVersion:X})",
                    selectedDevice.TDev, selectedDevice.NDev, ucVersion);
            }

            // Menús adicionales según tipo de dispositivo 
            // mnuFactDefault: Solo visible para dispositivos con password en modo factory
            // mnuProd: Visible según configuración específica del dispositivo
            ConfigureDeviceSpecificMenus(selectedDevice);

            // Iniciar watchdog si el dispositivo lo requiere
            if (RequiresWatchdog(selectedDevice))
            {
                LogStatus("Starting watchdog service...");
                try
                {
                    // CRÍTICO: Usar 25 segundos 
                    await _watchdog.StartAsync(TimeSpan.FromSeconds(25));
                    _logger.LogInformation("Watchdog service started (25s interval)");
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to start watchdog service");
                }
            }

            // Navegar a la interfaz del dispositivo
            if (webView?.CoreWebView2 != null)
            {
                var url = $"http://localhost:{_httpPort}";
                LogStatus($"Loading device interface: {url}");
                webView.CoreWebView2.Navigate(url);
                _logger.LogInformation("Navigated to device interface");
            }

            // Actualizar variables de estado
            _chTestActivated = -1;
            _confSCA = "";
            _pendingAnswer = false;
            lblHyperLink.Visible = false;
            cmdRefresh.Visible = true;
            mnuFWInfo.Visible = true;

            // Habilitar menús de configuración
            mnuConfig.Enabled = true;
            mnuLoadConfig.Enabled = true;
            mnuSaveConfig.Enabled = true;

            // Habilitar menús de calibración si están visibles
            if (mnuCal.Visible)
            {
                mnuCal.Enabled = true;
                mnuSaveCal.Enabled = true;
                mnuLoadCal.Enabled = true;
            }

            // Actualizar contexto de sesión
            _sessionContext = _sessionContext with
            {
                State = ConnectionState.Connected,
                Device = selectedDevice
            };

            // Guardar último puerto usado
            await SaveLastUsedPortAsync(selectedDevice.ComPort);

            // Task.Yield para procesar eventos pendientes 
            await Task.Yield();

            UpdateUIForConnectedState();
            LogStatus($"Connected to {selectedDevice.NameTypeDevice}");
            _logger.LogInformation("=== CONEXIÓN COMPLETA ===");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Connection failed");
            MessageBox.Show(
                $"Connection failed: {ex.Message}",
                "Error",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error);

            await DisconnectAsync();
        }
        finally
        {
            SetUIState(isConnecting: false);
        }
    }

    /// <summary>
    /// Desconecta del dispositivo y libera todos los recursos
    /// PROMPT 6: Implementaci�n completa de desconexi�n
    /// </summary>
    private async Task DisconnectAsync()
    {
        try
        {
            _logger.LogInformation("=== INICIANDO DESCONEXI�N ===");
            LogStatus("Disconnecting...");

            // Cancelar operaciones en curso
            _cts?.Cancel();

            // Detener watchdog
            if (_watchdog != null)
            {
                try
                {
                    await _watchdog.StopAsync();
                    _logger.LogInformation("Watchdog service stopped");
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error stopping watchdog");
                }
            }

            // Detener servidor HTTP
            if (_httpServerIsRunning)
            {
                try
                {
                    await _httpServer.StopAsync();
                    _httpServerIsRunning = false;
                    _logger.LogInformation("HTTP server stopped");
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error stopping HTTP server");
                }
            }

            // Cerrar puerto serial
            if (_serialPort.IsOpen)
            {
                try
                {
                    // Modo noUSB: No intentar cerrar puerto simulado
                    if (_devModeSettings?.NoUSB == true)
                    {
                        _logger.LogInformation("Modo noUSB: Omitiendo cierre puerto simulado");
                    }
                    else
                    {
                        _logger.LogInformation("Cerrando puerto serial");
                        await _serialPort.CloseAsync();
                    }

                    _logger.LogInformation("Serial port closed");
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error closing serial port");
                }
            }

            // Navegar a página predeterminada al desconectar
            if (webView?.CoreWebView2 != null)
            {
                try
                {
                    // PASO 1: Primera navegación a about:blank (Stop)
                    webView.CoreWebView2.Navigate("about:blank");
                    await Task.Delay(50); // Pequeña pausa para asegurar navegación
                    _logger.LogDebug("Primera navegación: about:blank (Stop)");

                    // PASO 2: Navegar a página predeterminada
                    await NavigateToDefaultPageAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error clearing WebView");
                }
            }

            // Cerrar formularios secundarios
            CloseSecondaryForms();

            // Ocultar menús específicos del dispositivo
            mnuFactDefault.Visible = false;
            mnuLicense.Visible = false;
            mnuPassword.Visible = false;
            mnuEth.Visible = false;
            mnuProd.Visible = false;
            mnuFWInfo.Visible = false;
            mnuFWVer.Visible = false;

            // Ocultar menús de calibración (agregados en conexión según tipo dispositivo)
            mnuLoadCal.Visible = false;
            mnuSaveCal.Visible = false;

            // Restaurar menús base 
            mnuOneCH.Visible = true;
            mnuTwoCH.Visible = true;
            mnuSixCH.Visible = true;

            // Deshabilitar menús de configuración
            // Deshabilitar tanto submenús padre como items hijos
            mnuConfig.Enabled = false;
            mnuLoadConfig.Enabled = false;
            mnuSaveConfig.Enabled = false;
            mnuCal.Enabled = false;
            mnuLoadCal.Enabled = false;
            mnuSaveCal.Enabled = false;
            cmdRefresh.Visible = false;
            lblHyperLink.Enabled = false;
            lblHyperLink.Visible = false;

            // Reset variables de estado
            _chTestActivated = -1;
            _confSCA = "";
            _pendingAnswer = false;
            _waitingLF = false;
            _currentDeviceConfig = null;

            // Actualizar contexto de sesión
            _sessionContext = _sessionContext with
            {
                State = ConnectionState.Disconnected,
                Device = null
            };

            UpdateUIForDisconnectedState();
            LogStatus("Disconnected");

            // Limpiar password validada (seguridad)
            _validatedPassword = null;
            _pipeline.ClearStoredPassword();

            // Resetear router (limpia cache, password, procesadores de respuesta)
            _commandRouter.Reset();

            _logger.LogInformation("=== DESCONEXIÓN COMPLETA ===");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during disconnect");
        }
        finally
        {
            // Dispose CancellationTokenSource
            _cts?.Dispose();
            _cts = null;
        }
    }

    /// <summary>
    /// Handler para evento CredentialsRequired del pipeline.
    /// </summary>
    /// <remarks>
    /// Se invoca cuando el dispositivo responde INVALID CREDENTIALS.
    /// Retorna la contraseña validada o solicita una nueva al usuario.
    /// </remarks>
    private async Task<string?> OnPipelineCredentialsRequired()
    {
        // Primero intentar usar password ya validada
        if (!string.IsNullOrEmpty(_validatedPassword))
        {
            _logger.LogDebug("Retornando password validada para reintento");
            return _validatedPassword;
        }

        // Intentar recuperar password guardada de configuración
        try
        {
            var savedPassword = await _appSettings.GetSettingAsync<string>("DevicePassword");
            if (!string.IsNullOrEmpty(savedPassword))
            {
                _logger.LogDebug("Usando password guardada para reintento INVALID CREDENTIALS");
                _validatedPassword = savedPassword;
                _pipeline.SetStoredPassword(savedPassword);
                return savedPassword;
            }
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Error recuperando password guardada");
        }

        // Como último recurso, mostrar diálogo de password
        // Nota: Esto debe ejecutarse en el hilo de UI
        string? password = null;

        if (InvokeRequired)
        {
            Invoke(() =>
            {
                using var passwordDialog = _serviceProvider.GetRequiredService<frmPassword>();
                passwordDialog.Text = "Authentication Required";
                if (passwordDialog.ShowDialog(this) == DialogResult.OK)
                {
                    password = passwordDialog.Password;
                }
            });
        }
        else
        {
            using var passwordDialog = _serviceProvider.GetRequiredService<frmPassword>();
            passwordDialog.Text = "Authentication Required";
            if (passwordDialog.ShowDialog(this) == DialogResult.OK)
            {
                password = passwordDialog.Password;
            }
        }

        if (!string.IsNullOrEmpty(password))
        {
            _validatedPassword = password;
            _pipeline.SetStoredPassword(password);
        }

        return password;
    }

    #region Helper Methods

    private bool ValidateDeviceSelection()
    {
        return cmbCOM.SelectedIndex >= 0 && _foundDevices.Any();
    }

    private DeviceInfo? GetSelectedDevice()
    {
        if (cmbCOM.SelectedIndex < 0 || cmbCOM.SelectedIndex >= _foundDevices.Count)
            return null;

        return _foundDevices[cmbCOM.SelectedIndex];
    }

    private string GetSelectedComPort()
    {
        var device = GetSelectedDevice();
        return device != null ? $"COM{device.ComPort}" : string.Empty;
    }

    /// <summary>
    /// Configura menús específicos según tipo de dispositivo.
    /// </summary>
    /// <remarks>
    /// Configura la visibilidad de menús Factory Default, Producción y Calibración
    /// según el tipo de dispositivo conectado (TDev).
    /// </remarks>
    private void ConfigureDeviceSpecificMenus(DeviceInfo device)
    {
        // mnuFactDefault: Solo visible para dispositivo 2c (BDA Dual)
        // Solo dispositivos 2c soportan factory reset
        if (device.TDev == "2c")
        {
            mnuFactDefault.Visible = true;
            _logger.LogDebug("mnuFactDefault habilitado para dispositivo 2c");
        }
        else
        {
            mnuFactDefault.Visible = false;
        }

        // mnuProd: Menú de producción - Configura visibilidad según tipo de dispositivo
        UpdateProductionMenuVisibility(device);

        // mnuCal (Calibración): Visible para 2c, 4dm, 5dm
        var showCalibration = device.TDev switch
        {
            "2c" => true,
            "4dm" => true,
            "5dm" => true,
            _ => false
        };

        if (showCalibration)
        {
            mnuCal.Visible = true;
            mnuLoadCal.Visible = true;
            mnuSaveCal.Visible = true;
            _logger.LogDebug("Menús de calibración habilitados para {DeviceType}", device.TDev);
        }
        else
        {
            mnuCal.Visible = false;
            mnuLoadCal.Visible = false;
            mnuSaveCal.Visible = false;
        }
    }

    /// <summary>
    /// Obtiene PathShared con fallback robustos: device ? tipo ? default.
    /// Crea contenido m�nimo si no existe.
    /// ETAPA 5: PathShared Fallback
    /// </summary>
    private async Task<string> GetDevicePathShared(DeviceInfo device)
    {
        // Modo noUSB: Usar PathShared simulado
        if (_devModeSettings?.NoUSB == true)
        {
            var simulatedPath = Path.Combine(
                AppDomain.CurrentDomain.BaseDirectory,
                _devModeSettings.SimulatedPathShared);

            _logger.LogInformation("Modo noUSB: PathShared simulado = {Path}", simulatedPath);

            if (!Directory.Exists(simulatedPath))
            {
                _logger.LogWarning("PathShared simulado no existe, creando: {Path}", simulatedPath);
                Directory.CreateDirectory(simulatedPath);
                await CreateDefaultDeviceContent(simulatedPath, device);
            }

            return simulatedPath;
        }

        // L�gica de fallback robusta
        string devicePath = string.Empty;

        // 1. Intentar PathShared del dispositivo
        if (!string.IsNullOrEmpty(device.PathShared) && Directory.Exists(device.PathShared))
        {
            devicePath = device.PathShared;
            _logger.LogInformation("Usando PathShared del dispositivo: {Path}", devicePath);
        }
        else
        {
            // 2. Fallback a directorio basado en tipo de dispositivo
            var baseDir = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "pages");
            var deviceTypeDir = $"htdocs_{device.TDev}";
            devicePath = Path.Combine(baseDir, deviceTypeDir);

            if (Directory.Exists(devicePath))
            {
                _logger.LogWarning("PathShared original no v�lido, usando fallback tipo: {Path}", devicePath);
            }
            else
            {
                // 3. �ltimo fallback: htdocs_default
                devicePath = Path.Combine(baseDir, "htdocs_default");
                if (!Directory.Exists(devicePath))
                {
                    _logger.LogWarning("Creando PathShared por defecto: {Path}", devicePath);
                    Directory.CreateDirectory(devicePath);
                    await CreateDefaultDeviceContent(devicePath, device);
                }
                else
                {
                    _logger.LogWarning("Usando PathShared por defecto: {Path}", devicePath);
                }
            }
        }

        return devicePath;
    }

    /// <summary>
    /// Crea contenido m�nimo para directorio de dispositivo por defecto.
    /// ETAPA 5: Contenido default
    /// </summary>
    private async Task CreateDefaultDeviceContent(string path, DeviceInfo device)
    {
        try
        {
            // Crear index.html b�sico
            var indexPath = Path.Combine(path, "index.html");
            if (!File.Exists(indexPath))
            {
                var defaultHtml = $@"<!DOCTYPE html>
<html>
<head>
    <title>Fiplex Device Interface - {device.NameTypeDevice}</title>
    <meta charset=""UTF-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
    <style>
        body {{
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background-color: #f5f5f5;
        }}
        .container {{
            background-color: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        h1 {{
            color: #333;
            border-bottom: 3px solid #0078d7;
            padding-bottom: 10px;
        }}
        .info {{
            background-color: #e7f3fe;
            border-left: 4px solid #0078d7;
            padding: 15px;
            margin: 20px 0;
        }}
        .warning {{
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
        }}
    </style>
</head>
<body>
    <div class=""container"">
        <h1>Fiplex Device Interface</h1>
        <div class=""info"">
            <p><strong>Device:</strong> {device.NameTypeDevice}</p>
            <p><strong>Type:</strong> {device.TDev}</p>
            <p><strong>Version:</strong> {device.NDev:F1}</p>
        </div>
        <div class=""warning"">
            <p><strong>Default Interface</strong></p>
            <p>Device-specific content not found. Using default interface.</p>
            <p>Device will respond to configured commands via HTTP API.</p>
        </div>
        <h2>API Status</h2>
        <p>Device is connected and ready to receive commands.</p>
    </div>
</body>
</html>";

                await File.WriteAllTextAsync(indexPath, defaultHtml);
                _logger.LogInformation("index.html por defecto creado en {Path}", path);
            }

            // Crear settings.cfg b�sico
            var settingsPath = Path.Combine(path, "settings.cfg");
            if (!File.Exists(settingsPath))
            {
                var defaultSettings = @"---GET---
/test	T1	0		Test command
/version	V1	0		Version command
/status	S1	0		Status check
---POST---
/reset	R0	0	0	Reset device
/update	U1{data}	0	1	Update configuration";

                await File.WriteAllTextAsync(settingsPath, defaultSettings);
                _logger.LogInformation("settings.cfg por defecto creado en {Path}", path);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creando contenido por defecto en {Path}", path);
            throw;
        }
    }


    private async Task<DeviceConfiguration?> LoadDeviceConfigurationAsync(
        string settingsPath,
        CancellationToken ct)
    {
        try
        {
            _logger.LogInformation("Attempting to load configuration from: {Path}", settingsPath);

            if (!File.Exists(settingsPath))
            {
                _logger.LogError("Configuration file does not exist: {Path}", settingsPath);
                return null;
            }

            var commands = await _settingsParser.ParseSettingsAsync(settingsPath);

            if (commands == null)
            {
                _logger.LogError("Parser returned null for settings file: {Path}", settingsPath);
                return null;
            }

            if (!commands.Any())
            {
                _logger.LogWarning("No commands found in settings file: {Path}", settingsPath);
                _logger.LogWarning("File content might be in an unexpected format");

                // Intentar leer primeras l�neas para diagn�stico
                try
                {
                    var sampleLines = (await File.ReadAllLinesAsync(settingsPath)).Take(5);
                    _logger.LogInformation("First 5 lines of file: {@Lines}", sampleLines);
                }
                catch
                {
                    // Ignorar errores de lectura de muestra
                }

                return null;
            }

            // Construir DeviceConfiguration desde la lista de CommandDefinition
            var config = new DeviceConfiguration
            {
                GetCommands = commands
                    .Where(c => c.HttpMethod.Equals("GET", StringComparison.OrdinalIgnoreCase))
                    .Select(c => new GetCommand
                    {
                        Page = c.Page,
                        Command = c.Command,
                        Encode = c.HexEncoding,
                        // CORREGIDO: Preservar LengthValidation original para splitwith3tabs
                        ExpectedLengths = !string.IsNullOrEmpty(c.LengthValidation)
                            ? new[] { c.LengthValidation }
                            : Array.Empty<string>(),
                        UrlParameters = !string.IsNullOrEmpty(c.UrlParameters)
                            ? c.UrlParameters.Split(',', StringSplitOptions.RemoveEmptyEntries)
                            : Array.Empty<string>()
                    })
                    .ToList(),

                PostCommands = commands
                    .Where(c => c.HttpMethod.Equals("POST", StringComparison.OrdinalIgnoreCase))
                    .Select(c => new PostCommand
                    {
                        Page = c.Page,
                        Command = c.Command,
                        Encode = c.HexEncoding,
                        WaitResponse = c.WaitResponse,
                        // DecodeBody se activa cuando HexEncoding es true
                        DecodeBody = c.HexEncoding,
                        // Parsear NoEncodeParams string a int
                        NoDecodeChars = int.TryParse(c.NoEncodeParams, out var noDecodeChars) ? noDecodeChars : 0
                    })
                    .ToList(),

                FileCommands = commands
                    .Where(c => c.HttpMethod.Equals("FILE", StringComparison.OrdinalIgnoreCase))
                    .Select(c => new FileCommand
                    {
                        OperationType = c.Page, // SaveCFG, LoadCFG, SaveCAL, LoadCAL
                        Commands = c.Command.Split(',', StringSplitOptions.RemoveEmptyEntries)
                            .Select(cmd => cmd.Trim())
                            .ToArray(),
                        LengthValidation = c.LengthValidation,
                        Message = c.Message,
                        Mode = c.FileMode
                    })
                    .ToList()
            };

            _logger.LogInformation(
                "Device configuration loaded successfully: {GetCount} GET, {PostCount} POST, {FileCount} FILE commands",
                config.GetCommands.Count,
                config.PostCommands.Count,
                config.FileCommands.Count);

            return config;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error loading device configuration from: {Path}", settingsPath);
            throw;
        }
    }

    private bool RequiresWatchdog(DeviceInfo device)
    {
        // Los dispositivos con contrase�a requieren watchdog
        return device.DeviceWithPass;
    }

    private void CloseSecondaryForms()
    {
        try
        {
            var formsToClose = Application.OpenForms
                .Cast<Form>()
                .Where(f => f != this && f.Owner == this)
                .ToList();

            foreach (var form in formsToClose)
            {
                try
                {
                    form.Close();
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error closing form: {FormName}", form.Name);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error closing secondary forms");
        }
    }

    private async Task SaveLastUsedPortAsync(int portNumber)
    {
        try
        {
            await _appSettings.SaveLastUsedComPortAsync(portNumber);
            _logger.LogInformation("Saved last used port: COM{Port}", portNumber);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to save last used port");
        }
    }

    private void UpdateUIForConnectedState()
    {
        if (InvokeRequired)
        {
            Invoke(UpdateUIForConnectedState);
            return;
        }

        // Suspender layout para evitar artefactos visuales durante redimensionamiento
        SuspendLayout();
        tlpMainLayout.SuspendLayout();

        try
        {
            cmdConnect.Text = "Disconnect";
            cmdConnect.BackColor = Color.FromArgb(220, 53, 69); // Rojo para disconnect
            cmdConnect.Enabled = true; // Re-habilitar después de conexión
            cmdIDPort.Enabled = false;
            cmbCOM.Enabled = false;
            cmdRefresh.Enabled = true;

            // Ajustar tamaño fijo y centrar formulario al conectar
            // Tamaño: 1350 × 800 px
            this.WindowState = FormWindowState.Normal;
            this.Size = new Size(1350, 800);
            this.MinimumSize = new Size(1024, 720);
            CenterFormOnScreen();

            // Actualizar información de firmware en menú
            UpdateFirmwareInfo();
        }
        finally
        {
            tlpMainLayout.ResumeLayout(true);
            ResumeLayout(true);
            // Forzar redibujado completo para eliminar artefactos
            Refresh();
        }
    }

    /// <summary>
    /// Actualiza el menú con información del firmware.
    /// </summary>
    /// <remarks>
    /// Formato: "FW: 2C v1.0 (uc:0x10B)" donde ucVersion se muestra si está disponible.
    /// </remarks>
    private void UpdateFirmwareInfo()
    {
        if (_sessionContext.Device == null) return;

        var device = _sessionContext.Device;
        var ucVersion = _authService.UcVersion;

        // Formato extendido con información de ucVersion para diagnóstico
        var tdevUpper = device.TDev.ToUpperInvariant();
        var fwInfo = $"FW: {tdevUpper} v{device.NDev:F1}";

        // Agregar ucVersion solo si está disponible (> 0)
        if (ucVersion > 0)
        {
            fwInfo += $" (uc:0x{ucVersion:X})";
        }

        mnuFWVer.Text = fwInfo;
        mnuFWVer.Visible = true;

        _logger.LogDebug("Firmware info actualizado: {FwInfo}", fwInfo);
    }

    private void UpdateUIForDisconnectedState()
    {
        if (InvokeRequired)
        {
            Invoke(UpdateUIForDisconnectedState);
            return;
        }

        // Suspender layout para evitar artefactos visuales durante redimensionamiento
        SuspendLayout();
        tlpMainLayout.SuspendLayout();

        try
        {
            cmdConnect.Text = "Connect";
            cmdConnect.BackColor = Color.FromArgb(0, 120, 215); // Azul para connect
            cmdIDPort.Enabled = true;
            cmbCOM.Enabled = true;
            cmdRefresh.Enabled = false;

            // Ajustar tamaño mínimo y centrar formulario al desconectar
            // Tamaño mínimo: 1024 × 720 px
            this.WindowState = FormWindowState.Normal;
            this.MinimumSize = new Size(1024, 720);
            this.Size = new Size(1024, 720);
            CenterFormOnScreen();
        }
        finally
        {
            tlpMainLayout.ResumeLayout(true);
            ResumeLayout(true);
            // Forzar redibujado completo para eliminar artefactos
            Refresh();
        }
    }

    /// <summary>
    /// Centra el formulario en la pantalla actual.
    /// </summary>
    private void CenterFormOnScreen()
    {
        var screen = Screen.FromControl(this);
        var workingArea = screen.WorkingArea;
        this.Location = new Point(
            workingArea.Left + (workingArea.Width - this.Width) / 2,
            workingArea.Top + (workingArea.Height - this.Height) / 2);
    }

    #endregion

    private void SetUIState(bool isScanning = false, bool isConnecting = false)
    {
        if (InvokeRequired)
        {
            Invoke(() => SetUIState(isScanning, isConnecting));
            return;
        }

        var isConnected = _serialPort.IsOpen;

        cmdIDPort.Enabled = !isScanning && !isConnecting && !isConnected;
        cmbCOM.Enabled = !isScanning && !isConnecting && !isConnected;
        cmdConnect.Enabled = (!isScanning && !isConnecting && _foundDevices.Any()) || isConnected;
    }

    private void LogStatus(string message)
    {
        if (InvokeRequired)
        {
            Invoke(() => LogStatus(message));
            return;
        }

        var timestamp = DateTime.Now.ToString("HH:mm:ss");
        // lblStatus muestra mensajes operativos
        // lbldaysRemaining permanece exclusivo para info CLSS
        lblStatus.Text = $"[{timestamp}] {message}";

        _logger.LogDebug(message);
    }

    private async void cmdRefresh_Click(object sender, EventArgs e)
    {
        // Llama a RefreshDeviceUIAsync sin forzar modo avanzado
        await RefreshDeviceUIAsync();
    }

    /// <summary>
    /// Handler para clic en el enlace de actualización.
    /// </summary>
    /// <remarks>
    /// Abre la URL de descarga en el navegador predeterminado.
    /// </remarks>
    private void lblHyperLink_LinkClicked(object sender, LinkLabelLinkClickedEventArgs e)
    {
        try
        {
            if (!_versionCheck.OpenDownloadUrl())
            {
                MessageBox.Show(
                    "Could not open the download URL. Please visit www.fiplex.com to download the update.",
                    "Download Error",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Warning);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error opening download URL");
            MessageBox.Show(
                $"Error opening download link: {ex.Message}",
                "Error",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error);
        }
    }

    /// <summary>
    /// Verifica si hay actualizaciones disponibles y actualiza lblHyperLink.
    /// </summary>
    /// <remarks>
    /// El enlace de actualización solo es visible si hay una nueva versión disponible
    /// y el dispositivo NO está conectado.
    /// </remarks>
    private async Task CheckForUpdatesAsync()
    {
        try
        {
            _logger.LogInformation("Checking for software updates...");

            var result = await _versionCheck.CheckForUpdatesAsync();

            if (result.UpdateAvailable && _sessionContext.State == ConnectionState.Disconnected)
            {
                lblHyperLink.Text = $"New version {result.LatestVersion} is available. Click to download";
                lblHyperLink.Visible = true;
                lblHyperLink.Enabled = true;

                _logger.LogInformation(
                    "Update available: {Current} -> {Latest}",
                    result.CurrentVersion,
                    result.LatestVersion);
            }
            else if (result.ErrorMessage != null)
            {
                _logger.LogWarning("Version check failed: {Error}", result.ErrorMessage);
            }
            else
            {
                _logger.LogDebug("Software is up to date (version {Version})", result.CurrentVersion);
            }
        }
        catch (OperationCanceledException)
        {
            _logger.LogDebug("Version check cancelled");
        }
        catch (Exception ex)
        {
            // No bloquear la inicialización si falla la verificación de versiones
            _logger.LogWarning(ex, "Failed to check for updates (non-blocking)");
        }
    }

    #region FILE Operations (SaveCFG, LoadCFG, SaveCAL, LoadCAL)

    /// <summary>
    /// Handler para menú Save Configuration.
    /// </summary>
    private async void mnuSaveConfig_Click(object sender, EventArgs e)
    {
        if (_currentDeviceConfig == null)
        {
            MessageBox.Show("No device configuration loaded.", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            return;
        }

        var saveCommands = _currentDeviceConfig.FileCommands
            .Where(fc => fc.OperationType.Equals("SaveCFG", StringComparison.OrdinalIgnoreCase))
            .ToList();

        if (!saveCommands.Any())
        {
            MessageBox.Show("No SaveCFG commands defined for this device.", "Information", MessageBoxButtons.OK, MessageBoxIcon.Information);
            return;
        }

        using var saveDialog = new SaveFileDialog
        {
            Title = "Save Device Configuration",
            // Soporta nuevo formato (.cfg)
            Filter = "Configuration Files (*.cfg)|*.cfg|Legacy Format (*.cfgr)|*.cfgr|All Files (*.*)|*.*",
            DefaultExt = "cfg",
            FileName = $"{_sessionContext.Device?.TDev ?? "device"}_config_{DateTime.Now:yyyyMMdd_HHmmss}.cfg"
        };

        if (saveDialog.ShowDialog() != DialogResult.OK)
            return;

        await ExecuteFileOperationAsync(FileOperationType.SaveConfig, saveDialog.FileName, saveCommands);
    }

    /// <summary>
    /// Handler para menú Load Configuration.
    /// </summary>
    private async void mnuLoadConfig_Click(object sender, EventArgs e)
    {
        if (_currentDeviceConfig == null)
        {
            MessageBox.Show("No device configuration loaded.", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            return;
        }

        var loadCommands = _currentDeviceConfig.FileCommands
            .Where(fc => fc.OperationType.Equals("LoadCFG", StringComparison.OrdinalIgnoreCase))
            .ToList();

        if (!loadCommands.Any())
        {
            MessageBox.Show("No LoadCFG commands defined for this device.", "Information", MessageBoxButtons.OK, MessageBoxIcon.Information);
            return;
        }

        using var openDialog = new OpenFileDialog
        {
            Title = "Load Device Configuration",
            // Soporta nuevo formato (.cfg)
            Filter = "Configuration Files (*.cfg;*.cfgr)|*.cfg;*.cfgr|New Format (*.cfg)|*.cfg|Legacy Format (*.cfgr)|*.cfgr|All Files (*.*)|*.*",
            DefaultExt = "cfg"
        };

        if (openDialog.ShowDialog() != DialogResult.OK)
            return;

        await ExecuteFileOperationAsync(FileOperationType.LoadConfig, openDialog.FileName, loadCommands);
    }

    /// <summary>
    /// Handler para menú Save Calibration.
    /// </summary>
    private async void mnuSaveCal_Click(object sender, EventArgs e)
    {
        if (_currentDeviceConfig == null)
        {
            MessageBox.Show("No device configuration loaded.", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            return;
        }

        var saveCommands = _currentDeviceConfig.FileCommands
            .Where(fc => fc.OperationType.Equals("SaveCAL", StringComparison.OrdinalIgnoreCase))
            .ToList();

        if (!saveCommands.Any())
        {
            MessageBox.Show("No SaveCAL commands defined for this device.", "Information", MessageBoxButtons.OK, MessageBoxIcon.Information);
            return;
        }

        using var saveDialog = new SaveFileDialog
        {
            Title = "Save Device Calibration",
            // Soporta nuevo formato (.cal)
            Filter = "Calibration Files (*.cal)|*.cal|Legacy Format (*.calr)|*.calr|All Files (*.*)|*.*",
            DefaultExt = "cal",
            FileName = $"{_sessionContext.Device?.TDev ?? "device"}_calibration_{DateTime.Now:yyyyMMdd_HHmmss}.cal"
        };

        if (saveDialog.ShowDialog() != DialogResult.OK)
            return;

        await ExecuteFileOperationAsync(FileOperationType.SaveCalibration, saveDialog.FileName, saveCommands);
    }

    /// <summary>
    /// Handler para menú Load Calibration.
    /// </summary>
    private async void mnuLoadCal_Click(object sender, EventArgs e)
    {
        if (_currentDeviceConfig == null)
        {
            MessageBox.Show("No device configuration loaded.", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            return;
        }

        var loadCommands = _currentDeviceConfig.FileCommands
            .Where(fc => fc.OperationType.Equals("LoadCAL", StringComparison.OrdinalIgnoreCase))
            .ToList();

        if (!loadCommands.Any())
        {
            MessageBox.Show("No LoadCAL commands defined for this device.", "Information", MessageBoxButtons.OK, MessageBoxIcon.Information);
            return;
        }

        using var openDialog = new OpenFileDialog
        {
            Title = "Load Device Calibration",
            // Soporta nuevo formato (.cal)
            Filter = "Calibration Files (*.cal;*.calr)|*.cal;*.calr|New Format (*.cal)|*.cal|Legacy Format (*.calr)|*.calr|All Files (*.*)|*.*",
            DefaultExt = "cal"
        };

        if (openDialog.ShowDialog() != DialogResult.OK)
            return;

        await ExecuteFileOperationAsync(FileOperationType.LoadCalibration, openDialog.FileName, loadCommands);
    }

    /// <summary>
    /// Ejecuta una operación de archivo (Save/Load Config/Cal).
    /// </summary>
    private async Task ExecuteFileOperationAsync(
        FileOperationType operationType,
        string filePath,
        List<FileCommand> fileCommands)
    {
        var operationName = operationType switch
        {
            FileOperationType.SaveConfig => "Save Configuration",
            FileOperationType.LoadConfig => "Load Configuration",
            FileOperationType.SaveCalibration => "Save Calibration",
            FileOperationType.LoadCalibration => "Load Calibration",
            _ => "File Operation"
        };

        _logger.LogInformation("Starting {Operation} to {Path}", operationName, filePath);
        LogStatus($"{operationName} in progress...");

        // Convertir FileCommand a FileOperationCommand
        var commands = fileCommands.Select(fc => new FileOperationCommand
        {
            Commands = fc.Commands,
            LengthValidation = fc.LengthValidation,
            Message = fc.Message,
            Mode = fc.Mode,
            OperationType = operationType
        }).ToList();

        // Crear progress reporter
        var progress = new Progress<FileOperationProgress>(p =>
        {
            var message = !string.IsNullOrEmpty(p.Message)
                ? p.Message
                : $"Processing {p.CurrentCommandName}...";
            LogStatus($"{operationName}: {message} ({p.PercentComplete:F0}%)");
        });

        try
        {
            // Deshabilitar menús durante operación
            mnuConfig.Enabled = false;
            mnuSaveConfig.Enabled = false;
            mnuLoadConfig.Enabled = false;
            mnuCal.Enabled = false;
            mnuSaveCal.Enabled = false;
            mnuLoadCal.Enabled = false;
            cmdConnect.Enabled = false;

            var result = await _fileOperationService.ExecuteFileOperationAsync(
                operationType,
                filePath,
                commands,
                progress,
                _cts?.Token ?? CancellationToken.None);

            if (result.Success)
            {
                _logger.LogInformation(
                    "{Operation} completed: {Executed}/{Total} commands in {Duration}ms",
                    operationName, result.CommandsExecuted, result.TotalCommands, result.Duration.TotalMilliseconds);

                LogStatus($"{operationName} completed successfully");
                MessageBox.Show(
                    $"{operationName} completed successfully.\n\n" +
                    $"Commands executed: {result.CommandsExecuted}\n" +
                    $"Duration: {result.Duration.TotalSeconds:F1} seconds",
                    operationName,
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Information);

                // Navegación post-operación para calibración
                if (operationType == FileOperationType.SaveCalibration ||
                    operationType == FileOperationType.LoadCalibration)
                {
                    await NavigateToFactoryMenuAsync();
                }

                // Refresh WebView para LoadConfig y SaveConfig exitosos
                if (operationType == FileOperationType.LoadConfig ||
                    operationType == FileOperationType.SaveConfig)
                {
                    await RefreshWebViewAsync();
                }
            }
            else
            {
                _logger.LogError("{Operation} failed: {Error}", operationName, result.ErrorMessage);
                LogStatus($"{operationName} failed");
                MessageBox.Show(
                    $"{operationName} failed.\n\n" +
                    $"Error: {result.ErrorMessage}\n" +
                    $"Commands executed: {result.CommandsExecuted}/{result.TotalCommands}",
                    operationName,
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error);

                // Refresh WebView también en caso de error para Config
                if (operationType == FileOperationType.LoadConfig ||
                    operationType == FileOperationType.SaveConfig)
                {
                    await RefreshWebViewAsync();
                }
            }
        }
        catch (OperationCanceledException)
        {
            _logger.LogWarning("{Operation} cancelled", operationName);
            LogStatus($"{operationName} cancelled");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "{Operation} error", operationName);
            LogStatus($"{operationName} error: {ex.Message}");
            MessageBox.Show(
                $"An error occurred during {operationName}.\n\n{ex.Message}",
                "Error",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error);
        }
        finally
        {
            // Rehabilitar menús si aún conectado
            // Incluye menús padre junto con items hijos
            if (_sessionContext.State == ConnectionState.Connected)
            {
                mnuConfig.Enabled = true;
                mnuSaveConfig.Enabled = true;
                mnuLoadConfig.Enabled = true;
                // Rehabilitar menús de calibración solo si el dispositivo los soporta
                if (mnuCal.Visible)
                {
                    mnuCal.Enabled = true;
                    mnuSaveCal.Enabled = true;
                    mnuLoadCal.Enabled = true;
                }
            }
            cmdConnect.Enabled = true;
        }
    }

    /// <summary>
    /// Navega al menú de fábrica después de operaciones de calibración.
    /// </summary>
    /// <remarks>
    /// Se llama al finalizar SaveCal y LoadCal exitosamente.
    /// </remarks>
    private async Task NavigateToFactoryMenuAsync()
    {
        try
        {
            if (!_httpServerIsRunning)
            {
                _logger.LogWarning("HTTP server not running, cannot navigate to factory menu");
                return;
            }

            var factoryMenuUrl = $"http://localhost:{_httpPort}/factory/fmenu.html";
            _logger.LogInformation("Navigating to factory menu: {Url}", factoryMenuUrl);

            // Detener navegación actual primero
            webView.Stop();

            // Pequeño delay para asegurar que el browser está listo
            await Task.Delay(100);

            // Navegar al menú de fábrica
            webView.Source = new Uri(factoryMenuUrl);

            _logger.LogDebug("Navigation to factory menu initiated");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error navigating to factory menu");
            // No lanzar excepción - la navegación es secundaria a la operación principal
        }
    }

    /// <summary>
    /// Refresca el WebView después de operaciones de carga de configuración.
    /// </summary>
    /// <remarks>
    /// Recarga la página actual para reflejar los cambios de configuración.
    /// </remarks>
    private async Task RefreshWebViewAsync()
    {
        try
        {
            if (webView.CoreWebView2 == null)
            {
                _logger.LogWarning("WebView2 not initialized, cannot refresh");
                return;
            }

            _logger.LogInformation("Refreshing WebView after configuration load");

            // Pequeño delay antes del refresh
            await Task.Delay(100);

            // Recargar la página actual
            webView.CoreWebView2.Reload();

            _logger.LogDebug("WebView refresh initiated");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error refreshing WebView");
            // No lanzar excepción - el refresh es secundario a la operación principal
        }
    }

    #endregion

    #region Menu CLSS - Logout, Training Details

    /// <summary>
    /// Handler para menú CLSS > Logout.
    /// </summary>
    /// <remarks>
    /// Cierra sesión CLSS invalidando token y cerrando aplicación.
    /// </remarks>
    private void LogoutToolStripMenuItem_Click(object? sender, EventArgs e)
    {
        var dialogResult = MessageBox.Show(
            "Are you sure you want to logout?",
            "Logout",
            MessageBoxButtons.YesNo,
            MessageBoxIcon.Question,
            MessageBoxDefaultButton.Button2);

        if (dialogResult != DialogResult.Yes)
        {
            _logger.LogDebug("CLSS logout cancelled by user");
            return;
        }

        try
        {
            _logger.LogInformation("User initiated CLSS logout");

            // Limpiar datos de licencia y training
            _trainingValidation.ClearLicenseData();

            MessageBox.Show(
                "You have been successfully logged out",
                "Logout",
                MessageBoxButtons.OK,
                MessageBoxIcon.Information);

            _logger.LogInformation("CLSS logout successful, closing application");

            Close();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during CLSS logout");
            Close();
        }
    }

    /// <summary>
    /// Handler para menú CLSS > Training Details.
    /// </summary>
    /// <remarks>
    /// Muestra formulario con información de suscripción y entrenamiento.
    /// </remarks>
    private void SubscriptionInformationToolStripMenuItem_Click(object? sender, EventArgs e)
    {
        _logger.LogDebug("Opening Training Details dialog");

        try
        {
            using var dialog = _serviceProvider.GetRequiredService<SubscriptionInfo>();
            dialog.ShowDialog(this);

            _logger.LogDebug("Training Details dialog closed");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error opening Training Details dialog");
            MessageBox.Show(
                $"Error opening Training Details.\n\n{ex.Message}",
                "Error",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error);
        }
    }

    #endregion

    #region Menu File - Exit, Password, License, Factory Default

    /// <summary>
    /// Handler para menú Exit.
    /// </summary>
    /// <remarks>
    /// Cierra el formulario disparando FormClosing para limpieza ordenada.
    /// </remarks>
    private void mnuExit_Click(object sender, EventArgs e)
    {
        _logger.LogInformation("User requested application exit via menu");
        Close(); // Dispara frmMain2_FormClosing que maneja la limpieza
    }

    /// <summary>
    /// Handler para menú Edit Password.
    /// </summary>
    /// <remarks>
    /// Permite cambiar la contraseña del dispositivo conectado usando comando ^0.
    /// </remarks>
    private async void mnuPassword_Click(object sender, EventArgs e)
    {
        if (_sessionContext.State != ConnectionState.Connected)
        {
            MessageBox.Show(
                "Please connect to a device first.",
                "Not Connected",
                MessageBoxButtons.OK,
                MessageBoxIcon.Warning);
            return;
        }

        // Crear diálogo en modo edición
        using var passwordDialog = _serviceProvider.GetRequiredService<frmPassword>();
        passwordDialog.IsEditMode = true;  // Configura título, prompt y oculta chkRemember
        passwordDialog.ShowCancel = true;  // Permitir cancelación

        // Pre-popular con password actual si está disponible
        if (!string.IsNullOrEmpty(_validatedPassword))
        {
            passwordDialog.Password = _validatedPassword;
        }

        if (passwordDialog.ShowDialog(this) != DialogResult.OK)
        {
            _logger.LogDebug("Password change cancelled by user");
            return;
        }

        var newPassword = passwordDialog.Password;

        if (string.IsNullOrWhiteSpace(newPassword))
        {
            MessageBox.Show(
                "Password cannot be empty.",
                "Invalid Password",
                MessageBoxButtons.OK,
                MessageBoxIcon.Warning);
            return;
        }

        try
        {
            LogStatus("Changing device password...");
            cmdConnect.Enabled = false;
            mnuPassword.Enabled = false;

            // Comando ^0 = Cambio de password (no confundir con *0 que es autenticación)
            var serialCommand = new SerialCommand
            {
                Payload = $"^0{newPassword}",
                ExpectsAck = true,
                ExpectsData = true,
                MaxRetries = 2,
                AckTimeout = TimeSpan.FromSeconds(2),
                CancellationToken = _cts?.Token ?? default
            };
            var result = await _pipeline.EnqueueCommandAsync(serialCommand);

            // Verificar respuesta exitosa
            if (result.Success && result.Data.Equals("ACK", StringComparison.OrdinalIgnoreCase))
            {
                // Actualizar password almacenada
                _validatedPassword = newPassword;
                _pipeline.SetStoredPassword(newPassword);
                _commandRouter.SetStoredPassword(newPassword);

                // En modo edición, siempre guardar la nueva contraseña
                // (el usuario ya autenticó para poder cambiarla)
                await _appSettings.SaveSettingAsync("DevicePassword", newPassword);
                _logger.LogInformation("New password saved to settings");

                LogStatus("Password changed successfully");
                MessageBox.Show(
                    "Device password has been changed successfully.",
                    "Password Changed",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Information);

                _logger.LogInformation("Device password changed successfully");
            }
        else
        {
            // Procesar errores específicos de validación de password
            var errorMessage = ParsePasswordValidationError(result.Data);                _logger.LogWarning("Password change failed: {Response} -> {Error}", result.Data, errorMessage);
                LogStatus("Password change failed");
                MessageBox.Show(
                    $"Failed to change password.\n\n{errorMessage}",
                    "Password Change Failed",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error changing device password");
            LogStatus("Password change error");
            MessageBox.Show(
                $"An error occurred while changing the password.\n\n{ex.Message}",
                "Error",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error);
        }
        finally
        {
            cmdConnect.Enabled = true;
            if (_sessionContext.State == ConnectionState.Connected)
            {
                mnuPassword.Enabled = true;
            }
        }
    }

    /// <summary>
    /// Parsea respuesta de error de validación de password del dispositivo.
    /// </summary>
    /// <remarks>
    /// El dispositivo retorna códigos de error específicos en formato hexadecimal:
    /// - 0x80: Longitud inválida (debe ser entre 8 y 16 caracteres)
    /// - 0x01: Carácter inválido
    /// - 0x02: Debe contener al menos una mayúscula
    /// - 0x04: Debe contener al menos una minúscula
    /// - 0x08: Debe contener al menos un número
    /// - 0x10: Debe contener al menos un carácter especial
    /// </remarks>
    private static string ParsePasswordValidationError(string response)
    {
        if (string.IsNullOrEmpty(response))
            return "Unexpected Error. Try again";

        var upperResponse = response.ToUpperInvariant().Trim();

        if (upperResponse == "NACK" || response.Length < 4)
            return "Unexpected Error. Try again";

        if (upperResponse.Contains("INVALID"))
            return "Invalid Credentials";

        // Intentar parsear código de error hexadecimal
        try
        {
            var hexPart = response.Length >= 4 ? response[..4] : response;
            if (int.TryParse(hexPart, System.Globalization.NumberStyles.HexNumber, null, out var errorCode))
            {
                if ((errorCode & 0x80) != 0)
                    return "Invalid length. Password length must be between 8 and 16 characters.";
                if ((errorCode & 0x01) != 0)
                    return "Invalid character.";
                if ((errorCode & 0x02) != 0)
                    return "Password must contain at least one uppercase character.";
                if ((errorCode & 0x04) != 0)
                    return "Password must contain at least one lowercase character.";
                if ((errorCode & 0x08) != 0)
                    return "Password must contain at least one numeric character.";
                if ((errorCode & 0x10) != 0)
                    return "Password must contain at least one special character.";
            }
        }
        catch
        {
            // Ignorar errores de parsing
        }

        return $"Unexpected Error: {response}";
    }

    /// <summary>
    /// Handler para menú License.
    /// Muestra formulario para ingresar clave de licencia (64 hex) y habilitar/deshabilitar features.
    /// </summary>
    private void mnuLicense_Click(object sender, EventArgs e)
    {

        try
        {
            // Obtener instancia via DI (tiene ISerialCommandPipeline inyectado)
            var licenseForm = _serviceProvider.GetRequiredService<frmLicenseKey>();

            // Suscribir evento para WebRefresh al aplicar licencia exitosamente
            licenseForm.LicenseApplied += async (s, args) =>
            {
                _logger.LogInformation("Licencia aplicada exitosamente - refrescando UI");
                await NavigateToDeviceUIAsync(forceAdvanced: true);
            };

            // Mostrar formulario (no modal)
            licenseForm.Show(this);
            LogStatus("License form opened");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error opening license form");
            MessageBox.Show(
                $"Error opening license form:\n\n{ex.Message}",
                "Error",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error);
        }
    }

    /// <summary>
    /// Handler para menú Ethernet > Install.
    /// Abre diálogo para activar/desactivar módulo Ethernet Rabbit.
    /// </summary>
    private void mnuEthInstall_Click(object sender, EventArgs e)
    {
        var device = _sessionContext.Device;

        if (device == null || _sessionContext.State != ConnectionState.Connected)
        {
            _logger.LogWarning("Ethernet menu clicked without connected device");
            MessageBox.Show(
                "Please connect to a device first.",
                "Not Connected",
                MessageBoxButtons.OK,
                MessageBoxIcon.Warning);
            return;
        }

        try
        {
            LogStatus("Opening Ethernet Module configuration...");

            // Crear y configurar diálogo
            using var dialog = _serviceProvider.GetRequiredService<frmEthernetInstall>();
            dialog.SetDevice(device);

            // Mostrar diálogo modal
            var result = dialog.ShowDialog(this);

            // Si se aplicaron cambios, refrescar WebView
            if (result == DialogResult.OK)
            {
                _logger.LogInformation("Ethernet configuration changed, refreshing device UI");
                LogStatus("Ethernet configuration applied, refreshing...");

                // Refrescar WebView después de aplicar cambios
                _ = NavigateToDeviceUIAsync(true);
            }
            else
            {
                LogStatus("Ethernet configuration cancelled");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error opening Ethernet Module dialog");
            MessageBox.Show(
                $"Error opening Ethernet Module configuration.\n\n{ex.Message}",
                "Error",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error);
        }
    }

    /// <summary>
    /// Handler para menú Reset To Factory Default.
    /// Restablece configuración a valores de fábrica.
    /// Solo disponible para dispositivos 2c (BDA Dual).
    /// </summary>
    private async void mnuFactDefault_Click(object sender, EventArgs e)
    {
        var device = _sessionContext.Device;

        if (device == null || _sessionContext.State != ConnectionState.Connected)
        {
            MessageBox.Show(
                "Please connect to a device first.",
                "Not Connected",
                MessageBoxButtons.OK,
                MessageBoxIcon.Warning);
            return;
        }

        // Solo soportado para dispositivo 2c
        if (device.TDev != "2c")
        {
            MessageBox.Show(
                $"Factory reset is not available for device type '{device.TDev}'.\n\n" +
                "This feature is only supported for BDA Dual (2c) devices.",
                "Not Supported",
                MessageBoxButtons.OK,
                MessageBoxIcon.Information);
            return;
        }

        // Confirmación del usuario
        var confirm = MessageBox.Show(
            "Configuration will be reset to factory default.\n\n" +
            "This will restore all settings to their original values.\n" +
            "BBU type and connection information will be preserved.\n\n" +
            "Do you want to continue?",
            "Factory Reset Confirmation",
            MessageBoxButtons.YesNo,
            MessageBoxIcon.Warning,
            MessageBoxDefaultButton.Button2);

        if (confirm != DialogResult.Yes)
        {
            _logger.LogDebug("Factory reset cancelled by user");
            return;
        }

        try
        {
            LogStatus("Resetting to factory default...");
            Cursor = Cursors.WaitCursor;
            cmdConnect.Enabled = false;
            mnuFactDefault.Enabled = false;

            var success = await RestoreFactoryConfigAsync(device);

            if (success)
            {
                LogStatus("Factory reset completed successfully");
                MessageBox.Show(
                    "Configuration has been reset to factory default.\n\n" +
                    "The device interface will be refreshed.",
                    "Factory Reset Complete",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Information);

                // Refrescar UI del dispositivo
                await NavigateToDeviceUIAsync(true);
            }
            else
            {
                LogStatus("Factory reset failed");
                MessageBox.Show(
                    "Failed to reset configuration to factory default.\n\n" +
                    "Please check the device connection and try again.",
                    "Factory Reset Failed",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Factory reset error");
            LogStatus("Factory reset error");
            MessageBox.Show(
                $"An error occurred during factory reset.\n\n{ex.Message}",
                "Error",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error);
        }
        finally
        {
            Cursor = Cursors.Default;
            cmdConnect.Enabled = true;
            if (_sessionContext.State == ConnectionState.Connected && device.TDev == "2c")
            {
                mnuFactDefault.Enabled = true;
            }
        }
    }

    /// <summary>
    /// Restaura configuración de fábrica del dispositivo.
    /// Específico para dispositivo 2c (BDA Dual).
    /// </summary>
    /// <param name="device">Información del dispositivo</param>
    /// <returns>True si exitoso</returns>
    private async Task<bool> RestoreFactoryConfigAsync(DeviceInfo device)
    {
        _logger.LogInformation("Starting factory reset for device {Device}", device.NameTypeDevice);

        try
        {
            // PASO 1: Leer configuración actual para preservar BBU info (solo para ndev >= 2)
            string currentConfig = string.Empty;

            if (device.NDev >= 2.0)
            {
                var readCommand = new SerialCommand
                {
                    Payload = "C1",
                    ExpectsAck = false,
                    ExpectsData = true,
                    MaxRetries = 2,
                    AckTimeout = TimeSpan.FromSeconds(5),
                    CancellationToken = _cts?.Token ?? default
                };
                var currentConfigResult = await _pipeline.EnqueueCommandAsync(readCommand);

                if (!currentConfigResult.Success || string.IsNullOrEmpty(currentConfigResult.Data))
                {
                    _logger.LogError("Failed to read current configuration for BBU preservation");
                    return false;
                }

                currentConfig = currentConfigResult.Data;

                // Validar longitud mínima de respuesta
                if (currentConfig.Length < 636)
                {
                    _logger.LogError("Configuration response too short: {Length} chars (expected >= 636)",
                        currentConfig.Length);
                    return false;
                }
            }

            // PASO 2: Preparar configuración de fábrica según versión del dispositivo
            string factoryConfig = GetFactoryConfigForDevice(device.NDev);

            if (string.IsNullOrEmpty(factoryConfig))
            {
                _logger.LogError("No factory configuration defined for device version {Version}", device.NDev);
                return false;
            }

            // PASO 3: Para ndev >= 2.0, construir cadena completa con BBU preservado
            if (device.NDev >= 2.0 && currentConfig.Length >= 636)
            {
                // Agregar caracter BBU preservado (posición 636 en 1-indexed = 635 en 0-indexed)
                char bbuChar = currentConfig[635];
                factoryConfig += bbuChar;

                // Agregar segunda parte de la configuración
                factoryConfig += GetFactoryConfigSecondPart();

                _logger.LogDebug("Factory config for v2.0+ with BBU preserved: {Length} chars", factoryConfig.Length);
            }

            _logger.LogDebug("Factory config prepared: {Length} chars", factoryConfig.Length);

            // PASO 4: Enviar configuración de fábrica
            var resetCommand = new SerialCommand
            {
                Payload = factoryConfig,
                ExpectsAck = true,
                ExpectsData = false,
                MaxRetries = 2,
                AckTimeout = TimeSpan.FromSeconds(10),
                CancellationToken = _cts?.Token ?? default
            };
            var resetResult = await _pipeline.EnqueueCommandAsync(resetCommand);

            if (!resetResult.Success)
            {
                _logger.LogError("Failed to send factory configuration: {Status}", resetResult.Status);
                return false;
            }

            // Verificar que se recibió ACK exitosamente
            _logger.LogInformation("Factory reset completed successfully - ACK received");
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during factory reset");
            return false;
        }
    }

    /// <summary>
    /// Obtiene la cadena de configuración de fábrica para una versión de dispositivo 2c.
    /// </summary>
    /// <remarks>
    /// Las cadenas para ndev >= 2 incluyen placeholder en posición 636 para BBU info.
    /// </remarks>
    /// <param name="deviceVersion">Versión del dispositivo (ndev)</param>
    /// <returns>Cadena de configuración de fábrica (primera parte antes de BBU)</returns>
    private static string GetFactoryConfigForDevice(double deviceVersion)
    {
        // Formato: Primera parte + [BBU info preservada] + Segunda parte

        if (deviceVersion >= 2.0)
        {
            // Configuración para 2c v2.0+
            // Primera parte (635 chars) - antes del caracter BBU
            // Segunda parte se añade después de preservar BBU
            return "C000000914003C000C319C3718FF008000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC00FD5302A300FD5302A300FD5302A300FD5302A361003721FF008000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC00FD5302A3E3FD5302A300FD5302A3D8FD5302A3000";
        }
        else if (deviceVersion >= 1.0)
        {
            // Configuración para 2c v1.0+
            // Esta versión NO preserva BBU (cadena completa sin placeholder)
            return "C000000914003C000C319C3718F3008000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC00FD5302A300FD5302A300FD5302A300FD5302A361003721F3008000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC00FD5302A300FD5302A300FD5302A300FD5302A3000914003C0001319C3718F30080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000000FD3002D000FD3002D000FD3002D000FD3002D061003721F30080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000000FD3002D000FD3002D000FD3002D000FD3002D0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0FFFFFFFFB0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0FFFFFFFF00008DA1A1A1A18DA1A1A1A12B009C002B009C002B009C00005000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180";
        }
        else
        {
            // Configuración para 2c v0.x (legacy)
            // Similar a v1.0 pero con ligera diferencia en la sección final
            return "C000000914003C000C319C3718F3008000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC00FD5302A300FD5302A300FD5302A300FD5302A361003721F3008000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC00FD5302A300FD5302A300FD5302A300FD5302A3000914003C0001319C3718F30080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000000FD3002D000FD3002D000FD3002D000FD3002D061003721F30080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000000FD3002D000FD3002D000FD3002D000FD3002D0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0FFFFFFFFB0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B09292B0B0B0B0FFFFFFFF00008DA1A1A1A18DA1A1A1A12B009C002B009C002B009C0000500001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180";
        }
    }

    /// <summary>
    /// Obtiene la segunda parte de la configuración de fábrica (después del BBU info).
    /// Solo aplica para ndev >= 2.0 que usa formato con placeholder BBU.
    /// </summary>
    private static string GetFactoryConfigSecondPart()
    {
        return "1480000000319C3718FF00800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000000FD3002D000FD3002D000FD3002D000FD3002D061003721FF00800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000000FD3002D000FD3002D000FD3002D000FD3002D0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0FFFFFFFFB0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0FFFFFFFF00008DA1A1A1A18DA1A1A1A12B009C002B009C002B009C0000500001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180";
    }

    #endregion

    #region Production Tests Menu Handlers

    /// <summary>
    /// Handler para menú Production Tests > Clear EEPROM.
    /// Borra EEPROM y resetea configuración del dispositivo.
    /// </summary>
    private async void mnuClear_Click(object sender, EventArgs e)
    {
        // Borra EEPROM: nchannels=1, mode=0, clearROM=True
        await ExecuteProductionTestAsync(1, 0, clearROM: true, "Clear EEPROM");
    }

    /// <summary>
    /// Handler para menú Production Tests > 1 CH.
    /// Aplica configuración de producción de 1 canal.
    /// </summary>
    private async void mnuOneCH_Click(object sender, EventArgs e)
    {
        // 1 canal: nchannels=1, mode=0, clearROM=False
        await ExecuteProductionTestAsync(1, 0, clearROM: false, "1 Channel Production Config");
    }

    /// <summary>
    /// Handler para menú Production Tests > 2 CH > Band start.
    /// Aplica configuración de producción de 2 canales (inicio de banda).
    /// </summary>
    private async void mnuTwoCHStart_Click(object sender, EventArgs e)
    {
        // 2 canales inicio banda: nchannels=2, mode=0, clearROM=False
        await ExecuteProductionTestAsync(2, 0, clearROM: false, "2 Channel Band Start Production Config");
    }

    /// <summary>
    /// Handler para menú Production Tests > 2 CH > Band center.
    /// Aplica configuración de producción de 2 canales (centro de banda).
    /// </summary>
    private async void mnuTwoCHCenter_Click(object sender, EventArgs e)
    {
        // 2 canales centro banda: nchannels=2, mode=1, clearROM=False
        await ExecuteProductionTestAsync(2, 1, clearROM: false, "2 Channel Band Center Production Config");
    }

    /// <summary>
    /// Handler para menú Production Tests > 2 CH > Band stop.
    /// Aplica configuración de producción de 2 canales (fin de banda).
    /// </summary>
    private async void mnuTwoCHStop_Click(object sender, EventArgs e)
    {
        // 2 canales fin banda: nchannels=2, mode=2, clearROM=False
        await ExecuteProductionTestAsync(2, 2, clearROM: false, "2 Channel Band Stop Production Config");
    }

    /// <summary>
    /// Handler para menú Production Tests > 6 CH.
    /// Aplica configuración de producción de 6 canales.
    /// </summary>
    private async void mnuSixCH_Click(object sender, EventArgs e)
    {
        // 6 canales: nchannels=6, mode=0, clearROM=False
        await ExecuteProductionTestAsync(6, 0, clearROM: false, "6 Channel Production Config");
    }

    /// <summary>
    /// Handler para menú Production Tests > FirstNet Filter.
    /// Aplica configuración de producción FirstNet (solo para 1c v5).
    /// </summary>
    private async void mnuFirstNet_Click(object sender, EventArgs e)
    {
        // FirstNet: nchannels=0, mode=0, clearROM=False
        await ExecuteProductionTestAsync(0, 0, clearROM: false, "FirstNet Filter Production Config");
    }

    /// <summary>
    /// Ejecuta una operación de Production Test con validación y manejo de errores común.
    /// Wrapper para SendProdConfigAsync con UI feedback.
    /// </summary>
    /// <param name="nchannels">Número de canales (0=FirstNet, 1=1CH, 2=2CH, 6=6CH)</param>
    /// <param name="mode">Modo para 2CH: 0=start, 1=center, 2=stop</param>
    /// <param name="clearROM">True para borrar EEPROM</param>
    /// <param name="operationName">Nombre de la operación para logging/UI</param>
    private async Task ExecuteProductionTestAsync(short nchannels, short mode, bool clearROM, string operationName)
    {
        var device = _sessionContext.Device;

        // Validación de conexión
        if (device == null || _sessionContext.State != ConnectionState.Connected)
        {
            MessageBox.Show(
                "Please connect to a device first.",
                "Not Connected",
                MessageBoxButtons.OK,
                MessageBoxIcon.Warning);
            return;
        }

        // Confirmación para operaciones de Clear EEPROM
        if (clearROM)
        {
            var confirm = MessageBox.Show(
                $"This will clear the EEPROM and reset the device configuration.\n\n" +
                "All user settings will be erased.\n\n" +
                "Do you want to continue?",
                "Clear EEPROM Confirmation",
                MessageBoxButtons.YesNo,
                MessageBoxIcon.Warning,
                MessageBoxDefaultButton.Button2);

            if (confirm != DialogResult.Yes)
            {
                _logger.LogDebug("Clear EEPROM cancelled by user");
                return;
            }
        }

        try
        {
            LogStatus($"Applying {operationName}...");
            Cursor = Cursors.WaitCursor;
            SetProductionMenusEnabled(false);

            _logger.LogInformation("Starting production test: {Operation} (nchannels={Channels}, mode={Mode}, clearROM={Clear})",
                operationName, nchannels, mode, clearROM);

            var success = await SendProdConfigAsync(device, nchannels, mode, clearROM);

            if (success)
            {
                LogStatus($"{operationName} completed successfully");
                _logger.LogInformation("Production test completed: {Operation}", operationName);

                // Refrescar UI del dispositivo
                await NavigateToDeviceUIAsync(true);
            }
            else
            {
                LogStatus($"{operationName} failed");
                MessageBox.Show(
                    $"Failed to apply {operationName}.\n\n" +
                    "Please check the device connection and try again.",
                    "Production Test Failed",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during production test: {Operation}", operationName);
            LogStatus($"{operationName} error");
            MessageBox.Show(
                $"An error occurred during {operationName}.\n\n{ex.Message}",
                "Error",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error);
        }
        finally
        {
            Cursor = Cursors.Default;
            if (_sessionContext.State == ConnectionState.Connected)
            {
                UpdateProductionMenuVisibility(device);
            }
        }
    }

    /// <summary>
    /// Habilita o deshabilita los menús de Production Tests durante operaciones.
    /// </summary>
    private void SetProductionMenusEnabled(bool enabled)
    {
        mnuClear.Enabled = enabled;
        mnuOneCH.Enabled = enabled;
        mnuTwoCH.Enabled = enabled;
        mnuSixCH.Enabled = enabled;
        mnuFirstNet.Enabled = enabled;
    }

    /// <summary>
    /// Actualiza la visibilidad de los menús de Production Tests según el dispositivo.
    /// </summary>
    private async void UpdateProductionMenuVisibility(DeviceInfo device)
    {
        // Restaurar estado habilitado
        SetProductionMenusEnabled(true);

        // Visibilidad por defecto
        mnuProd.Visible = false;
        mnuClear.Visible = false;
        mnuFirstNet.Visible = false;
        mnuOneCH.Visible = false;
        mnuTwoCH.Visible = false;
        mnuSixCH.Visible = false;

        // TwoCH sub-items - Start/Stop deshabilitados por defecto (solo Center activo)
        mnuTwoCHStart.Enabled = false;
        mnuTwoCHCenter.Enabled = true;
        mnuTwoCHStop.Enabled = false;

        if (device == null) return;

        string tdev = device.TDev?.ToLowerInvariant() ?? "";
        double ndev = device.NDev;

        // GRUPO 1: Dispositivos que requieren getFactoryParameters para determinar visibilidad
        bool requiresFactoryParams = tdev switch
        {
            "1cm" => true,
            "1a" when ndev >= 2.0 => true,
            "1dm" when ndev >= 4.1 => true,
            "1c" when ndev >= 3.0 || Math.Abs(ndev - 2.0) < 0.05 || Math.Abs(ndev - 1.2) < 0.05 || Math.Abs(ndev - 2.2) < 0.05 => true,
            "1dr" when ndev >= 2.1 => true,
            _ => false
        };

        if (requiresFactoryParams)
        {
            var factoryService = _serviceProvider.GetRequiredService<FactoryParametersService>();
            var factParams = await factoryService.GetFactoryParametersAsync(tdev, ndev);

            if (factParams != null)
            {
                mnuProd.Visible = true;

                // Si isADJBW o 1c v2.2, solo Clear visible (sin canales)
                if ((tdev == "1c" && Math.Abs(ndev - 2.2) < 0.05) || factParams.IsAdjBW)
                {
                    mnuClear.Visible = true;
                    mnuOneCH.Visible = false;
                    mnuTwoCH.Visible = false;
                    mnuSixCH.Visible = false;
                }
                else
                {
                    mnuOneCH.Visible = true;
                    mnuTwoCH.Visible = true;
                    mnuSixCH.Visible = true;
                }

                // Si bandwidth >= 3MHz, habilitar TwoCHStart/Stop
                if (factParams.BandWidth >= 3_000_000.0)
                {
                    mnuTwoCHStart.Enabled = true;
                    mnuTwoCHStop.Enabled = true;
                }

                // mnuClear visible para 1c v3+, 1c v1.2, 1cm, 1dm v4.1+, 1a v2+, 1dr v2.1+
                if ((tdev == "1c" && ndev >= 3.0) ||
                    (tdev == "1c" && Math.Abs(ndev - 1.2) < 0.05) ||
                    tdev == "1cm" ||
                    (tdev == "1dm" && ndev >= 4.1) ||
                    (tdev == "1a" && ndev >= 2.0) ||
                    (tdev == "1dr" && ndev >= 2.1))
                {
                    mnuClear.Visible = true;
                }
            }
        }

        // GRUPO 2: Dispositivos con config hardcodeada (sin factoryParams)
        bool hasHardcodedConfig = tdev switch
        {
            "1c" when (int)ndev == 7 || (int)ndev == 8 => true,
            "2c" or "2dm" or "3c" or "3dm" or "2dr" or "2dr1" or "2dr2" or "3dr" or "5dm" or "2dm1" or "3dm1" => true,
            "4dm" or "4dm1" or "4dm2" or "4dm3" or "4dm4" => true,
            _ => false
        };

        if (hasHardcodedConfig)
        {
            mnuProd.Visible = true;
            mnuClear.Visible = true;
            // Para estos dispositivos, ocultar menús de canales
            mnuOneCH.Visible = false;
            mnuTwoCH.Visible = false;
            mnuSixCH.Visible = false;
        }

        // GRUPO 3: Dispositivo 1de (solo Clear)
        if (tdev == "1de")
        {
            mnuProd.Visible = true;
            mnuClear.Visible = true;
            mnuOneCH.Visible = false;
            mnuTwoCH.Visible = false;
            mnuSixCH.Visible = false;
        }

        // mnuFirstNet solo visible para 1c v5
        mnuFirstNet.Visible = tdev == "1c" && (int)ndev == 5;
    }

    /// <summary>
    /// Envía configuración de producción al dispositivo.
    /// </summary>
    /// <remarks>
    /// Esta función contiene configuraciones hardcodeadas extensas para múltiples
    /// tipos de dispositivos. La implementación actual soporta los dispositivos más comunes.
    /// Para dispositivos no soportados, se muestra un mensaje informativo.
    /// </remarks>
    /// <param name="device">Información del dispositivo</param>
    /// <param name="nchannels">Número de canales (0=FirstNet, 1=1CH, 2=2CH, 6=6CH)</param>
    /// <param name="mode">Modo para 2CH: 0=start, 1=center, 2=stop</param>
    /// <param name="clearROM">True para borrar EEPROM y resetear tag</param>
    /// <returns>True si exitoso</returns>
    private async Task<bool> SendProdConfigAsync(DeviceInfo device, short nchannels, short mode, bool clearROM)
    {
        string tdev = device.TDev?.ToLowerInvariant() ?? "";
        double ndev = device.NDev;

        _logger.LogInformation("SendProdConfig: tdev={TDev}, ndev={NDev}, nchannels={Channels}, mode={Mode}, clearROM={Clear}",
            tdev, ndev, nchannels, mode, clearROM);

        try
        {
            // Delay de estabilización antes de enviar comandos
            await Task.Delay(2000);

            // Obtener configuración de producción para el dispositivo
            var prodConfig = GetProductionConfig(tdev, ndev, nchannels, mode, clearROM);

            // Si no hay config hardcodeada, intentar construcción dinámica
            if (prodConfig == null || prodConfig.Commands.Count == 0)
            {
                // Intentar construir config dinámica para dispositivos soportados
                if (SupportsDynamicConfig(tdev, ndev))
                {
                    var dynamicBuilder = _serviceProvider.GetRequiredService<DynamicConfigBuilder>();
                    var factoryService = _serviceProvider.GetRequiredService<FactoryParametersService>();

                    // Obtener parámetros de fábrica del dispositivo
                    var factoryParams = await factoryService.GetFactoryParametersAsync(tdev, ndev);
                    if (factoryParams != null)
                    {
                        var dynamicCommands = await dynamicBuilder.BuildConfigFramesAsync(
                            tdev, ndev, factoryParams, nchannels, mode, clearROM);

                        if (dynamicCommands.Count > 0)
                        {
                            prodConfig = new ProductionConfigData();
                            prodConfig.Commands.AddRange(dynamicCommands);
                            _logger.LogInformation("Using dynamic config for {TDev} v{NDev}: {Count} commands",
                                tdev, ndev, dynamicCommands.Count);
                        }
                    }
                }
            }

            if (prodConfig == null || prodConfig.Commands.Count == 0)
            {
                _logger.LogWarning("No production config available for device {TDev} v{NDev}", tdev, ndev);
                MessageBox.Show(
                    $"Production test configuration is not available for device type '{tdev}' version {ndev:F1}.\n\n" +
                    "This feature may require hardware-specific configuration data.",
                    "Not Supported",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Information);
                return false;
            }

            // Mostrar mensaje de progreso
            LogStatus("Applying production configuration...");

            // Enviar cada comando de la configuración
            foreach (var cmdInfo in prodConfig.Commands)
            {
                _logger.LogDebug("Sending production command: {Description}", cmdInfo.Description);

                var command = new SerialCommand
                {
                    Payload = cmdInfo.Payload,
                    ExpectsAck = cmdInfo.ExpectsAck,
                    ExpectsData = false,
                    MaxRetries = 2,
                    AckTimeout = TimeSpan.FromSeconds(cmdInfo.TimeoutSeconds),
                    CancellationToken = _cts?.Token ?? default
                };

                var result = await _pipeline.EnqueueCommandAsync(command);

                // El pipeline ya maneja reintentos, verificamos resultado final
                if (!result.Success && cmdInfo.ExpectsAck)
                {
                    _logger.LogError("Production command failed: {Description}, Status: {Status}",
                        cmdInfo.Description, result.Status);
                    return false;
                }

                // Pequeña pausa entre comandos 
                await Task.Delay(100);
            }

            _logger.LogInformation("Production configuration applied successfully");
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in SendProdConfigAsync");
            return false;
        }
    }

    /// <summary>
    /// Determina si un dispositivo soporta configuración dinámica via BuildCFGFrames.
    /// </summary>
    /// <remarks>
    /// Dispositivos que usan BuildCFGFrames() en lugar de configs hardcodeadas.
    /// </remarks>
    private static bool SupportsDynamicConfig(string tdev, double ndev)
    {
        return tdev switch
        {
            // 1c versiones 2-6 (excepto 7 y 8 que tienen config hardcodeada)
            "1c" when ndev >= 2.0 && ndev < 7.0 => true,

            // 1dm versión 4.1 o superior
            "1dm" when ndev >= 4.1 => true,

            // 1dr versión 2.1 o superior
            "1dr" when ndev >= 2.1 => true,

            // 1cm todas las versiones
            "1cm" => true,

            // 1a todas las versiones
            "1a" => true,

            _ => false
        };
    }

    /// <summary>
    /// Obtiene la configuración de producción para un dispositivo específico.
    /// </summary>
    /// <remarks>
    /// Esta implementación incluye configuraciones para dispositivos comunes.
    /// Las configuraciones son strings hexadecimales que representan parámetros del firmware.
    /// </remarks>
    private ProductionConfigData? GetProductionConfig(string tdev, double ndev, short nchannels, short mode, bool clearROM)
    {
        // Seleccionar configuración según tipo de dispositivo
        switch (tdev)
        {
            case "1c" when (int)ndev == 7:
                return GetProductionConfig_1C_V7(nchannels, mode, clearROM);

            case "1c" when (int)ndev == 8:
                return GetProductionConfig_1C_V8(nchannels, mode, clearROM);

            case "2c":
                return GetProductionConfig_2C(ndev, nchannels, mode, clearROM);

            case "2dr" or "2dr2":
                return GetProductionConfig_2DR(nchannels, mode, clearROM);

            case "2dr1":
                return GetProductionConfig_2DR1(nchannels, mode, clearROM);

            case "3dr":
                return GetProductionConfig_3DR(ndev, nchannels, mode, clearROM);

            case "4dm" or "4dm2" or "4dm3":
                return GetProductionConfig_4DM(nchannels, mode, clearROM);

            case "4dm1":
                return GetProductionConfig_4DM1(nchannels, mode, clearROM);

            case "4dm4":
                return GetProductionConfig_4DM4(nchannels, mode, clearROM);

            case "5dm":
                return GetProductionConfig_5DM(ndev, nchannels, mode, clearROM);

            case "2dm" or "2dm1":
                return GetProductionConfig_2DM(tdev, nchannels, mode, clearROM);

            case "3c":
                return GetProductionConfig_3C(ndev, nchannels, mode, clearROM);

            case "3dm" or "3dm1":
                return GetProductionConfig_3DM(tdev, nchannels, mode, clearROM);

            case "1de":
                return GetProductionConfig_1DE(ndev, nchannels, mode, clearROM);

            default:
                // Para otros dispositivos, retornar null para indicar no soportado
                // BuildCFGFrames() para dispositivos genéricos no implementado aún
                _logger.LogDebug("Production config not implemented for device {TDev} v{NDev}", tdev, ndev);
                return null;
        }
    }

    /// <summary>
    /// Configuración de producción para dispositivo 1c v7.
    /// </summary>
    private ProductionConfigData GetProductionConfig_1C_V7(short nchannels, short mode, bool clearROM)
    {
        var config = new ProductionConfigData();

        // Comando C - Configuración principal
        config.Commands.Add(new ProductionCommand
        {
            Payload = "C000000914003C000CB09C5518E3008000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC00FD5302A300FD5302A300FD5302A300FD5302A3E0005521E3008000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC00FD5302A300FD5302A300FD5302A300FD5302A3000914003C0001B09C5518E3008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000000FD3002D000FD3002D000FD3002D000FD3002D0E0005521E3008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000000FD3002D000FD3002D000FD3002D000FD3002D0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0FFFFFFFFB0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0FFFFFFFF00000001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180",
            Description = "1c v7 Config (C command)",
            ExpectsAck = true,
            TimeoutSeconds = 10
        });

        // Comando J - Parámetros adicionales
        config.Commands.Add(new ProductionCommand
        {
            Payload = "J003E803E8000A03E803E8000A057E7F0000031F1F0C000003AB083F003F007F7F0808000808040000000000804050504058484848224148500001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180External Input 1              External Input 2              External Input 3              Force RF OFF                  ",
            Description = "1c v7 Params (J command)",
            ExpectsAck = true,
            TimeoutSeconds = 10
        });

        // Comando O - Clear log
        config.Commands.Add(new ProductionCommand
        {
            Payload = "O001",
            Description = "Clear log (O command)",
            ExpectsAck = true,
            TimeoutSeconds = 5
        });

        // Si clearROM, agregar comando de tag reset
        if (clearROM)
        {
            // Comando T para reset tag
            config.Commands.Add(new ProductionCommand
            {
                Payload = "T0BDA FIPLEX                    ",
                Description = "Reset tag (T command)",
                ExpectsAck = true,
                TimeoutSeconds = 5
            });
        }

        return config;
    }

    /// <summary>
    /// Configuración de producción para dispositivo 1c v8.
    /// </summary>
    private ProductionConfigData GetProductionConfig_1C_V8(short nchannels, short mode, bool clearROM)
    {
        var config = new ProductionConfigData();

        // Comando C - Configuración principal para v8
        config.Commands.Add(new ProductionCommand
        {
            Payload = "C000000914003C000C909C8228F3000000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC00FD5302A300FD5302A300FD5302A300FD5302A380008228F3000000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC00FD5302A300FD5302A300FD5302A300FD5302A3000914003C0001909C8228F3000000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000000FD3002D000FD3002D000FD3002D000FD3002D080008228F3000000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000000FD3002D000FD3002D000FD3002D000FD3002D0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B09292B0B0A6A6FFFFFFFFB0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B09292B0B0A6A6FFFFFFFF00000001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180",
            Description = "1c v8 Config (C command)",
            ExpectsAck = true,
            TimeoutSeconds = 10
        });

        // Comando J para v8
        config.Commands.Add(new ProductionCommand
        {
            Payload = "J003E803E8000A03E809C4000A057E7F0000031F1F0C0000039C0D230023007E7E0404000000040000000000000000000000444C4C254A40000001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180External Input 1              External Input 2              External Input 3              Force RF OFF                  ",
            Description = "1c v8 Params (J command)",
            ExpectsAck = true,
            TimeoutSeconds = 10
        });

        // Comando O
        config.Commands.Add(new ProductionCommand
        {
            Payload = "O001",
            Description = "Clear log (O command)",
            ExpectsAck = true,
            TimeoutSeconds = 5
        });

        if (clearROM)
        {
            config.Commands.Add(new ProductionCommand
            {
                Payload = "T0BDA FIPLEX                    ",
                Description = "Reset tag (T command)",
                ExpectsAck = true,
                TimeoutSeconds = 5
            });
        }

        return config;
    }

    /// <summary>
    /// Configuración de producción para dispositivo 2c (BDA Dual).
    /// </summary>
    private ProductionConfigData GetProductionConfig_2C(double ndev, short nchannels, short mode, bool clearROM)
    {
        var config = new ProductionConfigData();

        // La configuración 2c es más compleja con detección MMS y preservación BBU
        // Por ahora implementamos la versión básica
        string configPayload;

        if (ndev >= 2.0)
        {
            // Configuración para 2c v2+
            configPayload = "C000000914003C000CB09C5518EF008000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC00FD5302A300FD5302A300FD5302A300FD5302A3E0005521EF008000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC00FD5302A3E3FD5302A300FD5302A3D8FD5302A3000";
        }
        else
        {
            // Configuración para 2c v1.x
            configPayload = "C000000914003C000CB09C5518E3008000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC00FD5302A300FD5302A300FD5302A300FD5302A3E0005521E3008000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC00FD5302A300FD5302A300FD5302A300FD5302A3";
        }

        config.Commands.Add(new ProductionCommand
        {
            Payload = configPayload,
            Description = "2c Config (C command)",
            ExpectsAck = true,
            TimeoutSeconds = 10
        });

        // Comando J
        config.Commands.Add(new ProductionCommand
        {
            Payload = "J003E803E8000A03E803E8000A057E7F0000031F1F0C000003AB083F003F007F7F0808000808040000000000804050504058484848224148500001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180External Input 1              External Input 2              External Input 3              Force RF OFF                  ",
            Description = "2c Params (J command)",
            ExpectsAck = true,
            TimeoutSeconds = 10
        });

        // Comando O
        config.Commands.Add(new ProductionCommand
        {
            Payload = "O001",
            Description = "Clear log (O command)",
            ExpectsAck = true,
            TimeoutSeconds = 5
        });

        if (clearROM)
        {
            config.Commands.Add(new ProductionCommand
            {
                Payload = "T0BDA FIPLEX                    ",
                Description = "Reset tag (T command)",
                ExpectsAck = true,
                TimeoutSeconds = 5
            });
        }

        return config;
    }

    /// <summary>
    /// Configuración de producción para dispositivo 2dr/2dr2.
    /// </summary>
    private ProductionConfigData GetProductionConfig_2DR(short nchannels, short mode, bool clearROM)
    {
        var config = new ProductionConfigData();

        config.Commands.Add(new ProductionCommand
        {
            Payload = "C000000914003C000CB09C5518EF008000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC00FD5302A300FD5302A300FD5302A300FD5302A3E0005521EF008000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC00FD5302A300FD5302A300FD5302A300FD5302A3000914003C0001B09C5518EF00800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000000FD3002D000FD3002D000FD3002D000FD3002D0E0005521EF00800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000000FD3002D000FD3002D000FD3002D000FD3002D0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0FFFFFFFFB0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0FFFFFFFF00000001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000000000000000000",
            Description = "2dr Config (C command)",
            ExpectsAck = true,
            TimeoutSeconds = 10
        });

        // Comando J para 2dr
        config.Commands.Add(new ProductionCommand
        {
            Payload = "J003E803E8000A03E803E8000A057E7F0000031F1F0C000003AB0878CF20005D7C080800080804080800000000405050405848484822414850080858080201580000015100000151000001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180External Input 1              External Input 2              External Input 3              External Input 4              EC02EC02550214021402",
            Description = "2dr Params (J command)",
            ExpectsAck = true,
            TimeoutSeconds = 10
        });

        // Comando O
        config.Commands.Add(new ProductionCommand
        {
            Payload = "O001",
            Description = "Clear log (O command)",
            ExpectsAck = true,
            TimeoutSeconds = 5
        });

        if (clearROM)
        {
            config.Commands.Add(new ProductionCommand
            {
                Payload = "T0REMOTE FIPLEX                 ",
                Description = "Reset tag (T command)",
                ExpectsAck = true,
                TimeoutSeconds = 5
            });
        }

        return config;
    }

    /// <summary>
    /// Configuración de producción para dispositivo 4dm/4dm2/4dm3.
    /// </summary>
    private ProductionConfigData GetProductionConfig_4DM(short nchannels, short mode, bool clearROM)
    {
        var config = new ProductionConfigData();

        config.Commands.Add(new ProductionCommand
        {
            Payload = "C0000100000955003C000CB09C5518EF008000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC00FD5302A300FD5302A300FD5302A300FD5302A3E0005521EF008000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC00FD5302A300FD5302A300FD5302A300FD5302A3000955003C0001B09C5518EF00800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000000FD3002D000FD3002D000FD3002D000FD3002D0E0005521EF00800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000000FD3002D000FD3002D000FD3002D000FD3002D0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0FFFFFFFFB0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0FFFFFFFF00000001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000000000000000000",
            Description = "4dm Config (C command)",
            ExpectsAck = true,
            TimeoutSeconds = 10
        });

        // Comando J para 4dm
        config.Commands.Add(new ProductionCommand
        {
            Payload = "J0000103E803E8000A03E803E8000A057E7F0000031F1F0C000003AB0848FF30007F7F080800080804080800000080405050405848484822414850080858080201580000015100000151000001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180External Input 1              External Input 2              External Input 3              Force RF OFF                  EC02EC02550214021402",
            Description = "4dm Params (J command)",
            ExpectsAck = true,
            TimeoutSeconds = 10
        });

        // Comando O
        config.Commands.Add(new ProductionCommand
        {
            Payload = "O001",
            Description = "Clear log (O command)",
            ExpectsAck = true,
            TimeoutSeconds = 5
        });

        if (clearROM)
        {
            config.Commands.Add(new ProductionCommand
            {
                Payload = "T0MASTER FIPLEX                 \t\t\t0100\t\t\t0200",
                Description = "Reset tag (T command)",
                ExpectsAck = true,
                TimeoutSeconds = 5
            });
        }

        return config;
    }

    /// <summary>
    /// Configuración de producción para dispositivo 2dr1.
    /// </summary>
    private ProductionConfigData GetProductionConfig_2DR1(short nchannels, short mode, bool clearROM)
    {
        var config = new ProductionConfigData();

        config.Commands.Add(new ProductionCommand
        {
            Payload = "C000000914003C000CB09C5518EF00800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002800FCEA032A00FCEA032A00FD5302A300FD5302A3E0005518EF00800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002800FCEA032A00FCEA032A00FD5302A300FD5302A3000914003C0001B09C5518EF008000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD800FCD6031600FCD6031600FD3002D000FD3002D0E000551EEF008000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD800FCD6031600FCD6031600FD3002D000FD3002D0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0FFFFFFFFB0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0FFFFFFFF00000001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000000000000000000",
            Description = "2dr1 Config (C command)",
            ExpectsAck = true,
            TimeoutSeconds = 10
        });

        // Comando J para 2dr1
        config.Commands.Add(new ProductionCommand
        {
            Payload = "J003E803E8000A03E803E8000A057E7F0000031F1F0C000003ABAB48CF30007F7F080800080804080800000080405050405848484822414850080858080201580008045100000151000001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180External Input 1              External Input 2              External Input 3              External Input 4              EC02EC02550214021402",
            Description = "2dr1 Params (J command)",
            ExpectsAck = true,
            TimeoutSeconds = 10
        });

        // Comando O
        config.Commands.Add(new ProductionCommand
        {
            Payload = "O001",
            Description = "Clear log (O command)",
            ExpectsAck = true,
            TimeoutSeconds = 5
        });

        if (clearROM)
        {
            config.Commands.Add(new ProductionCommand
            {
                Payload = "T0REMOTE FIPLEX                 ",
                Description = "Reset tag (T command)",
                ExpectsAck = true,
                TimeoutSeconds = 5
            });
        }

        return config;
    }

    /// <summary>
    /// Configuración de producción para dispositivo 3dr.
    /// </summary>
    /// <remarks>
    /// Versión simplificada sin detección de commonUl en tiempo real.
    /// </remarks>
    private ProductionConfigData GetProductionConfig_3DR(double ndev, short nchannels, short mode, bool clearROM)
    {
        var config = new ProductionConfigData();

        // Configuración por defecto (commonUl = false)
        string configPayload = "C000000914003C000CB09C5518EF008000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC00FD5302A300FD5302A300FD5302A300FD5302A3E0005521EF008000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC00FD5302A300FD5302A300FD5302A300FD5302A3000914003C0001B09C5518EF00800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000000FD3002D000FD3002D000FD3002D000FD3002D0E0005521EF00800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000000FD3002D000FD3002D000FD3002D000FD3002D0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0FFFFFFFFB0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0FFFFFFFF00000001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000000000000000000";

        config.Commands.Add(new ProductionCommand
        {
            Payload = configPayload,
            Description = "3dr Config (C command)",
            ExpectsAck = true,
            TimeoutSeconds = 10
        });

        // Comando J para 3dr
        config.Commands.Add(new ProductionCommand
        {
            Payload = "J003E803E8000A03E803E8000A057E7F0000031F1F0C000003AB0878CF20005D7C080800080804080800000000405050405848484822414850080858080201580000015100000151000001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180External Input 1              External Input 2              External Input 3              External Input 4              EC02EC02550214021402",
            Description = "3dr Params (J command)",
            ExpectsAck = true,
            TimeoutSeconds = 10
        });

        // Comando O
        config.Commands.Add(new ProductionCommand
        {
            Payload = "O001",
            Description = "Clear log (O command)",
            ExpectsAck = true,
            TimeoutSeconds = 5
        });

        if (clearROM)
        {
            config.Commands.Add(new ProductionCommand
            {
                Payload = "T0REMOTE FIPLEX                 ",
                Description = "Reset tag (T command)",
                ExpectsAck = true,
                TimeoutSeconds = 5
            });
        }

        return config;
    }

    /// <summary>
    /// Configuración de producción para dispositivo 4dm1.
    /// </summary>
    private ProductionConfigData GetProductionConfig_4DM1(short nchannels, short mode, bool clearROM)
    {
        var config = new ProductionConfigData();

        config.Commands.Add(new ProductionCommand
        {
            Payload = "C0000100000914003C000CB09C5518EF00800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002800FCEA032A00FCEA032A00FD5302A300FD5302A3E0005518EF00800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002800FCEA032A00FCEA032A00FD5302A300FD5302A3000914003C0001B09C5518EF008000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD800FCD6031600FCD6031600FD3002D000FD3002D0E000551EEF008000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD800FCD6031600FCD6031600FD3002D000FD3002D0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0FFFFFFFFB0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0FFFFFFFF00000001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000000000000000000",
            Description = "4dm1 Config (C command)",
            ExpectsAck = true,
            TimeoutSeconds = 10
        });

        // Comando J para 4dm1
        config.Commands.Add(new ProductionCommand
        {
            Payload = "J0000103E803E8000A03E803E8000A057E7F0000031F1F0C000003ABAB48F33000027F080800080804080800000080405050405848484822414850080858080201580008045100000151000001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180External Input 1              External Input 2              External Input 3              Force RF OFF                  EC02EC02550214021402",
            Description = "4dm1 Params (J command)",
            ExpectsAck = true,
            TimeoutSeconds = 10
        });

        // Comando O
        config.Commands.Add(new ProductionCommand
        {
            Payload = "O001",
            Description = "Clear log (O command)",
            ExpectsAck = true,
            TimeoutSeconds = 5
        });

        if (clearROM)
        {
            config.Commands.Add(new ProductionCommand
            {
                Payload = "T0MASTER FIPLEX                 \t\t\t0100\t\t\t0200",
                Description = "Reset tag (T command)",
                ExpectsAck = true,
                TimeoutSeconds = 5
            });
        }

        return config;
    }

    /// <summary>
    /// Configuración de producción para dispositivo 4dm4.
    /// </summary>
    private ProductionConfigData GetProductionConfig_4DM4(short nchannels, short mode, bool clearROM)
    {
        var config = new ProductionConfigData();

        config.Commands.Add(new ProductionCommand
        {
            Payload = "C0000100000955003C000CB09C5518EF00810000288100002881000028810000288100002881000028810000288100002881000028810000288100002881000028810000288100002881000028810000288100002881000028810000288100002881000028810000288100002881000028810000288100002881000028810000288100002881000028810000288100002800FCEA032A00FCEA032A00FD5302A300FD5302A3E0005518EF00810000288100002881000028810000288100002881000028810000288100002881000028810000288100002881000028810000288100002881000028810000288100002881000028810000288100002881000028810000288100002881000028810000288100002881000028810000288100002881000028810000288100002800FCEA032A00FCEA032A00FD5302A300FD5302A3000955003C0001B09C5418EF008100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD800FCD6031600FCD6031600FD3002D000FD3002D0E000541EEF008100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD800FCD6031600FCD6031600FD3002D000FD3002D0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0FFFFFFFFB0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0FFFFFFFF00000001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000000000000000000",
            Description = "4dm4 Config (C command)",
            ExpectsAck = true,
            TimeoutSeconds = 10
        });

        // Comando J para 4dm4
        config.Commands.Add(new ProductionCommand
        {
            Payload = "J0000103E803E8000A03E803E8000A057E7F0000031F1F0C000003ABAB48FF30007F7F080800080804080800000080405050405848484822414850080858080201580008045100000151000001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180External Input 1              External Input 2              External Input 3              Force RF OFF                  EC02EC02550214021402",
            Description = "4dm4 Params (J command)",
            ExpectsAck = true,
            TimeoutSeconds = 10
        });

        // Comando O
        config.Commands.Add(new ProductionCommand
        {
            Payload = "O001",
            Description = "Clear log (O command)",
            ExpectsAck = true,
            TimeoutSeconds = 5
        });

        if (clearROM)
        {
            config.Commands.Add(new ProductionCommand
            {
                Payload = "T0BDA FIPLEX                    \t\t\t0100\t\t\t0200",
                Description = "Reset tag (T command)",
                ExpectsAck = true,
                TimeoutSeconds = 5
            });
        }

        return config;
    }

    /// <summary>
    /// Configuración de producción para dispositivo 5dm.
    /// </summary>
    /// <remarks>
    /// Versión simplificada sin detección de commonUl/MMS en tiempo real.
    /// </remarks>
    private ProductionConfigData GetProductionConfig_5DM(double ndev, short nchannels, short mode, bool clearROM)
    {
        var config = new ProductionConfigData();

        // Configuración por defecto (commonUl = false, MMS = false)
        string configPayload;
        string jPayload;

        if (ndev < 1)
        {
            // Versión sin commonUl
            configPayload = "C0000100000914003C000CB09C5518EF00810000288100002881000028810000288100002881000028810000288100002881000028810000288100002881000028810000288100002881000028810000288100002881000028810000288100002881000028810000288100002881000028810000288100002881000028810000288100002881000028810000288100002800FD5302A300FD5302A300FD5302A300FD5302A3E0005518EF00810000288100002881000028810000288100002881000028810000288100002881000028810000288100002881000028810000288100002881000028810000288100002881000028810000288100002881000028810000288100002881000028810000288100002881000028810000288100002881000028810000288100002800FCEA032A00FCEA032A00FCEA032A00FCEA032A000914003C0001B09C5518EF008100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD800FD3002D000FD3002D000FD3002D000FD3002D0E000551EEF008100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD800FCD6031600FCD6031600FCD6031600FCD60316B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0FFFFFFFFFFFFFFFFB0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0FFFFFFFFFFFFFFFF000000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800003FF000000000000";
            jPayload = "J0000103E803E8000A03E803E8000A057E7F0000031F1F0C000003ABAB08F320FF227F080800080804080800000080000000000808080808080808080808080201080008045100000151000001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180External Input 1              External Input 2              External Input 3              Force RF OFF/Remote Ext.Input EC02EC02EC02EC02EC02EC02EC02EC025502";
        }
        else
        {
            // Versión >= 1 sin commonUl, sin MMS
            configPayload = "C0000100000914003C000CB09C5518EF00810000288100002881000028810000288100002881000028810000288100002881000028810000288100002881000028810000288100002881000028810000288100002881000028810000288100002881000028810000288100002881000028810000288100002881000028810000288100002881000028810000288100002800FD5302A300FD5302A300FD5302A300FD5302A3E0005525EF00810000288100002881000028810000288100002881000028810000288100002881000028810000288100002881000028810000288100002881000028810000288100002881000028810000288100002881000028810000288100002881000028810000288100002881000028810000288100002881000028810000288100002800FCEA032A00FCEA032A00FCEA032A00FCEA032A000914003C0001909C5518EF008100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD800FD3002D000FD3002D000FD3002D000FD3002D0E0005525EF008100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD800FCD6031600FCD6031600FCD6031600FCD60316B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0FFFFFFFFFFFFFFFFB0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0FFFFFFFFFFFFFFFF000000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800003D7000000000000010";
            jPayload = "J0000103E803E8000A03E803E8000A057E7F0000031F1F0C000003ABAB00F300FF2203080800080804080880808080000000000808080808080808080808080201080008040000000000000001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180External Input 1              External Input 2              External Input 3              Force RF OFF/Remote Ext.Input EC02EC02EC02EC02EC02EC02EC02EC0255020100F0FF0F00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000151800000000000000000000000000000000151800001518000015180000151800001518000015180Annunciator 1                 Annunciator 2                 Annunciator 3                 Annunciator 4                 ";
        }

        config.Commands.Add(new ProductionCommand
        {
            Payload = configPayload,
            Description = "5dm Config (C command)",
            ExpectsAck = true,
            TimeoutSeconds = 10
        });

        config.Commands.Add(new ProductionCommand
        {
            Payload = jPayload,
            Description = "5dm Params (J command)",
            ExpectsAck = true,
            TimeoutSeconds = 10
        });

        // Comando O - 5dm usa O000 para clear log individual
        config.Commands.Add(new ProductionCommand
        {
            Payload = "O000",
            Description = "Clear log (O command)",
            ExpectsAck = true,
            TimeoutSeconds = 5
        });

        if (clearROM)
        {
            config.Commands.Add(new ProductionCommand
            {
                Payload = "T0MASTER FIPLEX                 ",
                Description = "Reset tag (T command)",
                ExpectsAck = true,
                TimeoutSeconds = 5
            });
        }

        return config;
    }

    /// <summary>
    /// Configuración de producción para dispositivos 2dm/2dm1.
    /// </summary>
    private ProductionConfigData GetProductionConfig_2DM(string tdev, short nchannels, short mode, bool clearROM)
    {
        var config = new ProductionConfigData();

        // Comando C para 2dm/2dm1
        config.Commands.Add(new ProductionCommand
        {
            Payload = "C000000914003C000CB09C5518E3008000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC00FD5302A300FD5302A300FD5302A300FD5302A3E0005521E3008000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC00FD5302A300FD5302A300FD5302A300FD5302A3000914003C000CB09C5518E3008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000000FD3002D000FD3002D000FD3002D000FD3002D0E0005521E3008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000000FD3002D000FD3002D000FD3002D000FD3002D0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0FFFFFFFFB0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0FFFFFFFF0000000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000\tF001EC21EC210000000F-F001ED21ED210000000F-F001EE21EE210000000F-F001EF21EF210000000F-F001F021F0210000000F-F001F121F1210000000F-F001F221F2210000000F-F001F321F3210000000F",
            Description = "2dm Config (C command)",
            ExpectsAck = true,
            TimeoutSeconds = 10
        });

        // Comando J - diferente para 2dm vs 2dm1
        string jPayload = tdev == "2dm"
            ? "J003E803E8000A03E803E8000A057E7F0000031F1F0C000003ABAB387F7D3F0000000808000208020400080008485151005C48484828484850800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180Laser Fail                    Photodiode Fail               Door Open                     Force RF OFF                  02680852000828200800200070201845External Input 1              External Input 2              External Input 3              External Input 4              \t6F4500-6F4500-6F4500-6F4500-6F4500-6F4500-6F4500-6F4500"
            : "J003E803E8000A03E803E8000A057E7F0000031F1F0C000003ABAB387F7D0F0F00000808000208020400080008485151005048484828C0C0D08008080808000000000001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180External Input 1              External Input 2              External Input 3              Force RF OFF                  02680852000828000800200070201800External Input 1              External Input 2              External Input 3              External Input 4              \t6F8500-6F8500-6F8500-6F8500-6F8500-6F8500-6F8500-6F8500";

        config.Commands.Add(new ProductionCommand
        {
            Payload = jPayload,
            Description = $"{tdev} Params (J command)",
            ExpectsAck = true,
            TimeoutSeconds = 10
        });

        // Comando O
        config.Commands.Add(new ProductionCommand
        {
            Payload = "O001",
            Description = "Clear log (O command)",
            ExpectsAck = true,
            TimeoutSeconds = 5
        });

        // Comando !0 para 2dm - clear EEPROM
        config.Commands.Add(new ProductionCommand
        {
            Payload = "!0" + new string(' ', 700),
            Description = "Clear EEPROM (! command)",
            ExpectsAck = true,
            TimeoutSeconds = 10
        });

        if (clearROM)
        {
            config.Commands.Add(new ProductionCommand
            {
                Payload = "T0MASTER FIPLEX                 " + new string(' ', 240),
                Description = "Reset tag (T command)",
                ExpectsAck = true,
                TimeoutSeconds = 5
            });
        }

        return config;
    }

    /// <summary>
    /// Configuración de producción para dispositivo 3c.
    /// </summary>
    /// <remarks>
    /// Versión simplificada sin detección MMS en tiempo real.
    /// </remarks>
    private ProductionConfigData GetProductionConfig_3C(double ndev, short nchannels, short mode, bool clearROM)
    {
        var config = new ProductionConfigData();

        string configPayload;
        string jPayload;

        if (ndev < 1)
        {
            // Versión 0.x
            configPayload = "C000000914003C000CB09C5518E3008000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002800FCEA032A00FCEA032A00FE7AFFBA00000A014AE0005518E3008000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002800FCEA032A00FCEA032A00FE7AFFBA00000A014A000914003C0001B09C5518E3008000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD800FCD6031600FCD6031600FD26FE6600FEB6FFF6E0005521E3008000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD800FCD6031600FCD6031600FD26FE6600FEB6FFF6B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B09292B0B0A6A6FFFFFFFFB0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B09292B0B0A6A6FFFFFFFF00000001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180";
            jPayload = "J003E803E8000A03E803E8000A057E7F0000031F1F0C000003ABAB38FF30FFFF00000808000C08000404000000C05050405C48484828424158480001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180External Input 1              External Input 2              External Input 3              Force RF OFF                  ";
        }
        else
        {
            // Versión 1.x+ (sin MMS por defecto)
            configPayload = "C000000914003C000CB09C5518EF00810000288100002881000028810000288100002881000028810000288100002881000028810000288100002881000028810000288100002881000028810000288100002881000028810000288100002881000028810000288100002881000028810000288100002881000028810000288100002881000028810000288100002800FCEA032A00FCEA032A00FCEA032A00FCEA032AE0005518EF00810000288100002881000028810000288100002881000028810000288100002881000028810000288100002881000028810000288100002881000028810000288100002881000028810000288100002881000028810000288100002881000028810000288100002881000028810000288100002881000028810000288100002800FCEA032A00FCEA032A00FCEA032A00FCEA032A000148100F358B09C5518EF008100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD800FCD6031600F9B6FFF600F9B6FFF600F9B6FFF6E000551EEF008100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD800FCD6031600FCD6031600FCD6031600FCD60316B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0FFFFFFFFB0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0FFFFFFFF00000001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180";
            jPayload = "J003E803E8000A03E803E8000A057E7F0000031F1F0C000003ABAB00FF30FFFFFFFFFF0F08080000080004040000000000000000080808080201080801020408808080800480808080808080000000000000000000000F00000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180External Input 1              External Input 2              External Input 3              Force RF OFF                  Annunciator 1                 Annunciator 2                 Annunciator 3                 Annunciator 4                 ";
        }

        config.Commands.Add(new ProductionCommand
        {
            Payload = configPayload,
            Description = "3c Config (C command)",
            ExpectsAck = true,
            TimeoutSeconds = 10
        });

        config.Commands.Add(new ProductionCommand
        {
            Payload = jPayload,
            Description = "3c Params (J command)",
            ExpectsAck = true,
            TimeoutSeconds = 10
        });

        // Comando O
        config.Commands.Add(new ProductionCommand
        {
            Payload = "O001",
            Description = "Clear log (O command)",
            ExpectsAck = true,
            TimeoutSeconds = 5
        });

        // Comando !0 para 3c
        config.Commands.Add(new ProductionCommand
        {
            Payload = "!0" + new string(' ', 700),
            Description = "Clear EEPROM (! command)",
            ExpectsAck = true,
            TimeoutSeconds = 10
        });

        if (clearROM)
        {
            config.Commands.Add(new ProductionCommand
            {
                Payload = "T0BDA FIPLEX                    ",
                Description = "Reset tag (T command)",
                ExpectsAck = true,
                TimeoutSeconds = 5
            });
        }

        return config;
    }

    /// <summary>
    /// Configuración de producción para dispositivos 3dm/3dm1.
    /// </summary>
    private ProductionConfigData GetProductionConfig_3DM(string tdev, short nchannels, short mode, bool clearROM)
    {
        var config = new ProductionConfigData();

        // Comando C para 3dm/3dm1
        config.Commands.Add(new ProductionCommand
        {
            Payload = "C000000914003C000CB09C5518E3008000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002800FCEA032A00FCEA032A00FE7AFFBA00000A014AE0005518E3008000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002800FCEA032A00FCEA032A00FE7AFFBA00000A014A000914003C0001B09C5518E3008000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD800FCD6031600FCD6031600FD26FE6600FEB6FFF6E0005521E3008000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD800FCD6031600FCD6031600FD26FE6600FEB6FFF6B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0FFFFFFFFB0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0FFFFFFFF0000000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000\tF001EC21EC210000000F-F001ED21ED210000000F-F001EE21EE210000000F-F001EF21EF210000000F-F001F021F0210000000F-F001F121F1210000000F-F001F221F2210000000F-F001F321F3210000000F",
            Description = "3dm Config (C command)",
            ExpectsAck = true,
            TimeoutSeconds = 10
        });

        // Comando J - diferente para 3dm vs 3dm1
        string jPayload = tdev == "3dm"
            ? "J003E803E8000A03E803E8000A057E7F0000031F1F0C000003ABAB38FF7F3F0000000808000208020404080808485151005C48484828484850C80001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180Laser Fail                    Photodiode Fail               Door Open                     Force RF OFF                  6208680258080800280800100060587FExternal Input 1              External Input 2              External Input 3              External Input 4              \t7F4700-7F4700-7F4700-7F4700-7F4700-7F4700-7F4700-7F4700"
            : "J003E803E8000A03E803E8000A057E7F0000031F1F0C000003ABAB38FF7F0F0F00000808000208020404080808485151005048484828C0C0D0C008080808000000000001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180External Input 1              External Input 2              External Input 3              Force RF OFF                  6208680258080800280800100060587FExternal Input 1              External Input 2              External Input 3              External Input 4              \t7F4700-7F4700-7F4700-7F4700-7F4700-7F4700-7F4700-7F4700";

        config.Commands.Add(new ProductionCommand
        {
            Payload = jPayload,
            Description = $"{tdev} Params (J command)",
            ExpectsAck = true,
            TimeoutSeconds = 10
        });

        // Comando O
        config.Commands.Add(new ProductionCommand
        {
            Payload = "O001",
            Description = "Clear log (O command)",
            ExpectsAck = true,
            TimeoutSeconds = 5
        });

        // Comando !0 para 3dm
        config.Commands.Add(new ProductionCommand
        {
            Payload = "!0" + new string(' ', 700),
            Description = "Clear EEPROM (! command)",
            ExpectsAck = true,
            TimeoutSeconds = 10
        });

        if (clearROM)
        {
            config.Commands.Add(new ProductionCommand
            {
                Payload = "T0MASTER FIPLEX                 " + new string(' ', 240),
                Description = "Reset tag (T command)",
                ExpectsAck = true,
                TimeoutSeconds = 5
            });
        }

        return config;
    }

    /// <summary>
    /// Configuración de producción para dispositivo 1de (Expansor).
    /// Solo envía comando T para tag reset.
    /// </summary>
    private ProductionConfigData GetProductionConfig_1DE(double ndev, short nchannels, short mode, bool clearROM)
    {
        var config = new ProductionConfigData();

        // Para 1de, solo se usa clearROM que envía el tag
        // Si no es clearROM, no hay configuración disponible para expansor
        if (!clearROM)
        {
            _logger.LogDebug("1de (Expansor) only supports clearROM operation");
            return config;
        }

        // Tag para 1de según versión
        string tagPayload = (int)ndev == 1
            ? "T0EXPANS FIPLEX  0.0 0.0        "
            : "T0EXPANSION FIPLEX              ";

        config.Commands.Add(new ProductionCommand
        {
            Payload = tagPayload,
            Description = "1de Tag reset (T command)",
            ExpectsAck = true,
            TimeoutSeconds = 5
        });

        // Para 1de v1, hay umbral adicional
        if ((int)ndev == 1)
        {
            config.Commands.Add(new ProductionCommand
            {
                Payload = "U0E702E702E702E702E702E702E702E702500A",
                Description = "1de Thresholds (U command)",
                ExpectsAck = true,
                TimeoutSeconds = 5
            });
        }

        return config;
    }

    #endregion

    private async void frmMain2_FormClosing(object sender, FormClosingEventArgs e)
    {
        _logger.LogInformation("Form closing");

        try
        {
            _scanCts?.Cancel();

            if (_serialPort.IsOpen)
            {
                await DisconnectAsync();
            }

            await _pipeline.StopAsync();

            _logger.LogInformation("Cleanup complete");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during cleanup");
        }
    }
}
