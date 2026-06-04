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
        ApplicationConfiguration.Initialize();

        var host = CreateHost();
        
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
        services.AddLogging(builder =>
        {
            builder.ClearProviders();
            builder.AddConsole();
            builder.AddDebug();
            builder.SetMinimumLevel(LogLevel.Debug);
            
            // Custom filters
            builder.AddFilter("Microsoft", LogLevel.Warning);
            builder.AddFilter("System", LogLevel.Warning);
            builder.AddFilter("Fiplex", LogLevel.Debug);
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