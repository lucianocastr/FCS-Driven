# Design Patterns

## Creational Patterns

### Dependency Injection (DI)

**Location**: `Program.cs`

The system uses Microsoft.Extensions.DependencyInjection to manage all dependencies.

```mermaid
flowchart TB
    subgraph "DI Container"
        REG[Registration in Program.cs]
        RES[Automatic Resolution]
    end
    
    subgraph "Services"
        S1[ISerialPort]
        S2[ISerialCommandPipeline]
        S3[IDeviceCommandRouter]
        S4[IEmbeddedHttpServer]
    end
    
    subgraph "Consumers"
        F[frmMain]
        L[Login]
    end
    
    REG --> S1 & S2 & S3 & S4
    RES --> F & L
    F --> S1 & S2 & S3 & S4
```

**Lifecycles**:

| Type | Services |
|------|----------|
| **Singleton** | Pipeline, HttpServer, DeviceCatalog, AuthService |
| **Transient** | ConfigService, SettingsParser, CalibrationService |

---

## Structural Patterns

### Adapter Pattern

**Location**: `Core/Serial/Implementation/SerialPortAdapter.cs`

Adapts `System.IO.Ports.SerialPort` to the `ISerialPort` interface.

```mermaid
classDiagram
    class ISerialPort {
        <<interface>>
        +Open()
        +Close()
        +Write(data)
        +Read()
    }
    
    class SerialPortAdapter {
        -SerialPort _port
        +Open()
        +Close()
        +Write(data)
        +Read()
    }
    
    class SimulatedSerialPort {
        -Dictionary responses
        +Open()
        +Close()
        +Write(data)
        +Read()
    }
    
    ISerialPort <|.. SerialPortAdapter
    ISerialPort <|.. SimulatedSerialPort
```

**Benefits**:
- Allows swapping real/simulated implementation
- Facilitates testing without hardware

---

### Strategy Pattern

**Location**: `Core/Commands/`

Implements device-specific handlers for response processing.

```mermaid
classDiagram
    class IDeviceResponseHandler {
        <<interface>>
        +CanHandle(deviceType, version) bool
        +ProcessResponse(command, response) string
    }
    
    class Device1C_V22_ResponseHandler {
        +CanHandle()
        +ProcessResponse()
    }
    
    class Device1C_V52_ResponseHandler {
        +CanHandle()
        +ProcessResponse()
    }
    
    class DeviceResponseProcessor {
        -List~IDeviceResponseHandler~ handlers
        +Process(deviceType, version, command, response)
    }
    
    IDeviceResponseHandler <|.. Device1C_V22_ResponseHandler
    IDeviceResponseHandler <|.. Device1C_V52_ResponseHandler
    DeviceResponseProcessor o-- IDeviceResponseHandler
```

**Usage**:
```csharp
// The processor iterates through registered handlers
foreach (var handler in _handlers)
{
    if (handler.CanHandle(deviceType, version))
    {
        return handler.ProcessResponse(command, rawResponse);
    }
}
```

---

## Behavioral Patterns

### Observer Pattern

**Location**: Multiple services

The system uses .NET events for decoupled notifications.

```mermaid
sequenceDiagram
    participant Pipe as SerialCommandPipeline
    participant Main as frmMain
    participant Router as DeviceCommandRouter
    
    Pipe->>Pipe: Command completes
    Pipe-->>Main: CommandCompleted event
    Pipe-->>Router: CommandCompleted event
    
    Note over Main,Router: Multiple subscribers<br/>processing the same event
```

**Main Events**:

| Service | Event | Purpose |
|---------|-------|---------|
| `ISerialCommandPipeline` | `CommandCompleted` | Notifies command completion |
| `ISerialCommandPipeline` | `CredentialsRequired` | Requests password |
| `ISerialCommandPipeline` | `CommandStateChanged` | State change |
| `IEmbeddedHttpServer` | `CommandReceived` | HTTP request received |
| `IEmbeddedHttpServer` | `BaseJsLoaded` | UI fully loaded |

---

### Pipeline Pattern

**Location**: `Core/Serial/Implementation/SerialCommandPipeline.cs`

Sequential command processing with defined states.

```mermaid
stateDiagram-v2
    [*] --> Queued: EnqueueCommand()
    Queued --> Sending: ProcessQueue()
    Sending --> WaitingAck: WriteAsync()
    
    WaitingAck --> WaitingData: ACK (0x06)
    WaitingAck --> Failed: NAK (0x15)
    WaitingAck --> Retrying: Timeout
    
    WaitingData --> Completed: Data + CRLF
    WaitingData --> Retrying: Timeout
    
    Retrying --> Sending: retries < max
    Retrying --> Failed: retries >= max
    
    Completed --> [*]: CommandCompleted
    Failed --> [*]: CommandCompleted
```

**Processing Flow**:
1. **Enqueue**: Command added to FIFO queue
2. **Dequeue**: Worker processes next command
3. **Send**: Transmission via serial port
4. **Wait ACK**: Wait for device confirmation
5. **Wait Data**: Wait for data response (if applicable)
6. **Complete/Fail**: Notify result via event

---

## Additional Patterns

### Circuit Breaker Pattern

**Location**: `Core/Commands/DeviceCommandRouter.cs`

Prevents cascading failures by temporarily stopping requests after consecutive errors.

```mermaid
stateDiagram-v2
    [*] --> Closed: Initial
    Closed --> Open: 3 consecutive failures
    Open --> HalfOpen: After cooldown (30s)
    HalfOpen --> Closed: Success
    HalfOpen --> Open: Failure
```

**Configuration**:
```csharp
private const int MaxConsecutiveFailures = 3;
private const int CircuitBreakerCooldownMs = 30000;
```

---

### Null Object Pattern

**Location**: `Core/Serial/Implementation/SimulatedSerialPort.cs`

Provides a functional implementation for testing without real hardware.

```csharp
public class SimulatedSerialPort : ISerialPort
{
    private readonly Dictionary<string, string> _responses;
    
    public async Task<string> ReadAsync()
    {
        // Returns simulated response based on last command
        return _responses.GetValueOrDefault(_lastCommand, "OK");
    }
}
```

**Use Cases**:
- Unit testing without hardware
- Development without physical devices
- Demo mode for presentations

---

### Repository Pattern

**Location**: `Core/Devices/DeviceCatalogService.cs`

Abstracts access to the device catalog (`fdevices.tsv`).

```csharp
public interface IDeviceCatalogService
{
    DeviceInfo? GetById(string id);
    DeviceInfo? GetByTDevNDev(string tdev, string ndev);
    IEnumerable<DeviceInfo> GetAll();
}
```

---

## Pattern Summary by Layer

| Layer | Patterns |
|-------|----------|
| **Presentation** | Observer (events), Dependency Injection |
| **Application** | Pipeline, Strategy, Circuit Breaker |
| **Domain** | Repository, Null Object |
| **Infrastructure** | Adapter, Factory |

---

**Previous**: [Physical Architecture](./physical-architecture.md) | **Next**: [Solution Structure](../20-solution-and-projects/solution-structure.md)
