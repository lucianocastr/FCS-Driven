# Guía de Logs de Diagnóstico — FCS 3.x

**Versión:** FCS 3.3.0+  
**Ubicación de archivos:** `%APPDATA%\FiplexControlSoftware\`  
**Ruta típica:** `C:\Users\<usuario>\AppData\Roaming\FiplexControlSoftware\`

---

## Archivos generados

| Archivo | Propósito | Se genera |
|---|---|---|
| `FCSLog_YYYYMMDD.txt` | Log general de la aplicación — eventos, errores, comunicación serial | Siempre, desde el primer arranque |
| `FCSProd_YYYYMMDD.txt` | Log de Production Tests — trazabilidad comando a comando de Clear EEPROM | Solo al ejecutar Production Tests |
| `USBmessages_YYYYMMDD.txt` | Trace serial TX/RX — trama raw del protocolo serial | Solo cuando el usuario activa el trace (tecla `T`) |

Ambos archivos acumulan múltiples sesiones del mismo día en el mismo archivo (modo append). Se retienen **7 días** y se eliminan automáticamente al iniciar la aplicación.

---

## FCSLog — Log general de la aplicación

### ¿Para qué sirve?

`FCSLog` registra la actividad general del software: inicio y cierre de sesión, comunicación con el dispositivo, errores del servidor HTTP interno, autenticación y cualquier evento anómalo. Es el primer archivo que se debe revisar ante cualquier comportamiento inesperado de la aplicación.

### Formato de cada línea

```
YYYY-MM-DD HH:mm:ss.fff [NIVEL] Componente       — Mensaje
```

Ejemplo real:
```
2026-05-26 00:12:35.850 [ERR ] DeviceCommandRouter — Command failed after 3 attempts
2026-05-26 00:34:37.121 [WARN] OfflineTokenValidator — Signature validation failed
2026-05-26 00:09:18.592 [WARN] SerialProtocolParser — Partial data timeout after 506ms
```

### Marcadores de sesión

Cada vez que se abre la aplicación se escribe un encabezado:

```
────────────────────────────────────────────────────────────
SESSION START  2026-05-26 00:09:11  FCS 3.3.0+de94ec3  [Log: WARN]
────────────────────────────────────────────────────────────
```

Y al cerrar:

```
────────────────────────────────────────────────────────────
SESSION END    2026-05-26 00:34:30
────────────────────────────────────────────────────────────
```

Esto permite identificar exactamente qué sesión corresponde a cada issue reportado.

---

### Niveles de log

El menú **LOG** en la barra principal permite seleccionar el nivel activo. El nivel se refleja en el título de la ventana: `[Log: WARN]`, `[Log: INFO]`, etc.

| Nivel | Título | Qué captura | Cuándo usarlo |
|---|---|---|---|
| **Warning + Error** | `[Log: WARN]` | ⚠️ Advertencias y errores únicamente | **Default de producción.** Registra solo eventos anómalos. Archivo liviano. |
| **Info** | `[Log: INFO]` | Todo lo anterior + flujo general (connect, auth, navegación, comandos) | Cuando se quiere ver el flujo completo sin detalle técnico profundo |
| **Debug** | `[Log: DBG]` | Todo lo anterior + detalle interno de cada componente | Para diagnosticar problemas de comunicación o comportamiento inesperado |
| **Trace** | `[Log: TRC]` | Todo lo anterior + payload TX completo y primeros 80 chars del RX | Solo para análisis profundo de protocolo serial. Archivo muy grande. |

> **Nota:** El nivel se cicla haciendo clic en el submenú correspondiente. El cambio es inmediato — no requiere reiniciar la aplicación ni reconectar el dispositivo.

---

### Componentes principales en el log

| Componente | Qué registra |
|---|---|
| `SerialCommandPipeline` | Estado de cada comando serial: ACK recibido, timeout, reintentos |
| `DeviceCommandRouter` | Traducción de requests HTTP → comandos seriales. Errores de routing |
| `SerialProtocolParser` | Parsing de tramas del dispositivo. Timeouts de datos parciales durante scan |
| `SerialPortAdapter` | Apertura/cierre de puertos COM. Errores de acceso |
| `DeviceDiscoveryService` | Scan de puertos COM: retries de identificación I1, dispositivos encontrados |
| `AuthService` | Autenticación `*0{password}` → resultado |
| `OidcAuthService` | Validación de licencia/token OIDC |
| `EmbeddedHttpServer` | Requests HTTP desde WebView2. Errores de procesamiento |
| `frmMain` | Eventos de UI: connect, disconnect, comandos cancelados |
| `AppFileLoggerProvider` | Eventos del propio sistema de log (inicio, errores de escritura) |

> **Seguridad:** Las contraseñas nunca aparecen en el log. El comando `*0{password}` se registra como `*0[***]`. Tokens Bearer y JWT claims también se sanitizan automáticamente.

---

### Escenarios de uso — FCSLog

#### El dispositivo no se conecta / scan no encuentra el equipo

→ Nivel recomendado: **Info** o **Debug**  
→ Buscar en el log:
```
SerialPortAdapter  — Failed to open COMx
DeviceDiscoveryService — COMx retry=N
SerialProtocolParser — Partial data timeout
```
Esto permite ver en qué puerto se detuvo el scan, cuántos reintentos realizó y qué datos recibió.

#### El dispositivo se desconecta inesperadamente

→ Nivel recomendado: **Warning** (default es suficiente)  
→ Buscar:
```
SerialPortAdapter  — IOException
frmMain            — USB disconnect detected
DeviceCommandRouter — Command cancelled
```

#### Autenticación falla / wrong password en loop

→ Nivel recomendado: **Info**  
→ Buscar:
```
AuthService        — Attempting authentication
AuthService        — Authentication failed
SerialProtocolParser — Received INVALID CREDENTIALS response
```

#### Un comando serial falla (Save Config, Load, etc.)

→ Nivel recomendado: **Debug**  
→ Buscar:
```
SerialCommandPipeline — ACK failed: cmd=XX retry=N
DeviceCommandRouter   — Attempt N failed
DeviceCommandRouter   — Command failed after 3 attempts
EmbeddedHttpServer    — Error processing request
```
El campo `cmd=` identifica el comando que falló (`C0`=config, `G1`=alarm, `S1`=status, etc.).

#### Error inesperado / crash

→ El log captura el último evento antes del crash gracias a `ForceFlush` en los handlers de excepción no capturada.  
→ Buscar al final del archivo:
```
[ERR ] o [CRIT] con stack trace
SESSION END (ausente si fue crash abrupto)
```

---

## FCSProd — Log de Production Tests

### ¿Para qué sirve?

`FCSProd` registra exclusivamente la ejecución de **Production Tests** (Clear EEPROM). Provee trazabilidad completa de cada comando enviado al dispositivo durante la secuencia: tiempo de respuesta (RTT), tamaño del payload, resultado y reintentos. Es el archivo a revisar cuando un production test falla o da resultados inesperados.

### Formato

Cada ejecución de Production Test genera un bloque con encabezado propio:

```
=== FCS Production Log 2026-05-26 14:38:50 ===
14:38:50.781 Device: tdev=2c ndev=2 nchannels=1 mode=0 clearROM=True
14:38:50.782 [INIT] pipeline.IsWaitingAnswer=True _cts.IsCancellationRequested=False
14:38:55.805 [INIT] Pipeline still busy after 5s — cancelling pending commands
14:38:55.806 [PIPE] cmd=S1 retry=0/1 ackResult=Timeout data='(empty)'
14:38:56.006 [INIT] Pipeline ready. Delay 2s...
14:38:58.006 [C1] Sending C1 pre-read...
14:38:58.594 [C1] Result: Success=True Status=Success DataLen=1650
14:38:58.594 [C1] OK: len=1650 raw[634..635]='00' bbuByte='0' mms=False bbuType=0
14:38:58.599 [#1] Sending: C0 — 2c Config (C command) (timeout=10s payloadLen=1692)
14:39:00.211 [#1] Result: Success=True Status=Success Retries=0 RTT=1117ms
14:39:00.311 [#2] Sending: J0 — 2c Params (J command) (timeout=10s payloadLen=559)
...
14:39:07.951 [#5] Result: Success=True Status=Success Retries=0 RTT=505ms
```

### Etiquetas del log de producción

| Etiqueta | Significado |
|---|---|
| `[INIT]` | Estado del pipeline antes de iniciar la secuencia |
| `[PIPE]` | Comando background (ej. S1 watchdog) cancelado durante la inicialización |
| `[C1]` / `[J1]` | Pre-lectura de configuración actual del dispositivo antes de escribir |
| `[#N]` | Comando N de la secuencia (1 = C0 Config, 2 = J0 Params, 3 = O0 Clear log, 4 = !0 Clear EEPROM, 5 = T0 Reset tag) |
| `[J1→J0]` | Estrategia write-back: J1 leído y reescrito como J0 para preservar parámetros |

### Campos de cada resultado

```
[#4] Result: Success=True Status=Success Retries=0 RTT=590ms
```

| Campo | Significado |
|---|---|
| `Success` | `True` = comando completado correctamente |
| `Status` | `Success` / `Timeout` / `Cancelled` / `AuthenticationFailed` |
| `Retries` | Número de reintentos realizados (0 = primera vez) |
| `RTT` | Round-trip time — tiempo desde envío hasta recepción del ACK del dispositivo |

### Escenarios de uso — FCSProd

#### El production test muestra FAIL en algún paso

→ Identificar qué comando falló:
```
[#4] Result: Success=False Status=Timeout Retries=1 RTT=15000ms
```
RTT igual al timeout configurado (10s, 15s) indica que el dispositivo no respondió.

#### El production test falla inmediatamente sin enviar comandos

→ Ver la sección `[INIT]`:
```
[INIT] Pipeline still busy after 5s — cancelling pending commands
[PIPE] cmd=S1 retry=0/1 ackResult=Timeout
[INIT] Pipeline ready. Delay 2s...
```
Si el pipeline tarda más de 5s en liberarse, hay un comando anterior colgado (típicamente S1 watchdog). Esto es normal y el software lo resuelve automáticamente.

#### El test se cancela a mitad de secuencia

→ Buscar `Status=Cancelled` con RTT bajo:
```
[#2] Result: Success=False Status=Cancelled Retries=1 RTT=60ms
```
RTT muy bajo (ej. 60ms) con `Status=Cancelled` indica cancelación por software (no por timeout del dispositivo). Esto ocurría antes del fix de #31 cuando la UI se recargaba durante el test.

---

## Referencia rápida — ¿Qué archivo usar?

| Situación | Archivo | Nivel sugerido |
|---|---|---|
| El FCS no conecta con el dispositivo | `FCSLog` | Info |
| Scan de COM ports lento o se cuelga | `FCSLog` | Debug |
| Autenticación con password falla | `FCSLog` | Info |
| Comando serial falla (Save, Load, etc.) | `FCSLog` | Debug |
| Crash o cierre inesperado de la app | `FCSLog` | WARN (default) |
| Production Test falla o da FAIL | `FCSProd` | — (siempre activo) |
| Análisis de protocolo serial raw | `USBmessages` | Activar con tecla `T` |

---

## Cómo compartir los logs para soporte

1. Abrir el explorador de Windows y pegar en la barra de dirección:
   ```
   %APPDATA%\FiplexControlSoftware
   ```
2. Identificar los archivos del día del issue (`_YYYYMMDD`).
3. Comprimir y enviar:
   - `FCSLog_YYYYMMDD.txt` — siempre incluir
   - `FCSProd_YYYYMMDD.txt` — incluir si el issue es de production test
   - `USBmessages_YYYYMMDD.txt` — incluir si se activó el trace serial

> Si el problema ocurre hoy, el archivo del día actual ya contiene la sesión activa.  
> Si el problema ocurrió ayer o antes, buscar el archivo con la fecha correspondiente (se retienen 7 días).

---

## Cambiar el nivel de log en campo

El menú **LOG** es público — no requiere acceso factory ni licencia especial.

1. Reproducir el issue con el nivel **Warning** (default).
2. Si el log no contiene información suficiente, cambiar a **Info** desde el menú LOG.
3. Reproducir el issue nuevamente.
4. Si aún no es suficiente, cambiar a **Debug** y repetir.
5. Enviar el archivo `FCSLog_YYYYMMDD.txt` a soporte.

> El nivel activo se muestra siempre en el título de la ventana: `Fiplex Control Software 3.3.0 [Log: WARN]`  
> El cambio de nivel es **inmediato** y **no requiere reconectar** el dispositivo.
