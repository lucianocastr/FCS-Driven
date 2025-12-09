# Operational Flows

## Flow Index

This document describes the main operational flows of the Fiplex Control Software system.

## Documented Flows

| # | Flow | Description |
|---|------|-------------|
| 1 | [Initialization](#initialization-flow) | Application startup |
| 2 | [User Authentication](#user-authentication-flow) | OIDC login |
| 3 | [Device Connection](#device-connection-flow) | Serial connection |
| 4 | [HTTP-Serial Commands](#http-serial-command-flow) | Command processing |
| 5 | [Watchdog](#watchdog-flow) | Device keepalive |

---

## Initialization Flow

### Objective

Initialize all services and prepare the application for user interaction.

### Sequence Diagram

```mermaid
sequenceDiagram
    participant OS as Windows
    participant App as Program.cs
    participant Host as IHost
    participant DI as DI Container
    participant Login as Login Form
    participant Sub as SubscriptionInfo
    participant Main as frmMain
    
    OS->>App: Execute EXE
    App->>App: ApplicationConfiguration.Initialize()
    App->>Host: CreateHost()
    Host->>DI: ConfigureServices()
    
    Note over DI: Register services:<br/>- Serial Pipeline<br/>- HTTP Server<br/>- Auth Services<br/>- Forms
    
    App->>DI: CreateScope()
    DI->>Login: GetRequiredService<Login>()
    App->>Login: ShowDialog()
    
    alt Login Successful
        Login-->>App: DialogResult.OK
        App->>Sub: ShowDialog()
        Sub-->>App: Close
        App->>Main: Application.Run(frmMain)
    else Login Cancelled
        Login-->>App: DialogResult.Cancel
        App->>App: Application.Exit()
    end
```

### Detailed Steps

1. **WinForms Initialization**
   - `ApplicationConfiguration.Initialize()` configures DPI awareness

2. **Host Creation**
   - Load `appsettings.json`
   - Configure logging (Console, Debug)
   - Register services in DI container

3. **Login Flow**
   - If valid offline token → auto-login
   - If not → show login form

4. **Subscription Information**
   - Show CLSS training/license status

5. **Main Form**
   - `Application.Run(frmMain)` starts message loop

---

## User Authentication Flow

### Objective

Authenticate the user via OIDC to access the system.

### Sequence Diagram

```mermaid
sequenceDiagram
    participant User
    participant Login as Login Form
    participant OIDC as OidcAuthService
    participant Browser as System Browser
    participant AAD as Azure AD
    participant API as Fiplex API
    
    User->>Login: Open application
    Login->>OIDC: ValidateOfflineTokenAsync()
    
    alt Valid offline token
        OIDC-->>Login: true
        Login-->>User: Auto-login successful
    else No valid token
        OIDC-->>Login: false
        User->>Login: Click "Login"
        Login->>OIDC: LoginAsync()
        OIDC->>Browser: Open auth URL
        Browser->>AAD: Navigate to login
        User->>AAD: Enter credentials
        AAD-->>Browser: Redirect with code
        Browser-->>OIDC: Capture code
        OIDC->>AAD: Exchange for tokens
        AAD-->>OIDC: Access + Refresh tokens
        OIDC->>API: Request offline token
        API-->>OIDC: Offline token
        OIDC->>OIDC: Save to %LocalAppData%
        OIDC-->>Login: OidcLoginResult.Success
        Login-->>User: Login successful
    end
```

### Validations

| Validation | Location | Action on Failure |
|------------|----------|-------------------|
| Offline token present | `OnLoad` | Show login |
| Token not expired | `ValidateOfflineTokenAsync` | Show login |
| Valid signature | `OfflineTokenValidator` | Show login |
| Valid training | `TrainingValidationService` | Warning + continue |

---

## Device Connection Flow

### Objective

Establish serial connection with a Fiplex device and load its web interface.

### Sequence Diagram

```mermaid
sequenceDiagram
    participant User
    participant Main as frmMain
    participant Scan as DeviceDiscovery
    participant Serial as ISerialPort
    participant Cat as DeviceCatalog
    participant Auth as AuthService
    participant Pwd as frmPassword
    participant HTTP as EmbeddedHttpServer
    participant WV as WebView2
    
    User->>Main: Click "Scan"
    Main->>Scan: ScanAsync()
    
    loop Each COM port
        Scan->>Serial: Open(COMx)
        Scan->>Serial: Write(*V1)
        Serial-->>Scan: V1 Response
        Scan->>Cat: GetDeviceByResponse()
        Cat-->>Scan: DeviceInfo
    end
    
    Scan-->>Main: Device list
    Main->>Main: Show in ComboBox
    
    User->>Main: Select device
    User->>Main: Click "Connect"
    
    Main->>Main: ValidateTraining()
    Main->>Serial: Open(selected COM)
    Main->>Main: LoadSettingsConfig()
    
    alt Requires password
        Main->>Pwd: ShowDialog()
        Pwd-->>Main: Password
        Main->>Auth: AuthenticateAsync(password)
        Auth->>Serial: *0{password}
        Serial-->>Auth: ACK
    end
    
    Main->>HTTP: StartAsync(8080, htdocs_path)
    Main->>WV: Navigate(http://localhost:8080/)
```

### Connection Phases (8)

```mermaid
flowchart TB
    P1[1. Validate CLSS Training] --> P2[2. Open serial port]
    P2 --> P3[3. Resolve PathShared]
    P3 --> P4[4. Load settings.cfg]
    P4 --> P5[5. Configure CommandRouter]
    P5 --> P6{6. HasPass?}
    P6 -->|Yes| P7[Show frmPassword]
    P6 -->|No| P8[7. Start HTTP Server]
    P7 --> P8
    P8 --> P9[8. Navigate WebView2]
    P9 --> P10[Start Watchdog]
```

---

## HTTP-Serial Command Flow

### Objective

Translate HTTP requests from WebView2 UI to serial commands.

### Sequence Diagram

```mermaid
sequenceDiagram
    participant WV as WebView2 (HTML/JS)
    participant HTTP as EmbeddedHttpServer
    participant Router as DeviceCommandRouter
    participant Pipe as SerialCommandPipeline
    participant Serial as ISerialPort
    participant Device as Fiplex Device

    WV->>HTTP: GET /getStatus.shtml
    HTTP->>Router: RouteCommand("getStatus")
    Router->>Router: Lookup settings.cfg
    Router->>Pipe: EnqueueCommandAsync(S1)
    Pipe->>Serial: Write(*S1\r\n)
    Serial->>Device: RS-232 TX
    Device-->>Serial: Response
    Serial-->>Pipe: Data received
    Pipe-->>Router: SerialResult
    Router->>Router: FormatResponse()
    Router-->>HTTP: Formatted data
    HTTP-->>WV: HTTP Response
```

---

## Watchdog Flow

### Objective

Maintain connection alive and detect disconnections.

### Sequence Diagram

```mermaid
sequenceDiagram
    participant Timer as Watchdog Timer
    participant Main as frmMain
    participant Pipe as SerialCommandPipeline
    participant Device as Device

    loop Every 25 seconds
        Timer->>Main: Elapsed event
        Main->>Pipe: EnqueueCommandAsync(W1)
        Pipe->>Device: *W1
        
        alt Response OK
            Device-->>Pipe: ACK
            Pipe-->>Main: Success
        else No response
            Pipe-->>Main: Timeout
            Main->>Main: HandleConnectionLost()
            Main->>Main: Disconnect()
        end
    end
```

---

**Previous**: [Forms](../30-forms/forms-index.md) | **Next**: [Error Handling](../50-errors-and-logging/error-handling.md)
