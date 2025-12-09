# frmMain - Main Form

## General Information

| Attribute | Value |
|-----------|-------|
| **File** | `Forms/frmMain.cs` |
| **Namespace** | `Fiplex.Control.Software.WinForms.Forms` |
| **Type** | Main MDI Form |
| **Lines of Code** | ~4,316 |

## Purpose

Main application form that orchestrates:
- Serial device connection
- WebView2 for HTML UI rendering
- Embedded HTTP server
- Dynamic menus per device
- File operations (calibration, configuration)

## Injected Dependencies

| Service | Interface | Purpose |
|---------|-----------|---------|
| `_pipeline` | `ISerialCommandPipeline` | Serial command queue |
| `_router` | `IDeviceCommandRouter` | HTTP→Serial routing |
| `_httpServer` | `IEmbeddedHttpServer` | Embedded HTTP server |
| `_deviceCatalog` | `IDeviceCatalogService` | Device catalog |
| `_authService` | `IAuthService` | Device authentication |
| `_configService` | `IConfigService` | Configuration service |
| `_calibrationService` | `ICalibrationService` | Calibration service |
| `_trainingValidation` | `ITrainingValidationService` | Training validation |
| `_watchdog` | `IWatchdogService` | Device keepalive |
| `_settingsParser` | `ISettingsParser` | settings.cfg parser |
| `_fileOperationService` | `IFileOperationService` | File operations |
| `_factoryService` | `IFactoryParametersService` | Factory parameters |
| `_logger` | `ILogger<frmMain>` | Structured logging |
| `_serviceProvider` | `IServiceProvider` | Dependency resolution |

## Connection Flow (8 Phases)

```mermaid
sequenceDiagram
    participant User
    participant Main as frmMain
    participant TVS as TrainingValidation
    participant Serial as SerialPort
    participant Catalog as DeviceCatalog
    participant Auth as AuthService
    participant HTTP as HttpServer
    participant WV as WebView2

    User->>Main: Select COM Port
    User->>Main: Click Connect
    
    rect rgb(240, 240, 255)
        Note over Main: Phase 1: Validate Training
        Main->>TVS: ValidateTraining()
        TVS-->>Main: Valid/Invalid
    end
    
    rect rgb(240, 255, 240)
        Note over Main: Phase 2: Open Serial Port
        Main->>Serial: Open(COM, 9600, 8N1)
        Serial-->>Main: Success
    end
    
    rect rgb(255, 240, 240)
        Note over Main: Phase 3: Read Device ID
        Main->>Serial: *I1 (Identity)
        Serial-->>Main: Device ID
        Main->>Catalog: GetById(deviceId)
        Catalog-->>Main: DeviceInfo
    end
    
    rect rgb(240, 255, 255)
        Note over Main: Phase 4: Resolve PathShared
        Main->>Main: ResolvePathShared()
    end
    
    rect rgb(255, 255, 240)
        Note over Main: Phase 5: Load settings.cfg
        Main->>Main: LoadDeviceConfiguration()
    end
    
    rect rgb(255, 240, 255)
        Note over Main: Phase 6: Configure Router
        Main->>Main: ConfigureRouter()
    end
    
    rect rgb(240, 250, 240)
        Note over Main: Phase 7: Authentication (if required)
        alt HasPass = 1
            Main->>Auth: AuthenticateAsync()
            Auth->>Serial: *0{password}
            Serial-->>Auth: OK/INVALID
        end
    end
    
    rect rgb(250, 240, 240)
        Note over Main: Phase 8: Start HTTP + WebView
        Main->>HTTP: Start(8080-8090)
        Main->>WV: Navigate(http://localhost:port/)
        Main->>Main: StartWatchdog(25s)
    end
```

## Main Areas

### WebView2

```csharp
private async Task InitializeWebViewAsync()
{
    var env = await CoreWebView2Environment.CreateAsync();
    await webView.EnsureCoreWebView2Async(env);
    
    webView.CoreWebView2.WebResourceRequested += OnWebResourceRequested;
    webView.CoreWebView2.NavigationCompleted += OnNavigationCompleted;
}
```

### Dynamic Menu

```csharp
private void ConfigureMenusForDevice(DeviceInfo device)
{
    // License menu: only if ucVersion >= 0x10B
    mnuLicense.Visible = _ucVersion >= 0x10B;
    
    // Password menu: only if HasPass = 1
    mnuPassword.Visible = device.HasPass == 1;
    
    // Calibration menu: only for certain device types
    mnuCal.Visible = CalibrationSupportedForDevice(device.TDev);
}
```

### Watchdog

```csharp
private void StartWatchdog()
{
    _watchdogTimer = new System.Timers.Timer(25000);
    _watchdogTimer.Elapsed += async (s, e) =>
    {
        var result = await _pipeline.EnqueueCommandAsync(new SerialCommand
        {
            Payload = "W1",  // Watchdog ping
            ExpectsAck = true,
            ExpectsData = false
        });
        
        if (!result.Success)
        {
            HandleConnectionLost();
        }
    };
    _watchdogTimer.Start();
}
```

## Connection States

```mermaid
stateDiagram-v2
    [*] --> Disconnected
    Disconnected --> Connecting: Connect()
    Connecting --> Connected: Success
    Connecting --> Disconnected: Failure
    Connected --> Disconnecting: Disconnect()
    Connected --> Disconnected: Connection Lost
    Disconnecting --> Disconnected: Cleanup Complete
```

## Main Events

| Event | Source | Action |
|-------|--------|--------|
| `CommandCompleted` | Pipeline | Update UI status |
| `CredentialsRequired` | Pipeline | Show frmPassword |
| `BaseJsLoaded` | HttpServer | Clear pending commands |
| `NavigationCompleted` | WebView2 | Enable menus |

## Main Menus

| Menu | Options |
|------|---------|
| **File** | Connect, Disconnect, Exit |
| **Setup** | Password, License, Ethernet, Factory Default |
| **Calibration** | Load, Save, Apply |
| **Configuration** | Load, Save, Apply |
| **Help** | Subscription Info, About |

## File Operations

### Calibration (.calr)

```csharp
private async Task SaveCalibrationAsync(string filePath)
{
    using var progress = new frmMessage();
    progress.SetMessage("Saving Calibration");
    progress.Show();
    
    try
    {
        await _calibrationService.SaveToFileAsync(filePath);
    }
    finally
    {
        progress.CloseProgress();
    }
}
```

### Configuration (.cfgr)

```csharp
private async Task LoadConfigurationAsync(string filePath)
{
    using var progress = new frmMessage();
    progress.SetMessage("Loading Configuration");
    progress.Show();
    
    try
    {
        await _configService.LoadFromFileAsync(filePath);
        WebRefresh(true);
    }
    finally
    {
        progress.CloseProgress();
    }
}
```

## ucVersion Logic

```csharp
// Extracted from V1 response
private int _ucVersion;

// Determines feature availability
if (_ucVersion >= 0x10B)  // Version 1.11+
{
    mnuLicense.Visible = true;
    mnuLicenseKey.Visible = true;
}
```

---

**Previous**: [Forms Index](./forms-index.md) | **Next**: [Login](./Login.md)
