using Fiplex.Control.Software.WinForms.Core.Commands.Interfaces;
using Fiplex.Control.Software.WinForms.Core.Commands;
using Fiplex.Control.Software.WinForms.Core.Diagnostics;
using Fiplex.Control.Software.WinForms.Core.Config.Interfaces;
using Fiplex.Control.Software.WinForms.Core.Config;
using Fiplex.Control.Software.WinForms.Core.Configuration;
using Fiplex.Control.Software.WinForms.Core.Configuration.Interfaces;
using Fiplex.Control.Software.WinForms.Core.Devices;
using Fiplex.Control.Software.WinForms.Core.Devices.Interfaces;
using Fiplex.Control.Software.WinForms.Core.Http;
using Fiplex.Control.Software.WinForms.Core.Http.Interfaces;
using Fiplex.Control.Software.WinForms.Core.Security.Interfaces;
using Fiplex.Control.Software.WinForms.Core.Serial.Implementation;
using Fiplex.Control.Software.WinForms.Core.Serial.Interfaces;
using Fiplex.Control.Software.WinForms.Core.Serial.Models;
using Fiplex.Control.Software.WinForms.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;
using System.Reflection;
using System.Text.Json;

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
    private bool _scanInProgress;
    private CancellationTokenSource? _scanCts;
    private CancellationTokenSource? _cts;
    private SessionContext _sessionContext = new();
    private bool _httpServerIsRunning = false;
    private int _httpPort = 8000;
    private string? _sessionToken;
    private DevelopmentModeSettings? _devModeSettings;
    private Form? _filterInfoPopupForm;
    private WebView2? _filterInfoPopupWebView;

    // Current device configuration (FILE commands)
    private DeviceConfiguration? _currentDeviceConfig;
    private bool _waitingLF = false;
    private short _chTestActivated = -1;
    private string _confSCA = "";
    private bool _pendingAnswer = false;

    private short _cntmode = 0;
    private readonly MouseButtons[] _eButton = [MouseButtons.Right, MouseButtons.Right, MouseButtons.Left];

    private char _serialFirstChar = '\0';
    private char _versionFirstChar = '\0';

    // Tracks whether the window has been maximized on first connection (resets on disconnect)
    private bool _hasMaximized = false;

    private SerialTraceLogger _traceLogger = null!;
    private AppLogLevelSwitch _appLogSwitch = null!;
    private PortQuarantine _portQuarantine = null!;

    private System.Windows.Forms.Timer? _portHealthTimer;

    // INIT-011: status bar severity model. _currentState holds the last STATE
    // message (the persistent baseline the bar reverts to when a transient
    // Info/Success/Warning message expires). _statusRevertTimer drives the revert.
    private string _currentState = "Ready";
    private System.Windows.Forms.Timer? _statusRevertTimer;

    // Validated password for INVALID CREDENTIALS retries
    private string? _validatedPassword;

    // Set when user explicitly cancels the password dialog (vs wrong password)
    private bool _userCancelledAuth;

    // Guards against opening a second password dialog while ConnectAsync auth is already
    // in progress. The pipeline calls OnPipelineCredentialsRequired when the device returns
    // INVALID CREDENTIALS — including during *0{password} attempts — which would otherwise
    // open a second frmPassword while the first is still waiting for the serial response.
    private bool _authDialogOpen;

    // Set during production tests (Clear EEPROM, 1CH, 2CH, etc.) to prevent
    // base.js reload from cancelling in-progress pipeline commands.
    private bool _productionTestInProgress;

    // VB 1.9 parity: last-used calibration file paths (retained across saves/loads)
    private string? _lastCalSavePath;
    private string? _lastCalLoadPath;

    // Default page path for initial load and disconnection
    // Used when no device is connected or when executing Disconnect
    private static readonly string DefaultPagePath = Path.Combine(
        AppDomain.CurrentDomain.BaseDirectory,
        "pages", "htdocs_default", "index.html");

    // Software version to display in About > SW Info
    // Uses InformationalVersion to include semantic suffix (-alpha, -beta, etc.)
    // Split('+')[0] removes the Git hash that .NET adds automatically
    private static readonly string SoftwareVersion =
        (Assembly.GetExecutingAssembly()
            .GetCustomAttribute<AssemblyInformationalVersionAttribute>()
            ?.InformationalVersion ?? "3.8.1")
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
        ILogger<frmMain> logger,
        SerialTraceLogger traceLogger,
        AppLogLevelSwitch appLogSwitch,
        PortQuarantine portQuarantine)
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
        _traceLogger = traceLogger;
        _appLogSwitch = appLogSwitch;
        _portQuarantine = portQuarantine;

        InitializeComponent();

        // Route pipeline TX/RX/ACK events to trace logger. Suppressed during scan (I1 is logged
        // via PortScanTrace as COM{N} Nretry=n ans=... — VB 1.9 parity).
        // AckDiagnostic: only log "Rx0 ACK"/"Rx0 NACK" (normal flow). "---" prefix = error diagnostics, not in VB 1.9.
        _pipeline.TxDiagnostic  += (msg) => { if (_traceLogger.IsEnabled && !_scanInProgress) _traceLogger.Log(msg); };
        _pipeline.RxDiagnostic  += (msg) => { if (_traceLogger.IsEnabled && !_scanInProgress) _traceLogger.Log(msg); };
        _pipeline.AckDiagnostic += (msg) => { if (_traceLogger.IsEnabled && !_scanInProgress && !msg.StartsWith("---")) _traceLogger.Log(msg); };

        // Route scan port results to trace logger — VB 1.9 parity: "COM8 Nretry=0 ans=Fiplex..."
        _discovery.PortScanTrace += (msg) => { if (_traceLogger.IsEnabled) _traceLogger.Log(msg); };

        // VB 1.9 sized cmbCOM manually in frmMain_Resize (ClientWidth - 16).
        // Dock.Fill and Anchor.Right both conflict with the native Win32 ComboBox HWND,
        // producing a split rendering (two visible dropdown arrows). Use no Anchor.Right
        // and replicate VB 1.9's explicit OnResize sizing instead.
        cmbCOM.Dock = DockStyle.None;
        cmbCOM.Anchor = AnchorStyles.Left | AnchorStyles.Top;
        cmbCOM.FlatStyle = FlatStyle.Standard;

        // Configure Debug/Tools menu for logging and diagnostics
        ConfigureDebugMenu();
        ConfigureLogMenu();

        // Load development mode configuration
        _devModeSettings = _configuration
            .GetSection("DevelopmentMode")
            .Get<DevelopmentModeSettings>();

        if (_devModeSettings?.NoUSB == true)
        {
            _logger.LogWarning(
                "?? DEVELOPMENT MODE ACTIVE (noUSB=true) - Simulated device: {Device}",
                _devModeSettings.SimulatedDevice);
        }

        InitializeAsync();

        // Subscribe to HTTP event to process commands
        _httpServer.CommandReceived += OnHttpCommandReceived;

        // Subscribe to BaseJsLoaded event to clear pending commands
        // when loading base.js, avoiding orphan commands
        _httpServer.BaseJsLoaded += OnHttpServerBaseJsLoaded;

        // Subscribe to pipeline credentials required event
        // This allows automatic retry when device responds with INVALID CREDENTIALS
        _pipeline.CredentialsRequired += OnPipelineCredentialsRequired;

        // Subscribe to COM selection change event
        cmbCOM.SelectedIndexChanged += cmbCOM_SelectedIndexChanged;

        // Subscribe to CLSS menu events
        LogoutToolStripMenuItem.Click += LogoutToolStripMenuItem_Click;
        SubscriptionInformationToolStripMenuItem.Click += SubscriptionInformationToolStripMenuItem_Click;

        // Factory mode activation: mirrors VB 1.9 cmdRefresh_MouseDown / cmdRefresh_KeyPress
        cmdRefresh.MouseDown += cmdRefresh_MouseDown;
        cmdRefresh.KeyPress += cmdRefresh_KeyPress;
    }

    /// <summary>
    /// Gets an available TCP port in the specified range
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
                // Port busy, continue with next one
            }
        }

        throw new InvalidOperationException(
            $"No available ports found between {startPort} and {endPort}");
    }

    private async void InitializeAsync()
    {
        try
        {
            // Assign software version to About > SW Info menu
            mnuSWver.Text = SoftwareVersion;

            LogStatus("Initializing services...");

            await _catalog.LoadCatalogAsync();
            await _pipeline.StartAsync();

            // Read CLSS token information
            await _trainingValidation.ReadTokenInformationAsync();

            // Show license status in lbldaysRemaining
            lbldaysRemaining.Text = _trainingValidation.GetStatusMessage();

            // Validate training and configure cmdConnect
            ValidateTrainingAndUpdateUI();


            _sessionContext = _sessionContext with { State = ConnectionState.Disconnected };

            // Initialize WebView2
            await InitializeWebView2Async();

            // Check for updates in background without blocking UI
            await CheckForUpdatesAsync();

            // Quick scan for devices when form loads
            // Stops when first valid device is found (QuickScan)
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
    /// Validates training status and updates UI accordingly.
    /// </summary>
    /// <remarks>
    /// If training is valid, enables the connection button.
    /// If expired, disables button and shows informative tooltip.
    /// </remarks>
    private void ValidateTrainingAndUpdateUI()
    {
        if (_trainingValidation.IsTrainingValid)
        {
            // Training valid: enable connection
            // Note: cmdConnect.Enabled also depends on having devices in the list
            ToolTip1.SetToolTip(cmdConnect, "");
            _logger.LogDebug("Training valid, connection enabled. Days remaining: {Days}",
                _trainingValidation.DaysRemaining);
        }
        else
        {
            // Training expired: disable connection and show tooltip
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
    /// Configures the Debug/Tools menu for logging and diagnostics.
    /// Adds options to enable/disable HTTP command logging.
    /// The menu is only shown if FeatureFlags:EnableDebugMenu is enabled in appsettings.json.
    /// </summary>
    private void ConfigureDebugMenu()
    {
        // Check if Debug menu is enabled in configuration
        var enableDebugMenu = _configuration.GetValue<bool>("FeatureFlags:EnableDebugMenu");

        if (!enableDebugMenu)
        {
            _logger.LogDebug("Debug menu disabled by configuration (FeatureFlags:EnableDebugMenu = false)");
            return;
        }

        // Create Debug menu
        var mnuDebug = new ToolStripMenuItem("&Debug");

        // Option: Enable HTTP Command Logging
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

        // Separator
        mnuDebug.DropDownItems.Add(new ToolStripSeparator());

        // Option: Open Log Directory
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

        // Add to main menu
        MainMenu1.Items.Add(mnuDebug);

        _logger.LogDebug("Debug menu configured");
    }

    private void ConfigureLogMenu()
    {
        var mnuLog = new ToolStripMenuItem("LOG");

        ToolStripMenuItem[] levelItems =
        [
            new ToolStripMenuItem("Warning + Error"),
            new ToolStripMenuItem("Info"),
            new ToolStripMenuItem("Debug"),
            new ToolStripMenuItem("Trace"),
        ];

        Microsoft.Extensions.Logging.LogLevel[] levels =
        [
            Microsoft.Extensions.Logging.LogLevel.Warning,
            Microsoft.Extensions.Logging.LogLevel.Information,
            Microsoft.Extensions.Logging.LogLevel.Debug,
            Microsoft.Extensions.Logging.LogLevel.Trace,
        ];

        void UpdateChecks()
        {
            for (int i = 0; i < levels.Length; i++)
                levelItems[i].Checked = _appLogSwitch.CurrentLevel == levels[i];
        }

        for (int i = 0; i < levelItems.Length; i++)
        {
            var level = levels[i];
            levelItems[i].Click += (_, _) =>
            {
                _appLogSwitch.SetLevel(level);
                UpdateChecks();
                UpdateWindowTitle();
            };
            mnuLog.DropDownItems.Add(levelItems[i]);
        }

        _appLogSwitch.LevelChanged += (_, _) => UpdateChecks();

        MainMenu1.Items.Add(mnuLog);
        UpdateChecks();
        UpdateWindowTitle();
    }

    private void UpdateWindowTitle()
    {
        Text = $"Fiplex Control Software {SoftwareVersion}  {_appLogSwitch.DisplayLabel}";
    }

    private async Task InitializeWebView2Async()
    {
        try
        {
            await webView.EnsureCoreWebView2Async();

            // Configure navigation events
            webView.CoreWebView2.NavigationStarting += CoreWebView2_NavigationStarting;
            webView.CoreWebView2.NavigationCompleted += CoreWebView2_NavigationCompleted;
            webView.CoreWebView2.NewWindowRequested += CoreWebView2_NewWindowRequested;
            webView.CoreWebView2.DownloadStarting += CoreWebView2_DownloadStarting;

            // Disable features we don't need
            webView.AllowExternalDrop = false;

            // Configure local content permissions
            webView.CoreWebView2.Settings.IsScriptEnabled = true;
            webView.CoreWebView2.Settings.AreDefaultScriptDialogsEnabled = true;
            webView.CoreWebView2.Settings.IsWebMessageEnabled = true;
            webView.CoreWebView2.Settings.AreDevToolsEnabled = true;
            webView.CoreWebView2.Settings.IsStatusBarEnabled = false;

            _logger.LogInformation("WebView2 initialized successfully");

            // Navigate to default page on initial load
            await NavigateToDefaultPageAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "WebView2 initialization failed");
            MessageBox.Show($"WebView2 initialization failed: {ex.Message}", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }

    /// <summary>
    /// Navigates to the default page (htdocs_default/index.html).
    /// Used on form initial load and when executing Disconnect.
    /// </summary>
    private async Task NavigateToDefaultPageAsync()
    {
        if (webView?.CoreWebView2 == null)
        {
            _logger.LogWarning("WebView2 not initialized, cannot navigate to default page");
            return;
        }

        try
        {
            if (File.Exists(DefaultPagePath))
            {
                var defaultUrl = new Uri(DefaultPagePath).AbsoluteUri;
                webView.CoreWebView2.Navigate(defaultUrl);
                _logger.LogInformation("Navigating to default page: {Url}", defaultUrl);
            }
            else
            {
                _logger.LogWarning("Default page not found: {Path}", DefaultPagePath);
                webView.CoreWebView2.Navigate("about:blank");
            }

            // Small pause to ensure navigation completes
            await Task.Delay(50);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error navigating to default page");
        }
    }

    private void CoreWebView2_NewWindowRequested(object? sender, CoreWebView2NewWindowRequestedEventArgs e)
    {
        e.Handled = true;

        try
        {
            if (!string.IsNullOrWhiteSpace(e.Uri) &&
                Uri.TryCreate(e.Uri, UriKind.Absolute, out var popupUri) &&
                IsFilterInfoPopupUri(popupUri))
            {
                _ = ShowFilterInfoPopupAsync(e.Uri);
                return;
            }

            // Bug #1 fix: WebView2/Chromium fires NewWindowRequested for target="content" from a subframe.
            // Navigate the named frame via JS to keep the frameset intact.
            if (e.Name == "content" &&
                !string.IsNullOrWhiteSpace(e.Uri) &&
                Uri.TryCreate(e.Uri, UriKind.Absolute, out var frameNavUri) &&
                frameNavUri.IsLoopback &&
                webView?.CoreWebView2 != null)
            {
                var safeUri = e.Uri.Replace("\\", "\\\\").Replace("'", "\\'");
                _ = webView.CoreWebView2.ExecuteScriptAsync(
                    $"(function(){{var f=top.frames['content'];if(f)f.location.href='{safeUri}';}})();"
                );
                _logger.LogDebug("Frame navigation via JS: target='content' uri={Uri}", e.Uri);
                return;
            }

            // Filter Info / Filter Tool use window.open(...).
            // Ensure popup navigation keeps the in-session token to avoid 403 Forbidden.
            if (webView?.CoreWebView2 != null &&
                !string.IsNullOrWhiteSpace(_sessionToken) &&
                !string.IsNullOrWhiteSpace(e.Uri) &&
                Uri.TryCreate(e.Uri, UriKind.Absolute, out var loopbackPopupUri) &&
                loopbackPopupUri.IsLoopback)
            {
                var headers = $"X-Fiplex-Token: {_sessionToken}\r\n";
                var request = webView.CoreWebView2.Environment.CreateWebResourceRequest(
                    e.Uri,
                    "GET",
                    null,
                    headers);

                webView.CoreWebView2.NavigateWithWebResourceRequest(request);
                _logger.LogDebug("Popup navigation redirected with session token: {Uri}", e.Uri);
                return;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error handling popup navigation with token, fallback to normal navigation");
        }

        if (webView?.CoreWebView2 != null)
        {
            webView.CoreWebView2.Navigate(e.Uri);
        }
    }

    private static bool IsFilterInfoPopupUri(Uri popupUri)
    {
        return popupUri.IsLoopback &&
               (popupUri.AbsolutePath.EndsWith("/fhelp.html", StringComparison.OrdinalIgnoreCase) ||
                popupUri.AbsolutePath.EndsWith("/ftool.zhtml", StringComparison.OrdinalIgnoreCase));
    }

    private async Task ShowFilterInfoPopupAsync(string uri)
    {
        if (InvokeRequired)
        {
            BeginInvoke(new Action(() => _ = ShowFilterInfoPopupAsync(uri)));
            return;
        }

        try
        {
            EnsureFilterInfoPopupWindow();

            if (_filterInfoPopupForm == null || _filterInfoPopupWebView == null)
            {
                return;
            }

            await EnsureFilterInfoPopupWebViewInitializedAsync();

            NavigatePopupWithSessionToken(_filterInfoPopupWebView, uri);

            if (!_filterInfoPopupForm.Visible)
            {
                CenterFilterInfoPopup(_filterInfoPopupForm);
                _filterInfoPopupForm.Show(this);
            }

            _filterInfoPopupForm.BringToFront();
            _filterInfoPopupForm.Activate();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error showing floating Filter Info popup, falling back to main WebView navigation");

            if (webView?.CoreWebView2 != null)
            {
                NavigatePopupWithSessionToken(webView, uri);
            }
        }
    }

    private void EnsureFilterInfoPopupWindow()
    {
        if (_filterInfoPopupForm != null &&
            !_filterInfoPopupForm.IsDisposed &&
            _filterInfoPopupWebView != null &&
            !_filterInfoPopupWebView.IsDisposed)
        {
            return;
        }

        // Scale popup content area by DPI factor so WebView2 renders 820x520 CSS pixels
        // on any DPI setting, matching v1.9's window.open("height=520,width=820") viewport.
        var dpiScale = DeviceDpi / 96f;
        var popupClientW = (int)(820 * dpiScale);
        var popupClientH = (int)(520 * dpiScale);

        var popupForm = new Form
        {
            Owner = this,
            Text = "Filter Tool",
            StartPosition = FormStartPosition.Manual,
            ShowInTaskbar = false,
            FormBorderStyle = FormBorderStyle.SizableToolWindow,
            MinimizeBox = false,
            MaximizeBox = false,
            AutoScaleMode = AutoScaleMode.None,
            BackColor = Color.White,
            ClientSize = new Size(popupClientW, popupClientH),
            MinimumSize = new Size(popupClientW, popupClientH)
        };

        var popupWebView = new WebView2
        {
            Dock = DockStyle.Fill,
            Margin = Padding.Empty,
            DefaultBackgroundColor = Color.White
        };

        popupWebView.NavigationCompleted += FilterInfoPopupWebView_NavigationCompleted;

        popupForm.Controls.Add(popupWebView);
        popupForm.FormClosed += (_, _) =>
        {
            if (_filterInfoPopupWebView != null)
            {
                _filterInfoPopupWebView.NavigationCompleted -= FilterInfoPopupWebView_NavigationCompleted;
                _filterInfoPopupWebView.Dispose();
            }

            _filterInfoPopupWebView = null;
            _filterInfoPopupForm = null;
        };

        _filterInfoPopupForm = popupForm;
        _filterInfoPopupWebView = popupWebView;
    }

    private async Task EnsureFilterInfoPopupWebViewInitializedAsync()
    {
        if (_filterInfoPopupWebView?.CoreWebView2 != null)
        {
            return;
        }

        if (_filterInfoPopupWebView == null)
        {
            return;
        }

        await _filterInfoPopupWebView.EnsureCoreWebView2Async();

        _filterInfoPopupWebView.AllowExternalDrop = false;
        _filterInfoPopupWebView.CoreWebView2.Settings.IsScriptEnabled = true;
        _filterInfoPopupWebView.CoreWebView2.Settings.AreDefaultScriptDialogsEnabled = true;
        _filterInfoPopupWebView.CoreWebView2.Settings.AreDevToolsEnabled = false;
        _filterInfoPopupWebView.CoreWebView2.Settings.IsStatusBarEnabled = false;

        if (_httpServerIsRunning)
        {
            _filterInfoPopupWebView.CoreWebView2.AddWebResourceRequestedFilter(
                $"http://localhost:{_httpPort}/*", CoreWebView2WebResourceContext.All);
            _filterInfoPopupWebView.CoreWebView2.AddWebResourceRequestedFilter(
                $"http://127.0.0.1:{_httpPort}/*", CoreWebView2WebResourceContext.All);
        }

        _filterInfoPopupWebView.CoreWebView2.WebResourceRequested -= CoreWebView2_WebResourceRequested;
        _filterInfoPopupWebView.CoreWebView2.WebResourceRequested += CoreWebView2_WebResourceRequested;

        _filterInfoPopupWebView.CoreWebView2.WebMessageReceived -= FilterToolPopup_WebMessageReceived;
        _filterInfoPopupWebView.CoreWebView2.WebMessageReceived += FilterToolPopup_WebMessageReceived;
    }

    private void FilterToolPopup_WebMessageReceived(object? sender, CoreWebView2WebMessageReceivedEventArgs e)
    {
        try
        {
            var msg = e.TryGetWebMessageAsString();
            if (string.IsNullOrEmpty(msg) || !msg.StartsWith("ftool-apply:", StringComparison.Ordinal))
                return;

            var frmsJson = msg["ftool-apply:".Length..];
            if (string.IsNullOrWhiteSpace(frmsJson) || webView?.CoreWebView2 == null)
                return;

            // Clear the filterToolCheckApply flag to prevent navi.js polling from also
            // calling toolSubmit (would send C0 twice, leaving device in confused state).
            // Navigate to the status page first if the content frame is not already there —
            // toolSubmit is only defined when start.zhtml is loaded in the content frame.
            var script = $@"(function(){{try{{
                var ks=Object.keys(localStorage);
                for(var i=0;i<ks.length;i++){{
                    if(ks[i].indexOf('filterToolCheckApply')===0)localStorage.setItem(ks[i],'0');
                }}
                var frms={frmsJson};
                var cf=top.frames['content'];
                if(!cf)return;
                if(cf.startPage){{
                    cf.toolSubmit(frms);
                }}else{{
                    cf.location.href='start.zhtml';
                    setTimeout(function(){{top.frames['content'].toolSubmit(frms);}},3000);
                }}
            }}catch(e){{}}}})()" ;
            _ = webView.CoreWebView2.ExecuteScriptAsync(script);
            _logger.LogDebug("Filter Tool Apply Proposal relayed to content frame");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error relaying Filter Tool Apply Proposal to content frame");
        }
    }

    private void NavigatePopupWithSessionToken(WebView2 targetWebView, string uri)
    {
        if (targetWebView.CoreWebView2 != null &&
            !string.IsNullOrWhiteSpace(_sessionToken) &&
            Uri.TryCreate(uri, UriKind.Absolute, out var popupUri) &&
            popupUri.IsLoopback)
        {
            var headers = $"X-Fiplex-Token: {_sessionToken}\r\n";
            var request = targetWebView.CoreWebView2.Environment.CreateWebResourceRequest(
                uri,
                "GET",
                null,
                headers);

            targetWebView.CoreWebView2.NavigateWithWebResourceRequest(request);
            return;
        }

        targetWebView.CoreWebView2?.Navigate(uri);
    }

    private async void FilterInfoPopupWebView_NavigationCompleted(object? sender, CoreWebView2NavigationCompletedEventArgs e)
    {
        if (!e.IsSuccess || _filterInfoPopupWebView?.CoreWebView2 == null || _filterInfoPopupForm == null)
        {
            return;
        }

        try
        {
            // ftool.zhtml: fixed viewport matching v1.9 window.open("height=520,width=820").
            // Scaled by DPI so WebView2 renders exactly 820x520 CSS pixels regardless of display DPI.
            // Skip DOM measurement and CSS injection — designed for fhelp.html only.
            var source = _filterInfoPopupWebView.CoreWebView2.Source ?? string.Empty;
            if (source.Contains("/ftool.zhtml", StringComparison.OrdinalIgnoreCase))
            {
                var dpi = DeviceDpi / 96f;
                _filterInfoPopupForm.ClientSize = new Size((int)(820 * dpi), (int)(520 * dpi));
                CenterFilterInfoPopup(_filterInfoPopupForm);
                return;
            }

            await ApplyFilterInfoPopupLayoutAsync();
            await Task.Delay(150);
            await ApplyFilterInfoPopupLayoutAsync();
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Could not apply floating layout to Filter Info popup");
        }
    }

    private async Task ApplyFilterInfoPopupLayoutAsync()
    {
        if (_filterInfoPopupWebView?.CoreWebView2 == null || _filterInfoPopupForm == null)
        {
            return;
        }

        const string layoutScript = """
            (() => {
                const doc = document.documentElement;
                const body = document.body || doc;
                const styleId = 'fcs-filter-info-popup-style';

                if (!document.getElementById(styleId)) {
                    const style = document.createElement('style');
                    style.id = styleId;
                    style.textContent = `
                        html, body {
                            width: auto !important;
                            min-width: 0 !important;
                            overflow-y: auto !important;
                            overflow-x: hidden !important;
                            max-height: 100vh !important;
                            box-sizing: border-box;
                            margin: 0;
                        }

                        body {
                            padding-right: 12px;
                        }
                    `;
                    (document.head || body).appendChild(style);
                }

                const candidates = [body, ...Array.from(body.querySelectorAll('*'))];
                let minLeft = Number.POSITIVE_INFINITY;
                let maxRight = 0;

                for (const element of candidates) {
                    if (!(element instanceof HTMLElement)) {
                        continue;
                    }

                    const style = getComputedStyle(element);
                    if (style.display === 'none' || style.visibility === 'hidden') {
                        continue;
                    }

                    const rect = element.getBoundingClientRect();
                    if (rect.width < 2 || rect.height < 2) {
                        continue;
                    }

                    minLeft = Math.min(minLeft, rect.left);
                    maxRight = Math.max(maxRight, rect.right);
                }

                const measuredContentWidth = Number.isFinite(minLeft)
                    ? Math.max(0, maxRight - minLeft)
                    : 0;

                const width = Math.ceil(Math.max(
                    measuredContentWidth,
                    body.scrollWidth,
                    body.offsetWidth,
                    doc.scrollWidth,
                    doc.offsetWidth
                ));
                const height = Math.ceil(Math.max(body.scrollHeight, body.offsetHeight, doc.scrollHeight, doc.offsetHeight));

                return {
                    title: document.title || 'Filter Info',
                    width,
                    height
                };
            })();
            """;

        var metricsJson = await _filterInfoPopupWebView.CoreWebView2.ExecuteScriptAsync(layoutScript);
        using var metrics = JsonDocument.Parse(metricsJson);

        var root = metrics.RootElement;
        var contentWidth = root.TryGetProperty("width", out var widthProperty) ? widthProperty.GetInt32() : 840;
        var contentHeight = root.TryGetProperty("height", out var heightProperty) ? heightProperty.GetInt32() : 500;
        var title = root.TryGetProperty("title", out var titleProperty) ? titleProperty.GetString() : null;

        if (!string.IsNullOrWhiteSpace(title))
        {
            _filterInfoPopupForm.Text = title;
        }

        ResizeAndPositionFilterInfoPopup(contentWidth, contentHeight);
    }

    private void ResizeAndPositionFilterInfoPopup(int contentWidth, int contentHeight)
    {
        if (_filterInfoPopupForm == null)
        {
            return;
        }

        var hostBounds = webView.RectangleToScreen(webView.ClientRectangle);
        var chromeWidth = _filterInfoPopupForm.Width - _filterInfoPopupForm.ClientSize.Width;
        var chromeHeight = _filterInfoPopupForm.Height - _filterInfoPopupForm.ClientSize.Height;

        var maxPopupWidth = Math.Max(820, hostBounds.Width - 16);
        var desiredWidth = Math.Clamp(contentWidth + chromeWidth + 32, 820, maxPopupWidth);

        var maxPopupHeight = Math.Max(520, hostBounds.Height - 16);
        var desiredHeight = Math.Clamp(contentHeight + chromeHeight + 16, 520, maxPopupHeight);

        _filterInfoPopupForm.Size = new Size(desiredWidth, desiredHeight);
        CenterFilterInfoPopup(_filterInfoPopupForm);
    }

    private void CenterFilterInfoPopup(Form popupForm)
    {
        var hostBounds = webView.RectangleToScreen(webView.ClientRectangle);
        var x = hostBounds.Left + Math.Max(0, (hostBounds.Width - popupForm.Width) / 2);
        var y = hostBounds.Top + Math.Max(0, (hostBounds.Height - popupForm.Height) / 2);

        popupForm.Location = new Point(x, y);
    }

    private void CoreWebView2_DownloadStarting(object? sender, Microsoft.Web.WebView2.Core.CoreWebView2DownloadStartingEventArgs e)
    {
        // Suppress default Chromium download notification (floats outside the app window)
        // and show a WinForms SaveFileDialog instead — VB 1.9 parity.
        e.Handled = true;

        var suggestedName = Path.GetFileName(e.DownloadOperation.ResultFilePath);
        var ext = Path.GetExtension(suggestedName).TrimStart('.');

        var filter = ext.Length > 0
            ? $"{ext.ToUpper()} files (*.{ext})|*.{ext}|All files (*.*)|*.*"
            : "All files (*.*)|*.*";

        using var dlg = new SaveFileDialog
        {
            FileName = suggestedName,
            Filter = filter,
            Title = "Save file"
        };

        if (dlg.ShowDialog(this) == DialogResult.OK)
        {
            e.ResultFilePath = dlg.FileName;
        }
        else
        {
            e.Cancel = true;
        }
    }

    private void CoreWebView2_NavigationStarting(object? sender, CoreWebView2NavigationStartingEventArgs e)
    {
        // Placeholder for validations
    }

    private void CoreWebView2_NavigationCompleted(object? sender, CoreWebView2NavigationCompletedEventArgs e)
    {
        if (!e.IsSuccess)
        {
            SetStatus($"Navigation error: {e.WebErrorStatus}", StatusSeverity.Error);
        }
    }

    /// <summary>
    /// Injects the session token header into every WebView2 request to the embedded HTTP server.
    /// </summary>
    /// <remarks>
    /// This prevents external browsers from accessing the server since they cannot provide the token.
    /// See issue #11: Factory can be accessed with external browser.
    /// </remarks>
    private void CoreWebView2_WebResourceRequested(object? sender, CoreWebView2WebResourceRequestedEventArgs e)
    {
        if (_sessionToken != null)
        {
            e.Request.Headers.SetHeader("X-Fiplex-Token", _sessionToken);
        }
    }

    /// <summary>
    /// Navigates to the device interface.
    /// </summary>
    /// <remarks>
    /// <para>Navigation flow:</para>
    /// <list type="bullet">
    ///   <item><description>Stops current navigation before starting new one</description></item>
    ///   <item><description>2C devices with forceADV → navigates to /std.html</description></item>
    ///   <item><description>Other devices → navigates to root (implicit index.html)</description></item>
    /// </list>
    /// </remarks>
    /// <param name="forceAdvanced">True to force advanced UI on 2C devices.</param>
    private async Task NavigateToDeviceUIAsync(bool forceAdvanced = false)
    {
        if (webView?.CoreWebView2 == null)
        {
            _logger.LogWarning("WebView2 no inicializado, no se puede navegar");
            return;
        }

        // Reset factory mode counter
        _cntmode = 0;

        // If disconnected, don't navigate
        if (_sessionContext.State != ConnectionState.Connected)
        {
            _logger.LogDebug("Not connected, navigation cancelled");
            return;
        }

        try
        {
            // Stop any pending load before navigating
            // In WebView2, we use CoreWebView2.Stop()
            webView.CoreWebView2.Stop();

            // Small pause to ensure Stop() completes
            await Task.Delay(50);

            // Determine URL based on device type
            string url;
            var currentDevice = _sessionContext.Device;

            // 2c device with forceAdvanced navigates to /std.html
            if (currentDevice?.TDev == "2c" && forceAdvanced)
            {
                url = $"http://localhost:{_httpPort}/std.html";
                _logger.LogDebug("2C device with forceAdvanced, navigating to std.html");
            }
            else
            {
                url = $"http://localhost:{_httpPort}";
            }

            _logger.LogInformation("WebRefresh: Navegando a {Url}", url);
            webView.CoreWebView2.Navigate(url);

            // NOTE: Form size adjustment logic is handled in
            // UpdateUIForConnectedState (1350×800 on connect) and 
            // UpdateUIForDisconnectedState (1024×720 on disconnect).
            // Refresh does NOT modify form size or position.
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in NavigateToDeviceUIAsync");
        }
    }

    /// <summary>
    /// Refreshes the device web page.
    /// Called by cmdRefresh button.
    /// </summary>
    private async Task RefreshDeviceUIAsync()
    {
        await NavigateToDeviceUIAsync(false);
    }

    /// <summary>
    /// Handler for HTTP server BaseJsLoaded event.
    /// </summary>
    /// <remarks>
    /// Clears all pending commands from the pipeline when UI loads base.js,
    /// preventing orphan commands from interfering with the new navigation session.
    /// </remarks>
    private void OnHttpServerBaseJsLoaded(object? sender, EventArgs e)
    {
        try
        {
            if (_productionTestInProgress)
            {
                _logger.LogDebug("base.js loaded during production test — skipping CancelPendingCommands");
                return;
            }
            _logger.LogDebug("base.js loaded - cancelling pending commands");
            _pipeline.CancelPendingCommands();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error clearing commands after base.js load");
        }
    }

    /// <summary>
    /// Handler for received HTTP command events.
    /// Processes HTTP commands and routes them to the serial device.
    /// </summary>
    private async void OnHttpCommandReceived(object? sender, HttpCommandEventArgs e)
    {
        try
        {
            _logger.LogDebug("HTTP command received: {Method} {Command}, Params: {Params}",
                e.HttpMethod,
                e.CommandName,
                string.Join(", ", e.Parameters.Select(kvp => $"{kvp.Key}={kvp.Value}")));

            // Validate that we are connected
            if (_sessionContext.State != ConnectionState.Connected)
            {
                _logger.LogWarning("Command received but not connected");
                e.SetResponse("ERROR: Not connected");
                return;
            }

            string response;
            if (e.HttpMethod.Equals("POST", StringComparison.OrdinalIgnoreCase))
            {
                response = await _commandRouter.ProcessPostRequestAsync(
                    e.CommandName,
                    e.CommandValue,
                    _cts?.Token ?? default);
            }
            else
            {
                response = await _commandRouter.ProcessGetRequestAsync(
                    e.CommandName,
                    e.Parameters,
                    _cts?.Token ?? default);
            }

            e.SetResponse(response);

            _logger.LogDebug("Response sent: {Response}",
                response.Length > 100 ? $"{response[..100]}..." : response);
        }
        catch (OperationCanceledException)
        {
            _logger.LogWarning("Command cancelled: {Command}", e.CommandName);
            e.SetResponse("ERROR: Operation cancelled");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing command {Command}", e.CommandName);
            e.SetResponse($"ERROR: {ex.Message}");
        }
    }

    private async void cmdIDPort_Click(object sender, EventArgs e)
    {
        // Full scan manually invoked by user
        await ExecuteDeviceScanAsync(DeviceScanMode.FullScan);
    }

    protected override bool ProcessCmdKey(ref Message msg, Keys keyData)
    {
        // VB 1.9 parity: T with Scan Devices focused toggles Traces ON
        if (keyData == Keys.T && ActiveControl == cmdIDPort)
        {
            if (_traceLogger.IsEnabled)
            {
                _traceLogger.Disable();
                Text = "Fiplex Control Software";
                LogStatus("Traces OFF");
            }
            else
            {
                try
                {
                    _traceLogger.Enable();
                    Text = "Fiplex Control Software (Traces ON)";
                    LogStatus($"Traces ON — {_traceLogger.LogFilePath}");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to enable serial trace logger");
                    SetStatus($"Traces ERROR: {ex.Message}", StatusSeverity.Error);
                }
            }
            return true;
        }
        return base.ProcessCmdKey(ref msg, keyData);
    }

    /// <summary>
    /// Full scan for form initial load. Lists all installed Fiplex devices.
    /// </summary>
    public async Task PerformQuickScanAsync()
    {
        await ExecuteDeviceScanAsync(DeviceScanMode.FullScan);
    }

    /// <summary>
    /// Handler for selection change in COM ports ComboBox.
    /// </summary>
    /// <remarks>
    /// Enables cmdConnect when a valid device is selected and training is valid.
    /// </remarks>
    private void cmbCOM_SelectedIndexChanged(object? sender, EventArgs e)
    {
        // Only process if devices found and index is valid
        if (_foundDevices.Count == 0 || cmbCOM.SelectedIndex < 0)
        {
            cmdConnect.Enabled = false;
            return;
        }

        // Verify selection is a valid device (not a status message)
        if (cmbCOM.SelectedIndex < _foundDevices.Count)
        {
            var device = _foundDevices[cmbCOM.SelectedIndex];

            // VB 1.9 parity: Unknown device is shown but Connect is disabled
            if (device.NameTypeDevice == "Unknown device")
            {
                cmdConnect.Enabled = false;
            }
            else
            {
                cmdConnect.Enabled = _trainingValidation.IsTrainingValid;
            }

            _logger.LogDebug("Selected device: {Device} on COM{Port}",
                device.NameTypeDevice, device.ComPort);

            LogStatus($"Selected: {device.NameTypeDevice}");
        }
        else
        {
            cmdConnect.Enabled = false;
        }
    }

    /// <summary>
    /// Executes device scan according to the specified mode.
    /// Separates UI logic from scan logic by delegating to the service.
    /// </summary>
    /// <param name="mode">QuickScan: stops at first device. FullScan: all ports.</param>
    private async Task ExecuteDeviceScanAsync(DeviceScanMode mode = DeviceScanMode.FullScan)
    {
        _scanCts?.Cancel();
        _scanCts = new CancellationTokenSource();

        // Defensive cleanup before scan: previous sessions may leave pending commands
        // that block discovery command processing.
        try
        {
            _pipeline.CancelPendingCommands();
            if (_serialPort.IsOpen)
            {
                await _serialPort.CloseAsync();
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Pre-scan cleanup failed");
        }

        SetUIState(isScanning: true);
        PrepareComboBoxForScan();
        SetStatus(mode == DeviceScanMode.QuickScan
            ? "Quick scan: searching for first device..."
            : "Starting full device scan...", StatusSeverity.InfoProgress);

        _scanInProgress = true;
        try
        {
            var progress = new Progress<ScanProgress>(UpdateScanProgress);
            // Run scan off the UI thread to keep the form responsive during COM probing.
            _foundDevices = await Task.Run(
                () => _discovery.ScanPortsAsync(mode, progress, _scanCts.Token),
                _scanCts.Token);

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
            _scanInProgress = false;
            SetUIState(isScanning: false);
            cmdIDPort.Focus();
        }
    }

    /// <summary>
    /// Prepares the ComboBox to show scan in progress status.
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
    /// Logs scan completed message according to mode.
    /// </summary>
    private void LogScanCompleteStatus(DeviceScanMode mode)
    {
        var modeLabel = mode == DeviceScanMode.QuickScan ? "Quick scan" : "Full scan";
        SetStatus($"{modeLabel} complete: {_foundDevices.Count} device(s) found", StatusSeverity.Success);
        _logger.LogInformation("{Mode} completed: {Count} devices", modeLabel, _foundDevices.Count);
    }

    /// <summary>
    /// Handles scan cancellation by user.
    /// </summary>
    private void HandleScanCancelled()
    {
        SetStatus("Scan cancelled by user", StatusSeverity.Warning);
        SetComboBoxMessage("Scan cancelled");
    }

    /// <summary>
    /// Handles errors during scan.
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
    /// Sets a single message in the ComboBox (error/cancellation states).
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

        // Only update the status bar, not the ComboBox
        SetStatus($"Scanning {p.CurrentPort} ({p.Completed}/{p.Total}) - Found: {p.DevicesFound}", StatusSeverity.InfoProgress);
        // Scan result is logged via PortScanTrace (VB 1.9 format). Progress bar only here.
    }

    private void UpdateDeviceList()
    {
        if (InvokeRequired)
        {
            Invoke(UpdateDeviceList);
            return;
        }

        // Complete cleanup of the ComboBox
        cmbCOM.DataSource = null;
        cmbCOM.DisplayMember = string.Empty;
        cmbCOM.ValueMember = string.Empty;
        cmbCOM.Items.Clear();

        if (_foundDevices.Any())
        {
            // Use BindingList for better behavior with ComboBox
            var bindingList = new System.ComponentModel.BindingList<DeviceInfo>(_foundDevices);
            cmbCOM.DataSource = bindingList;
            cmbCOM.DisplayMember = nameof(DeviceInfo.DisplayLabel);
            cmbCOM.ValueMember = nameof(DeviceInfo.ComPort);

            // Auto-select last used port
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
    /// Connects to the device with complete 8-phase flow
    /// PROMPT 6: Complete orchestrated connection implementation
    /// </summary>
    private async Task ConnectAsync()
    {
        try
        {
            _logger.LogInformation("=== STARTING DEVICE CONNECTION ===");

            // FASE 0: Reset de estado inicial 
            _waitingLF = false;
            _pendingAnswer = false;

            // TRAINING VALIDATION: Verify that training is still valid
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

            // PHASE 1: Device selection validation
            _logger.LogInformation("PHASE 1: Validating device selection");
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

            // Disable controls immediately 
            cmdConnect.Enabled = false;
            await Task.Yield();

            SetUIState(isConnecting: true);
            LogStatus($"Connecting to {selectedDevice.NameTypeDevice} on {portName}...");

            // Create CancellationTokenSource for the entire connection
            _cts = new CancellationTokenSource();
            _sessionContext = _sessionContext with { State = ConnectionState.Connecting };

            // PHASE 2: Serial port opening
            _logger.LogInformation("PHASE 2: Opening serial port {Port}", portName);
            LogStatus($"Opening port {portName}...");

            // CRITICAL: Close previous port if open
            if (_serialPort.IsOpen)
            {
                _logger.LogWarning("Port previously open, closing before reconnecting...");
                try
                {
                    await _serialPort.CloseAsync();
                    await Task.Delay(100); // Small pause to ensure complete closure
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error closing previous port, continuing...");
                }
            }

            bool opened;

            // noUSB mode: Bypass physical port opening
            if (_devModeSettings?.NoUSB == true)
            {
                _logger.LogWarning("noUSB mode: Simulating port {Port} opening", portName);
                opened = true; // Simulate success
                LogStatus($"Port {portName} simulated (noUSB)");
            }
            else
            {
                // INIT-005 Phase 2 (M-2): refuse to connect through a quarantined port —
                // its handle is likely retained by an abandoned driver call and opening
                // it again would fail or spawn another orphan.
                if (_portQuarantine.TryGet(portName, out var quarantineEntry))
                {
                    _logger.LogWarning(
                        "Connection refused: port {Port} is QUARANTINED (reason={Reason}, since={Since:HH:mm:ss})",
                        portName, quarantineEntry!.Reason, quarantineEntry.Since);
                    throw new InvalidOperationException(
                        $"Port {portName} is unavailable in this session (a previous operation on it never completed). " +
                        "Close and reopen the application to use this port again.");
                }

                // Actual port opening
                opened = await _serialPort.OpenAsync(portName);
            }

            if (!opened)
            {
                throw new InvalidOperationException($"Failed to open serial port {portName}");
            }

            if (_devModeSettings?.NoUSB != true)
            {
                _portHealthTimer = new System.Windows.Forms.Timer { Interval = 1000 };
                _portHealthTimer.Tick += PortHealthTimer_Tick;
                _portHealthTimer.Start();
            }

            _logger.LogInformation("Serial port {Status}",
                _devModeSettings?.NoUSB == true ? "simulated" : "opened successfully");

            // PHASE 3: Determine PathShared
            _logger.LogInformation("PHASE 3: Determining PathShared");
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

            // PHASE 4: Load settings.cfg
            _logger.LogInformation("PHASE 4: Loading device configuration");
            LogStatus("Loading device configuration...");

            var settingsPath = Path.Combine(devicePath, "settings.cfg");

            // Fallback to settingsW.cfg if settings.cfg does not exist OR is empty
            if (!File.Exists(settingsPath) || new FileInfo(settingsPath).Length == 0)
            {
                var fallbackPath = Path.Combine(devicePath, "settingsW.cfg");
                if (File.Exists(fallbackPath) && new FileInfo(fallbackPath).Length > 0)
                {
                    settingsPath = fallbackPath;
                    _logger.LogDebug("settings.cfg does not exist or is empty, using settingsW.cfg");
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

            // Save configuration for FILE operations (SaveCFG, LoadCFG)
            _currentDeviceConfig = deviceConfig;

            // PHASE 5: Load configuration in router
            _logger.LogInformation("PHASE 5: Loading configuration in router");
            LogStatus("Configuring command router...");

            _commandRouter.LoadConfiguration(deviceConfig);

            // STAGE 7: Configure device parameters
            _logger.LogInformation("Configuring device parameters: {Type} v{Version}",
                selectedDevice.TDev, selectedDevice.NDev);
            await _commandRouter.ConfigureDeviceAsync(
                selectedDevice.TDev,
                selectedDevice.NDev,
                _cts.Token);
            _logger.LogDebug("Device parameters configured");

            // PHASE 6: Verify authentication - CRITICAL
            _logger.LogInformation("PHASE 6: Verifying authentication");
            LogStatus("Checking authentication...");

            AuthResult authResult;

            // noUSB mode: Simulate without authentication
            if (_devModeSettings?.NoUSB == true)
            {
                _logger.LogInformation("noUSB mode: Simulating NoAuthRequired");
                authResult = AuthResult.NoAuthRequired;
            }
            else
            {
                // Real verification
                authResult = await _authService.CheckAuthenticationRequirementAsync(_cts.Token);
            }

            _logger.LogInformation("Authentication result: {Result}", authResult);

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

                case AuthResult.IncorrectPassword:
                    if (_userCancelledAuth)
                    {
                        // User explicitly cancelled — disconnect quietly (VB 1.9: no message on cancel)
                        _userCancelledAuth = false;
                        _validatedPassword = null;
                        _pipeline.SetStoredPassword(null);
                        await DisconnectAsync();
                        return;
                    }

                    // Wrong password — show dialog with inline error, stay open for retry (VB 1.9 parity)
                    _logger.LogWarning("Authentication failed - incorrect password");
                    _validatedPassword = null;
                    _pipeline.SetStoredPassword(null);

                    _authDialogOpen = true;
                    try
                    {
                        using (var retryDialog = _serviceProvider.GetRequiredService<frmPassword>())
                        {
                            retryDialog.Text = "Authentication Required";
                            retryDialog.AuthenticateCommand = async (pwd) =>
                            {
                                var r = await _authService.AuthenticateAsync(pwd, _cts.Token);
                                return r == AuthResult.AuthenticationSuccessful ? null : "Wrong password";
                            };
                            retryDialog.ShowValidationError("Wrong password");

                            if (retryDialog.ShowDialog(this) != DialogResult.OK)
                            {
                                await DisconnectAsync();
                                return;
                            }

                            _validatedPassword = retryDialog.Password;
                            _pipeline.SetStoredPassword(retryDialog.Password);
                            _commandRouter.SetStoredPassword(retryDialog.Password);
                        }
                    }
                    finally { _authDialogOpen = false; }
                    break;

                case AuthResult.PasswordRequired:
                    _logger.LogInformation("Device requires authentication");
                    LogStatus("Password required...");

                    _authDialogOpen = true;
                    try
                    {
                    using (var passwordDialog = _serviceProvider.GetRequiredService<frmPassword>())
                    {
                        // VB6 1.12 parity: show "Forgot Password" link for PassLevel >= 2
                        passwordDialog.PassLevel = selectedDevice.PassLevel;

                        // Auth runs inside the dialog — stays open on wrong password (VB 1.9 parity)
                        passwordDialog.AuthenticateCommand = async (pwd) =>
                        {
                            var result = await _authService.AuthenticateAsync(pwd, _cts.Token);
                            return result switch
                            {
                                AuthResult.AuthenticationSuccessful => null,
                                AuthResult.IncorrectPassword        => "Wrong password",
                                AuthResult.DeviceNotResponding      => "Device not responding",
                                _                                   => "Authentication failed"
                            };
                        };

                        var dlgResult = passwordDialog.ShowDialog(this);

                        if (passwordDialog.ForgotPasswordClicked)
                        {
                            _logger.LogInformation("User clicked Forgot Password — opening reset dialog");
                            using var resetDialog = new frmResetPass();
                            resetDialog.RequestResetKeyCommand = ct => _authService.RequestResetKeyAsync(ct);
                            resetDialog.ExecutePasswordResetCommand = (pwd, ct) => _authService.ExecutePasswordResetAsync(pwd, ct);
                            resetDialog.ShowDialog(this);
                            await DisconnectAsync();
                            return;
                        }

                        if (dlgResult != DialogResult.OK)
                        {
                            _logger.LogInformation("User cancelled password dialog");
                            await DisconnectAsync();
                            return;
                        }

                        _logger.LogInformation("Authentication successful");
                        SetStatus("Authentication successful", StatusSeverity.Success);

                        _validatedPassword = passwordDialog.Password;
                        _pipeline.SetStoredPassword(passwordDialog.Password);
                        _commandRouter.SetStoredPassword(passwordDialog.Password);
                    }
                    }
                    finally { _authDialogOpen = false; }
                    break;

                case AuthResult.NoAuthRequired:
                    _logger.LogInformation("No authentication required");
                    LogStatus("No authentication required");
                    break;
            }

            // PHASE 7: Start HTTP server
            _logger.LogInformation("PHASE 7: Starting HTTP server");
            LogStatus("Starting HTTP server...");

            try
            {
                var port = GetAvailablePort();
                _sessionToken = Guid.NewGuid().ToString("N");
                await _httpServer.StartAsync(port, devicePath, _sessionToken, _cts.Token);
                _httpServerIsRunning = true;
                _httpPort = port;

                _logger.LogInformation("HTTP server started on port {Port}", port);
                _logger.LogInformation("Root path: {RootPath}", devicePath);

                // Inject session token into all WebView2 requests via custom header
                if (webView?.CoreWebView2 != null)
                {
                    webView.CoreWebView2.AddWebResourceRequestedFilter(
                        $"http://localhost:{port}/*", CoreWebView2WebResourceContext.All);
                    webView.CoreWebView2.AddWebResourceRequestedFilter(
                        $"http://127.0.0.1:{port}/*", CoreWebView2WebResourceContext.All);
                    webView.CoreWebView2.WebResourceRequested += CoreWebView2_WebResourceRequested;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error starting HTTP server");
                await DisconnectAsync();
                MessageBox.Show(
                    $"Error starting HTTP server: {ex.Message}",
                    "Connection Error",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error);
                return;
            }

            // PHASE 8: Watchdog + WebView + Post-authentication menus
            _logger.LogInformation("PHASE 8: Initializing watchdog and browser");

            // Configure menus based on deviceWithPass
            if (selectedDevice.DeviceWithPass)
            {
                mnuPassword.Visible = true;
                mnuEth.Visible = true;
                _logger.LogDebug("Password and ethernet menus enabled");
            }

            // License condition: (tdev="1c" AND ndev=7 AND ucVersion>=0x10B) OR tdev="2c"
            // CRITICAL: Now uses real ucVersion extracted from V1 response
            var ucVersion = _authService.UcVersion;
            var showLicenseMenu = (selectedDevice.TDev == "1c" && (int)selectedDevice.NDev == 7 && ucVersion >= 0x10B)
                                   || selectedDevice.TDev == "2c";

            if (showLicenseMenu)
            {
                mnuLicense.Visible = true;
                _logger.LogDebug("License menu enabled (ucVersion=0x{UcVersion:X}, condition met)", ucVersion);
            }
            else
            {
                _logger.LogDebug("License menu NOT enabled (tdev={TDev}, ndev={NDev}, ucVersion=0x{UcVersion:X})",
                    selectedDevice.TDev, selectedDevice.NDev, ucVersion);
            }

            // Additional menus based on device type 
            // mnuFactDefault: Only visible for password devices in factory mode
            // mnuProd: Visible based on device-specific configuration
            ConfigureDeviceSpecificMenus(selectedDevice);

            // Start watchdog if the device requires it
            if (RequiresWatchdog(selectedDevice))
            {
                LogStatus("Starting watchdog service...");
                try
                {
                    // CRITICAL: Use 25 seconds 
                    await _watchdog.StartAsync(TimeSpan.FromSeconds(25));
                    _logger.LogInformation("Watchdog service started (25s interval)");
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to start watchdog service");
                }
            }

            // Navigate to device interface
            if (webView?.CoreWebView2 != null)
            {
                var url = $"http://localhost:{_httpPort}";
                LogStatus($"Loading device interface: {url}");
                webView.CoreWebView2.Navigate(url);
                _logger.LogInformation("Navigated to device interface");
            }

            // Update state variables
            _chTestActivated = -1;
            _confSCA = "";
            _pendingAnswer = false;
            lblHyperLink.Visible = false;
            cmdRefresh.Visible = true;
            mnuFWInfo.Visible = true;

            // Enable configuration menus
            // mnuConfig disabled for Flex devices (4dm*, 5dm, 2c) per VB reference
            var configEnabled = IsConfigMenuEnabledForDevice(selectedDevice);
            mnuConfig.Enabled = configEnabled;
            mnuLoadConfig.Enabled = configEnabled;
            mnuSaveConfig.Enabled = configEnabled;

            // Enable calibration menus if available (Available, not Visible — see comment in ExecuteFileOperationAsync)
            if (mnuCal.Available)
            {
                mnuCal.Enabled = true;
                mnuSaveCal.Enabled = true;
                mnuLoadCal.Enabled = true;
            }

            // Update session context
            _sessionContext = _sessionContext with
            {
                State = ConnectionState.Connected,
                Device = selectedDevice
            };

            // Save last used port
            await SaveLastUsedPortAsync(selectedDevice.ComPort);

            // Task.Yield to process pending events 
            await Task.Yield();

            UpdateUIForConnectedState();
            SetStatus($"Connected to {selectedDevice.NameTypeDevice}", StatusSeverity.State);
            _logger.LogInformation("=== CONNECTION COMPLETE ===");
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

    private async void PortHealthTimer_Tick(object? sender, EventArgs e)
    {
        try
        {
            _ = _serialPort.BytesToRead;
        }
        catch
        {
            _portHealthTimer?.Stop();
            _portHealthTimer?.Dispose();
            _portHealthTimer = null;
            await DisconnectAsync();
        }
    }

    /// <summary>
    /// Disconnects from the device and releases all resources
    /// PROMPT 6: Complete disconnection implementation
    /// </summary>
    private async Task DisconnectAsync()
    {
        try
        {
            _portHealthTimer?.Stop();
            _portHealthTimer?.Dispose();
            _portHealthTimer = null;

            _logger.LogInformation("=== STARTING DISCONNECTION ===");
            LogStatus("Disconnecting...");

            // Cancel ongoing operations
            _cts?.Cancel();

            // Cancel pending/blocked serial commands before stopping services.
            // This prevents scan deadlocks after reconnect/disconnect cycles.
            _pipeline.CancelPendingCommands();

            // Flush and close trace log if active (VB 1.9: traces stop on disconnect)
            if (_traceLogger.IsEnabled)
            {
                _traceLogger.Disable();
                Text = "Fiplex Control Software";
            }

            // Stop watchdog
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

            // Stop HTTP server
            if (_httpServerIsRunning)
            {
                try
                {
                    // Remove WebResourceRequested handler before stopping server
                    if (webView?.CoreWebView2 != null)
                    {
                        webView.CoreWebView2.WebResourceRequested -= CoreWebView2_WebResourceRequested;
                    }

                    await _httpServer.StopAsync();
                    _httpServerIsRunning = false;
                    _sessionToken = null;
                    _logger.LogInformation("HTTP server stopped");
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error stopping HTTP server");
                }
            }

            // Close serial port
            if (_serialPort.IsOpen)
            {
                try
                {
                    // noUSB mode: Don't try to close simulated port
                    if (_devModeSettings?.NoUSB == true)
                    {
                        _logger.LogInformation("noUSB mode: Skipping simulated port close");
                    }
                    else
                    {
                        _logger.LogInformation("Closing serial port");
                        await _serialPort.CloseAsync();
                    }

                    _logger.LogInformation("Serial port closed");
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error closing serial port");
                }
            }

            // Navigate to default page on disconnect
            if (webView?.CoreWebView2 != null)
            {
                try
                {
                    // STEP 1: First navigation to about:blank (Stop)
                    webView.CoreWebView2.Navigate("about:blank");
                    await Task.Delay(50); // Small pause to ensure navigation
                    _logger.LogDebug("First navigation: about:blank (Stop)");

                    // STEP 2: Navigate to default page
                    await NavigateToDefaultPageAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error clearing WebView");
                }
            }

            // Close secondary forms
            CloseSecondaryForms();

            // Hide device-specific menus
            mnuFactDefault.Visible = false;
            mnuLicense.Visible = false;
            mnuPassword.Visible = false;
            mnuEth.Visible = false;
            mnuProd.Visible = false;
            mnuFWInfo.Visible = false;
            mnuFWVer.Visible = false;

            // Hide calibration menus (only visible in factory mode)
            _logger.LogWarning("DisconnectAsync: hiding cal menus (mnuCal.Visible was {V})", mnuCal.Visible);
            mnuCal.Visible = false;
            mnuCal.Enabled = false;
            mnuLoadCal.Visible = false;
            mnuSaveCal.Visible = false;

            // Reset license manager characters (re-fetched on next license sequence attempt)
            _serialFirstChar = '\0';
            _versionFirstChar = '\0';

            // Restore base menus 
            mnuOneCH.Visible = true;
            mnuTwoCH.Visible = true;
            mnuSixCH.Visible = true;

            // Disable configuration menus
            // Disable both parent submenus and child items
            mnuConfig.Enabled = false;
            mnuLoadConfig.Enabled = false;
            mnuSaveConfig.Enabled = false;
            mnuCal.Enabled = false;
            mnuLoadCal.Enabled = false;
            mnuSaveCal.Enabled = false;
            cmdRefresh.Visible = false;
            lblHyperLink.Enabled = false;
            lblHyperLink.Visible = false;

            // Reset state variables
            _chTestActivated = -1;
            _confSCA = "";
            _pendingAnswer = false;
            _waitingLF = false;
            _currentDeviceConfig = null;

            // Update session context
            _sessionContext = _sessionContext with
            {
                State = ConnectionState.Disconnected,
                Device = null
            };

            UpdateUIForDisconnectedState();
            SetStatus("Disconnected", StatusSeverity.State);

            // Clear validated password (security)
            _validatedPassword = null;
            _pipeline.ClearStoredPassword();

            // Reset router (clears cache, password, response processors)
            _commandRouter.Reset();

            _logger.LogInformation("=== DISCONNECTION COMPLETE ===");
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
    /// Handler for pipeline CredentialsRequired event.
    /// </summary>
    /// <remarks>
    /// Invoked when device responds with INVALID CREDENTIALS.
    /// Returns validated password or requests a new one from user.
    /// </remarks>
    private async Task<string?> OnPipelineCredentialsRequired()
    {
        // If ConnectAsync already has an auth dialog open (e.g. waiting for *0{password} ACK),
        // the pipeline's INVALID CREDENTIALS callback must not open a second dialog.
        // The auth result will be handled by the existing dialog's AuthenticateCommand delegate.
        if (_authDialogOpen)
        {
            _logger.LogDebug("Auth dialog already open — suppressing duplicate credential prompt");
            return null;
        }

        // First try to use already validated password
        if (!string.IsNullOrEmpty(_validatedPassword))
        {
            _logger.LogDebug("Returning validated password for retry");
            return _validatedPassword;
        }

        // Show password dialog
        // Note: This must run on the UI thread
        string? password = null;

        if (InvokeRequired)
        {
            Invoke(() =>
            {
                using var passwordDialog = _serviceProvider.GetRequiredService<frmPassword>();
                passwordDialog.Text = "Authentication Required";
                if (passwordDialog.ShowDialog(this) == DialogResult.OK)
                    password = passwordDialog.Password;
                else
                    _userCancelledAuth = true;
            });
        }
        else
        {
            using var passwordDialog = _serviceProvider.GetRequiredService<frmPassword>();
            passwordDialog.Text = "Authentication Required";
            if (passwordDialog.ShowDialog(this) == DialogResult.OK)
                password = passwordDialog.Password;
            else
                _userCancelledAuth = true;
        }

        if (!string.IsNullOrEmpty(password))
        {
            _validatedPassword = password;
            _pipeline.SetStoredPassword(password);
        }

        return password;
    }

    #region Helper Methods

    /// <summary>
    /// Determines whether mnuConfig (File → Configuration) should be enabled for a device.
    /// </summary>
    /// <remarks>
    /// Equivalente VB.NET:
    /// <c>mnuConfig.Enabled = (tdev &lt;&gt; "4dm") And (tdev &lt;&gt; "4dm1") And (tdev &lt;&gt; "4dm2") And (tdev &lt;&gt; "4dm3") And (tdev &lt;&gt; "4dm4") And (tdev &lt;&gt; "5dm") And (tdev &lt;&gt; "2c")</c>
    /// Flex devices do not support user-editable configuration via this menu.
    /// </remarks>
    private static bool IsConfigMenuEnabledForDevice(DeviceInfo? device)
    {
        if (device?.TDev is null) return false;

        return device.TDev is not ("4dm" or "4dm1" or "4dm2" or "4dm3" or "4dm4" or "5dm" or "2c");
    }

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
    /// Configures menus specific to device type.
    /// </summary>
    /// <remarks>
    /// Configures visibility of Factory Default, Production, and Calibration menus
    /// according to the connected device type (TDev).
    /// </remarks>
    private void ConfigureDeviceSpecificMenus(DeviceInfo device)
    {
        // mnuFactDefault: Only visible for 2c device (BDA Dual)
        // Only 2c devices support factory reset
        if (device.TDev == "2c")
        {
            mnuFactDefault.Visible = true;
            _logger.LogDebug("mnuFactDefault enabled for 2c device");
        }
        else
        {
            mnuFactDefault.Visible = false;
        }

        // mnuProd: hidden until factory sequence is entered (ShowFactoryMenuAsync)
        mnuProd.Visible = false;

        // mnuCal (Calibration): hidden until factory sequence is entered (ShowFactoryMenuAsync)
        mnuCal.Visible = false;
        mnuLoadCal.Visible = false;
        mnuSaveCal.Visible = false;
    }

    /// <summary>
    /// Gets PathShared with robust fallbacks: device -> type -> default.
    /// Creates minimal content if not exists.
    /// STAGE 5: PathShared Fallback
    /// </summary>
    private async Task<string> GetDevicePathShared(DeviceInfo device)
    {
        // noUSB mode: Use simulated PathShared
        if (_devModeSettings?.NoUSB == true)
        {
            var simulatedPath = Path.Combine(
                AppDomain.CurrentDomain.BaseDirectory,
                _devModeSettings.SimulatedPathShared);

            _logger.LogInformation("noUSB mode: Simulated PathShared = {Path}", simulatedPath);

            if (!Directory.Exists(simulatedPath))
            {
                _logger.LogWarning("Simulated PathShared does not exist, creating: {Path}", simulatedPath);
                Directory.CreateDirectory(simulatedPath);
                await CreateDefaultDeviceContent(simulatedPath, device);
            }

            return simulatedPath;
        }

        // Robust fallback logic
        string devicePath = string.Empty;

        // 1. Try device PathShared
        if (!string.IsNullOrEmpty(device.PathShared) && Directory.Exists(device.PathShared))
        {
            devicePath = device.PathShared;
            _logger.LogInformation("Using device PathShared: {Path}", devicePath);
        }
        else
        {
            // 2. Fallback to directory based on device type
            var baseDir = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "pages");
            var deviceTypeDir = $"htdocs_{device.TDev}";
            devicePath = Path.Combine(baseDir, deviceTypeDir);

            if (Directory.Exists(devicePath))
            {
                _logger.LogWarning("Original PathShared not valid, using type fallback: {Path}", devicePath);
            }
            else
            {
                // 3. Last fallback: htdocs_default
                devicePath = Path.Combine(baseDir, "htdocs_default");
                if (!Directory.Exists(devicePath))
                {
                    _logger.LogWarning("Creating default PathShared: {Path}", devicePath);
                    Directory.CreateDirectory(devicePath);
                    await CreateDefaultDeviceContent(devicePath, device);
                }
                else
                {
                    _logger.LogWarning("Using default PathShared: {Path}", devicePath);
                }
            }
        }

        return devicePath;
    }

    /// <summary>
    /// Creates minimal content for default device directory.
    /// STAGE 5: Default content
    /// </summary>
    private async Task CreateDefaultDeviceContent(string path, DeviceInfo device)
    {
        try
        {
            // Create basic index.html
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
                _logger.LogInformation("Default index.html created at {Path}", path);
            }

            // Create basic settings.cfg
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
                _logger.LogInformation("Default settings.cfg created at {Path}", path);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating default content in {Path}", path);
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

                // Try to read first lines for diagnostics
                try
                {
                    var sampleLines = (await File.ReadAllLinesAsync(settingsPath)).Take(5);
                    _logger.LogInformation("First 5 lines of file: {@Lines}", sampleLines);
                }
                catch
                {
                    // Ignore sample read errors
                }

                return null;
            }

            // Build DeviceConfiguration from the CommandDefinition list
            var config = new DeviceConfiguration
            {
                GetCommands = commands
                    .Where(c => c.HttpMethod.Equals("GET", StringComparison.OrdinalIgnoreCase))
                    .Select(c => new GetCommand
                    {
                        Page = c.Page,
                        Command = c.Command,
                        Encode = c.HexEncoding,
                        // FIXED: Preserve original LengthValidation for splitwith3tabs
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
                        // DecodeBody is activated when HexEncoding is true
                        DecodeBody = c.HexEncoding,
                        // Parse NoEncodeParams string to int
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
        // Devices with password require watchdog
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

        // Suspend layout to avoid visual artifacts during resizing
        SuspendLayout();
        tlpMainLayout.SuspendLayout();

        try
        {
            cmdConnect.Text = "Disconnect";
            cmdConnect.BackColor = Color.FromArgb(220, 53, 69); // Red for disconnect
            cmdConnect.Enabled = true; // Re-enable after connection
            cmdIDPort.Enabled = false;
            cmbCOM.Enabled = false;
            cmdRefresh.Enabled = true;
            this.MinimumSize = new Size(1024, 720);

            // Update firmware information in menu
            UpdateFirmwareInfo();
        }
        finally
        {
            tlpMainLayout.ResumeLayout(true);
            ResumeLayout(true);
            Refresh();
        }

        if (!_hasMaximized)
        {
            _hasMaximized = true;
            BeginInvoke(() => this.WindowState = FormWindowState.Maximized);
        }
    }

    /// <summary>
    /// Updates the menu with firmware information.
    /// </summary>
    /// <remarks>
    /// Format: "FW: 2C v1.0 (uc:0x10B)" where ucVersion is shown if available.
    /// </remarks>
    private void UpdateFirmwareInfo()
    {
        if (_sessionContext.Device == null) return;

        var device = _sessionContext.Device;
        var ucVersion = _authService.UcVersion;

        // Extended format with ucVersion information for diagnostics
        var tdevUpper = device.TDev.ToUpperInvariant();
        var fwInfo = $"FW: {tdevUpper} v{device.NDev:F1}";

        // Add ucVersion only if available (> 0)
        if (ucVersion > 0)
        {
            fwInfo += $" (uc:0x{ucVersion:X})";
        }

        mnuFWVer.Text = fwInfo;
        mnuFWVer.Visible = true;

        _logger.LogDebug("Firmware info updated: {FwInfo}", fwInfo);
    }

    private void UpdateUIForDisconnectedState()
    {
        if (InvokeRequired)
        {
            Invoke(UpdateUIForDisconnectedState);
            return;
        }

        // Suspend layout to avoid visual artifacts during resizing
        SuspendLayout();
        tlpMainLayout.SuspendLayout();

        try
        {
            cmdConnect.Text = "Connect";
            cmdConnect.BackColor = Color.FromArgb(0, 120, 215); // Blue for connect
            cmdIDPort.Enabled = true;
            cmbCOM.Enabled = true;
            cmdRefresh.Enabled = false;

            // Restore fixed size on disconnect and reset maximize flag
            _hasMaximized = false;
            this.WindowState = FormWindowState.Normal;
            this.MinimumSize = new Size(1024, 720);
            this.Size = new Size(1024, 720);
            CenterFormOnScreen();
        }
        finally
        {
            tlpMainLayout.ResumeLayout(true);
            ResumeLayout(true);
            // Force full redraw to remove artifacts
            Refresh();
        }
    }

    // Replicates VB 1.9 frmMain_Resize: cmbCOM.Width = ClientRectangle.Width - 16
    // When maximizing, the native Win32 ComboBox HWND button does not reposition
    // on a programmatic resize — a Visible toggle forces it to repaint at the new width.
    protected override void OnResize(EventArgs e)
    {
        base.OnResize(e);
        if (cmbCOM == null) return;
        var w = ClientSize.Width - 16;
        if (w > 0) cmbCOM.Width = w;
        if (WindowState == FormWindowState.Maximized)
        {
            cmbCOM.Visible = false;
            cmbCOM.Visible = true;
        }
    }

    /// <summary>
    /// Centers the form on the current screen.
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

    // INIT-011: severity classification for status bar messages.
    private enum StatusSeverity
    {
        State,         // persistent baseline (connection/idle) — bar reverts here
        Info,          // transient, 10 s
        InfoProgress,  // persistent while a long operation keeps emitting events
        Success,       // transient, 10 s
        Warning,       // transient, 15 s
        Error          // persistent until a new State or new operation flow
    }

    /// <summary>
    /// Back-compat wrapper (INIT-011): legacy callers default to Info severity.
    /// </summary>
    private void LogStatus(string message) => SetStatus(message, StatusSeverity.Info);

    /// <summary>
    /// Sets the bottom status bar message with a severity-driven lifetime (INIT-011).
    /// State/InfoProgress/Error persist; Info/Success revert after 10 s, Warning after 15 s.
    /// On expiry the bar reverts to the current State baseline (<see cref="_currentState"/>).
    /// </summary>
    private void SetStatus(string message, StatusSeverity severity)
    {
        if (InvokeRequired)
        {
            Invoke(() => SetStatus(message, severity));
            return;
        }

        // Any new message cancels a pending revert; transient severities re-arm below.
        StopRevertTimer();

        // lblStatus shows operational messages (no timestamp — INIT-011)
        // lbldaysRemaining remains exclusive for CLSS info
        lblStatus.Text = message;
        lblStatus.ForeColor = ColorFor(severity);

        _logger.LogDebug(message);

        switch (severity)
        {
            case StatusSeverity.State:
                _currentState = message;        // new persistent baseline
                break;
            case StatusSeverity.InfoProgress:
            case StatusSeverity.Error:
                break;                          // persistent — no timer
            case StatusSeverity.Info:
            case StatusSeverity.Success:
                StartRevertTimer(10_000);
                break;
            case StatusSeverity.Warning:
                StartRevertTimer(15_000);
                break;
        }
    }

    private static Color ColorFor(StatusSeverity severity) => severity switch
    {
        StatusSeverity.Success => Color.FromArgb(0, 140, 60),
        StatusSeverity.Warning => Color.FromArgb(150, 90, 0),
        StatusSeverity.Error => Color.FromArgb(196, 32, 32),
        _ => Color.FromArgb(85, 85, 85)        // State / Info / InfoProgress
    };

    private void StartRevertTimer(int intervalMs)
    {
        if (_statusRevertTimer == null)
        {
            _statusRevertTimer = new System.Windows.Forms.Timer();
            _statusRevertTimer.Tick += StatusRevertTimer_Tick;
        }
        _statusRevertTimer.Interval = intervalMs;
        _statusRevertTimer.Start();
    }

    private void StopRevertTimer() => _statusRevertTimer?.Stop();

    private void StatusRevertTimer_Tick(object? sender, EventArgs e)
    {
        StopRevertTimer();
        lblStatus.Text = _currentState;
        lblStatus.ForeColor = ColorFor(StatusSeverity.State);
    }

    private async void cmdRefresh_Click(object sender, EventArgs e)
    {
        if (_cntmode > 0) return; // factory sequence in progress — ignore click
        await RefreshDeviceUIAsync();
    }

    private void cmdRefresh_MouseDown(object? sender, MouseEventArgs e)
    {
        if (_sessionContext.State != ConnectionState.Connected) return;
        if (_cntmode >= _eButton.Length) return;

        if (e.Button == _eButton[_cntmode] && (System.Windows.Forms.Control.ModifierKeys & Keys.Shift) != 0)
        {
            cmdRefresh.Focus();
            _cntmode++;
            if (_cntmode == 3)
                _ = FetchLicenseCharactersAsync();
        }
        else
        {
            _cntmode = 0;
        }
    }

    private void cmdRefresh_KeyPress(object? sender, KeyPressEventArgs e)
    {
        if (_cntmode == 50)
        {
            int sum = DateTime.Now.Minute + (DateTime.Now.Day % 10);
            char expected = (char)('0' + sum / 10);
            if (e.KeyChar == expected)
                _ = ShowFactoryMenuAsync();
            else
                _cntmode = 0;
            e.Handled = true;
        }
        else if (_cntmode == 2)
        {
            int sum = DateTime.Now.Minute + (DateTime.Now.Day % 10);
            char expected = (char)('0' + sum % 10);
            if (e.KeyChar == expected)
                _cntmode = 50;
            else
                _cntmode = 0;
            e.Handled = true;
        }
        else if (_cntmode == 6)
        {
            if (_versionFirstChar != '\0' && e.KeyChar == _versionFirstChar)
                ShowLicenseManager();
            else
                _cntmode = 0;
            e.Handled = true;
        }
        else if (_cntmode == 5)
        {
            if (_serialFirstChar != '\0' && e.KeyChar == _serialFirstChar)
                _cntmode = 6;
            else
                _cntmode = 0;
            e.Handled = true;
        }
        else if (_cntmode == 4)
        {
            int sum = DateTime.Now.Minute + (DateTime.Now.Day % 10);
            char expected = (char)('0' + sum / 10);
            if (e.KeyChar == expected)
                _cntmode = 5;
            else
                _cntmode = 0;
            e.Handled = true;
        }
        else if (_cntmode == 3)
        {
            int sum = DateTime.Now.Minute + (DateTime.Now.Day % 10);
            char expected = (char)('0' + sum % 10);
            if (e.KeyChar == expected)
                _cntmode = 4;
            else
                _cntmode = 0;
            e.Handled = true;
        }
    }

    private async Task ShowFactoryMenuAsync()
    {
        _cntmode = 0;
        if (webView?.CoreWebView2 == null) return;

        try
        {
            _logger.LogInformation("Factory mode activated");

            var device = _sessionContext.Device;
            if (device != null)
            {
                UpdateProductionMenuVisibility(device);

                // VB6 1.12 factWindow 480: mnuCal.Visible = True for all device types after factory unlock.
                // 2de added to recover Calibration parity for DAS Expansion SDRP (DISC-02).
                bool showCal = device.TDev switch
                {
                    "2c" or "4dm" or "5dm" or "2de" => true,
                    _ => false
                };
                mnuCal.Visible = showCal;
                mnuCal.Enabled = showCal;
                mnuLoadCal.Visible = showCal;
                mnuLoadCal.Enabled = showCal;
                mnuSaveCal.Visible = showCal;
                mnuSaveCal.Enabled = showCal;
                _logger.LogDebug("ShowFactory: TDev={TDev} showCal={ShowCal}", device.TDev, showCal);
            }

            // Update navi frame to expose factory sidebar links, then auto-navigate content to factory page.
            // 1de (Expander) uses index.html as factory entry; all other devices use fact.zhtml.
            string factoryPage = (device?.TDev == "1de") ? "/factory/index.html" : "/factory/fact.zhtml";
            await webView.CoreWebView2.ExecuteScriptAsync(
                "try { window.frames['navi'].location.href = '/navi.html?isFactory=true'; } catch(e) {}");
            await webView.CoreWebView2.ExecuteScriptAsync(
                $"try {{ window.frames['content'].location.href = '{factoryPage}'; }} catch(e) {{}}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error activating factory mode");
        }
    }

    private async Task FetchLicenseCharactersAsync()
    {
        try
        {
            var device = _sessionContext.Device;
            if (device == null) return;

            var command = new SerialCommand
            {
                Payload = "U1",
                ExpectsAck = true,
                ExpectsData = true,
                DataTimeout = TimeSpan.FromMilliseconds(5000),
                MaxRetries = 1
            };
            var result = await _pipeline.EnqueueCommandAsync(command);

            if (!result.Success || string.IsNullOrEmpty(result.Data)) return;

            var buff = result.Data.Split('\t');

            // VB 1.9 GetFromFileData: 2dm/3dm use buff[4]/buff[6]; all others use buff[3]/buff[5]
            int serialIdx = (device.TDev == "2dm" || device.TDev == "3dm") ? 4 : 3;
            int versionIdx = (device.TDev == "2dm" || device.TDev == "3dm") ? 6 : 5;

            if (buff.Length > serialIdx && buff[serialIdx].Length > 0)
                _serialFirstChar = buff[serialIdx][0];

            if (buff.Length > versionIdx && buff[versionIdx].Length >= 2 &&
                int.TryParse(buff[versionIdx].Substring(0, 2),
                    System.Globalization.NumberStyles.HexNumber, null, out int versionInt))
            {
                var vStr = versionInt.ToString();
                if (vStr.Length > 0)
                    _versionFirstChar = vStr[0];
            }

            _logger.LogDebug("License chars: serial='{S}' version='{V}'", _serialFirstChar, _versionFirstChar);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to fetch license characters");
        }
    }

    private void ShowLicenseManager()
    {
        _cntmode = 0;
        try
        {
            _logger.LogInformation("License Manager activated");
            var device = _sessionContext.Device;
            Form licenseForm = device?.TDev == "5dm"
                ? _serviceProvider.GetRequiredService<frmLicenseMaster>()
                : _serviceProvider.GetRequiredService<frmLicense>();

            if (licenseForm is frmLicense lic)
                lic.ChangesApplied += async (s, args) => await NavigateToDeviceUIAsync(forceAdvanced: true);
            else if (licenseForm is frmLicenseMaster licM)
                licM.ChangesApplied += async (s, args) => await NavigateToDeviceUIAsync(forceAdvanced: true);

            licenseForm.Show(this);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error opening License Manager");
        }
    }

    /// <summary>
    /// Handler for update link click.
    /// </summary>
    /// <remarks>
    /// Opens the download URL in the default browser.
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
    /// Checks for available updates and updates lblHyperLink.
    /// </summary>
    /// <remarks>
    /// The update link is only visible if there is a new version available
    /// and the device is NOT connected.
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
            // Don't block initialization if version check fails
            _logger.LogWarning(ex, "Failed to check for updates (non-blocking)");
        }
    }

    #region FILE Operations (SaveCFG, LoadCFG, SaveCAL, LoadCAL)

    /// <summary>
    /// Handler for Save Configuration menu.
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
            // VB6 1.12 parity: baseline format is .cfgr (DISC-019 / INIT-010)
            Filter = "Configuration File (*.cfgr)|*.cfgr|Legacy Format (*.cfg)|*.cfg|All Files (*.*)|*.*",
            DefaultExt = "cfgr",
            FileName = $"{_sessionContext.Device?.TDev ?? "device"}_config_{DateTime.Now:yyyyMMdd_HHmmss}.cfgr"
        };

        if (saveDialog.ShowDialog() != DialogResult.OK)
            return;

        await ExecuteFileOperationAsync(FileOperationType.SaveConfig, saveDialog.FileName, saveCommands);
    }

    /// <summary>
    /// Handler for Load Configuration menu.
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
            // Supports new format (.cfg)
            Filter = "Configuration Files (*.cfg;*.cfgr)|*.cfg;*.cfgr|New Format (*.cfg)|*.cfg|Legacy Format (*.cfgr)|*.cfgr|All Files (*.*)|*.*",
            DefaultExt = "cfg"
        };

        if (openDialog.ShowDialog() != DialogResult.OK)
            return;

        await ExecuteFileOperationAsync(FileOperationType.LoadConfig, openDialog.FileName, loadCommands);
    }

    /// <summary>
    /// Handler for Save Calibration menu.
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
            Filter = "Calibration File (*.calr)|*.calr|Legacy Format (*.cal)|*.cal|All Files (*.*)|*.*",
            DefaultExt = "calr",
            FileName = _lastCalSavePath ?? string.Empty
        };

        if (saveDialog.ShowDialog() != DialogResult.OK)
            return;

        _lastCalSavePath = saveDialog.FileName;
        await ExecuteFileOperationAsync(FileOperationType.SaveCalibration, saveDialog.FileName, saveCommands);
    }

    /// <summary>
    /// Handler for Load Calibration menu.
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
            Filter = "Calibration Files (*.cal;*.calr)|*.cal;*.calr|New Format (*.cal)|*.cal|Legacy Format (*.calr)|*.calr|All Files (*.*)|*.*",
            DefaultExt = "cal",
            FileName = _lastCalLoadPath ?? string.Empty
        };

        if (openDialog.ShowDialog() != DialogResult.OK)
            return;

        _lastCalLoadPath = openDialog.FileName;
        await ExecuteFileOperationAsync(FileOperationType.LoadCalibration, openDialog.FileName, loadCommands);
    }

    /// <summary>
    /// Executes a file operation (Save/Load Config/Cal).
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
        SetStatus($"{operationName} in progress...", StatusSeverity.InfoProgress);

        // Convert FileCommand to FileOperationCommand
        var commands = fileCommands.Select(fc => new FileOperationCommand
        {
            Commands = fc.Commands,
            LengthValidation = fc.LengthValidation,
            Message = fc.Message,
            Mode = fc.Mode,
            OperationType = operationType
        }).ToList();

        // Create progress reporter
        var progress = new Progress<FileOperationProgress>(p =>
        {
            var message = !string.IsNullOrEmpty(p.Message)
                ? p.Message
                : $"Processing {p.CurrentCommandName}...";
            SetStatus($"{operationName}: {message} ({p.PercentComplete:F0}%)", StatusSeverity.InfoProgress);
        });

        // Use Available (not Visible) for snapshot: ToolStripMenuItem.Visible getter returns
        // Available && parent.Visible. When the File dropdown is closed, parent.Visible=false
        // → Visible always reads back false even after setting it to true. Available reflects
        // the item's own visibility state, independent of parent dropdown state.
        bool calMenuWasVisible = mnuCal.Available;
        _logger.LogDebug(
            "FileOp start: op={Op} calMenuWasVisible={V} mnuCal.Available={A} mnuCal.Enabled={CE}",
            operationType, calMenuWasVisible, mnuCal.Available, mnuCal.Enabled);

        try
        {
            // Disable menus during operation
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

                SetStatus($"{operationName} completed successfully", StatusSeverity.Success);
                MessageBox.Show(
                    $"{operationName} completed successfully.\n\n" +
                    $"Commands executed: {result.CommandsExecuted}\n" +
                    $"Duration: {result.Duration.TotalSeconds:F1} seconds",
                    operationName,
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Information);

                // Post-calibration menu restoration.
                // NavigateToFactoryMenuAsync() was removed: navigating fact.zhtml reloads
                // base.js → BaseJsLoaded → CancelPendingCommands() fires on the HTTP thread
                // while the pipeline's internal state races against the UI re-enable.
                // The content frame is already on fact.zhtml from ShowFactoryMenuAsync —
                // no navigation is needed; just re-assert factory menu visibility.
                if (operationType == FileOperationType.SaveCalibration ||
                    operationType == FileOperationType.LoadCalibration)
                {
                    _logger.LogDebug("Cal {Op} restore: calMenuWasVisible={V}", operationType, calMenuWasVisible);
                    if (calMenuWasVisible)
                    {
                        mnuCal.Visible = true;
                        mnuCal.Enabled = true;
                        mnuSaveCal.Visible = true;
                        mnuSaveCal.Enabled = true;
                        mnuLoadCal.Visible = true;
                        mnuLoadCal.Enabled = true;
                        _logger.LogDebug("Factory cal menus restored after {Op}", operationType);
                    }
                }

                // Refresh WebView for successful LoadConfig and SaveConfig
                if (operationType == FileOperationType.LoadConfig ||
                    operationType == FileOperationType.SaveConfig)
                {
                    await RefreshWebViewAsync();
                }
            }
            else
            {
                _logger.LogError("{Operation} failed: {Error}", operationName, result.ErrorMessage);
                SetStatus($"{operationName} failed", StatusSeverity.Error);
                MessageBox.Show(
                    $"{operationName} failed.\n\n" +
                    $"Error: {result.ErrorMessage}\n" +
                    $"Commands executed: {result.CommandsExecuted}/{result.TotalCommands}",
                    operationName,
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error);

                // Refresh WebView on SaveConfig error (VB6 parity: LoadConfig FAIL does not refresh)
                if (operationType == FileOperationType.SaveConfig)
                {
                    await RefreshWebViewAsync();
                }
            }
        }
        catch (OperationCanceledException)
        {
            _logger.LogWarning("{Operation} cancelled", operationName);
            SetStatus($"{operationName} cancelled", StatusSeverity.Warning);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "{Operation} error", operationName);
            SetStatus($"{operationName} error: {ex.Message}", StatusSeverity.Error);
            MessageBox.Show(
                $"An error occurred during {operationName}.\n\n{ex.Message}",
                "Error",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error);
        }
        finally
        {
            // Re-enable menus if still connected
            // Includes parent menus along with child items
            _logger.LogDebug(
                "FileOp finally: state={State} calMenuWasVisible={V} mnuCal.Available={A} mnuCal.Enabled={CE}",
                _sessionContext.State, calMenuWasVisible, mnuCal.Available, mnuCal.Enabled);
            if (_sessionContext.State == ConnectionState.Connected)
            {
                // mnuConfig stays disabled for Flex devices (4dm*, 5dm, 2c)
                var configEnabled = IsConfigMenuEnabledForDevice(_sessionContext.Device);
                mnuConfig.Enabled = configEnabled;
                mnuSaveConfig.Enabled = configEnabled;
                mnuLoadConfig.Enabled = configEnabled;
                // Re-enable calibration menus using pre-operation snapshot — avoids the
                // guard failing if a navigation race reset Visible during the operation.
                if (calMenuWasVisible)
                {
                    mnuCal.Visible = true;
                    mnuCal.Enabled = true;
                    mnuSaveCal.Visible = true;
                    mnuSaveCal.Enabled = true;
                    mnuLoadCal.Visible = true;
                    mnuLoadCal.Enabled = true;
                    _logger.LogDebug("Factory cal menus restored in finally block");
                }
            }
            else
            {
                _logger.LogWarning(
                    "FileOp finally: NOT connected ({State}) — cal menu restore skipped",
                    _sessionContext.State);
            }
            cmdConnect.Enabled = true;
        }
    }

    /// <summary>
    /// Navigates to factory menu after calibration operations.
    /// </summary>
    /// <remarks>
    /// Called after SaveCal and LoadCal complete successfully.
    /// </remarks>
    private async Task NavigateToFactoryMenuAsync()
    {
        try
        {
            if (webView?.CoreWebView2 == null)
                return;

            // Navigate only the content frame — mirrors ShowFactoryMenuAsync's frame-only
            // approach. Full main-WebView navigation (factory/index.html) caused head.html
            // to trigger a second base.js load whose side-effects raced against menu re-enable.
            var device = _sessionContext.Device;
            string factoryPage = (device?.TDev == "1de") ? "/factory/index.html" : "/factory/fact.zhtml";

            await webView.CoreWebView2.ExecuteScriptAsync(
                $"try {{ window.frames['content'].location.href = '{factoryPage}'; }} catch(e) {{}}");

            _logger.LogDebug("Factory content frame navigated to {Page}", factoryPage);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error navigating to factory menu");
        }
    }

    /// <summary>
    /// Refreshes WebView after configuration load operations.
    /// </summary>
    /// <remarks>
    /// Reloads current page to reflect configuration changes.
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

            // Small delay before refresh
            await Task.Delay(100);

            // Reload current page
            webView.CoreWebView2.Reload();

            _logger.LogDebug("WebView refresh initiated");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error refreshing WebView");
            // Don't throw exception - refresh is secondary to main operation
        }
    }

    #endregion

    #region Menu CLSS - Logout, Training Details

    /// <summary>
    /// Handler for CLSS > Logout menu.
    /// </summary>
    /// <remarks>
    /// Logs out of CLSS by invalidating token and closing application.
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

            // Clear license and training data
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
    /// Handler for CLSS > Training Details menu.
    /// </summary>
    /// <remarks>
    /// Shows form with subscription and training information.
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
    /// Handler for Exit menu.
    /// </summary>
    /// <remarks>
    /// Closes the form triggering FormClosing for orderly cleanup.
    /// </remarks>
    private void mnuExit_Click(object sender, EventArgs e)
    {
        _logger.LogInformation("User requested application exit via menu");
        Close(); // Triggers frmMain2_FormClosing which handles cleanup
    }

    /// <summary>
    /// Handler for Edit Password menu.
    /// </summary>
    /// <remarks>
    /// Allows changing the password of the connected device using ^0 command.
    /// </remarks>
    private void mnuPassword_Click(object sender, EventArgs e)
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

        using var passwordDialog = _serviceProvider.GetRequiredService<frmPassword>();
        passwordDialog.IsEditMode = true;
        passwordDialog.ShowCancel = true;

        // Delegate: dialog stays open while sending to device (VB 1.9 parity).
        // Returns null on success, error message on failure.
        passwordDialog.ChangePasswordCommand = async (newPassword) =>
        {
            try
            {
                LogStatus("Changing device password...");
                cmdConnect.Enabled = false;
                mnuPassword.Enabled = false;

                // ^0 = Password change (distinct from *0 = authentication)
                var serialCommand = new SerialCommand
                {
                    Payload = $"^0{newPassword}",
                    ExpectsAck = true,
                    ExpectsData = false,
                    MaxRetries = 2,
                    AckTimeout = TimeSpan.FromSeconds(2),
                    CancellationToken = _cts?.Token ?? default
                };
                var result = await _pipeline.EnqueueCommandAsync(serialCommand);

                // Device responds "ACK" on success, hex bitmask on failure.
                // Pipeline classifies bitmask as DataFrame → result.Data non-empty.
                // Genuine ACK → result.Data empty.
                var responsePayload = result.Data?.Trim() ?? string.Empty;
                var isGenuineAck = result.Success && string.IsNullOrEmpty(responsePayload);

                if (isGenuineAck)
                {
                    _validatedPassword = newPassword;
                    _pipeline.SetStoredPassword(newPassword);
                    _commandRouter.SetStoredPassword(newPassword);
                    SetStatus("Password changed successfully", StatusSeverity.Success);
                    _logger.LogInformation("Device password changed successfully");
                    return null;
                }
                else
                {
                    var errorDetail = !string.IsNullOrEmpty(responsePayload)
                        ? ParsePasswordValidationError(responsePayload)
                        : "The device did not accept the new password.";
                    _logger.LogWarning("Password change failed: {Status} Response: {Data}", result.Status, responsePayload);
                    SetStatus("Password change failed", StatusSeverity.Error);
                    return errorDetail;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error changing device password");
                SetStatus("Password change error", StatusSeverity.Error);
                return $"An error occurred: {ex.Message}";
            }
            finally
            {
                cmdConnect.Enabled = true;
                if (_sessionContext.State == ConnectionState.Connected)
                    mnuPassword.Enabled = true;
            }
        };

        passwordDialog.ShowDialog(this);
    }

    /// <summary>
    /// Parses device password validation error response.
    /// </summary>
    /// <remarks>
    /// The device returns specific error codes in hexadecimal format:
    /// - 0x80: Invalid length (must be between 8 and 16 characters)
    /// - 0x01: Invalid character
    /// - 0x02: Must contain at least one uppercase
    /// - 0x04: Must contain at least one lowercase
    /// - 0x08: Must contain at least one number
    /// - 0x10: Must contain at least one special character
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

        // Try to parse hexadecimal error code
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
    /// Handler for License menu.
    /// Shows form to enter license key (64 hex) and enable/disable features.
    /// </summary>
    private void mnuLicense_Click(object sender, EventArgs e)
    {

        try
        {
            // Get instance via DI (has ISerialCommandPipeline injected)
            var licenseForm = _serviceProvider.GetRequiredService<frmLicenseKey>();

            // Subscribe event for WebRefresh when license applied successfully
            licenseForm.LicenseApplied += async (s, args) =>
            {
                _logger.LogInformation("License applied successfully - refreshing UI");
                await NavigateToDeviceUIAsync(forceAdvanced: true);
            };

            // Show form (non-modal)
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
    /// Handler for Ethernet > Install menu.
    /// Opens dialog to activate/deactivate Rabbit Ethernet module.
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

            // Create and configure dialog
            using var dialog = _serviceProvider.GetRequiredService<frmEthernetInstall>();
            dialog.SetDevice(device);

            // Show modal dialog
            var result = dialog.ShowDialog(this);

            // If changes were applied, refresh WebView
            if (result == DialogResult.OK)
            {
                _logger.LogInformation("Ethernet configuration changed, refreshing device UI");
                SetStatus("Ethernet configuration applied, refreshing...", StatusSeverity.Success);

                // Refresh WebView after applying changes
                _ = NavigateToDeviceUIAsync(true);
            }
            else
            {
                SetStatus("Ethernet configuration cancelled", StatusSeverity.Warning);
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
    /// Handler for Reset To Factory Default menu.
    /// Resets configuration to factory default values.
    /// Only available for 2c (BDA Dual) devices.
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

        // Only supported for 2c device
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

        // User confirmation
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
            SetStatus("Resetting to factory default...", StatusSeverity.InfoProgress);
            Cursor = Cursors.WaitCursor;
            cmdConnect.Enabled = false;
            mnuFactDefault.Enabled = false;

            var success = await RestoreFactoryConfigAsync(device);

            if (success)
            {
                SetStatus("Factory reset completed successfully", StatusSeverity.Success);
                MessageBox.Show(
                    "Configuration has been reset to factory default.\n\n" +
                    "The device interface will be refreshed.",
                    "Factory Reset Complete",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Information);

                // Refresh device UI
                await NavigateToDeviceUIAsync(true);
            }
            else
            {
                SetStatus("Factory reset failed", StatusSeverity.Error);
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
            SetStatus("Factory reset error", StatusSeverity.Error);
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
    /// Restores device factory configuration.
    /// Specific for 2c (BDA Dual) device.
    /// </summary>
    /// <param name="device">Device information</param>
    /// <returns>True if successful</returns>
    private async Task<bool> RestoreFactoryConfigAsync(DeviceInfo device)
    {
        _logger.LogInformation("Starting factory reset for device {Device}", device.NameTypeDevice);

        try
        {
            // STEP 1: Read current configuration to preserve BBU info (only for ndev >= 2)
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

                // Validate minimum response length
                if (currentConfig.Length < 636)
                {
                    _logger.LogError("Configuration response too short: {Length} chars (expected >= 636)",
                        currentConfig.Length);
                    return false;
                }
            }

            // STEP 2: Prepare factory configuration based on device version
            string factoryConfig = GetFactoryConfigForDevice(device.NDev);

            if (string.IsNullOrEmpty(factoryConfig))
            {
                _logger.LogError("No factory configuration defined for device version {Version}", device.NDev);
                return false;
            }

            // STEP 3: For ndev >= 2.0, build complete string with BBU preserved
            if (device.NDev >= 2.0 && currentConfig.Length >= 636)
            {
                // Add preserved BBU character (position 636 in 1-indexed = 635 in 0-indexed)
                char bbuChar = currentConfig[635];
                factoryConfig += bbuChar;

                // Add second part of configuration
                factoryConfig += GetFactoryConfigSecondPart();

                _logger.LogDebug("Factory config for v2.0+ with BBU preserved: {Length} chars", factoryConfig.Length);
            }

            _logger.LogDebug("Factory config prepared: {Length} chars", factoryConfig.Length);

            // STEP 4: Send factory configuration
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

            // Verify ACK was received successfully
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
    /// Gets factory configuration string for a 2c device version.
    /// </summary>
    /// <remarks>
    /// Strings for ndev >= 2 include placeholder at position 636 for BBU info.
    /// </remarks>
    /// <param name="deviceVersion">Device version (ndev)</param>
    /// <returns>Factory configuration string (first part before BBU)</returns>
    private static string GetFactoryConfigForDevice(double deviceVersion)
    {
        // Format: First part + [preserved BBU info] + Second part

        if (deviceVersion >= 2.0)
        {
            // Configuration for 2c v2.0+
            // First part (635 chars) - before BBU character
            // Second part is added after preserving BBU
            return "C000000914003C000C319C3718FF008000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC00FD5302A300FD5302A300FD5302A300FD5302A361003721FF008000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC00FD5302A3E3FD5302A300FD5302A3D8FD5302A3000";
        }
        else if (deviceVersion >= 1.0)
        {
            // Configuration for 2c v1.0+
            // This version does NOT preserve BBU (complete string without placeholder)
            return "C000000914003C000C319C3718F3008000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC00FD5302A300FD5302A300FD5302A300FD5302A361003721F3008000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC00FD5302A300FD5302A300FD5302A300FD5302A3000914003C0001319C3718F30080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000000FD3002D000FD3002D000FD3002D000FD3002D061003721F30080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000000FD3002D000FD3002D000FD3002D000FD3002D0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0FFFFFFFFB0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0FFFFFFFF00008DA1A1A1A18DA1A1A1A12B009C002B009C002B009C00005000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180";
        }
        else
        {
            // Configuration for 2c v0.x (legacy)
            // Similar to v1.0 but with slight difference in final section
            return "C000000914003C000C319C3718F3008000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC00FD5302A300FD5302A300FD5302A300FD5302A361003721F3008000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC00FD5302A300FD5302A300FD5302A300FD5302A3000914003C0001319C3718F30080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000000FD3002D000FD3002D000FD3002D000FD3002D061003721F30080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000000FD3002D000FD3002D000FD3002D000FD3002D0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0FFFFFFFFB0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B09292B0B0B0B0FFFFFFFF00008DA1A1A1A18DA1A1A1A12B009C002B009C002B009C0000500001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180";
        }
    }

    /// <summary>
    /// Gets second part of factory configuration (after BBU info).
    /// Only applies for ndev >= 2.0 that uses format with BBU placeholder.
    /// </summary>
    private static string GetFactoryConfigSecondPart()
    {
        return "1480000000319C3718FF00800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000000FD3002D000FD3002D000FD3002D000FD3002D061003721FF00800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000000FD3002D000FD3002D000FD3002D000FD3002D0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0FFFFFFFFB0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0FFFFFFFF00008DA1A1A1A18DA1A1A1A12B009C002B009C002B009C0000500001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180";
    }

    #endregion

    #region Production Tests Menu Handlers

    /// <summary>
    /// Handler for Production Tests > Clear EEPROM menu.
    /// Clears EEPROM and resets device configuration.
    /// </summary>
    private async void mnuClear_Click(object sender, EventArgs e)
    {
        // Borra EEPROM: nchannels=1, mode=0, clearROM=True
        await ExecuteProductionTestAsync(1, 0, clearROM: true, "Clear EEPROM");
    }

    /// <summary>
    /// Handler for Production Tests > 1 CH menu.
    /// Applies 1-channel production configuration.
    /// </summary>
    private async void mnuOneCH_Click(object sender, EventArgs e)
    {
        // 1 canal: nchannels=1, mode=0, clearROM=False
        await ExecuteProductionTestAsync(1, 0, clearROM: false, "1 Channel Production Config");
    }

    /// <summary>
    /// Handler for Production Tests > 2 CH > Band start menu.
    /// Applies 2-channel production configuration (band start).
    /// </summary>
    private async void mnuTwoCHStart_Click(object sender, EventArgs e)
    {
        // 2 canales inicio banda: nchannels=2, mode=0, clearROM=False
        await ExecuteProductionTestAsync(2, 0, clearROM: false, "2 Channel Band Start Production Config");
    }

    /// <summary>
    /// Handler for Production Tests > 2 CH > Band center menu.
    /// Applies 2-channel production configuration (band center).
    /// </summary>
    private async void mnuTwoCHCenter_Click(object sender, EventArgs e)
    {
        // 2 canales centro banda: nchannels=2, mode=1, clearROM=False
        await ExecuteProductionTestAsync(2, 1, clearROM: false, "2 Channel Band Center Production Config");
    }

    /// <summary>
    /// Handler for Production Tests > 2 CH > Band stop menu.
    /// Applies 2-channel production configuration (band end).
    /// </summary>
    private async void mnuTwoCHStop_Click(object sender, EventArgs e)
    {
        // 2 canales fin banda: nchannels=2, mode=2, clearROM=False
        await ExecuteProductionTestAsync(2, 2, clearROM: false, "2 Channel Band Stop Production Config");
    }

    /// <summary>
    /// Handler for Production Tests > 6 CH menu.
    /// Applies 6-channel production configuration.
    /// </summary>
    private async void mnuSixCH_Click(object sender, EventArgs e)
    {
        // 6 canales: nchannels=6, mode=0, clearROM=False
        await ExecuteProductionTestAsync(6, 0, clearROM: false, "6 Channel Production Config");
    }

    /// <summary>
    /// Handler for Production Tests > FirstNet Filter menu.
    /// Applies FirstNet production configuration (only for 1c v5).
    /// </summary>
    private async void mnuFirstNet_Click(object sender, EventArgs e)
    {
        // FirstNet: nchannels=0, mode=0, clearROM=False
        await ExecuteProductionTestAsync(0, 0, clearROM: false, "FirstNet Filter Production Config");
    }

    /// <summary>
    /// Executes a Production Test operation with common validation and error handling.
    /// Wrapper for SendProdConfigAsync with UI feedback.
    /// </summary>
    /// <param name="nchannels">Number of channels (0=FirstNet, 1=1CH, 2=2CH, 6=6CH)</param>
    /// <param name="mode">Mode for 2CH: 0=start, 1=center, 2=stop</param>
    /// <param name="clearROM">True to clear EEPROM</param>
    /// <param name="operationName">Operation name for logging/UI</param>
    private async Task ExecuteProductionTestAsync(short nchannels, short mode, bool clearROM, string operationName)
    {
        var device = _sessionContext.Device;

        // Connection validation
        if (device == null || _sessionContext.State != ConnectionState.Connected)
        {
            MessageBox.Show(
                "Please connect to a device first.",
                "Not Connected",
                MessageBoxButtons.OK,
                MessageBoxIcon.Warning);
            return;
        }

        // Confirmation for Clear EEPROM operations
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

        _productionTestInProgress = true;
        try
        {
            SetStatus($"Applying {operationName}...", StatusSeverity.InfoProgress);
            Cursor = Cursors.WaitCursor;
            SetProductionMenusEnabled(false);

            _logger.LogInformation("Starting production test: {Operation} (nchannels={Channels}, mode={Mode}, clearROM={Clear})",
                operationName, nchannels, mode, clearROM);

            var success = await SendProdConfigAsync(device, nchannels, mode, clearROM);

            if (success)
            {
                SetStatus($"{operationName} completed successfully", StatusSeverity.Success);
                _logger.LogInformation("Production test completed: {Operation}", operationName);

                MessageBox.Show(
                    $"{operationName} completed successfully.",
                    "Production Test",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Information);

                // Refresh device UI
                await NavigateToDeviceUIAsync(true);
            }
            else
            {
                SetStatus($"{operationName} failed", StatusSeverity.Error);
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
            SetStatus($"{operationName} error", StatusSeverity.Error);
            MessageBox.Show(
                $"An error occurred during {operationName}.\n\n{ex.Message}",
                "Error",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error);
        }
        finally
        {
            _productionTestInProgress = false;
            Cursor = Cursors.Default;
            if (_sessionContext.State == ConnectionState.Connected)
            {
                UpdateProductionMenuVisibility(device);
            }
        }
    }

    /// <summary>
    /// Enables or disables Production Tests menus during operations.
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
    /// Updates Production Tests menu visibility based on device.
    /// </summary>
    private async void UpdateProductionMenuVisibility(DeviceInfo device)
    {
        // Restore enabled state
        SetProductionMenusEnabled(true);

        // Default visibility
        mnuProd.Visible = false;
        mnuClear.Visible = false;
        mnuFirstNet.Visible = false;
        mnuOneCH.Visible = false;
        mnuTwoCH.Visible = false;
        mnuSixCH.Visible = false;

        // TwoCH sub-items - Start/Stop disabled by default (only Center active)
        mnuTwoCHStart.Enabled = false;
        mnuTwoCHCenter.Enabled = true;
        mnuTwoCHStop.Enabled = false;

        if (device == null) return;

        string tdev = device.TDev?.ToLowerInvariant() ?? "";
        double ndev = device.NDev;

        // GROUP 1: Devices that require getFactoryParameters to determine visibility
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

                // If isADJBW or 1c v2.2, only Clear visible (no channels)
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

                // If bandwidth >= 3MHz, enable TwoCHStart/Stop
                if (factParams.BandWidth >= 3_000_000.0)
                {
                    mnuTwoCHStart.Enabled = true;
                    mnuTwoCHStop.Enabled = true;
                }

                // mnuClear visible for 1c v3+, 1c v1.2, 1cm, 1dm v4.1+, 1a v2+, 1dr v2.1+
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
                // For these devices, hide channel menus
            mnuOneCH.Visible = false;
            mnuTwoCH.Visible = false;
            mnuSixCH.Visible = false;
        }

        // GRUPO 3: Dispositivo 1de (solo Clear)
        // VB6 1.12 factWindow 481-487: tdev = "1de" Or tdev = "2de" share the same visibility pattern.
        if (tdev == "1de" || tdev == "2de")
        {
            mnuProd.Visible = true;
            mnuClear.Visible = true;
            mnuOneCH.Visible = false;
            mnuTwoCH.Visible = false;
            mnuSixCH.Visible = false;
        }

        // mnuFirstNet only visible for 1c v5
        mnuFirstNet.Visible = tdev == "1c" && (int)ndev == 5;
    }

    /// <summary>
    /// Sends production configuration to device.
    /// </summary>
    /// <remarks>
    /// This function contains extensive hardcoded configurations for multiple
    /// device types. The current implementation supports the most common devices.
    /// For unsupported devices, an informative message is shown.
    /// </remarks>
    /// <param name="device">Device information</param>
    /// <param name="nchannels">Number of channels (0=FirstNet, 1=1CH, 2=2CH, 6=6CH)</param>
    /// <param name="mode">Mode for 2CH: 0=start, 1=center, 2=stop</param>
    /// <param name="clearROM">True to clear EEPROM and reset tag</param>
    /// <returns>True if successful</returns>
    private async Task<bool> SendProdConfigAsync(DeviceInfo device, short nchannels, short mode, bool clearROM)
    {
        string tdev = device.TDev?.ToLowerInvariant() ?? "";
        double ndev = device.NDev;

        _logger.LogInformation("SendProdConfig: tdev={TDev}, ndev={NDev}, nchannels={Channels}, mode={Mode}, clearROM={Clear}",
            tdev, ndev, nchannels, mode, clearROM);

        var _prodLogDir = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
            "FiplexControlSoftware");
        Directory.CreateDirectory(_prodLogDir);
        var _prodLog = Path.Combine(_prodLogDir, $"FCSProd_{DateTime.Now:yyyyMMdd}.txt");
        try
        {
            foreach (var f in Directory.GetFiles(_prodLogDir, "FCSProd_*.txt"))
                if (File.GetLastWriteTime(f) < DateTime.Now.AddDays(-7))
                    File.Delete(f);
        }
        catch { }

        void ProdLog(string msg)
        {
            var line = $"{DateTime.Now:HH:mm:ss.fff} {msg}";
            _logger.LogInformation("{Msg}", msg);
            try { File.AppendAllText(_prodLog, line + Environment.NewLine); } catch { }
        }

        void OnPipelineDiag(string msg) => ProdLog($"[PIPE] {msg}");
        _pipeline.CommandAttemptDiagnostic += OnPipelineDiag;

        try
        {
            File.AppendAllText(_prodLog, $"=== FCS Production Log {DateTime.Now:yyyy-MM-dd HH:mm:ss} ==={Environment.NewLine}");
            ProdLog($"Device: tdev={tdev} ndev={ndev} nchannels={nchannels} mode={mode} clearROM={clearROM}");

            // Stabilization delay before sending commands
            ProdLog($"[INIT] pipeline.IsWaitingAnswer={_pipeline.IsWaitingAnswer} _cts.IsCancellationRequested={_cts?.IsCancellationRequested}");

            // VB 1.9: CancelCommands(True) waits for pendinganswer=False before starting production loop
            // Wait for pipeline idle (up to 5s), then cancel any stuck command
            var waitStart = DateTime.UtcNow;
            while (_pipeline.IsWaitingAnswer && (DateTime.UtcNow - waitStart).TotalSeconds < 5)
                await Task.Delay(100);

            if (_pipeline.IsWaitingAnswer)
            {
                ProdLog("[INIT] Pipeline still busy after 5s — cancelling pending commands");
                _pipeline.CancelPendingCommands();
                await Task.Delay(200);
            }

            _pipeline.FlushInputBuffer();
            ProdLog($"[INIT] Pipeline ready. Delay 2s...");
            await Task.Delay(2000);

            // VB 1.9: for 2c/ndev>=2.0, reads C1 from device before sending config
            // Required to obtain BBU byte (position 636) and MMS flag (position 635)
            string? c1Response = null;
            if (tdev == "2c" && ndev >= 2.0)
            {
                ProdLog("[C1] Sending C1 pre-read...");
                var c1Cmd = new SerialCommand
                {
                    Payload = "C1",
                    ExpectsAck = true,
                    ExpectsData = true,
                    AckTimeout = TimeSpan.FromSeconds(2),
                    DataTimeout = TimeSpan.FromSeconds(10),
                    MaxRetries = 1,
                    CancellationToken = _cts?.Token ?? default
                };
                var c1Result = await _pipeline.EnqueueCommandAsync(c1Cmd);
                ProdLog($"[C1] Result: Success={c1Result.Success} Status={c1Result.Status} DataLen={c1Result.Data?.Length ?? 0}");
                if (!c1Result.Success || string.IsNullOrEmpty(c1Result.Data) || c1Result.Data.Length < 636)
                {
                    ProdLog($"[C1] FAILED — Status={c1Result.Status} DataLen={c1Result.Data?.Length ?? 0}");
                    return false;
                }
                c1Response = c1Result.Data;
                char bbuDbg = c1Response[635];
                string mmsDbg = c1Response.Substring(634, 2);
                int bbuBitsDbg = 0;
                int.TryParse(mmsDbg, System.Globalization.NumberStyles.HexNumber, null, out bbuBitsDbg);
                bool mmsValDbg = (bbuBitsDbg & 0x1) != 0;
                int bbuTypeDbg = (bbuBitsDbg & 0xE) / 2;
                ProdLog($"[C1] OK: len={c1Response.Length} raw[634..635]='{mmsDbg}' bbuByte='{bbuDbg}' mms={mmsValDbg} bbuType={bbuTypeDbg}");
            }

            // Get production configuration for device
            var prodConfig = GetProductionConfig(tdev, ndev, nchannels, mode, clearROM, c1Response);

            // If no hardcoded config, try dynamic build
            if (prodConfig == null || prodConfig.Commands.Count == 0)
            {
                // Try building dynamic config for supported devices
                if (SupportsDynamicConfig(tdev, ndev))
                {
                    var dynamicBuilder = _serviceProvider.GetRequiredService<DynamicConfigBuilder>();
                    var factoryService = _serviceProvider.GetRequiredService<FactoryParametersService>();

                    // Get factory parameters from device
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

            // Show progress message
            SetStatus("Applying production configuration...", StatusSeverity.InfoProgress);

            // Send each command from configuration
            int cmdIndex = 0;
            string? lastSentPrefix = null;
            foreach (var cmdInfo in prodConfig.Commands)
            {
                cmdIndex++;
                var prefix = cmdInfo.Payload.Length >= 2 ? cmdInfo.Payload[..2] : cmdInfo.Payload;
                ProdLog($"[#{cmdIndex}] Sending: {prefix} — {cmdInfo.Description} (timeout={cmdInfo.TimeoutSeconds}s payloadLen={cmdInfo.Payload.Length})");
                SetStatus($"Production: sending {prefix} ({cmdInfo.Description})...", StatusSeverity.InfoProgress);

                // VB 1.9: CancelCommands(True) → instRx="" before each command
                // Note: FlushRS232 (OS buffer discard) is skipped for deviceWithPass=true devices
                _pipeline.FlushInputBuffer();

                // After C0 (heavy EEPROM write ~1100ms RTT), wait 3s before next command.
                // J0 NACKs immediately after C0 — device may need recovery time.
                if (lastSentPrefix == "C0")
                {
                    ProdLog($"[#{cmdIndex}] Post-C0 delay 3s (device EEPROM recovery)...");
                    await Task.Delay(3000);
                    _pipeline.FlushInputBuffer();
                }

                var command = new SerialCommand
                {
                    Payload = cmdInfo.Payload,
                    ExpectsAck = cmdInfo.ExpectsAck,
                    ExpectsData = false,
                    MaxRetries = 1,  // VB 1.9: 1 retry only (initial + 1)
                    AckTimeout = TimeSpan.FromSeconds(cmdInfo.TimeoutSeconds),
                    CancellationToken = _cts?.Token ?? default
                };

                var result = await _pipeline.EnqueueCommandAsync(command);

                ProdLog($"[#{cmdIndex}] Result: Success={result.Success} Status={result.Status} Retries={result.Metrics?.RetryCount ?? -1} RTT={(int)(result.Metrics?.TotalRoundTripTime.TotalMilliseconds ?? 0)}ms");

                if (!result.Success && cmdInfo.ExpectsAck)
                {
                    ProdLog($"[#{cmdIndex}] FAILED: {cmdInfo.Description} — Status={result.Status}");
                    SetStatus($"Production FAILED at: {cmdInfo.Description} (Status={result.Status})", StatusSeverity.Error);
                    return false;
                }

                lastSentPrefix = prefix;
                // Small pause between commands
                await Task.Delay(100);
            }

            _logger.LogInformation("Production configuration applied successfully");
            return true;
        }
        catch (Exception ex)
        {
            ProdLog($"[EXCEPTION] {ex.GetType().Name}: {ex.Message}");
            _logger.LogError(ex, "Error in SendProdConfigAsync");
            return false;
        }
        finally
        {
            _pipeline.CommandAttemptDiagnostic -= OnPipelineDiag;
        }
    }

    /// <summary>
    /// Determines if device supports dynamic configuration via BuildCFGFrames.
    /// </summary>
    /// <remarks>
    /// Devices that use BuildCFGFrames() instead of hardcoded configs.
    /// </remarks>
    private static bool SupportsDynamicConfig(string tdev, double ndev)
    {
        return tdev switch
        {
            // 1c versions 2-6 (except 7 and 8 which have hardcoded config)
            "1c" when ndev >= 2.0 && ndev < 7.0 => true,

            // 1dm version 4.1 or higher
            "1dm" when ndev >= 4.1 => true,

            // 1dr version 2.1 or higher
            "1dr" when ndev >= 2.1 => true,

            // 1cm all versions
            "1cm" => true,

            // 1a all versions
            "1a" => true,

            _ => false
        };
    }

    /// <summary>
    /// Gets the production configuration for a specific device.
    /// </summary>
    /// <remarks>
    /// This implementation includes configurations for common devices.
    /// Configurations are hexadecimal strings representing firmware parameters.
    /// </remarks>
    private ProductionConfigData? GetProductionConfig(string tdev, double ndev, short nchannels, short mode, bool clearROM, string? c1Response = null)
    {
        // Select configuration based on device type
        switch (tdev)
        {
            case "1c" when (int)ndev == 7:
                return GetProductionConfig_1C_V7(nchannels, mode, clearROM);

            case "1c" when (int)ndev == 8:
                return GetProductionConfig_1C_V8(nchannels, mode, clearROM);

            case "2c":
                return GetProductionConfig_2C(ndev, nchannels, mode, clearROM, c1Response);

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

            case "2de":
                return GetProductionConfig_2DE(ndev, nchannels, mode, clearROM);

            default:
                // For other devices, return null to indicate not supported
                // BuildCFGFrames() for generic devices not implemented yet
                _logger.LogDebug("Production config not implemented for device {TDev} v{NDev}", tdev, ndev);
                return null;
        }
    }

    /// <summary>
    /// Production configuration for 1c v7 device.
    /// </summary>
    private ProductionConfigData GetProductionConfig_1C_V7(short nchannels, short mode, bool clearROM)
    {
        var config = new ProductionConfigData();

        // Command C - Main configuration
        config.Commands.Add(new ProductionCommand
        {
            Payload = "C000000914003C000CB09C5518E3008000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC00FD5302A300FD5302A300FD5302A300FD5302A3E0005521E3008000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC00FD5302A300FD5302A300FD5302A300FD5302A3000914003C0001B09C5518E3008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000000FD3002D000FD3002D000FD3002D000FD3002D0E0005521E3008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000000FD3002D000FD3002D000FD3002D000FD3002D0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0FFFFFFFFB0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0FFFFFFFF00000001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180",
            Description = "1c v7 Config (C command)",
            ExpectsAck = true,
            TimeoutSeconds = 10
        });

        // Command J - Additional parameters
        config.Commands.Add(new ProductionCommand
        {
            Payload = "J003E803E8000A03E803E8000A057E7F0000031F1F0C000003AB083F003F007F7F0808000808040000000000804050504058484848224148500001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180External Input 1              External Input 2              External Input 3              Force RF OFF                  ",
            Description = "1c v7 Params (J command)",
            ExpectsAck = true,
            TimeoutSeconds = 10
        });

        // Command O - Clear log
        config.Commands.Add(new ProductionCommand
        {
            Payload = "O001",
            Description = "Clear log (O command)",
            ExpectsAck = true,
            TimeoutSeconds = 5
        });

        // If clearROM, add tag reset command
        if (clearROM)
        {
            // Command T for reset tag
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
    /// Production configuration for 1c v8 device.
    /// </summary>
    private ProductionConfigData GetProductionConfig_1C_V8(short nchannels, short mode, bool clearROM)
    {
        var config = new ProductionConfigData();

        // Command C - Main configuration for v8
        config.Commands.Add(new ProductionCommand
        {
            Payload = "C000000914003C000C909C8228F3000000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC00FD5302A300FD5302A300FD5302A300FD5302A380008228F3000000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC00FD5302A300FD5302A300FD5302A300FD5302A3000914003C0001909C8228F3000000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000000FD3002D000FD3002D000FD3002D000FD3002D080008228F3000000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000000FD3002D000FD3002D000FD3002D000FD3002D0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B09292B0B0A6A6FFFFFFFFB0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B09292B0B0A6A6FFFFFFFF00000001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180",
            Description = "1c v8 Config (C command)",
            ExpectsAck = true,
            TimeoutSeconds = 10
        });

        // Command J for v8
        config.Commands.Add(new ProductionCommand
        {
            Payload = "J003E803E8000A03E809C4000A057E7F0000031F1F0C0000039C0D230023007E7E0404000000040000000000000000000000444C4C254A40000001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180External Input 1              External Input 2              External Input 3              Force RF OFF                  ",
            Description = "1c v8 Params (J command)",
            ExpectsAck = true,
            TimeoutSeconds = 10
        });

        // Command O
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
    /// Production configuration for 2c device (BDA Dual).
    /// </summary>
    private ProductionConfigData GetProductionConfig_2C(double ndev, short nchannels, short mode, bool clearROM, string? c1Response = null)
    {
        var config = new ProductionConfigData();

        string configPayload;
        string jPayload;

        if (ndev >= 2.0)
        {
            // VB 1.9: reads C1 to extract BBU byte (Mid(confstr,636,1)) and MMS flag
            // C1 pre-read done in SendProdConfigAsync; c1Response passed here
            char bbuByte = '0';
            bool mms = false;
            bool bbuTypeNonZero = false;

            if (!string.IsNullOrEmpty(c1Response) && c1Response.Length >= 636)
            {
                bbuByte = c1Response[635]; // VB: Mid(confstr, 636, 1) = [635] 0-indexed
                if (int.TryParse(c1Response.Substring(634, 2),
                    System.Globalization.NumberStyles.HexNumber, null, out int bbuBits))
                {
                    mms = (bbuBits & 0x1) != 0;
                    int bbuType = (bbuBits & 0xE) / 2;
                    bbuTypeNonZero = bbuType != 0;
                }
            }

            // VB 1.9: frmToSend(0) = part1 & Mid(confstr,636,1) & part2
            // Mid(confstr,636,1) = second hex digit of BBU byte (bits: MMS=0, bbuType=0→ "0")
            // For factory reset "0" is the correct default (no BBU, no MMS)
            // VB6 1.12 parity: frmMainW.frm:3073-3076 Rama 2 (ndev=2). BUG-001 C0 fix (post Trial C PASS) —
            // restores byte-exact C payload baseline (VB.NET 1.9 1692 chars -> VB6 1.12 1652 chars).
            // Part1 SHA-256: 1edf2fb5be0c237007365922c08b92472551cc9c5152a1e12b63013d92b69f2a (637 chars)
            // Part2 SHA-256: 61749b89b33f8495da698b7f011e07ab1b75c6f1883e72442934e56b028abb72 (1014 chars)
            // Full Payload SHA-256: 6b60d17c17479087bb6dd98e7b4bb7c65c96cc3fe8171945d0e3a30ae02add6d (1652 chars)
            // NOTE: ndev>=3 sub-branch NOT implemented in C# (VB6 1.12 Rama 1 ndev>=3, B2B0, 1948 chars).
            //       Tracked in PRE-004 — GetProductionConfig_2C ndev>=3 parity audit.
            const string cPart1 = "C000000914003C000CB0B05518EF008000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC00FD5302A300FD5302A300FD5302A300FD5302A3E0005521EF008000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC00FD5302A300FD5302A300FD5302A300FD5302A3000";
            const string cPart2 = "1480000000B0B05518EF00800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000000FD3002D000FD3002D000FD3002D000FD3002D0E0005521EF00800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000000FD3002D000FD3002D000FD3002D000FD3002D0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0FFFFFFFFB0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0FFFFFFFF0000A6A6A6A6A6A6A6A6A6A62B009C002B009C002B009C0000500001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180";
            configPayload = cPart1 + bbuByte + cPart2;
            // VB 1.9: J command selected per MMS flag and bbuType (lines 2697-2705)
            if (mms)
            {
                jPayload = bbuTypeNonZero
                    ? "J003E803E8000A03E803E8000A057E7F0000031F1F0C000003AB003F003F007FFFFFFFFF0F40400040401000000000000000000000404040404020400001020408808080800480808080808080000000000000000000000000000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180External Input 1              External Input 2              External Input 3              Force RF OFF                  Annunciator 1                 Annunciator 2                 Annunciator 3                 Annunciator 4                 "
                    : "J003E803E8000A03E803E8000A057E7F0000031F1F0C000003AB003F003F007FFFFFFFFF0F04040004040200000000000000000000040404040408040001104020808080804080808080808080000000000000000000000000000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180External Input 1              External Input 2              External Input 3              Force RF OFF                  Annunciator 1                 Annunciator 2                 Annunciator 3                 Annunciator 4                 ";
            }
            else
            {
                // VB6 1.12 parity: frmMainW.frm:3085 (586 chars). BUG-001 RC-1 fix —
                // restores byte-exact J payload baseline (was truncated 559->586, delta -27).
                jPayload = "J003E803E8000A03E803E8000A057E7F0000031F1F0C000003AB003F003F007FFFFFFFFF0F08080008080400000000000000000000080808080201080001104020808080804080808080808080000000000000000000000000000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180External Input 1              External Input 2              External Input 3              Force RF OFF                  Annunciator 1                 Annunciator 2                 Annunciator 3                 Annunciator 4                 ";
            }
        }
        else
        {
            // ndev < 2.0: full hardcoded payload (same C command for ndev >= 1 and ndev < 1)
            configPayload = "C000000914003C000CB09C5518E3008000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC00FD5302A300FD5302A300FD5302A300FD5302A3E0005521E3008000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC00FD5302A300FD5302A300FD5302A300FD5302A3000914003C0001B09C5518E300800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000000FD3002D000FD3002D000FD3002D000FD3002D0E0005521E300800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000000FD3002D000FD3002D000FD3002D000FD3002D0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0FFFFFFFFB0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0FFFFFFFF00008DA1A1A1A18DA1A1A1A12B009C002B009C002B009C0000500001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180";
            jPayload = "J003E803E8000A03E803E8000A057E7F0000031F1F0C000003AB083F003F007F7F0808000808040000000000804050504058484848224148500001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180External Input 1              External Input 2              External Input 3              Force RF OFF                  ";
        }

        config.Commands.Add(new ProductionCommand
        {
            Payload = configPayload,
            Description = "2c Config (C command)",
            ExpectsAck = true,
            TimeoutSeconds = 10
        });

        // J Command
        config.Commands.Add(new ProductionCommand
        {
            Payload = jPayload,
            Description = "2c Params (J command)",
            ExpectsAck = true,
            TimeoutSeconds = 10
        });

        // Command O
        config.Commands.Add(new ProductionCommand
        {
            Payload = "O001",
            Description = "Clear log (O command)",
            ExpectsAck = true,
            TimeoutSeconds = 5
        });

        // VB 1.9: frmToSend(3) = "!0" & Space(700) — always present for 2c, not conditional on clearROM
        // Clears the EEPROM user data area before applying factory config
        config.Commands.Add(new ProductionCommand
        {
            Payload = "!0" + new string(' ', 700),
            Description = "Clear EEPROM (! command)",
            ExpectsAck = true,
            TimeoutSeconds = 15
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
    /// Production configuration for 2dr/2dr2 device.
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

        // Command J for 2dr
        config.Commands.Add(new ProductionCommand
        {
            Payload = "J003E803E8000A03E803E8000A057E7F0000031F1F0C000003AB0878CF20005D7C080800080804080800000000405050405848484822414850080858080201580000015100000151000001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180External Input 1              External Input 2              External Input 3              External Input 4              EC02EC02550214021402",
            Description = "2dr Params (J command)",
            ExpectsAck = true,
            TimeoutSeconds = 10
        });

        // Command O
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
    /// Production configuration for 4dm/4dm2/4dm3 device.
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

        // Command J for 4dm
        config.Commands.Add(new ProductionCommand
        {
            Payload = "J0000103E803E8000A03E803E8000A057E7F0000031F1F0C000003AB0848FF30007F7F080800080804080800000080405050405848484822414850080858080201580000015100000151000001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180External Input 1              External Input 2              External Input 3              Force RF OFF                  EC02EC02550214021402",
            Description = "4dm Params (J command)",
            ExpectsAck = true,
            TimeoutSeconds = 10
        });

        // Command O
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
    /// Production configuration for 2dr1 device.
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

        // Command J for 2dr1
        config.Commands.Add(new ProductionCommand
        {
            Payload = "J003E803E8000A03E803E8000A057E7F0000031F1F0C000003ABAB48CF30007F7F080800080804080800000080405050405848484822414850080858080201580008045100000151000001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180External Input 1              External Input 2              External Input 3              External Input 4              EC02EC02550214021402",
            Description = "2dr1 Params (J command)",
            ExpectsAck = true,
            TimeoutSeconds = 10
        });

        // Command O
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
    /// Production configuration for 3dr device.
    /// </summary>
    /// <remarks>
    /// Simplified version without real-time commonUl detection.
    /// </remarks>
    private ProductionConfigData GetProductionConfig_3DR(double ndev, short nchannels, short mode, bool clearROM)
    {
        var config = new ProductionConfigData();

        // Default configuration (commonUl = false)
        string configPayload = "C000000914003C000CB09C5518EF008000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC00FD5302A300FD5302A300FD5302A300FD5302A3E0005521EF008000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC00FD5302A300FD5302A300FD5302A300FD5302A3000914003C0001B09C5518EF00800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000000FD3002D000FD3002D000FD3002D000FD3002D0E0005521EF00800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000000FD3002D000FD3002D000FD3002D000FD3002D0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0FFFFFFFFB0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0FFFFFFFF00000001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000000000000000000";

        config.Commands.Add(new ProductionCommand
        {
            Payload = configPayload,
            Description = "3dr Config (C command)",
            ExpectsAck = true,
            TimeoutSeconds = 10
        });

        // Command J for 3dr
        config.Commands.Add(new ProductionCommand
        {
            Payload = "J003E803E8000A03E803E8000A057E7F0000031F1F0C000003AB0878CF20005D7C080800080804080800000000405050405848484822414850080858080201580000015100000151000001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180External Input 1              External Input 2              External Input 3              External Input 4              EC02EC02550214021402",
            Description = "3dr Params (J command)",
            ExpectsAck = true,
            TimeoutSeconds = 10
        });

        // Command O
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
    /// Production configuration for 4dm1 device.
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

        // Command J for 4dm1
        config.Commands.Add(new ProductionCommand
        {
            Payload = "J0000103E803E8000A03E803E8000A057E7F0000031F1F0C000003ABAB48F33000027F080800080804080800000080405050405848484822414850080858080201580008045100000151000001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180External Input 1              External Input 2              External Input 3              Force RF OFF                  EC02EC02550214021402",
            Description = "4dm1 Params (J command)",
            ExpectsAck = true,
            TimeoutSeconds = 10
        });

        // Command O
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
    /// Production configuration for 4dm4 device.
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

        // Command J for 4dm4
        config.Commands.Add(new ProductionCommand
        {
            Payload = "J0000103E803E8000A03E803E8000A057E7F0000031F1F0C000003ABAB48FF30007F7F080800080804080800000080405050405848484822414850080858080201580008045100000151000001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180External Input 1              External Input 2              External Input 3              Force RF OFF                  EC02EC02550214021402",
            Description = "4dm4 Params (J command)",
            ExpectsAck = true,
            TimeoutSeconds = 10
        });

        // Command O
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
    /// Production configuration for 5dm device.
    /// </summary>
    /// <remarks>
    /// Simplified version without real-time commonUl/MMS detection.
    /// </remarks>
    private ProductionConfigData GetProductionConfig_5DM(double ndev, short nchannels, short mode, bool clearROM)
    {
        var config = new ProductionConfigData();

        // Default configuration (commonUl = false, MMS = false)
        string configPayload;
        string jPayload;

        if (ndev < 1)
        {
            // Version without commonUl
            configPayload = "C0000100000914003C000CB09C5518EF00810000288100002881000028810000288100002881000028810000288100002881000028810000288100002881000028810000288100002881000028810000288100002881000028810000288100002881000028810000288100002881000028810000288100002881000028810000288100002881000028810000288100002800FD5302A300FD5302A300FD5302A300FD5302A3E0005518EF00810000288100002881000028810000288100002881000028810000288100002881000028810000288100002881000028810000288100002881000028810000288100002881000028810000288100002881000028810000288100002881000028810000288100002881000028810000288100002881000028810000288100002800FCEA032A00FCEA032A00FCEA032A00FCEA032A000914003C0001B09C5518EF008100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD800FD3002D000FD3002D000FD3002D000FD3002D0E000551EEF008100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD88100FFD800FCD6031600FCD6031600FCD6031600FCD60316B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0FFFFFFFFFFFFFFFFB0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0FFFFFFFFFFFFFFFF000000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800003FF000000000000";
            jPayload = "J0000103E803E8000A03E803E8000A057E7F0000031F1F0C000003ABAB08F320FF227F080800080804080800000080000000000808080808080808080808080201080008045100000151000001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180External Input 1              External Input 2              External Input 3              Force RF OFF/Remote Ext.Input EC02EC02EC02EC02EC02EC02EC02EC025502";
        }
        else
        {
            // Version >= 1 without commonUl, without MMS
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

        // Command O - 5dm uses O000 for individual log clear
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
    /// Production configuration for 2dm/2dm1 devices.
    /// </summary>
    private ProductionConfigData GetProductionConfig_2DM(string tdev, short nchannels, short mode, bool clearROM)
    {
        var config = new ProductionConfigData();

        // Command C for 2dm/2dm1
        config.Commands.Add(new ProductionCommand
        {
            Payload = "C000000914003C000CB09C5518E3008000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC00FD5302A300FD5302A300FD5302A300FD5302A3E0005521E3008000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC8000FFEC00FD5302A300FD5302A300FD5302A300FD5302A3000914003C000CB09C5518E3008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000000FD3002D000FD3002D000FD3002D000FD3002D0E0005521E3008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000080000000800000008000000000FD3002D000FD3002D000FD3002D000FD3002D0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0FFFFFFFFB0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0FFFFFFFF0000000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000\tF001EC21EC210000000F-F001ED21ED210000000F-F001EE21EE210000000F-F001EF21EF210000000F-F001F021F0210000000F-F001F121F1210000000F-F001F221F2210000000F-F001F321F3210000000F",
            Description = "2dm Config (C command)",
            ExpectsAck = true,
            TimeoutSeconds = 10
        });

        // Command J - different for 2dm vs 2dm1
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

        // Command O
        config.Commands.Add(new ProductionCommand
        {
            Payload = "O001",
            Description = "Clear log (O command)",
            ExpectsAck = true,
            TimeoutSeconds = 5
        });

        // Command !0 for 2dm - clear EEPROM
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
    /// Production configuration for 3c device.
    /// </summary>
    /// <remarks>
    /// Simplified version without real-time MMS detection.
    /// </remarks>
    private ProductionConfigData GetProductionConfig_3C(double ndev, short nchannels, short mode, bool clearROM)
    {
        var config = new ProductionConfigData();

        string configPayload;
        string jPayload;

        if (ndev < 1)
        {
            // Version 0.x
            configPayload = "C000000914003C000CB09C5518E3008000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002800FCEA032A00FCEA032A00FE7AFFBA00000A014AE0005518E3008000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002800FCEA032A00FCEA032A00FE7AFFBA00000A014A000914003C0001B09C5518E3008000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD800FCD6031600FCD6031600FD26FE6600FEB6FFF6E0005521E3008000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD800FCD6031600FCD6031600FD26FE6600FEB6FFF6B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B09292B0B0A6A6FFFFFFFFB0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B09292B0B0A6A6FFFFFFFF00000001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180";
            jPayload = "J003E803E8000A03E803E8000A057E7F0000031F1F0C000003ABAB38FF30FFFF00000808000C08000404000000C05050405C48484828424158480001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180External Input 1              External Input 2              External Input 3              Force RF OFF                  ";
        }
        else
        {
            // Version 1.x+ (without MMS by default)
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

        // Command O
        config.Commands.Add(new ProductionCommand
        {
            Payload = "O001",
            Description = "Clear log (O command)",
            ExpectsAck = true,
            TimeoutSeconds = 5
        });

        // Command !0 for 3c
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
    /// Production configuration for 3dm/3dm1 devices.
    /// </summary>
    private ProductionConfigData GetProductionConfig_3DM(string tdev, short nchannels, short mode, bool clearROM)
    {
        var config = new ProductionConfigData();

        // Command C for 3dm/3dm1
        config.Commands.Add(new ProductionCommand
        {
            Payload = "C000000914003C000CB09C5518E3008000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002800FCEA032A00FCEA032A00FE7AFFBA00000A014AE0005518E3008000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002880000028800000288000002800FCEA032A00FCEA032A00FE7AFFBA00000A014A000914003C0001B09C5518E3008000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD800FCD6031600FCD6031600FD26FE6600FEB6FFF6E0005521E3008000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD88000FFD800FCD6031600FCD6031600FD26FE6600FEB6FFF6B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0FFFFFFFFB0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0FFFFFFFF0000000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000\tF001EC21EC210000000F-F001ED21ED210000000F-F001EE21EE210000000F-F001EF21EF210000000F-F001F021F0210000000F-F001F121F1210000000F-F001F221F2210000000F-F001F321F3210000000F",
            Description = "3dm Config (C command)",
            ExpectsAck = true,
            TimeoutSeconds = 10
        });

        // Command J - different for 3dm vs 3dm1
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

        // Command O
        config.Commands.Add(new ProductionCommand
        {
            Payload = "O001",
            Description = "Clear log (O command)",
            ExpectsAck = true,
            TimeoutSeconds = 5
        });

        // Command !0 for 3dm
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
    /// Production configuration for 1de device (Expander).
    /// Only sends T command for tag reset.
    /// </summary>
    private ProductionConfigData GetProductionConfig_1DE(double ndev, short nchannels, short mode, bool clearROM)
    {
        var config = new ProductionConfigData();

        // For 1de, only clearROM is used which sends the tag
        // If not clearROM, no configuration available for expander
        if (!clearROM)
        {
            _logger.LogDebug("1de (Expansor) only supports clearROM operation");
            return config;
        }

        // Tag for 1de based on version
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

        // For 1de v1, there is an additional threshold
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

    /// <summary>
    /// Production configuration for 2de device (DAS Expansion / DAS Expansion SDRP).
    /// VB6 1.12 parity: frmMainW.frm 3135-3147 (C0+O001) and 3594-3595 (clearROM T0 tag).
    /// </summary>
    private ProductionConfigData GetProductionConfig_2DE(double ndev, short nchannels, short mode, bool clearROM)
    {
        var config = new ProductionConfigData();

        // VB6 1.12 frmMainW.frm 3137-3139: hardcoded C0 configuration frame.
        // Descriptors use PadRight(30) to enforce the 30-char fixed-width invariant (review note N-1)
        // without depending on manual whitespace counting at VB6 line continuations.
        string c0Hex1 = "00000001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180000151800001518000015180030300FFFFFFFF0F000F404000000000000000000000000000004040404040404040010204080000000004";
        string c0Hex2 = "00000000000000000000F0FE000000000000000000000000000000000000000000015180EC02EC02EC02EC02EC02EC02EC02EC025502";
        string c0Descriptors =
            "External Input 1".PadRight(30) +
            "External Input 2".PadRight(30) +
            "External Input 3".PadRight(30) +
            "Force RF OFF".PadRight(30) +
            "Annunciator 1".PadRight(30) +
            "Annunciator 2".PadRight(30) +
            "Annunciator 3".PadRight(30) +
            "Annunciator 4".PadRight(30);

        config.Commands.Add(new ProductionCommand
        {
            Payload = "C0" + c0Hex1 + c0Hex2 + c0Descriptors,
            Description = "2de Configuration (C0 hardcoded)",
            ExpectsAck = true,
            TimeoutSeconds = 10
        });

        // VB6 1.12 frmMainW.frm 3140: O001 output enable.
        config.Commands.Add(new ProductionCommand
        {
            Payload = "O001",
            Description = "2de Output Enable (O001)",
            ExpectsAck = true,
            TimeoutSeconds = 10
        });

        // VB6 1.12 frmMainW.frm 3594-3595: clearROM tag (32 chars: "T0" + "EXPANSION FIPLEX" + 14 spaces).
        if (clearROM)
        {
            config.Commands.Add(new ProductionCommand
            {
                Payload = "T0EXPANSION FIPLEX".PadRight(32),
                Description = "2de Tag reset (T command)",
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

        // INIT-011: stop/dispose the status-bar revert timer before teardown.
        _statusRevertTimer?.Stop();
        _statusRevertTimer?.Dispose();
        _statusRevertTimer = null;

        try
        {
            _scanCts?.Cancel();

            // Ensure pipeline queue is unblocked even if there are hanging commands.
            _pipeline.CancelPendingCommands();

            if (_serialPort.IsOpen)
            {
                // ROB-001 Phase 1A · PR-4 · I-7 Hard timeout on DisconnectAsync.
                // Bounds the wait at the FormClosing callsite only. Internal
                // DisconnectAsync semantics preserved unchanged for any other
                // invocation path (user-triggered Disconnect, state transitions).
                // If the 5s budget is exceeded, the in-flight task is abandoned
                // and FormClosing continues — PR-5 host.Dispose() will dispose
                // the remaining singletons (Watchdog, HTTP server, SerialPipeline,
                // logger) deterministically afterward.
                var disconnectTask = DisconnectAsync();
                if (await Task.WhenAny(disconnectTask, Task.Delay(TimeSpan.FromSeconds(5))) != disconnectTask)
                {
                    _logger.LogWarning("DisconnectAsync timed out after 5s — abandoning, FormClosing continues");
                }
            }

            // Guard StopAsync with timeout to avoid indefinite wait on close.
            var stopTask = _pipeline.StopAsync();
            var completed = await Task.WhenAny(stopTask, Task.Delay(2000));
            if (completed != stopTask)
            {
                _logger.LogWarning("Pipeline stop timed out during form closing");
            }

            _logger.LogInformation("Cleanup complete");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during cleanup");
        }
    }
}

