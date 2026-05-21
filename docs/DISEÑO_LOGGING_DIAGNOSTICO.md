# Diseño Técnico — Sistema de Logging de Diagnóstico FCS

**Estado:** Diseño aprobado — pendiente de implementación  
**Fecha:** 20/05/2026  
**Versión objetivo:** FCS 3.4  
**Autor:** Fiplex / Ikarus

---

## 1. Contexto y objetivo

El FCS en fase de estabilización post-migración (VB.NET 1.9 → C# .NET 10) presenta issues intermitentes y aleatorios que no son reproducibles de forma controlada en laboratorio. El equipo de soporte necesita un mecanismo que capture automáticamente el estado interno de la aplicación en el momento exacto en que ocurren los problemas, sin depender de que el cliente o el tester los reproduzca bajo condiciones específicas.

**Objetivo:** un archivo de log de diagnóstico que esté activo desde el primer uso, accesible para cualquier usuario, y cuyo nivel de verbosidad pueda ajustarse desde la interfaz principal sin restricciones.

Este sistema es una **herramienta de estabilización temporal**. Una vez que el software alcance un estado estable y los issues de campo queden resueltos, el acceso puede ser restringido o el sistema puede ser desactivado.

---

## 2. Sistemas de log existentes

El FCS ya tiene dos mecanismos de registro previos a este diseño:

| Sistema | Archivo | Cobertura | Activación |
|---|---|---|---|
| `SerialTraceLogger` | `%APPDATA%\FiplexControlSoftware\USBmessages_YYYYMMDD.txt` | Solo tráfico TX/RX serial | Manual (tecla `T` en contexto factory) |
| MEL interno | Consola / IDE únicamente | Toda la aplicación | Siempre activo, invisible en campo |

### Diferencia fundamental con `SerialTraceLogger`

`SerialTraceLogger` recibe **llamadas explícitas** desde `frmMain.cs` — solo captura lo que el programador decidió pasarle manualmente. Su scope es exclusivamente el protocolo serial.

El nuevo `AppFileLoggerProvider` es un **interceptor automático de MEL** (Microsoft.Extensions.Logging — la infraestructura de logging estándar de .NET). Todos los servicios del FCS ya tienen llamadas `_logger.LogDebug/Info/Warning/Error()` distribuidas en su código. El nuevo provider recibe esos eventos automáticamente sin modificar ninguna clase existente. Su scope es toda la aplicación.

En nivel Trace, el nuevo sistema incluye también los datos TX/RX que cubre `SerialTraceLogger`. A largo plazo, `SerialTraceLogger` puede deprecarse. Por ahora ambos coexisten — Fiplex ya conoce el workflow de pedir `USBmessages` al cliente.

---

## 3. Decisiones de diseño

Todas las decisiones están tomadas. No hay opciones abiertas.

| Decisión | Elección | Justificación |
|---|---|---|
| Nivel por defecto | `Warning` | Captura errores y advertencias desde el primer uso sin intervención. Si #34 ocurre y nadie estaba mirando, el evento ya quedó registrado. |
| Persistencia entre sesiones | No persiste | Cada reinicio vuelve a `Warning`. Evita que un cliente quede en `Trace` indefinidamente llenando disco sin saberlo. |
| Relación con `USBmessages` | Coexisten | No se toca `SerialTraceLogger`. El nuevo archivo agrega la capa de aplicación. |
| Retención de archivos | 7 días | Suficiente para issues intermitentes. Limpieza automática al iniciar. |
| Exportación de logs | El cliente envía manualmente | La ruta `%APPDATA%\FiplexControlSoftware\` ya la conoce el equipo de soporte. Sin código adicional. |
| Payloads en nivel Trace | Primeros 80 chars | Suficiente para identificar el tipo de respuesta y diagnosticar protocolo. Los 1650 chars completos de U1 no agregan valor diagnóstico y hacen el archivo ilegible. |
| Activación | Menú `LOG` público en `MenuStrip` | Accesible a cualquier usuario, autodocumentado, sin riesgo de activación accidental mientras se tipea. |

---

## 4. Niveles de log

| Nivel (campo) | Nivel MEL mínimo capturado | Qué registra | Tamaño estimado/día |
|---|---|---|---|
| **Error** ← *default* | `Warning` | Fallos, timeouts, errores de validación, warnings de scan | ~1–5 KB |
| **Info** | `Information` | + conexión/desconexión, operaciones usuario (save, load, cambio password) | ~10–30 KB |
| **Debug** | `Debug` | + cada comando serial, ACK timings, scan puerto a puerto, requests HTTP | ~50–200 KB |
| **Trace** | `Trace` | + payloads TX/RX (primeros 80 chars), respuestas completas de identificación | ~200 KB–1 MB |

Ciclo de nivel mediante menú LOG:

```
Error  →  Info  →  Debug  →  Trace  →  Error  →  ...
```

---

## 5. Activación — menú LOG en MenuStrip

Un `ToolStripMenuItem` con título `LOG` en la barra de menú principal. Subítems con radio-button visual (checkmark exclusivo):

```
[Archivo]  [Dispositivo]  [Herramientas]  [LOG]
                                           ├── ● Error       ← default
                                           ├──   Info
                                           ├──   Debug
                                           └──   Trace
```

Accesible desde cualquier estado de la aplicación, sin restricción de modo. Un click selecciona el nivel inmediatamente.

El título de ventana refleja el nivel activo en todo momento:

```
Fiplex Control Software v3.4.0  [Log: ERR]
Fiplex Control Software v3.4.0  [Log: INFO]
Fiplex Control Software v3.4.0  [Log: DBG]
Fiplex Control Software v3.4.0  [Log: TRC]
```

---

## 6. Formato del archivo

**Ruta:** `%APPDATA%\FiplexControlSoftware\FCSLog_YYYYMMDD.txt`

Un archivo por día, texto plano legible sin herramientas especiales.

```
────────────────────────────────────────────────────────────
SESSION START  2026-05-20 14:31:02  FCS v3.4.0  [Log: ERR]
────────────────────────────────────────────────────────────
2026-05-20 14:32:15.001 [WARN] Discovery        — COM122 open timeout (4000ms), skipped
2026-05-20 14:32:15.442 [WARN] Discovery        — COM123 NACK retry 3/5
2026-05-20 14:32:16.890 [ERR ] Pipeline         — MaxRetries exceeded U1 (5/5)
2026-05-20 14:32:17.001 [INFO] frmMain          — Device connected COM8 Signal Booster 2c/2.0
2026-05-20 14:32:17.200 [INFO] frmMain          — Save from Device started
2026-05-20 14:32:17.890 [INFO] frmMain          — Save from Device completed (config.cfgr 3174 bytes)
2026-05-20 14:32:18.010 [DBG ] Pipeline         — Enqueued U1 (queue: 0)
2026-05-20 14:32:18.344 [DBG ] Pipeline         — ACK ok (334ms) U1
2026-05-20 14:32:18.345 [TRC ] Pipeline         — Tx U1
2026-05-20 14:32:18.890 [TRC ] Pipeline         — Rx 1650 chars — "U1_resp_data_2c2_v2.0_fiplex..."
────────────────────────────────────────────────────────────
SESSION END    2026-05-20 15:14:33
────────────────────────────────────────────────────────────
```

**Reglas de formato:**
- El separador de sesión incluye el nivel activo al iniciar — permite saber qué verbosidad tuvo la captura
- La columna de categoría es fija en 16 chars con padding — los mensajes quedan alineados
- La categoría se abrevia al último segmento del namespace (`SerialCommandPipeline` → `Pipeline`)
- Timestamps con precisión de milisegundos
- El archivo acumula varias sesiones del mismo día — los separadores permiten identificar cada una

---

## 7. Arquitectura de componentes

### Diagrama de flujo

```
DeviceDiscoveryService._logger.LogWarning(...)  ─┐
SerialCommandPipeline._logger.LogDebug(...)     ─┤
AuthService._logger.LogError(...)               ─┤──→  MEL  ──→  AppFileLoggerProvider  ──→  FCSLog_YYYYMMDD.txt
ConfigService._logger.LogInfo(...)              ─┤            ──→  ConsoleProvider       ──→  consola (dev)
frmMain._logger.LogInformation(...)             ─┘            ──→  DebugProvider         ──→  IDE output
```

MEL recibe todos los eventos y los distribuye a los providers registrados. `AppFileLoggerProvider` es uno más de esos providers — no requiere cambios en los servicios existentes.

### Componentes nuevos

#### `AppLogLevelSwitch` — `Core/Diagnostics/AppLogLevelSwitch.cs` (~25 líneas)

Singleton thread-safe. Mantiene el nivel activo y notifica cambios.

```csharp
public sealed class AppLogLevelSwitch
{
    // Backing field como int para operaciones Interlocked (thread-safe sin lock)
    private volatile int _level = (int)LogLevel.Warning; // default: Error/Warning

    public LogLevel CurrentLevel => (LogLevel)_level;
    public bool IsEnabled => CurrentLevel != LogLevel.None;

    public event EventHandler<LogLevel>? LevelChanged;

    public void SetLevel(LogLevel level)
    {
        Interlocked.Exchange(ref _level, (int)level);
        LevelChanged?.Invoke(this, level);
    }

    public void CycleLevel()
    {
        var next = CurrentLevel switch
        {
            LogLevel.Warning     => LogLevel.Information,
            LogLevel.Information => LogLevel.Debug,
            LogLevel.Debug       => LogLevel.Trace,
            _                    => LogLevel.Warning
        };
        SetLevel(next);
    }
}
```

#### `AppFileLoggerProvider` — `Core/Diagnostics/AppFileLoggerProvider.cs` (~90 líneas)

`ILoggerProvider` registrado en DI. Gestiona el archivo y el flush loop.

Responsabilidades:
1. Abre `%APPDATA%\FiplexControlSoftware\FCSLog_YYYYMMDD.txt` al construirse
2. Escribe el separador SESSION START con nivel activo y versión
3. Purga archivos `FCSLog_*.txt` con más de 7 días (limpieza automática)
4. `ConcurrentQueue<string>` + flush loop cada 200ms (idéntico a `SerialTraceLogger`)
5. En Error/Critical: señal inmediata al loop de flush (`SemaphoreSlim`)
6. En `Dispose`: drena la queue, escribe SESSION END, cierra el `StreamWriter`
7. `CreateLogger(categoryName)` → devuelve `AppFileLogger` con categoría abreviada

#### `AppFileLogger` — `Core/Diagnostics/AppFileLogger.cs` (~60 líneas)

`ILogger` instance por categoría. No tiene estado propio — solo referencia al switch y al provider.

Responsabilidades:
1. `IsEnabled(level)` → `level >= _switch.CurrentLevel`
2. `Log()` → formatea la línea con timestamp, nivel y categoría
3. Aplica `Sanitize()` antes de encolar — nunca registra datos sensibles
4. Encola en el provider (`fire-and-forget`) — nunca toca el `StreamWriter` directamente
5. Si `logLevel >= LogLevel.Error`: señala flush inmediato

---

## 8. Debilidades identificadas y mitigaciones

### Severidad Alta

#### A — Pérdida de eventos en crash

**Problema:** el flush loop escribe cada 200ms. Si la app crashea abruptamente, los últimos eventos están en la `ConcurrentQueue` pero no llegaron al disco. Un crash es exactamente el momento donde más importa el log.

**Mitigación 1 — flush en crash controlado:**

```csharp
// En Program.cs, antes de Application.Run()
AppDomain.CurrentDomain.UnhandledException += (_, e) =>
    host.Services.GetService<AppFileLoggerProvider>()
        ?.ForceFlush($"UNHANDLED EXCEPTION: {e.ExceptionObject}");

Application.ThreadException += (_, e) =>
    host.Services.GetService<AppFileLoggerProvider>()
        ?.ForceFlush($"THREAD EXCEPTION: {e.Exception.Message}");
```

`ForceFlush()` drena la queue sincrónicamente antes de que el proceso termine.

**Mitigación 2 — flush anticipado para Error/Critical:**

Para eventos importantes sin crash, el `AppFileLogger` señala al flush loop mediante `SemaphoreSlim`:

```csharp
// AppFileLoggerProvider
private readonly SemaphoreSlim _flushSignal = new(0, 1);

private async Task FlushLoop(CancellationToken ct)
{
    while (!ct.IsCancellationRequested)
    {
        // Espera 200ms O hasta señal — lo que ocurra primero
        await Task.WhenAny(Task.Delay(200, ct), _flushSignal.WaitAsync(ct));
        DrainQueue();
    }
}

// Llamado desde AppFileLogger cuando logLevel >= Error
public void SignalImmediateFlush() => _flushSignal.Release(1);
```

El thread serial no se bloquea — solo señala.

#### B — Exposición de datos sensibles

**Problema:** el provider intercepta todo MEL. Si algún servicio loguea un token OIDC, clave de licencia o fragmento de password por error, ese dato queda en el archivo que el cliente envía.

**Mitigación 1 — sanitizador en `AppFileLogger.Log()`:**

```csharp
private static readonly (Regex Pattern, string Replacement)[] _sanitizers =
[
    (new Regex(@"\*0\S+"),                                        "*0[***]"),
    (new Regex(@"(?i)(password|token|secret|key)\s*[:=]\s*\S+"), "$1=[***]"),
    (new Regex(@"(?i)Bearer\s+\S+"),                              "Bearer [***]"),
];

private static string Sanitize(string msg)
{
    foreach (var (pattern, replacement) in _sanitizers)
        msg = pattern.Replace(msg, replacement);
    return msg;
}
```

**Mitigación 2 — auditoría previa a activación en campo (tarea requerida):**

Antes de activar el sistema con usuarios reales, ejecutar:

```powershell
Select-String -Path "E:\Ikarus\Proyecto C#\FCS302OK\FCSDev\src\**\*.cs" `
  -Pattern "_logger\.Log" -Recurse |
  Where-Object { $_.Line -match "(token|password|key|secret|Bearer)" }
```

Revisar cada resultado e identificar si el dato es sensible. Agregar el patrón al sanitizador si corresponde. Especialmente en: `AuthService.cs`, `OidcAuthService.cs`, `OfflineTokenManager.cs`, `LicenseValidator.cs`.

### Severidad Media

| Debilidad | Mitigación |
|---|---|
| `SetMinimumLevel(Trace)` global contamina Console y Debug providers con ruido | Filtros por provider explícitos en lugar de SetMinimumLevel global |
| Sin rollover a medianoche (para apps que corren 24h) | En flush loop verificar si cambió la fecha y rotar el archivo |

---

## 9. Archivos a crear y modificar

### Archivos nuevos

| Archivo | Líneas estimadas |
|---|---|
| `Core/Diagnostics/AppLogLevelSwitch.cs` | ~25 |
| `Core/Diagnostics/AppFileLogger.cs` | ~60 |
| `Core/Diagnostics/AppFileLoggerProvider.cs` | ~90 |

### Archivos modificados

| Archivo | Cambio |
|---|---|
| `Program.cs` | Registrar `AppLogLevelSwitch` y `AppFileLoggerProvider` en DI; filtros por provider; handlers `UnhandledException` y `ThreadException` |
| `Forms/frmMain.cs` | Inyectar `AppLogLevelSwitch`; agregar menú `LOG` en `MenuStrip` con 4 ítems; actualizar título de ventana con nivel activo |
| `Core/Serial/Implementation/SerialCommandPipeline.cs` | Agregar `_logger.LogTrace()` para TX (payload completo) y RX (primeros 80 chars) — habilita el nivel Trace |

### No requiere cambios en

- `SerialTraceLogger.cs` — coexiste sin modificaciones
- `HttpCommandLogger.cs` — sistema de debug independiente, permanece separado
- `DeviceDiscoveryService.cs` — ya tiene `_logger.LogDebug/Warning` que MEL captura automáticamente
- `appsettings.json` — el nivel se controla en runtime, no en configuración
- JS/HTML — ningún impacto en la capa web embebida

---

## 10. Cobertura de issues de campo

Qué aparecería en el log para cada issue conocido:

| Issue | Nivel mínimo | Evento capturado |
|---|---|---|
| **#34** COM discovery random failure | Error (default) | `[WARN] Discovery — COM{N} open timeout (4000ms), skipped` |
| **#22** DAS Master Flex 2.0 no identificado | Debug | `[DBG] Discovery — [Scan X] COM122 retry 3/5 — NACK` |
| **#4** Clear EEPROM falla | Debug | Secuencia completa C1→J1→T0 con cada ACK/timeout |
| **#9** Save Config 18 filtros | Error (default) | `[WARN] Response validation failed... Got: {N} chars` |
| **#31** Password con espacios ignorado | Error (default) | `[WARN] Password change failed — device returned error bitmask` |

---

## 11. Escenarios de validación

| Escenario | Verificación |
|---|---|
| App arranca sin intervención | Archivo `FCSLog_YYYYMMDD.txt` creado, separador SESSION START visible |
| Click en `LOG > Debug` | Título cambia a `[Log: DBG]`, checkmark se mueve |
| Dispositivo encontrado | `[INFO] frmMain — Device connected COM8 Signal Booster 2c/2.0` en el archivo |
| COM port timeout durante scan | `[WARN] Discovery — COM{N} open timeout` visible en nivel Error (default) |
| Password cambiada correctamente | `[INFO] frmMain — Password change completed` — sin exponer el valor |
| Password con campo `*0` | Línea en archivo muestra `*0[***]` — dato sensible sanitizado |
| Crash de la app | Último evento antes del crash presente en el archivo (ForceFlush actuó) |
| App corriendo un día completo | Al día siguiente se crea nuevo archivo; el anterior permanece 7 días |

---

## 12. Relación futura con `SerialTraceLogger`

El diseño actual mantiene ambos sistemas. La ruta de deprecación natural es:

1. **Ahora:** ambos coexisten, `SerialTraceLogger` sigue activo con tecla `T`
2. **Una vez estable el FCSLog:** comunicar a Fiplex que el nivel Trace del FCSLog reemplaza a `USBmessages`
3. **Versión posterior:** eliminar `SerialTraceLogger`, tecla `T`, y eventos `TxDiagnostic`/`RxDiagnostic`/`AckDiagnostic` del pipeline

No hay urgencia en esta transición — `SerialTraceLogger` no introduce conflictos con el nuevo sistema.

---

## 13. Estimación de implementación

| Tarea | Tiempo estimado |
|---|---|
| 3 clases nuevas (`AppLogLevelSwitch`, `AppFileLogger`, `AppFileLoggerProvider`) | 2h |
| `Program.cs` — DI + crash handlers | 20 min |
| `frmMain.cs` — menú LOG + título | 30 min |
| `SerialCommandPipeline.cs` — `LogTrace` TX/RX | 20 min |
| Auditoría de datos sensibles (grep + revisión) | 30 min |
| Prueba manual (arranque, ciclo de niveles, archivo generado, crash test) | 30 min |
| **Total** | **~4h** |

---

## 14. Checklist pre-campo

Antes de entregar una versión con este sistema activo a clientes:

- [ ] Auditoría de llamadas `_logger.Log*` en servicios de seguridad completada
- [ ] Sanitizador verificado con casos reales (password, token, Bearer)
- [ ] Archivo generado y legible en `%APPDATA%\FiplexControlSoftware\`
- [ ] Separador SESSION START visible con nivel y versión correctos
- [ ] Crash handler verificado: eventos anteriores al crash presentes en archivo
- [ ] Retención verificada: archivos de más de 7 días eliminados al iniciar
- [ ] Menú LOG visible y funcional en la build de entrega
- [ ] Título de ventana actualiza correctamente al cambiar nivel
- [ ] `appsettings.json` con `"Default": "Information"` (no Debug) en build de entrega
- [ ] Verificación que `SerialTraceLogger` sigue operativo independientemente

---

*Documento técnico de diseño — Fiplex / Ikarus — 20/05/2026*
