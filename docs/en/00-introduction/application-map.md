# Application Map

## Conceptual Map

```mermaid
mindmap
  root((Fiplex Control Software))
    Authentication
      OIDC Login
      Offline token
      CLSS Validation
      Training certification
    Device Connection
      COM port scanning
      fdevices.tsv catalog
      Device password
      Watchdog keepalive
    User Interface
      Embedded WebView2
      HTML UI per device
      Context menus
      Modal dialogs
    Serial Communication
      FIFO Pipeline
      ACK/NAK Protocol
      Automatic retries
      Timeout handling
    HTTP Server
      Static files
      .zhtml/.shtml commands
      previousans cache
      Response formatting
    Configuration
      settings.cfg per device
      appsettings.json
      Factory parameters
      Calibration files
```

## Layer Structure

```mermaid
flowchart TB
    subgraph "Presentation Layer"
        UI[WinForms]
        WV[WebView2]
        DLG[Modal Dialogs]
    end
    
    subgraph "Application Layer"
        HTTP[EmbeddedHttpServer]
        ROUTER[DeviceCommandRouter]
        AUTH[AuthService]
    end
    
    subgraph "Domain Layer"
        PIPE[SerialCommandPipeline]
        CAT[DeviceCatalogService]
        CFG[ConfigService]
        TRAIN[TrainingValidationService]
    end
    
    subgraph "Infrastructure Layer"
        SERIAL[ISerialPort]
        OIDC[OidcAuthService]
        FILE[FileOperationService]
    end
    
    UI --> HTTP
    WV --> HTTP
    DLG --> AUTH
    HTTP --> ROUTER
    ROUTER --> PIPE
    AUTH --> PIPE
    PIPE --> SERIAL
    AUTH --> OIDC
    CFG --> FILE
    CAT --> FILE
```

## System Modules

### Security Module (`Core/Security/`)

| Class | Function |
|-------|----------|
| `AuthService` | Device authentication (command *0) |
| `OidcAuthService` | OIDC login with Firebase/Azure AD |
| `TrainingValidationService` | CLSS certification validation |
| `OfflineTokenManager` | Offline token management |
| `WatchdogService` | Device keepalive (25s) |

### Serial Module (`Core/Serial/`)

| Class | Function |
|-------|----------|
| `SerialCommandPipeline` | FIFO queue with retries |
| `SerialProtocolParser` | CR/LF frame parser |
| `SerialPortAdapter` | System.IO.Ports wrapper |
| `SimulatedSerialPort` | Mock for development |
| `ResponseValidator` | ACK/NAK validation |

### HTTP Module (`Core/Http/`)

| Class | Function |
|-------|----------|
| `EmbeddedHttpServer` | Local HTTP server 8080-8090 |
| `HttpCommandLogger` | GET command logging |
| `HttpCommandEventArgs` | Command event data |

### Commands Module (`Core/Commands/`)

| Class | Function |
|-------|----------|
| `DeviceCommandRouter` | HTTP → Serial mapping |
| `ResponseFormatter` | Hex decoding |
| `DeviceResponseProcessor` | Per-device handlers |
| `DynamicConfigBuilder` | CFG frame construction |

### Configuration Module (`Core/Config/`)

| Class | Function |
|-------|----------|
| `ConfigService` | Configuration operations |
| `SettingsParser` | settings.cfg parser |
| `CalibrationService` | .calr files |
| `FactoryParametersService` | Factory parameters |

## Main Forms

```mermaid
flowchart LR
    subgraph "Startup Flow"
        LOGIN[Login] --> SUB[SubscriptionInfo]
        SUB --> MAIN[frmMain]
    end
    
    subgraph "Operation Dialogs"
        MAIN --> PWD[frmPassword]
        MAIN --> LIC[frmLicense]
        MAIN --> LICM[frmLicenseMaster]
        MAIN --> ETH[frmEthernetInstall]
        MAIN --> MSG[frmMessage]
    end
    
    subgraph "License Dialogs"
        MAIN --> INIT[frmInitLicense]
        MAIN --> KEY[frmLicenseKey]
        MAIN --> KEYD[LicenseKeyDialog]
    end
```

## Configuration Files

| File | Location | Purpose |
|------|----------|---------|
| `appsettings.json` | Root | General config, OIDC, endpoints |
| `fiplex.license` | Root | Encrypted CLSS license |
| `fdevices.tsv` | Resources/ | Device catalog |
| `settings.cfg` | htdocs_*/  | Command mapping per device |

## System Events

```mermaid
sequenceDiagram
    participant WV as WebView2
    participant HTTP as HttpServer
    participant Router as CommandRouter
    participant Pipe as Pipeline
    participant Device as Device
    
    WV->>HTTP: GET /getVersion.zhtml
    HTTP->>HTTP: CommandReceived event
    HTTP->>Router: ProcessGetRequestAsync()
    Router->>Pipe: EnqueueCommandAsync(V1)
    Pipe->>Device: *V1\r\n
    Device-->>Pipe: ACK + Data
    Pipe-->>Router: SerialResult
    Router-->>HTTP: Response string
    HTTP-->>WV: HTTP 200 + body
```

---

**Previous**: [Overview](./overview.md) | **Next**: [Logical Architecture](../10-architecture/logical-architecture.md)
