# Sistema de Logging Serial — FCS 3.1

**Versión:** 1.0  
**Fecha:** 16/05/2026  
**Contexto:** Diagnóstico de comunicación serial en campo — escenario 2-3 COM ports + BDA

---

## Motivación

Mauricio (cliente, tester de campo) reporta que cuando hay 2-3 puertos COM, un dispositivo BDA conectado y la app no responde, no hay visibilidad de qué ocurre en la comunicación serial. FCS 1.9 tiene el modo `tracesON` (tecla `T`) que permite capturar exactamente qué se envía y recibe. El fix de paridad ya fue aplicado a FCS 3.1, pero la cobertura de TX/RX del pipeline serial aún está ausente del archivo de trazas.

---

## Estado del sistema — ya implementado

| Componente | Archivo | Línea |
|---|---|---|
| Tecla `T` con `cmdIDPort` activo → toggle `_tracesOn` | `Forms/frmMain.cs` | 1073-1082 |
| Título de ventana `(Traces ON)` | `Forms/frmMain.cs` | 1079 |
| `WriteTraceLog()` → `%APPDATA%\Fiplex\USBmessages_YYYYMMDD.txt` | `Forms/frmMain.cs` | 1090-1105 |
| Scan progress por puerto COM | `Forms/frmMain.cs` | 1280 |
| Device found (dispositivo identificado) | `Forms/frmMain.cs` | 1299-1301 |
| Pipeline retries (`CommandAttemptDiagnostic` event) | `Forms/frmMain.cs` | 138 |
| `HttpCommandLogger` — logging HTTP GET detallado | `Core/Http/HttpCommandLogger.cs` | — |
| `EnableCommandLogging()` vía Debug menu | `Forms/frmMain.cs` / `Core/Commands/DeviceCommandRouter.cs` | — |

## Brechas actuales

El archivo de trazas **no contiene** cuando Traces está ON:

- TX bytes enviados al dispositivo (`I1`, `S1`, `U1`, etc.)
- RX bytes recibidos (longitud + preview)
- ACK timeout y su duración
- Data timeout
- MaxRetries y estado final de `IsWaitingAnswer`

Los `ILogger.LogDebug` en `SerialCommandPipeline.cs` cubren estos eventos pero van solo a Console/Debug output — invisibles en campo.

---

## Arquitectura del sistema propuesto

### Principio rector

> El hilo del pipeline serial nunca debe bloquearse esperando IO de disco.

La implementación actual de `WriteTraceLog` en `frmMain.cs` usa `File.AppendAllText` — un open/write/close por llamada. Cuando se llama desde eventos del pipeline (hilo background), introduce latencia de filesystem directamente en el camino crítico serial. En escenario de 3 COM con retries, puede generarse un ciclo degenerativo: IO lento → timeout → más retries → más IO.

### Solución: Clase dedicada `SerialTraceLogger`

La funcionalidad de escritura al log se extrae a su propia clase, siguiendo el mismo patrón que `HttpCommandLogger` — que ya resuelve exactamente el mismo problema para el layer HTTP.

**Ubicación:** `Core/Diagnostics/SerialTraceLogger.cs`

```csharp
public sealed class SerialTraceLogger : IDisposable
{
    private readonly ConcurrentQueue<string> _queue = new();
    private StreamWriter? _writer;
    private CancellationTokenSource? _cts;
    private Task? _flushTask;

    public bool IsEnabled { get; private set; }

    public void Enable(string version, string machine)
    {
        if (IsEnabled) return;
        var dir = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "Fiplex");
        Directory.CreateDirectory(dir);
        var file = Path.Combine(dir, $"USBmessages_{DateTime.Now:yyyyMMdd}.txt");
        _writer = new StreamWriter(file, append: true, Encoding.UTF8) { AutoFlush = false };
        IsEnabled = true;
        _cts = new CancellationTokenSource();
        _flushTask = Task.Run(() => FlushLoop(_cts.Token));
        Log($"=== Traces ON  FCS {version}  Machine: {machine} ===");
    }

    public void Disable()
    {
        if (!IsEnabled) return;
        Log("=== Traces OFF ===");
        IsEnabled = false;
        _cts?.Cancel();
        _flushTask?.Wait(TimeSpan.FromSeconds(2));
        DrainQueue();
        _writer?.Dispose();
        _writer = null;
    }

    // Fire-and-forget — nunca bloquea al llamador
    public void Log(string msg)
    {
        var line = $"{DateTime.Now:HH:mm:ss.fff}\t[T{Environment.CurrentManagedThreadId:D2}]\t{msg}";
        _queue.Enqueue(line);
    }

    private async Task FlushLoop(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            await Task.Delay(200, ct).ConfigureAwait(false);
            DrainQueue();
        }
        DrainQueue();
    }

    private void DrainQueue()
    {
        if (_writer is null) return;
        while (_queue.TryDequeue(out var line))
            _writer.WriteLine(line);
        _writer.Flush();
    }

    public void Dispose() => Disable();
}
```

**Registro en DI (`Program.cs`):**

```csharp
services.AddSingleton<SerialTraceLogger>();
```

**Uso en `frmMain.cs`** — el toggle `T` llama a la clase:

```csharp
private void SetTracesOn(bool on)
{
    if (on) _traceLogger.Enable(SoftwareVersion, Environment.MachineName);
    else    _traceLogger.Disable();
    Text = on ? "Fiplex Control Software (Traces ON)" : "Fiplex Control Software";
}
```

**Suscripción de eventos** (junto a línea 138):

```csharp
_pipeline.TxDiagnostic  += (msg) => { if (_traceLogger.IsEnabled) _traceLogger.Log(msg); };
_pipeline.RxDiagnostic  += (msg) => { if (_traceLogger.IsEnabled) _traceLogger.Log(msg); };
_pipeline.AckDiagnostic += (msg) => { if (_traceLogger.IsEnabled) _traceLogger.Log(msg); };
```

**Scan progress en `UpdateScanProgress` (línea 1280):**

```csharp
if (_traceLogger.IsEnabled)
    _traceLogger.Log($"{p.CurrentPort} ({p.Completed}/{p.Total}) found={p.DevicesFound}");
```

### Eventos del pipeline — patrón de extensión

Agregar a `ISerialCommandPipeline` (mismo patrón que `CommandAttemptDiagnostic`):

```csharp
event Action<string>? TxDiagnostic;   // mensaje ya formateado
event Action<string>? RxDiagnostic;
event Action<string>? AckDiagnostic;
```

Suscribir en `frmMain.cs` junto a la línea 138:

```csharp
_pipeline.TxDiagnostic  += (msg) => { if (_tracesOn) WriteTraceLog(msg); };
_pipeline.RxDiagnostic  += (msg) => { if (_tracesOn) WriteTraceLog(msg); };
_pipeline.AckDiagnostic += (msg) => { if (_tracesOn) WriteTraceLog(msg); };
```

Disparar en `SerialCommandPipeline.cs`:

```csharp
// Helper — zero allocation para strings cortos
private static string Preview(string s, int len = 20)
    => string.IsNullOrEmpty(s) ? string.Empty : s.Length <= len ? s : s[..len];

// Línea ~313 — después de WriteAsync
TxDiagnostic?.Invoke($"Tx1 {cmd.Payload}");

// Línea ~340 — ACK ok
AckDiagnostic?.Invoke($"ACK ok ({elapsedMs}ms)");

// Línea ~389 — ACK timeout (colapsar retries: no 3 líneas, 1 resumen)
AckDiagnostic?.Invoke($"--- ACK timeout ({ms}ms) retry {n}/{max}");

// Línea ~430 — RX data
RxDiagnostic?.Invoke($"Rx1 {data.Length} chars \"{Preview(data)}\"");

// Línea ~449 — MaxRetries
AckDiagnostic?.Invoke($"--- MaxRetries superado ({max}/{max}) IsWaitingAnswer=false");
```

### Control de verbosidad

Para evitar archivos de cientos de MB en escenarios de polling continuo:

| Situación | Política |
|---|---|
| ACK timeout repetitivo (mismo comando) | Loguear cada retry individualmente — es el dato clave para Mauricio |
| Port health timer polling sin bytes | NO loguear — es ruido en operación normal |
| RX preview | Máximo 20 chars — `Preview(data, 20)` |
| Scan COM en loop | Loguear entrada/salida de cada puerto, no cada polling tick interno |

---

## Formato del archivo resultante

```
14:32:14.999	[T01]	=== Traces ON ===
14:32:15.000	[T01]	=== FCS 3.1.0  Machine: LAPTOP-MAURICIO ===
14:32:15.123	[T01]	COM3 (1/3) found=0
14:32:15.441	[T08]	Tx1 I1
14:32:15.820	[T08]	Rx1 45 chars "Fiplex Signal Boost"
14:32:15.821	[T01]	Device is 2c2.0 on COM3
14:32:16.100	[T08]	Tx1 S1
14:32:16.245	[T08]	ACK ok (145ms)
14:32:16.890	[T08]	Rx1 1796 chars "S1_resp_data_block_A"
14:32:18.000	[T08]	Tx1 U1
14:32:18.800	[T08]	--- ACK timeout (800ms) retry 1/3
14:32:19.600	[T08]	--- ACK timeout (800ms) retry 2/3
14:32:20.400	[T08]	--- ACK timeout (800ms) retry 3/3
14:32:20.401	[T08]	--- MaxRetries superado (3/3) IsWaitingAnswer=false
```

El Thread ID `[T08]` identifica el hilo del pipeline y distingue de `[T01]` (UI thread / scan). Si hay scan paralelo de 3 COM, cada port usa un thread distinto → los eventos quedan correlacionados en el archivo.

---

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `Core/Diagnostics/SerialTraceLogger.cs` | **Nuevo** — clase dedicada de escritura al log (cola + StreamWriter persistente) |
| `Core/Serial/Interfaces/ISerialCommandPipeline.cs` | Agregar `TxDiagnostic`, `RxDiagnostic`, `AckDiagnostic` events |
| `Core/Serial/Implementation/SerialCommandPipeline.cs` | Implementar los 3 events + helper `Preview()` + disparar en TX/ACK/RX/MaxRetries |
| `Forms/frmMain.cs` | Eliminar `WriteTraceLog`; inyectar `SerialTraceLogger`; suscribir los 3 nuevos events; cambiar toggle `T` para llamar `SetTracesOn()` |
| `Program.cs` | Registrar `SerialTraceLogger` como Singleton en DI |

### No requiere cambios en
- `HttpCommandLogger.cs` — el Debug menu logging permanece independiente
- `DeviceDiscoveryService.cs` — scan progress se mueve a `_traceLogger.Log()` en `frmMain.cs`
- `DeviceCommandRouter.cs` — sin cambios
- `appsettings.json`, `settings.cfg`, JS/HTML

---

## Escenarios de validación

| Escenario | Qué debe aparecer en el archivo |
|---|---|
| 1 COM, dispositivo responde | `Tx1 I1` → `Rx1 N chars` → device found → `Tx1 S1` → `ACK ok` → `Rx1...` — sin warnings |
| 3 COM, 1 con BDA, 2 vacíos | 3 bloques de scan con thread IDs distintos; BDA produce `Rx1 Fiplex...`; los vacíos no tienen `Rx1` |
| Dispositivo no responde (cuelgue) | `Tx1 U1` → `--- ACK timeout ×3` → `--- MaxRetries` — confirma recuperación del pipeline |
| Save Config firmware v2.0 | `Tx1 U1` → `Rx1 {N} chars` — N real visible para diagnóstico de longitud |
| Múltiples sesiones en un día | Cada Traces ON escribe `=== Traces ON ===` como separador de sesión |

---

## Criterio de entrega

El log generado en `%APPDATA%\Fiplex\USBmessages_YYYYMMDD.txt` puede ser enviado por el cliente como adjunto para diagnóstico remoto. El formato es texto plano legible sin herramientas especiales, compatible con el mismo path que FCS 1.9 — el cliente de soporte puede abrir con Notepad.
