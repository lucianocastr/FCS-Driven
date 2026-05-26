#

## [3.4.0] - TBD

### Added
- **Sistema de logging de diagnóstico de campo** (`Core/Diagnostics/AppFileLoggerProvider`, `AppFileLogger`, `AppLogLevelSwitch`)
  - Archivo diario `%APPDATA%\FiplexControlSoftware\FCSLog_YYYYMMDD.txt` activo desde el primer arranque.
  - Cuatro niveles seleccionables por el usuario: **Error** (default), **Info**, **Debug**, **Trace**.
  - Menú `LOG` público en la barra de menú principal (accesible sin restricciones) con checkmark en el nivel activo.
  - Título de ventana refleja el nivel activo: `[Log: WARN]` / `[Log: INFO]` / `[Log: DBG]` / `[Log: TRC]`.
  - Separadores `SESSION START / SESSION END` con timestamp y nivel al abrir y cerrar la app.
  - Retención automática de 7 días; archivos anteriores eliminados al iniciar.
  - `ForceFlush` en handlers `UnhandledException` y `ThreadException` — los últimos eventos antes de un crash llegan al disco.
  - Sanitizador en el logger: `*0[***]`, Bearer tokens y JWT claims nunca aparecen en el archivo.
  - Nivel Trace cubre TX payload completo y RX primeros 80 chars (`SerialCommandPipeline.cs`).
  - Coexiste con `USBmessages_YYYYMMDD.txt` (`SerialTraceLogger`) — ambos sistemas activos en paralelo.

### Fixed
- **#28 — Calibration submenus disabled after Save/Load Calibration in factory mode** (`frmMain.cs`, `FileOperationService.cs`, `SerialCommandPipeline.cs`, `SerialCommand.cs`)
  - **Root cause 1 — `ToolStripMenuItem.Visible` getter behavior:** `ExecuteFileOperationAsync` capturaba el snapshot del menú con `bool calMenuWasVisible = mnuCal.Visible`. El getter `ToolStripMenuItem.Visible` retorna `Available && ParentDropdown.Visible`. Cuando el dropdown de File está cerrado, `ParentDropdown.Visible = false` → el getter siempre retorna `false` aunque el ítem esté activo. Al cerrar el diálogo de Save/Load, el snapshot era `false` → el bloque `finally` no restauraba los submenús. Confirmado por log: `ShowFactory: showCal=True mnuCal.Visible=False`.
  - **Fix 1:** Reemplazado `mnuCal.Visible` por `mnuCal.Available` en el snapshot. `Available` retorna el estado propio del ítem independientemente del estado del dropdown padre. Aplicado también en el guard de reconexión (`if (mnuCal.Available)`).
  - **Root cause 2 — LoadCAL: buffer serial contaminado por respuesta tardía de S1:** La operación LoadCAL cancela los comandos de polling activos (S1 watchdog) y envía F0+482 chars. S1 fue cancelado pero el device respondió igualmente con 1584 bytes en tránsito. F0 fue encolado 1ms después de la cancelación. El pipeline capturó los 1584 bytes de S1 como respuesta de F0 vía el path "DataFrame before ACK" → `result.Data = 1584 chars` ≠ "ACK" → LoadCAL fallaba con "Error sending calibration. Commands executed: 0/2". Confirmado por log: `LoadCal frame 0: Success=True Status=Success DataLen=1584`.
  - **Fix 2a — Nuevo método `DiscardAndFlushBuffer()` en `ISerialCommandPipeline`:** Combina `SerialPort.DiscardInBuffer()` (buffer OS) + `_parser.Reset()` (estado interno). `FlushInputBuffer()` queda sin cambios (solo parser reset) para mantener parity VB 1.9 en production test — VB 1.9 omite `FlushRS232()` para devices con password. `DiscardAndFlushBuffer()` se usa exclusivamente en LoadCAL donde la limpieza agresiva es necesaria.
  - **Fix 2b — `SerialCommand.DiscardDataBeforeAck`:** Nuevo flag. Cuando `true`, si el pipeline recibe un DataFrame mientras espera el ACK token, lo descarta y espera el ACK real sin reenviar el comando. Previene que bytes en tránsito de comandos cancelados contaminen el ACK wait del siguiente comando.
  - **Fix 2c — `ExpectsData = false` + `AckTimeout = 5s` para F0/Q0:** F0 y Q0 son write commands; el device responde solo con ACK token, sin data payload. `ExpectsData = true` era incorrecto. `AckTimeout` aumentado de 800ms a 5s para dar tiempo al device de procesar los 482 bytes antes de responder. La comprobación de éxito cambiada a `result.Success` únicamente.
  - **UX:** Diálogos de Save/Load Calibration retienen el último path usado (`_lastCalSavePath` / `_lastCalLoadPath`), replicando comportamiento de VB 1.9.
  - **Confirmado en hardware:** Save OK + Load OK, menú Calibrations visible y activo después de ambas operaciones. Duración típica: ~12.7s para 2 frames (482 + 384 chars).
- **#29 — UI not refreshing after License Apply Changes** (`frmMain.cs`)
  - **Root cause:** `ShowLicenseManager()` never subscribed to the `ChangesApplied` event on `frmLicense` / `frmLicenseMaster`. Changes were applied to the device but the web UI remained stale until the user manually refreshed.
  - **Fix:** Subscribe to `ChangesApplied` before `Show()` — calls `NavigateToDeviceUIAsync(forceAdvanced: true)` to reload the device page.
- **#30 — PROJECT RELATED tag intermittently not stored despite green check** (`DeviceCommandRouter.cs`)
  - **Root cause:** `UpdatePostCaches` evaluated `effectiveSuccess = commandSucceeded || !postCommand.WaitResponse`. For fire-and-forget commands (`!0`, `T0`, `C0`, etc., all with `WaitResponse=false`) this always resolved to `true`, so `_previousAnswer = "0"` regardless of whether the device ACK'd the write. If the device silently dropped the ACK, the tag was never stored but the JS showed a green check.
  - **Fix:** Use `commandSucceeded` directly: `_previousAnswer = commandSucceeded ? "0" : "1"`. A missing ACK now returns `"1"` (ERR_FAIL), detected immediately by `check_result()` without the 25-second polling fallback.
- **#31 — Device password authentication — VB 1.9 parity** (`frmPassword.cs`, `frmMain.cs`, `AuthService.cs`)
  - **Root cause 1:** `IsNullOrWhiteSpace` blocked space-only passwords client-side; VB 1.9 passes any non-empty string to the device for validation.
  - **Root cause 2:** Wrong password triggered `DisconnectAsync()` + MessageBox, forcing the user to reconnect from scratch. VB 1.9 keeps the dialog open with "Wrong password" shown inline.
  - **Root cause 3:** Cancelling the dialog also showed "Wrong password" because the pipeline received `null` and returned `AuthenticationFailed`, indistinguishable from a wrong password.
  - **Fix:** `IsNullOrEmpty` replaces `IsNullOrWhiteSpace` in `frmPassword` and `AuthService`. All capture-mode errors shown inline with auto-hide after 4 s. Cancel disconnects quietly; wrong password re-opens the dialog with error pre-filled and inline retry loop.
- **Filter Tool — Apply Proposal produces no visual feedback when content frame is not on the status page** (`frmMain.cs`)
  - **Root cause:** `FilterToolPopup_WebMessageReceived` called `top.frames['content'].toolSubmit(frms)` directly. `toolSubmit` is only defined when the status page (`start.zhtml`) is loaded in the content frame. When the user was on any other page (e.g. IP Config) at the time of clicking Apply Proposal, the call failed silently — no pending indicator, no green check ✓, no background status refresh.
  - **Fix:** Added `cf.startPage` guard before calling `toolSubmit`. If the content frame is not on the status page, it navigates to `start.zhtml` first and calls `toolSubmit` after a 3 s load delay, matching the page-switching logic already present in `navi.js`.
- **Clear EEPROM production test cancelled mid-sequence by web UI reload** (`frmMain.cs`)
  - **Root cause:** Pressing any web UI button (e.g. Status) during a production test triggered a page reload → `base.js` request → `OnHttpServerBaseJsLoaded` → `CancelPendingCommands()`. The J0 command (sent ~5 s into the sequence) received a cancellation token signal, returned `Status=Cancelled` with RTT=60 ms (far below the 10 s ACK timeout), and the test reported failure.
  - **Confirmed via** `FCSProd_YYYYMMDD.txt`: `[J1→J0] Result: Success=False Status=Cancelled Retries=1 RTT=60ms`, followed 200 ms later by `POST command not found: global_req` — the reloaded page's first request.
  - **Fix:** Added `_productionTestInProgress` flag (set before `SendProdConfigAsync`, cleared in `finally`). `OnHttpServerBaseJsLoaded` returns early without calling `CancelPendingCommands()` while the flag is set.

### Changed
- **FCSProd log relocated and date-stamped** (`frmMain.cs`)
  - Moved from `%TEMP%\fcs_prod_log.txt` (ephemeral, overwritten on each run) to `%APPDATA%\FiplexControlSoftware\FCSProd_YYYYMMDD.txt`.
  - Multiple production test runs on the same day accumulate in the same file (append mode with per-run header).
  - Automatic 7-day retention — same policy as `FCSLog_YYYYMMDD.txt`.
- **Log level default label corrected** (`AppLogLevelSwitch.cs`, `frmMain.cs`)
  - `[Log: ERR]` renamed to `[Log: WARN]` in the window title — the default level (`Warning`) captures both warnings and errors. The previous label implied only errors were logged, which caused field technicians to underestimate the diagnostic value of the default log.
  - Menu item "Error / Warning" renamed to "Warning + Error" for consistency.

---

## [3.3.0] - 2026-05-20

### Added
- **Factory mode access** — Activation sequence triggers auto-navigation to factory page on entry, matching FCS 1.9 behavior.
- **License Options access** — Activation sequence opens License Options dialog.

### Changed
- **License Options dialog** — Redesigned layout: checkboxes 20×20 px, Power Limit Downlink values centered, BAND0/BAND1 column headers aligned with input grid (64 px wide, centered), GDI+ confirmation icon (green check / red X circle) matching Ethernet Module dialog style.
- **CLSS menu** — Restored always-visible behavior on active session, matching FCS 1.9.

### Fixed
- **COM scan freeze — hung port blocking full scan** (`DeviceDiscoveryService`, `SerialPortAdapter`)
  - **Root cause:** `SerialPort.Close()` is synchronous. On certain USB CDC drivers (e.g. DAS Master Flex dual-port adapter), `Close()` blocks indefinitely when called while the driver has a pending I/O operation. The previous implementation awaited `CloseAsync()` directly on the scan loop thread, causing the entire scan to freeze.
  - **Secondary cause:** `SerialPort.Open()` can also block on non-standard USB serial drivers. With `MaxRetries=5` and `OpenPortTimeout=300ms`, up to 5 concurrent `Task.Run` threads could accumulate — all blocked on the same port — creating race conditions on the shared `_serialPort` field.
  - **Fix — `SerialPortAdapter.CloseAsync()`:** Field `_serialPort` is nulled immediately (so `IsOpen` returns `false` at once), then the actual `Close()`+`Dispose()` runs on a background thread. The scan loop is never blocked by driver-level I/O delays on close.
  - **Fix — open hang:** If `OpenAsync()` does not complete within 2 000 ms the port is skipped entirely (`return null`). No retry on hanging opens — prevents thread-pool accumulation.
  - **Fix — identification timeout:** After the 3 s identification guard fires, `CloseAsync()` is awaited with a 1 500 ms `Task.WhenAny` cap. Scan continues regardless of whether close completes.
  - **Fix — retry reduction:** `MaxRetries` reduced from 5 to 2. Worst case per non-responsive port: 2 × (3 s + 1.5 s) = 9 s.
  - **Fix — global watchdog:** 60 s `CancellationTokenSource` linked to the outer token. If the total scan exceeds 60 s for any reason, a warning is logged and the scan exits cleanly.
  - **Verification via trace log:** Enable serial trace logging (T key with Scan Devices focused) before scan. Each port appears in `%APPDATA%\FiplexControlSoftware\USBmessages_YYYYMMDD.txt` with elapsed time. A port that previously caused a 4-minute freeze should now appear with ~2 s delta (open timeout) or ~9 s delta (identification timeout).
- **Serial trace log activation** (`frmMain.cs`) — T key to toggle trace log was not working unless the user explicitly tabbed to Scan Devices. Root cause: async scan updates `cmbCOM` DataSource on completion, which silently steals focus from `cmdIDPort`. Fix: `cmdIDPort.Focus()` in the scan `finally` block restores exact VB 1.9 behavior (synchronous scan never moved focus away from the button).
- **DAS Remote (and slow-to-respond devices) not appearing in device list** (`DeviceDiscoveryService.cs`)
  - **Root cause — retries:** VB 1.9 retries the I1 identification command up to 5 times per port (`Loop While instRx = "NACK" And num < 5`). C# was capped at 2 retries (`MaxRetries = 2`). Devices that return NACK on the first 1–2 attempts (common in DAS Remote firmware during serial stack initialization) were silently dropped after the 2nd attempt. VB 1.9 found them on attempt 3–5.
  - **Root cause — open timeout:** If the USB-serial driver took more than 2 000 ms to open the COM port (observed with dual-port adapters such as Silicon Labs CP2105 used by DAS Remote units), C# aborted that port with no retry and no trace log entry — the device was completely invisible. VB 1.9 uses MSCOMM (synchronous, no explicit open timeout).
  - **Fix — `MaxRetries` 2 → 5:** Restores VB 1.9 parity. Devices that respond on the first attempt are unaffected. Slower devices get up to 5 chances before the port is abandoned.
  - **Fix — `OpenPortTimeout` 2 000 ms → 4 000 ms:** Provides additional margin for slow USB-serial drivers on open. Normal drivers open in <100 ms — no observable impact on them.
  - **Worst-case scan time per unresponsive port:** 5 × (4 s open + 3 s I1) = 35 s, bounded by the existing 60 s global watchdog.
  - **Verification:** With serial trace logging active, every port attempt appears in `%APPDATA%\FiplexControlSoftware\USBmessages_YYYYMMDD.txt`. A DAS Remote that was previously invisible should now produce `COMx Nretry=N ans=FiplexXXXXXXXXX` on one of the additional retries.
- **Serial trace log — path and content parity with VB 1.9** (`SerialTraceLogger.cs`, `SerialCommandPipeline.cs`, `frmMain.cs`)
  - **Root cause (path):** Log path was `%APPDATA%\Fiplex\USBmessages_YYYYMMDD.txt` (directory non-existent on standard installs). File was never written; client could not find it.
  - **Fix — path:** Corrected to `%APPDATA%\FiplexControlSoftware\USBmessages_YYYYMMDD.txt`, matching the exact path used by FCS 1.9.
  - **Fix — auth sequence:** `HandleInvalidCredentialsAsync` now logs `Tx0 V1` → `Rx0 INVALID CREDENTIALS` → `Tx0 *0{password}` → `Rx0 ACK`, matching VB 1.9 format exactly.
  - **Fix — TX/RX/ACK events:** `TxDiagnostic`, `RxDiagnostic`, `AckDiagnostic` events subscribed in `frmMain.cs` — every command TX and its ACK response are written to the trace file while logging is active.
  - **Residual difference (by design):** S1 spectrum polls run concurrently in v3.x vs. sequentially in VB 1.9; total elapsed time is similar (~2.5 s). Does not affect field diagnostics.

---

## [3.0.3] - 2026-05-06

### Fixed
- **Signal Booster — Save from Device no descargaba el archivo** (`DeviceCommandRouter.cs`)
  - GET encode=1 enviaba el comando hex-encodeado al dispositivo (`!1` → `"2131"`) y hex-decodeaba la respuesta (sentido invertido). Dispositivo recibía comando desconocido → timeout → XHR 10s → `getDataEnd()` silencioso. Fix: se elimina el hex-encoding del comando GET; se cambia `DecodeFromHex` → `EncodeToHex` para la respuesta (semántica v1.9: enviar comando sin modificar, encodear la respuesta).
- **Signal Booster — Load to Device mostraba FAIL aunque la config se aplicaba** (`DeviceCommandRouter.cs` + `htdocs_2c2/settings.cfg`)
  - POST encode=1 (`proj_str !0`, `ctl_tags_str T0`) hacía `DecodeBody` (correcto) y luego re-encodeaba todo con `EncodeToHex` (destruía el paso anterior). Fix: se elimina el bloque `EncodeToHex` de `ProcessPostRequestAsync`.
  - Todos los POST write-only (`proj_str`, `nfpa_str`, `np_settings_str`, etc.) usaban `WaitResponse=true` por defecto (faltaba 4ta columna en settings.cfg) → pipeline esperaba datos que nunca llegan → timeout → FAIL. Fix: se agrega columna `0` (WaitResponse=false) a todos los comandos write-only en `settings.cfg`.
- Actualización de versión de ensamblado, producto y archivo a 3.0.3.

## [3.0.2] - 2026-05-03

### Changed
- Actualización de versión de ensamblado, producto y archivo a 3.0.2.

# Changelog

All notable changes to Fiplex Control Software will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive documentation (EN)
- Technical architecture documentation with Mermaid diagrams

### Changed
- Device discovery and COM scan flow were hardened for mixed serial environments and repeated connect/disconnect cycles.

### Deprecated
- Nothing yet

### Removed
- Nothing yet

### Fixed
- **Issue #21: Wrong password shows unclear connectivity message** (source: user Excel tracker, 2026-05-01)
  - Restored VB parity for authentication failure handling when an invalid password is entered.
  - **Root cause**: During `V1` authentication check, pipeline-level `AuthenticationFailed` (triggered after invalid credentials in the credentials retry flow) was interpreted as `DeviceNotResponding`.
  - **Impact**: Users saw the connectivity error message (`"Device is not responding..."`) instead of a credential-specific message.
  - **Solution**:
    - Added explicit `AuthResult.IncorrectPassword` handling in `CheckAuthenticationRequirementAsync()` when pipeline status is `CommandResultStatus.AuthenticationFailed`.
    - Added explicit `AuthResult.IncorrectPassword` branch in `frmMain.ConnectAsync()`.
    - Updated UI message to: `"Incorrect password. Please verify your credentials and try again."`
  - **Technical details**:
    - Updated `Models/AuthResult.cs` with authentication outcome values used by the C# flow.
    - Updated `Core/Security/Interfaces/IAuthService.cs` to return `AuthResult` from `AuthenticateAsync`.
    - Updated `Core/Security/AuthService.cs` for explicit password-vs-connectivity result mapping.
    - Updated `Forms/frmMain.cs` authentication switch to display credential-specific feedback.
  - **Behavior**: Invalid password now shows a clear authentication message, while true connectivity failures still show the connectivity message.
- **Issue #18: "Edit password menu fails"** (source: user Excel tracker, 2026-05-01) for `release/3.0.0` stabilization
  - Fixed device password change command (`^0`) configuration in `frmMain.cs`
  - **Root cause**: Command was configured with `ExpectsData = true`, causing pipeline to wait for a DataFrame that never arrives
  - **Impact**: Password was successfully changed on device, but software showed error message due to timeout
  - **Solution**: Changed to `ExpectsData = false` since device only responds with ACK (no data frame)
  - **Technical details**:
    - Modified `mnuPassword_Click` handler in `frmMain.cs` (lines ~2509-2554)
    - Simplified validation logic from `result.Success && result.Data.Equals("ACK")` to just `result.Success`
    - Removed `ParsePasswordValidationError()` call since device doesn't send validation errors in ACK-only mode
  - **Behavior**: Now correctly shows success message when password change is accepted by device
- **Parity fix for `mnuConfig` (File → Configuration) on Flex devices**
  - **Root cause**: In C#, `mnuConfig` was being enabled unconditionally after connect and after file operations.
  - **Impact**: `File → Configuration` appeared enabled on Flex families where legacy VB behavior requires it to stay disabled.
  - **Solution**: Restored VB parity by disabling `mnuConfig` for `4dm`, `4dm1`, `4dm2`, `4dm3`, `4dm4`, `5dm`, and `2c`.
  - **Technical details**:
    - Added `IsConfigMenuEnabledForDevice(DeviceInfo? device)` in `frmMain.cs`.
    - Replaced unconditional enable logic in `ConnectAsync()` with device-conditional logic.
    - Replaced unconditional re-enable logic in `ExecuteFileOperationAsync()` (`finally`) with device-conditional logic.
  - **Behavior**: `File → Configuration` now remains disabled on Flex devices, matching expected VB behavior

### Security
- Nothing yet

---

## [3.0.1] - 2026-04-04

### Fixed
- **Port scan resilience and BDA/Signal Booster discovery parity improvements** (branch: `fix/bda-connection`)
  - Improved COM scanning so non-Fiplex devices do not block the scan loop.
  - Restored more VB-like tolerance for legacy identification responses during device discovery.
  - Ensured the UI remains responsive while scanning ports.
  - Added structured per-port/per-retry discovery logging for support diagnostics.
  - **Root causes addressed**:
    - Discovery previously depended on complete LF-terminated responses, which could miss legacy or partial `I1` replies.
    - A blocked or slow COM device could leave the application stuck in `Scanning COMx`.
    - Pending serial pipeline state after disconnect could interfere with subsequent scans.
  - **Solution**:
    - Added `AcceptPartialResponse` to `SerialCommand` and enabled it only for discovery command `I1`.
    - Updated `SerialCommandPipeline` to surface partial responses as `DataFrame` only when explicitly allowed.
    - Added pre-scan cleanup and disconnect cleanup in `frmMain` (`CancelPendingCommands`, defensive serial close).
    - Moved scan execution off the UI thread in `frmMain` to avoid freezing the WinForms message loop.
    - Added timeout guards around discovery stages in `DeviceDiscoveryService`:
      - `CheckComPort`
      - `ExistePort`
      - serial port open
      - `I1` identification wait
    - Added scan trace logging with `scanId`, COM port, retry, raw response, timeout, and identification outcome.
  - **Behavior**:
    - The scan now continues through all available COM ports even when unrelated serial devices are present.
    - Full scan supports multiple Fiplex devices connected at the same time.
    - Repeated `Scan → Connect → Disconnect → Scan` cycles are more reliable.
    - Debug logs now provide exact per-port discovery traceability.

---

## [3.0.0] - 2025-11-30

### Added
- Complete migration from VB.NET to C# (.NET 10)
- Modern dependency injection architecture
- WebView2 integration for HTML-based device UIs
- OIDC authentication with Duende IdentityModel
- Serial command pipeline with FIFO queue
- Circuit breaker pattern for device communication
- Strategy pattern for device-specific response handlers
- Embedded HTTP server for WebView2 communication
- Training validation and subscription management
- Simulated device mode for development (`NoUSB` mode)
- Structured logging with Microsoft.Extensions.Logging

### Changed
- Target framework from .NET Framework 4.x to .NET 10
- UI architecture from native WinForms to WebView2 hybrid
- Authentication from custom to OIDC-based system
- Serial communication to async pipeline model

### Removed
- Legacy VB.NET codebase
- Direct COM port access (replaced by abstracted pipeline)

---

## [1.x.x] - Legacy VB.NET Version

The original VB.NET implementation is no longer maintained.
See migration comments in code (`// Equivalente VB.NET:`) for historical context.

---

## Version History Summary

| Version | Date | Framework | Status |
|---------|------|-----------|--------|
| 3.0.1 | 2026 | .NET 10 | Current |
| 3.0.0 | 2025 | .NET 10 | Previous |
| 1.x.x | 2015-2025 | .NET Framework | Legacy |

---

## Release Types

- **Major (X.0.0)**: Breaking changes, major features
- **Minor (0.X.0)**: New features, backward compatible
- **Patch (0.0.X)**: Bug fixes, documentation updates

## Supported Devices

| Device Type | TDev | NDev Range | Status |
|-------------|------|------------|--------|
| Signal Booster | 1c | 2.2 - 7.0+ | ✅ Active |
| Signal Booster | 2c | 1.0+ | ✅ Active |
| DAS Master | 5dm | 1.0+ | ✅ Active |
| DAS Remote | 5dr | 1.0+ | ✅ Active |

---

[Unreleased]: https://github.com/fiplex/control-software/compare/v3.0.1...HEAD
[3.0.1]: https://github.com/fiplex/control-software/compare/v3.0.0...v3.0.1
[3.0.0]: https://github.com/fiplex/control-software/releases/tag/v3.0.0
