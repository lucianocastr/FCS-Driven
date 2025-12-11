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
        
        // Flujo de login: Primero mostrar Login, luego frmMain si login exitoso
        var loginForm = scope.ServiceProvider.GetRequiredService<Login>();
        var loginResult = loginForm.ShowDialog();
        
        if (loginResult == DialogResult.OK && loginForm.LoginSuccessful)
        {
            // Login exitoso → Cargar información de tokens y mostrar suscripción
            try
            {
                // Cargar información de training/license ANTES de mostrar el diálogo
                var trainingService = scope.ServiceProvider.GetRequiredService<ITrainingValidationService>();
                trainingService.ReadTokenInformationAsync().GetAwaiter().GetResult();
                
                var subscriptionDialog = scope.ServiceProvider.GetRequiredService<SubscriptionInfo>();
                subscriptionDialog.ShowDialog();
            }
            catch (Exception ex)
            {
                // No bloquear si hay error mostrando SubscriptionInfo
                Console.WriteLine($"Warning: Could not show subscription info: {ex.Message}");
            }
            
            // Mostrar aplicación principal
            var mainForm = scope.ServiceProvider.GetRequiredService<frmMain>();
            Application.Run(mainForm);
        }
        else
        {
            // Login cancelado o fallido → cerrar aplicación
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
            
            // Filtros personalizados
            builder.AddFilter("Microsoft", LogLevel.Warning);
            builder.AddFilter("System", LogLevel.Warning);
            builder.AddFilter("Fiplex", LogLevel.Debug);
        });
    }

    /// <summary>
    /// Configura OidcSettings desde appsettings.json.
    /// </summary>
    private static void ConfigureOidcSettings(IServiceCollection services, IConfiguration configuration)
    {
        // Bind OidcSettings desde configuración
        services.Configure<OidcSettings>(configuration.GetSection("OidcSettings"));
        
        // Bind ApiEndpoints para generación de tokens offline
        services.Configure<ApiEndpoints>(configuration.GetSection("ApiEndpoints"));
    }

    private static void ConfigureSerialServices(IServiceCollection services, IConfiguration configuration)
    {
        // Leer configuración de modo desarrollo
        var devModeSettings = configuration
            .GetSection("DevelopmentMode")
            .Get<DevelopmentModeSettings>();
        
        // Serial Port: Real o Simulado según configuración NoUSB
        if (devModeSettings?.NoUSB == true)
        {
            // Modo NoUSB: Usar puerto simulado con respuestas predefinidas
            services.AddSingleton<ISerialPort, SimulatedSerialPort>();
            Console.WriteLine("🔧 MODO SIMULADO (NoUSB=true) - Usando SimulatedSerialPort");
        }
        else
        {
            // Modo normal: Usar puerto serial real
            services.AddSingleton<ISerialPort, SerialPortAdapter>();
        }
        
        services.AddSingleton<ISerialProtocolParser, SerialProtocolParser>();
        services.AddSingleton<IResponseValidator, ResponseValidator>();
        services.AddSingleton<ISerialCommandPipeline, SerialCommandPipeline>();
    }

    private static void ConfigureDeviceServices(IServiceCollection services)
    {
        // Catalog (Singleton, cargado una vez)
        services.AddSingleton<IDeviceCatalogService, DeviceCatalogService>();
        
        // Discovery (Transient, cada escaneo es independiente)
        services.AddTransient<IDeviceDiscoveryService, DeviceDiscoveryService>();
    }

    private static void ConfigureHttpServices(IServiceCollection services)
    {
        // HTTP (Singleton, servidor único)
        services.AddSingleton<IEmbeddedHttpServer, EmbeddedHttpServer>();
        
        // HTTP Command Logger (Singleton, logging compartido para análisis comparativo)
        // Genera archivos en %LocalAppData%/Fiplex.Control.Software/HttpCommandLogs/
        services.AddSingleton<HttpCommandLogger>();
        
        // Router HTTP→Serial (Singleton, configuración compartida)
        services.AddSingleton<ResponseFormatter>();
        services.AddSingleton<IDeviceCommandRouter, DeviceCommandRouter>();
        
        // Device Response Handlers (Strategy pattern para casos especiales)
        services.AddSingleton<IDeviceResponseHandler, Device1C_V22_ResponseHandler>();
        services.AddSingleton<IDeviceResponseHandler, Device1C_V52_ResponseHandler>();
        services.AddSingleton<DeviceResponseProcessor>();
    }

    private static void ConfigureConfigServices(IServiceCollection services, IConfiguration configuration)
    {
        // AppSettings (Singleton, configuración persistente compartida)
        services.AddSingleton<IAppSettingsService, AppSettingsService>();
        
        // Config (Transient, operaciones independientes)
        services.AddTransient<ISettingsParser, SettingsParser>();
        services.AddTransient<IConfigService, ConfigService>();
        services.AddTransient<ICalibrationService, CalibrationService>();
        
        // File Operations (Transient, operaciones Save/Load independientes)
        services.AddTransient<IFileOperationService, FileOperationService>();
        
        // ETAPA 6: Factory Parameters (Singleton, parámetros compartidos)
        services.AddSingleton<FactoryParametersService>();
        
        // Dynamic Config Builder (Transient, construcción de tramas CFG por sesión)
        services.AddTransient<DynamicConfigBuilder>();
        
        // Ethernet Module Service (Transient, operaciones F0/F1)
        services.AddTransient<IEthernetModuleService, EthernetModuleService>();
        
        // ETAPA 8: Command Metrics (Singleton, métricas compartidas)
        services.AddSingleton<CommandMetrics>();
        
        // License Options Parser (Singleton, conversión hex M0/M1)
        services.AddSingleton<LicenseOptionsParser>();

        // Version Check Service (Singleton, verificación de actualizaciones)
        services.Configure<VersionCheckSettings>(configuration.GetSection("VersionCheck"));
        services.AddSingleton<IVersionCheckService, VersionCheckService>();
    }

    private static void ConfigureSecurityServices(IServiceCollection services)
    {
        // Auth (Transient, operaciones puntuales)
        services.AddTransient<IAuthService, AuthService>();
        
        // HttpClient para llamadas HTTP de tokens
        services.AddSingleton<HttpClient>();
        
        // OIDC Auth (Singleton, sesión compartida)
        services.AddSingleton<IOfflineTokenManager, OfflineTokenManager>();
        
        // Offline Token Generator y Validator
        services.AddSingleton<IOfflineTokenGenerator, OfflineTokenGenerator>();
        services.AddSingleton<IOfflineTokenValidator, OfflineTokenValidator>();
        
        // OIDC Auth Service (Singleton)
        services.AddSingleton<IOidcAuthService, OidcAuthService>();
        
        // Watchdog (Singleton, debe persistir)
        services.AddSingleton<IWatchdogService, WatchdogService>();
        
        // License (Singleton, validación compartida)
        services.AddSingleton<ILicenseValidator, LicenseValidator>();
        
        // Training Validation (Singleton, estado compartido)
        services.AddSingleton<ITrainingValidationService, TrainingValidationService>();
        
        // Usuarios privilegiados con whitelist y pass.bin cifrado con DPAPI
        services.AddSingleton<IPrivilegedUserService, PrivilegedUserService>();
    }

    private static void ConfigureForms(IServiceCollection services)
    {
        // Init License Form (Transient, términos y condiciones)
        services.AddTransient<frmInitLicense>();
        
        // Login Form (Transient, formulario de inicio)
        services.AddTransient<Login>();
        
        // Main Form (Transient, cada instancia independiente)
        services.AddTransient<frmMain>();
        
        // PasswordDialog (Transient, instancia por solicitud)
        services.AddTransient<frmPassword>();
        
        // License Key Dialogs (Transient)
        // LicenseKeyDialog: UI mejorada con info dispositivo (1 botón Apply + LicenseIndex)
        services.AddTransient<frmLicenseKey>();
        services.AddTransient<LicenseKeyDialog>();
        
        services.AddTransient<frmEthernetInstall>();
        
        // CLSS Dialog (Transient)
        services.AddTransient<SubscriptionInfo>();
        
        // License Options Dialog - Multi-banda (Transient, comandos M0/M1 para 4 bandas)
        services.AddTransient<frmLicenseMaster>();
        
        // License Options Dialog - 2 bandas (Transient, comandos M0/M1 para 2 bandas)
        services.AddTransient<frmLicense>();
    }
}