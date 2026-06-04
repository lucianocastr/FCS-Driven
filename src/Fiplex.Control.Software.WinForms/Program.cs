using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Fiplex.Control.Software.WinForms.Forms;
using Fiplex.Control.Software.WinForms.Core.Serial.Interfaces;
using Fiplex.Control.Software.WinForms.Core.Serial.Implementation;
using Fiplex.Control.Software.WinForms.Core.Devices;
using Fiplex.Control.Software.WinForms.Core.Devices.Interfaces;
using Fiplex.Control.Software.WinForms.Core.Http;
using Fiplex.Control.Software.WinForms.Core.Http.Interfaces;
using Fiplex.Control.Software.WinForms.Core.Config;
using Fiplex.Control.Software.WinForms.Core.Config.Interfaces;
using Fiplex.Control.Software.WinForms.Core.Security;
using Fiplex.Control.Software.WinForms.Core.Security.Interfaces;
using Fiplex.Control.Software.WinForms.Core.Configuration;
using Fiplex.Control.Software.WinForms.Core.Configuration.Interfaces;
using Fiplex.Control.Software.WinForms.Core.Commands;
using Fiplex.Control.Software.WinForms.Core.Commands.Interfaces;
using Fiplex.Control.Software.WinForms.Core.Metrics;
using Fiplex.Control.Software.WinForms.Core.Diagnostics;
using Microsoft.Extensions.Logging.Console;
using Fiplex.Control.Software.WinForms.Models;

namespace Fiplex.Control.Software.WinForms;

internal static class Program
{
    /// <summary>
    ///  The main entry point for the application.
    /// </summary>
    [STAThread]
    static void Main()
    {
        // ROB-001 Phase 1A · PR-3 + PR-5 lifecycle state.
        //   exitFlushTarget (PR-3): logger reference for queue drain at Main exit paths.
        //   hostToDispose, hostDisposed, disposeLock (PR-5): single-shot host.Dispose() guard.
        AppFileLoggerProvider? exitFlushTarget = null;
        IHost? hostToDispose = null;
        bool hostDisposed = false;
        var disposeLock = new object();

        // ROB-001 Phase 1A · PR-5 · I-3 Ordered host.Dispose()
        // Single-shot, deadlock-safe disposal of the IHost root container.
        //
        // Why Task.Run:
        //   Three singletons implement Dispose() as
        //   `StopAsync().GetAwaiter().GetResult()` — a sync-over-async pattern
        //   that would deadlock if invoked on the WinForms STA UI thread (sync
        //   context captured by Task continuations). Dispatching via Task.Run
        //   places execution on a ThreadPool worker with no sync context.
        //
        // Why a lock + flag:
        //   Both Application.ApplicationExit handler and Main finally invoke
        //   this function. The lock guarantees a single execution and removes
        //   any race between the two callers.
        //
        // Why a 5s timeout:
        //   Covers AppFileLoggerProvider's internal 2s flush wait plus normal
        //   StopAsync of the other singletons. If exceeded, abandon and let
        //   Main exit — shutdown remains best-effort and never blocks the UI
        //   thread indefinitely. A foreground SerialPort.EventLoopRunner
        //   stuck in kernel-mode IRP is out of scope for PR-5 (only I-1
        //   `Environment.Exit()` escape hatch can address that vector).
        void DisposeHostOnce()
        {
            lock (disposeLock)
            {
                if (hostDisposed) return;
                hostDisposed = true;
            }
            var target = hostToDispose;
            if (target is null) return;
            try
            {
                var disposeTask = Task.Run(() => target.Dispose());
                if (!disposeTask.Wait(TimeSpan.FromSeconds(5)))
                {
                    // Timeout exceeded — log + continue. exitFlushTarget may
                    // already be dead if AppFileLoggerProvider.Dispose ran;
                    // the message is best-effort.
                    exitFlushTarget?.ForceFlush("host.Dispose() timed out after 5s — abandoning, shutdown continues");
                }
            }
            catch (Exception ex)
            {
                exitFlushTarget?.ForceFlush($"host.Dispose() threw {ex.GetType().Name}: {ex.Message}");
            }
        }

        try
        {
            ApplicationConfiguration.Initialize();

            var host = CreateHost();
            hostToDispose = host;

            var appFileLoggerProvider = host.Services.GetRequiredService<AppFileLoggerProvider>();
            exitFlushTarget = appFileLoggerProvider;

            AppDomain.CurrentDomain.UnhandledException += (_, e) =>
                appFileLoggerProvider.ForceFlush($"UNHANDLED EXCEPTION: {e.ExceptionObject}");
            Application.ThreadException += (_, e) =>
                appFileLoggerProvider.ForceFlush($"THREAD EXCEPTION: {e.Exception.GetType().Name}: {e.Exception.Message}");

            // ROB-001 Phase 1A · PR-5 · I-2 ApplicationExit handler
            // Canonical WinForms cleanup hook. Fires synchronously when
            // Application.Run returns or when Application.Exit() is called
            // during an active MessageLoop. Invokes single-shot host.Dispose()
            // via DisposeHostOnce — idempotent with Main finally fallback.
            Application.ApplicationExit += (_, _) => DisposeHostOnce();

            using var scope = host.Services.CreateScope();

            // Login flow: First show Login, then frmMain if login successful
            var loginForm = scope.ServiceProvider.GetRequiredService<Login>();
            var loginResult = loginForm.ShowDialog();

            if (loginResult == DialogResult.OK && loginForm.LoginSuccessful)
            {
                // Login successful → Load token information and show subscription
                try
                {
                    // Load training/license information BEFORE showing the dialog
                    var trainingService = scope.ServiceProvider.GetRequiredService<ITrainingValidationService>();
                    trainingService.ReadTokenInformationAsync().GetAwaiter().GetResult();

                    var subscriptionDialog = scope.ServiceProvider.GetRequiredService<SubscriptionInfo>();
                    subscriptionDialog.ShowDialog();
                }
                catch (Exception ex)
                {
                    // Do not block if there is an error showing SubscriptionInfo
                    Console.WriteLine($"Warning: Could not show subscription info: {ex.Message}");
                }

                // Show main application
                var mainForm = scope.ServiceProvider.GetRequiredService<frmMain>();
                Application.Run(mainForm);
            }
            else
            {
                // Login cancelled or failed → close application
                Application.Exit();
            }
        }
        finally
        {
            // ROB-001 Phase 1A · PR-3 · I-4 Logger ForceFlush
            // Drain queue BEFORE host.Dispose runs (writer is still open here
            // on login-cancelled or early-exception paths where Application.Run
            // never started and ApplicationExit never fired). On normal exit
            // paths, AppFileLoggerProvider.Dispose already ran inside the
            // ApplicationExit handler — writer is null, ForceFlush is a no-op.
            exitFlushTarget?.ForceFlush();

            // ROB-001 Phase 1A · PR-5 · Fallback for paths where the
            // ApplicationExit handler did not fire. DisposeHostOnce is
            // idempotent — no-op if it already ran.
            DisposeHostOnce();
        }
    }

    private static IHost CreateHost()
    {
        return Host.CreateDefaultBuilder()
            .ConfigureAppConfiguration((hostContext, config) =>
            {
                config.SetBasePath(AppDomain.CurrentDomain.BaseDirectory);
                config.AddJsonFile("appsettings.json", optional: true, reloadOnChange: true);
            })
            .ConfigureServices((context, services) =>
            {
                ConfigureLogging(services);
                ConfigureOidcSettings(services, context.Configuration);
                ConfigureSerialServices(services, context.Configuration);
                ConfigureDeviceServices(services);
                ConfigureHttpServices(services);
                ConfigureConfigServices(services, context.Configuration);
                ConfigureSecurityServices(services);
                ConfigureForms(services);
            })
            .Build();
    }

    private static void ConfigureLogging(IServiceCollection services)
    {
        services.AddSingleton<AppLogLevelSwitch>();
        services.AddSingleton<DiscoveryTelemetry>();
        services.AddSingleton<AppFileLoggerProvider>(sp =>
        {
            var sw = sp.GetRequiredService<AppLogLevelSwitch>();
            var version = System.Reflection.Assembly
                .GetExecutingAssembly()
                .GetCustomAttributes(typeof(System.Reflection.AssemblyInformationalVersionAttribute), false)
                is System.Reflection.AssemblyInformationalVersionAttribute[] attrs && attrs.Length > 0
                ? attrs[0].InformationalVersion
                : "";
            return new AppFileLoggerProvider(sw, version);
        });

        services.AddLogging(builder =>
        {
            builder.ClearProviders();
            builder.AddConsole();
            builder.AddDebug();

            // Pass everything to providers — each provider filters by its own level.
            // AppFileLogger uses AppLogLevelSwitch; Console/Debug use their own filters below.
            builder.SetMinimumLevel(LogLevel.Trace);

            builder.AddFilter<ConsoleLoggerProvider>("Microsoft", LogLevel.Warning);
            builder.AddFilter<ConsoleLoggerProvider>("System", LogLevel.Warning);
            builder.AddFilter<ConsoleLoggerProvider>("Fiplex", LogLevel.Debug);

            // AppFileLoggerProvider: override appsettings "Fiplex: Information" filter.
            // MEL must pass ALL events (Trace+) to our provider — AppFileLogger filters
            // dynamically via AppLogLevelSwitch. Without this, appsettings blocks Debug/Trace
            // before they ever reach the provider, regardless of the active log level in the UI.
            builder.AddFilter<AppFileLoggerProvider>((category, level) => true);

            builder.Services.AddSingleton<ILoggerProvider>(sp =>
                sp.GetRequiredService<AppFileLoggerProvider>());
        });
    }

    /// <summary>
    /// Configures OidcSettings from appsettings.json.
    /// </summary>
    private static void ConfigureOidcSettings(IServiceCollection services, IConfiguration configuration)
    {
        // Bind OidcSettings from configuration
        services.Configure<OidcSettings>(configuration.GetSection("OidcSettings"));
        
        // Bind ApiEndpoints for offline token generation
        services.Configure<ApiEndpoints>(configuration.GetSection("ApiEndpoints"));
    }

    private static void ConfigureSerialServices(IServiceCollection services, IConfiguration configuration)
    {
        // Read development mode configuration
        var devModeSettings = configuration
            .GetSection("DevelopmentMode")
            .Get<DevelopmentModeSettings>();
        
        // Serial Port: Real or Simulated according to NoUSB configuration
        if (devModeSettings?.NoUSB == true)
        {
            // NoUSB mode: Use simulated port with predefined responses
            services.AddSingleton<ISerialPort, SimulatedSerialPort>();
            Console.WriteLine("🔧 SIMULATED MODE (NoUSB=true) - Using SimulatedSerialPort");
        }
        else
        {
            // Normal mode: Use real serial port
            services.AddSingleton<ISerialPort, SerialPortAdapter>();
        }
        
        services.AddSingleton<ISerialProtocolParser, SerialProtocolParser>();
        services.AddSingleton<IResponseValidator, ResponseValidator>();
        services.AddSingleton<ISerialCommandPipeline, SerialCommandPipeline>();
    }

    private static void ConfigureDeviceServices(IServiceCollection services)
    {
        // Catalog (Singleton, loaded once)
        services.AddSingleton<IDeviceCatalogService, DeviceCatalogService>();
        
        // Discovery (Transient, each scan is independent)
        services.AddTransient<IDeviceDiscoveryService, DeviceDiscoveryService>();
    }

    private static void ConfigureHttpServices(IServiceCollection services)
    {
        // HTTP (Singleton, single server)
        services.AddSingleton<IEmbeddedHttpServer, EmbeddedHttpServer>();
        
        // HTTP Command Logger (Singleton, shared logging for comparative analysis)
        // Generates files in %LocalAppData%/Fiplex.Control.Software/HttpCommandLogs/
        services.AddSingleton<HttpCommandLogger>();

        // Serial Trace Logger (Singleton, non-blocking — VB 1.9 USBmessages_YYYYMMDD.txt parity)
        services.AddSingleton<SerialTraceLogger>();
        
        // Router HTTP→Serial (Singleton, shared configuration)
        services.AddSingleton<ResponseFormatter>();
        services.AddSingleton<IDeviceCommandRouter, DeviceCommandRouter>();
        
        // Device Response Handlers (Strategy pattern for special cases)
        services.AddSingleton<IDeviceResponseHandler, Device1C_V22_ResponseHandler>();
        services.AddSingleton<IDeviceResponseHandler, Device1C_V52_ResponseHandler>();
        services.AddSingleton<IDeviceResponseHandler, DeviceBbuResponseHandler>();
        services.AddSingleton<DeviceResponseProcessor>();
    }

    private static void ConfigureConfigServices(IServiceCollection services, IConfiguration configuration)
    {
        // AppSettings (Singleton, shared persistent configuration)
        services.AddSingleton<IAppSettingsService, AppSettingsService>();
        
        // Config (Transient, independent operations)
        services.AddTransient<ISettingsParser, SettingsParser>();
        services.AddTransient<IConfigService, ConfigService>();
        services.AddTransient<ICalibrationService, CalibrationService>();
        
        // File Operations (Transient, independent Save/Load operations)
        services.AddTransient<IFileOperationService, FileOperationService>();
        
        // STEP 6: Factory Parameters (Singleton, shared parameters)
        services.AddSingleton<FactoryParametersService>();
        
        // Dynamic Config Builder (Transient, CFG frame construction per session)
        services.AddTransient<DynamicConfigBuilder>();
        
        // Ethernet Module Service (Transient, F0/F1 operations)
        services.AddTransient<IEthernetModuleService, EthernetModuleService>();
        
        // STEP 8: Command Metrics (Singleton, shared metrics)
        services.AddSingleton<CommandMetrics>();
        
        // License Options Parser (Singleton, hex M0/M1 conversion)
        services.AddSingleton<LicenseOptionsParser>();

        // Version Check Service (Singleton, update verification)
        services.Configure<VersionCheckSettings>(configuration.GetSection("VersionCheck"));
        services.AddSingleton<IVersionCheckService, VersionCheckService>();
    }

    private static void ConfigureSecurityServices(IServiceCollection services)
    {
        // Auth (Transient, point-in-time operations)
        services.AddTransient<IAuthService, AuthService>();
        
        // HttpClient for HTTP token calls
        services.AddSingleton<HttpClient>();
        
        // OIDC Auth (Singleton, shared session)
        services.AddSingleton<IOfflineTokenManager, OfflineTokenManager>();
        
        // Offline Token Generator and Validator
        services.AddSingleton<IOfflineTokenGenerator, OfflineTokenGenerator>();
        services.AddSingleton<IOfflineTokenValidator, OfflineTokenValidator>();
        
        // OIDC Auth Service (Singleton)
        services.AddSingleton<IOidcAuthService, OidcAuthService>();
        
        // Watchdog (Singleton, must persist)
        services.AddSingleton<IWatchdogService, WatchdogService>();
        
        // License (Singleton, shared validation)
        services.AddSingleton<ILicenseValidator, LicenseValidator>();
        
        // Training Validation (Singleton, shared state)
        services.AddSingleton<ITrainingValidationService, TrainingValidationService>();
        
        // Privileged users with whitelist and pass.bin encrypted with DPAPI
        services.AddSingleton<IPrivilegedUserService, PrivilegedUserService>();
    }

    private static void ConfigureForms(IServiceCollection services)
    {
        // Init License Form (Transient, terms and conditions)
        services.AddTransient<frmInitLicense>();
        
        // Login Form (Transient, startup form)
        services.AddTransient<Login>();
        
        // Main Form (Transient, cada instancia independiente)
        services.AddTransient<frmMain>();
        
        // PasswordDialog (Transient, instance per request)
        services.AddTransient<frmPassword>();
        
        // License Key Dialogs (Transient)
        // LicenseKeyDialog: Improved UI with device info (1 Apply button + LicenseIndex)
        services.AddTransient<frmLicenseKey>();
        services.AddTransient<LicenseKeyDialog>();
        
        services.AddTransient<frmEthernetInstall>();
        
        // CLSS Dialog (Transient)
        services.AddTransient<SubscriptionInfo>();
        
        // License Options Dialog - Multi-band (Transient, M0/M1 commands for 4 bands)
        services.AddTransient<frmLicenseMaster>();
        
        // License Options Dialog - 2 bands (Transient, M0/M1 commands for 2 bands)
        services.AddTransient<frmLicense>();
    }
}