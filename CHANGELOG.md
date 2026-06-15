#

## [3.7.0] - 2026-06-15

### Added
- **INIT-005 Phase 1A — Serial lifecycle instrumentation** (`6154e32`)
  - Close lifecycle logging: `[Serial] Close {Port} {START|OK|ABANDONED|LATE_COMPLETED} duration={Ms}ms`
  - ZOMBIE snapshot detector: comando perpetuo registrado cuando `cancelCount ≥ 2` — campos `EnqueuedAt`, `CancelCount`, `Phase`
  - `POST_WRITE` log tras escritura exitosa al puerto
  - 3 archivos afectados: `SerialPortAdapter.cs`, `DeviceDiscoveryService.cs`, `SerialCommandPipeline.cs`

### Fixed
- **BT-COM-001 / INIT-005 Phase 2 — Hostile-port mitigation** (`548ccab`)
  - **M-1 Write budget**: `WhenAny(WriteAsync, Delay(2000ms))` — escribe con límite de tiempo; resultado `CommandResultStatus.WriteTimeout` al agotar presupuesto; sin retry
  - **M-2 PortQuarantine**: nuevo singleton `PortQuarantine` (DI); excluye puerto hostil de scans subsiguientes al detectar `write-abandoned` o `close-abandoned`; guard de reconexión en `frmMain`
  - **M-3 DiscardOutBuffer pre-close**: `best-effort` antes de cerrar el puerto; drena el stack del driver; elimina residuo / handle leak
  - CUSTOMER-VALIDATED (2026-06-15): FCSLog cliente `FCSLog_20260615.txt` confirma ZOMBIE=0, AccessDenied=0, Close ABANDONED=0, Discovery y Connect exitosos sobre COM hostil; fix validado en lab propio (banco COM5 RFCOMM hostil + Booster COM8) y en entorno Fiplex (COM4 BT hostil + Booster COM6)

- **DISC-010 — Restaurar contrato POST de paridad VB6 1.12** (`52b6a79`)
  - **Raíz**: `SettingsParser.cs:192` — default `waitResponse=true` cuando settings.cfg no tiene 4ª columna; 48 de 49 perfiles son 3-columna → Apply Changes fallaba visual con ~60s timeout (el cambio quedaba aplicado porque el equipo ya había respondido ACK)
  - **Fix parser legacy** (`ParsePostCommand`): cuando falta col4, infiere `waitResponse` por sufijo del payload (`endsWith("0")` o `startsWith("!")` → ACK-only; else ACK+DATA)
  - **Fix parser pipe** (`ParseCSharpFormatAsync`): aplica la misma inferencia a la ruta pipe (causa gemela latente)
  - **Principio**: columna explícita en settings.cfg tiene precedencia absoluta; sufijo decide solo el default cuando col4 falta
  - **Log DBG**: `POST contract {cmd}: waitResponse={v} source={explicit-col4|inferred-suffix}`
  - Paridad VB6 1.12 restaurada: suffix-0 writes (C0,T0,J0,!0,O0,E0,N0,Q0,F0,K0,…) = ACK-only; suffix-1 reads (C1,T1,J1,E1,U1,A1,…) = ACK+DATA (sin cambio)
  - **Residual de validación externa**: inferred-suffix runtime no ejercitado en banco propio (único hardware disponible —Booster— mapea a htdocs_2c2, el único perfil 4-columna); cierra con campaña de campo Fiplex sobre dispositivo 3-columna

### Build Metadata
- `<Version>` (ProductVersion): **3.6.0 → 3.7.0**
- `<AssemblyVersion>`: `3.0.2.0` (sin cambio — **CONGELADO** por diseño .NET binding)
- `<FileVersion>`: `3.0.2.0` (sin cambio — **CONGELADO** · metadatos Windows)
- TargetFramework: `net10.0-windows` (sin cambio)

---

## [3.6.0] - 2026-06-03

### Added
- **ROB-001 Phase 1A — Discovery Telemetry** (`9da316e` · PR-1 · I-6)
  - `DiscoveryTelemetry` singleton lock-free con 14 counters (scan, port-open, identification, device categories)
  - `[Telemetry] ScansCompleted=N PortsOpenSucceeded=M ...` summary line por scan completo
  - Instrumentación pasiva en `DeviceDiscoveryService`, `SerialPortAdapter` y `SimulatedSerialPort` (F-1 closure)
- **ROB-001 Phase 1A — Open/Close logging explícito** (`347e9bd` · PR-2 · I-8)
  - `[Serial] {Action} {Port} {Outcome} duration={Ms}ms [reason={Reason}]` formato congelado
  - `Stopwatch` local por operación · sin cambios a control flow ni retries/timeouts
- **ROB-001 Phase 1A — Logger ForceFlush antes de exit** (`cd8efe3` · PR-3 · I-4)
  - `AppFileLoggerProvider.ForceFlush()` invocado en `Program.Main` finally
  - Drena cola pendiente de log antes de exit · sin tocar lifecycle ni singletons
- **ROB-001 Phase 1A — ApplicationExit + ordered host.Dispose** (`3414abe` · PR-5 · I-2 + I-3)
  - `Application.ApplicationExit` handler subscribed
  - `DisposeHostOnce()` con idempotency lock + `Task.Run` con timeout 5s + invocación en finally como fallback
  - Neutraliza sync-over-async (`Dispose() => StopAsync().GetAwaiter().GetResult()`) sin modificar singletons (`EmbeddedHttpServer`, `WatchdogService`, `SerialCommandPipeline`)
  - `SESSION END YYYY-MM-DD HH:MM:SS` footer empíricamente observado por primera vez post-migración
- **ROB-001 Phase 1A — Hard timeout DisconnectAsync** (`0b5c1ae` · PR-4 · I-7)
  - `await DisconnectAsync()` en `frmMain2_FormClosing` wrapped con `Task.WhenAny + Task.Delay(5s)`
  - Log warning si excede budget · `DisconnectAsync` interno preservado intacto
- **INIT-004 Componente A — FL2 Master Global Config dispatch** (`83e1d2a`)
  - `IsFl2MasterGlobalConfigContext` + `ProcessFl2MasterGlobalConfigAsync` con dispatch en `ProcessPostRequestAsync`
  - Resto INIT-004 ON HOLD hardware-gated (requiere DAS Master Flex 2.0)

### Changed
- **SOURCE vs DEPLOYMENT package model formalizado** (`8999b3a`)
  - `docs/GUIA_ENTREGA_NUEVA_VERSION.md` actualizada con regla de filtrado `runtimes/`
  - Regla v1.2: preservar `runtimes/win` (RID-genérico managed) + `runtimes/win-*` (RID-arch native) · filtro previo eliminaba `win` causando System.IO.Ports load failure
  - Cliente recibe DEPLOYMENT package · SOURCE package solo bajo solicitud explícita y autorización

### Fixed
- **BUG-002 · INIT-002 regression preservation U1 multi-segment response** (`cccbc4a`)
  - `DeviceBbuResponseHandler.ProcessResponse()` ya NO devuelve `_factStrFixed` aislado (~484 chars)
  - Parchea voltage bytes `"27D8"` in-place dentro de `segments[1]` offset 434 (longitud invariante)
  - Preserva trama multi-segmento (`splitwith3tabs:3104,2870,2528,4`) per VB6 1.12 baseline (`GetFromFileData.bas` 397-401, 495-520)
  - Hardware validado: DAS Master legacy `Fiplex000000085` (5dm/1.0 frVersion=0) COM8 · Status Page renderiza FW/SW/SN · "PLEASE WAIT LOADING" desaparece
  - INIT-002 sigue COMPLETED · sin reapertura

### Architectural Debt Closed
- **7 de 9 hallazgos OPS-003 cerrados directamente por ROB-001 PR-5**
  - `host.Dispose()` cableado por primera vez post-migración (era no-cabled desde commit inicial `8cf3177` 2025-12-11)
  - `ApplicationExit` handler agregado (ausencia histórica)
  - `EmbeddedHttpServer`, `WatchdogService`, `SerialCommandPipeline` liberados deterministicamente vía cadena Dispose
  - Log retenido post-cierre resuelto (`AppFileLoggerProvider.Dispose` ejecuta)
  - Proceso residente post-cierre visual resuelto bajo hardware healthy (`Get-Process *Fiplex*` vacío)
- Hallazgos pendientes:
  - `frmMain2_FormClosing` async void preservado intencionalmente (cambio de tipo tendría impacto de propagación inaceptable · OPS-003 fuera de scope)
  - Shutdown incompleto bajo hostile USB-Serial drivers (kernel-mode IRP) requiere I-1 diferida (Bounded shutdown timer + `Environment.Exit` escape hatch)
- **OBSERVATIONS documentadas** (no bloqueantes):
  - OBSERVATION-001: COM9 retry 5 timeout intermitente · pre-existente
  - OBSERVATION-002: kernel-mode IRP zombie bajo hostile USB-Serial drivers · cerrado parcialmente
  - OBSERVATION-003: `ObjectDisposedException` race en `DisconnectAsync` continuation · pre-existente
- **Iniciativas diferidas con criterios de reactivación**:
  - I-1 (Bounded shutdown timer + `Environment.Exit` escape hatch)
  - I-5 (Per-port blacklist con TTL)

### Governance
- **GOV-001 cleanup ejecutado**:
  - G1: CHANGELOG backfill `[3.1.0]` + `[3.2.0]` (commit `f81bc9f`)
  - G2: Tags históricos creados v3.0.3 · v3.1.0 · v3.2.0 · v3.3.0 (lightweight per precedente)
  - G3: `RELEASE_BY_RELEASE_MERGE_PLAN.md` v2.1 → v2.2
  - G5: Final cleanup validation · 10/10 checks PASS · 7/7 criterios PASS
- Autoridades de versionado consolidadas: L1 CHANGELOG.md + L2 GUIA_ENTREGA_NUEVA_VERSION.md
- Modelo de versionado de 5 niveles documentado (N1 BUSINESS_BASELINE · N2 PRODUCT_RELEASE · N3 BUILD_METADATA · N4 DEVICE_VERSION · N5 GIT TAG)

### Build Metadata
- `<Version>` (ProductVersion): **3.5.0 → 3.6.0**
- `<AssemblyVersion>`: `3.0.2.0` (sin cambio · **CONGELADO** por diseño .NET binding)
- `<FileVersion>`: `3.0.2.0` (sin cambio · **CONGELADO** · Windows file metadata)
- TargetFramework: `net10.0-windows` (sin cambio)

---

## [3.5.0] - 2026-06-01

### Added
- **INIT-001 Phase 2B password reset + PassLevel propagation** — Forgot Password flow with `frmResetPass` dialog. Adds `AuthService.RequestResetKeyAsync` + `ExecutePasswordResetAsync` + `ResetKeyStatus` model. `PassLevel` propagation from `DeviceInfo` to password dialog enables "Forgot Password" link for PassLevel ≥ 2 devices.
- **INIT-001 SDRP catalog suffix matching + catalog enhancements** — `DeviceCatalogService.ResolveDevice` uses suffix matching (`Substring(11, 4)`) instead of exact-match. `DeviceInfo` extended with `FrVersion`, `PassLevel`, `MaxVersion` properties. `fdevices.tsv` extended with passLevel + maxVersion columns. VB6 1.12 parity: `frversion > 0` → `PassLevel = 2`.
- **INIT-002 BBU response handler + AnalyzeDeepDischVolt** — `DeviceBbuResponseHandler` class with `AnalyzeDeepDischVolt` method detects and corrects deep discharge voltage condition. DI registration in `Program.cs`. Integrated with `DeviceResponseProcessor` for 5dm-specific prefix application.
- **INIT-003 PathShared dinámico + 4 htdocs versionados** — `DeviceDiscoveryService` extracts `frVersion` from device identification response (`Substring(6, 5)`), applies MaxVersion cap (`cappedFrVersion`), and constructs versioned `PathShared` (`PathShared + "_" + cappedFrVersion`). 4 new htdocs versionados added: `htdocs_2c3`, `htdocs_2de`, `htdocs_3dr1_1`, `htdocs_5dm1_1`. VB6 1.12 parity per `frmMainW.frm:2743-2744`.
- **DISC-01A + DISC-02 2de support** — `tdev=2de` now visible in Production Menu (`tdev == "1de" || tdev == "2de"`) and Calibration Menu (`showCal` switch includes `"2de"`). New `GetProductionConfig_2DE` method per VB6 1.12 `frmMainW.frm:3135-3147` (C0+O001) and `3594-3595` (clearROM T0 EXPANSION FIPLEX tag).

### Fixed
- **BUG-001 — Clear EEPROM 2c ndev=2 C0 payload restored to VB6 1.12 baseline** (`frmMain.cs`)
  - **Root cause:** `GetProductionConfig_2C` was using a C0 payload inherited from VB.NET 1.9 (B09C prefix, 1692 chars) instead of the formal VB6 1.12 baseline Rama 2 (B0B0 prefix, 1652 chars) for tdev=2c ndev=2.
  - **Fix:** R-1/R-2 restore `cPart1` and `cPart2` literals byte-exact from VB6 1.12 `frmMainW.frm:3073-3076`. cPart1 SHA-256: `1edf2fb5be0c237007365922c08b92472551cc9c5152a1e12b63013d92b69f2a` (637 chars). cPart2 SHA-256: `61749b89b33f8495da698b7f011e07ab1b75c6f1883e72442934e56b028abb72` (1014 chars). Full payload SHA-256: `6b60d17c17479087bb6dd98e7b4bb7c65c96cc3fe8171945d0e3a30ae02add6d` (1652 chars).
  - **Validated:** Empirically validated 2026-05-30 over real BDA Signal Booster 2c ndev=2: 12/12 critical UI fields transitioned UNCHANGED → MATCH vs golden VB6 1.12 baseline.
- **REG-007 — Clear EEPROM 2c ndev=2 J0 payload restored to VB6 1.12 baseline + J1→J0 workaround removed** (`frmMain.cs`)
  - **Root cause:** `SendProdConfigAsync` contained a J1 pre-read → J0 echo workaround that compensated for a truncated jPayload no-MMS literal (559 chars instead of VB6 1.12 `frmMainW.frm:3085` byte-exact 586 chars).
  - **Fix:** Removed J1 pre-read workaround block. Restored jPayload no-MMS to VB6 1.12 byte-exact 586 chars. Log markers `[J1]` and `[J1→J0]` no longer appear.

## [3.4.0] - 2026-05-26

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
- **Guía de diagnóstico de logs** (`docs/GUIA_LOGS_DIAGNOSTICO.md`, `docs/GUIA_LOGS_DIAGNOSTICO.pdf`)
  - Documento de referencia para soporte en campo: descripción de `FCSLog` y `FCSProd`, formato de línea, niveles de log, componentes principales, escenarios de uso paso a paso, tabla de referencia rápida e instrucciones para compartir logs con soporte.

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
- **#30 — PROJECT RELATED tag not retained after Save post-Clear EEPROM** (`global.js`, `global.jsm` — `htdocs_2c`, `htdocs_2c1`, `htdocs_2c2`)
  - **Root cause:** `formatProjConfig` applied `str.trim()` to the 730-byte positional buffer before hex-encoding. When all hidden fields (prjinfo_0–prjinfo_7, offsets 0–699) were empty spaces — exactly the state after Clear EEPROM — `trim()` collapsed the leading pad bytes, shifting the Tag value (prjinfo_8, offset 700) to offset 0. On reload, `parseProjConfig` read `str.substr(700, 30)` and found empty bytes.
  - **Fix:** Removed `str.trim()` / `t=t.trim()` from `formatProjConfig` in all three device variants (`.js` and `.jsm`). The buffer is assembled by the Save handler with exact positional padding — trim must never be applied.
- **#30 — PROJECT RELATED tag intermittently not stored despite green check** (`DeviceCommandRouter.cs`)
  - **Root cause:** `UpdatePostCaches` evaluated `effectiveSuccess = commandSucceeded || !postCommand.WaitResponse`. For fire-and-forget commands (`!0`, `T0`, `C0`, etc., all with `WaitResponse=false`) this always resolved to `true`, so `_previousAnswer = "0"` regardless of whether the device ACK'd the write. If the device silently dropped the ACK, the tag was never stored but the JS showed a green check.
  - **Fix:** Use `commandSucceeded` directly: `_previousAnswer = commandSucceeded ? "0" : "1"`. A missing ACK now returns `"1"` (ERR_FAIL), detected immediately by `check_result()` without the 25-second polling fallback.
- **#31 — Device password authentication — VB 1.9 parity** (`frmPassword.cs`, `frmMain.cs`)
  - **Root cause 1:** `IsNullOrWhiteSpace` blocked space-only passwords client-side; VB 1.9 passes any non-empty string (including spaces) to the device for validation.
  - **Root cause 2:** Auth mode showed "Password cannot be empty." client-side for empty input instead of sending to device; VB 1.9 sends all input and shows "Wrong password" from device.
  - **Root cause 3:** "Wrong password" auto-dismissed after 4 s in auth mode but the timer was also applied to client-side validation errors, causing the "dialog resets without warning" perception.
  - **Root cause 4:** `DialogResult` not set to `None` before `await AuthenticateCommand(...)` — WinForms `AcceptButton` mechanism could close the form during the serial await, producing a "new dialog" effect instead of showing "Wrong password".
  - **Root cause 5:** `OnPipelineCredentialsRequired` opened a second unstyled `frmPassword` while the first was already waiting for the device's response to `*0{password}`. The pipeline fires the credential callback on any "INVALID CREDENTIALS" response — including during the auth attempt itself. `_validatedPassword` was null at that point, triggering the duplicate dialog.
  - **Fix 1:** `IsNullOrEmpty` replaces `IsNullOrWhiteSpace` for new-password field; auth mode skips client-side empty check entirely — all input goes to device.
  - **Fix 2:** Auto-dismiss timer (4 s) retained for auth mode only; applies to all "Wrong password" responses regardless of input (empty, spaces, incorrect).
  - **Fix 3:** `DialogResult = None` set before `await AuthenticateCommand(...)` to anchor the form during the serial wait.
  - **Fix 4:** `_authDialogOpen` flag in `frmMain` — set before `ShowDialog` in both `IncorrectPassword` and `PasswordRequired` cases, cleared in `finally`. `OnPipelineCredentialsRequired` returns `null` immediately when flag is set, suppressing the duplicate dialog.
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

## [3.2.0] - 2026-05-18

### Added
- **License Manager activation sequence + hide CLSS menu** (`fe9aef4` · issue #3) — Mirrors VB 1.9 `cmdRefresh_KeyPress` `cntmode 3-6`: extended `_eButton` to `[Right, Left, Right]` (third click starts license path). `FetchLicenseCharactersAsync` sends `U1` on `cntmode=3`, extracts `serialFirstChar` (`buff[3][0]`) and `versionFirstChar` (first decimal digit of `AsciiToInt(buff[5][0..1])`). KeyPress `cntmode=3/4/5/6`: Minute%10 → Day%10 → serialFirstChar → versionFirstChar.
- **Clear EEPROM J1 write-back fixes J0 NACK on 2c v2.0** (`dcbd77a` · issue #4) — Device firmware 2c v2.0 uses extended J parameter format (584 chars data) vs VB 1.9 hardcoded strings (557 chars data). Device NACKs J0 because payload length is wrong. **Fix:** J1 pre-read before J0 → use J1 data directly as J0 payload. *(Root cause of what was later catalogued as REG-007.)*
- **Traces ON log file** — `WriteTraceLog` to `%APPDATA%\Fiplex\USBmessages_YYYYMMDD.txt` (`80c3bb2` · issue #14).
- **HTML modal for filter warnings** replacing native `window.confirm()` (`3ddcbbf`) — `window.confirm()` showed "localhost:8080 dice" browser chrome; replaced with a custom overlay modal matching the Fiplex brand (`#004a98` header, styled Cancel/Apply buttons). `readConfsFrm` now accepts an optional `onResult` callback enabling async flow; `submitform` in `net.js` uses the callback so the pending spinner only activates after the user confirms.
- **TX/RX/ACK diagnostic events on serial pipeline** (`90dd627`).
- **`FullScan` on startup + remove double port-open overhead** (`6348eec`) — Startup scan changed from `QuickScan` to `FullScan` (VB 1.9 parity: all installed Fiplex devices listed in `cmbCOM` at launch). Removed redundant `CanOpenPort()` probe eliminating one open/close cycle per port before `TryIdentifyDeviceAsync`. `OpenPortTimeout` `1200ms` → `300ms` (serial port open is near-instant).
- **`SerialTraceLogger` non-blocking + full-frame RX** (`550411a`) — `Core/Diagnostics/SerialTraceLogger`: `ConcurrentQueue` + `StreamWriter` + 200ms background flush loop; replaces synchronous `File.AppendAllText` that blocked the serial pipeline thread on every trace write. Enable/Disable writes `=== Traces ON ===` / `=== Traces OFF ===` headers with version and machine name, matching VB 1.9 `WriteLog()` convention.

### Changed
- **T key on Scan Devices toggles Traces ON** (`c6e3eed`, `f42a1c0`, `78b58af` · issue #14) — Multiple iterations: button focus → `KeyPreview` → `ProcessCmdKey` + `ActiveControl`. VB 1.9 parity.
- **Production Tests menu** hidden until factory sequence (`013927c` · issue #3).
- **Calibrations menu** hidden until factory sequence (`9889a94` · issue #3) — VB 1.9 parity.
- **`mnuCal`** enabled on factory activation; resets Visible+Enabled on disconnect (`dde0996` · issue #3).
- **GDI+ status icons** applied to `frmEthernetInstall` with disabled-text fix (`c0181b6` · style consistency with `frmLicenseManager`).

### Fixed
- **Issue #3 (factory menu hardening)**:
  - Guard `cmdRefresh_Click` during factory sequence — mirrors VB 1.9 `tmrModeFactory` check (`b04e2fd`).
  - Use `System.Windows.Forms.Control.ModifierKeys` to avoid namespace clash with `Fiplex.Control` (`6649f01`).
- **Issue #9: Save Config fails with 18 filters** (`4bc0fdf`).
- **Issue #18: License key NACK feedback** (8 commits):
  - `MaxRetries=1` (VB 1.9 parity), `Update()` replaces `DoEvents()` (`3a59ec1`).
  - `Frame1.Refresh()` so `pctOK`/`pctKO` repaint after visibility change (`82544b1`).
  - `Application.DoEvents()` after `pctOK`/`pctKO` visibility — matches VB 1.9 exactly (`0fd5411`).
  - Explicit `BackColor` + `SizeMode` on `pctOK`/`pctKO` so indicators render without RESX image (`fb0a2b4`).
  - GDI+ status indicators (OK green / KO red) replacing RESX icons (`5e5a7a5`).
  - Redraw `btnEnableFeature` text in Paint event when disabled (`a33a4a2`).

### QA / Documentation
- Clear EEPROM production flow — command sequence, J write-back protocol, timing (`9197fe5`).
- J hardcoded payload history — VB 1.9 origin, copied to C#, v2.0 incompatibility (`4926733`).
- Issue #9 validation + version guide + serial logging design (`c97e251`).
- Issue #3 hardware validation (`6fb9444`).

---

## [3.1.0] - 2026-05-15

### Added
- **`file://` URL encoding via `Uri.AbsoluteUri`** (`24df349`) — Manual string replacement of backslashes left `#` unencoded, causing WebView2 to truncate the path at the fragment separator when the project folder contained `Proyecto C#`. `Uri.AbsoluteUri` percent-encodes correctly.
- **Maximize window on first connection per session** (`8edf1ac` · issue #20) — VB 1.9 used `SW_SHOWMAXIMIZED` when the device GUI loaded, controlled by a `maximized` flag reset on each disconnect. C# was forcing Normal with a fixed `1350x800` size. Restored VB 1.9 parity.
- **Factory menu activation via Shift+click sequence on Refresh button** (`e9094b6` · issue #3) — Mirrors VB 1.9 `cmdRefresh_MouseDown` + `cmdRefresh_KeyPress`: Shift+RightClick → Shift+LeftClick on Refresh sets `cntmode=2`, type current minute%10 digit (`cntmode→50`), then day%10 digit.

### Changed
- **Splash screen logo** updated to v3.0.3 (`51c4300`); v3.0.2 preserved as `logo_v302.png`.
- **`htdocs_2c2` footer**: copyright 2024 → 2026 + version `3.0.0` → `3.0.3` (`43b306f`).
- **`htdocs_2c2/navi.html`**: copyright 2024 → 2026 (`351c28c`).
- **`cmbCOM` resize behavior** (issue #21) — Replicated VB 1.9 `frmMain_Resize`: `cmbCOM.Width = ClientRectangle.Width - 16`, `OnResize` without `Anchor.Right`, `Visible` toggle on maximize transitions (commits `1578312`, `1b11947`, `1762791`, `014ee01`, `21cedc3`, `a172bbe`, `f963362`, `7b47f09`).
- **`SaveFileDialog` on WebView2 file downloads** (`5e644c5` · issues #5/#6) — VB 1.9 parity.
- **COM port number in device selector** (`490e481` · issue #16) — VB 1.9 parity.
- **`cmbCOM` border visibility in disconnected state** — `FlatStyle.Standard` (`41629c7` · issue #19).

### Removed
- **Stale VB.NET project reference** from solution file (`df55be0`).

### Fixed
- **Issue #2: Ethernet Apply Changes returns fail even though device accepts** (`572060b`) — Root cause: `WriteFactoryStringAsync` checked `result.Data.StartsWith("ACK")`, but the pipeline consumes the ACK token leaving `result.Data` empty on a genuine ACK. Same pattern as issue #15. Fix: `isAck = result.Success && string.IsNullOrEmpty(result.Data)`.
- **Issue #10: Extend legacy postback handler to all HTML POSTs** (`313bae6`).
- **Issue #12: Show non-catalogued devices as "Unknown device"** (`062012a`).
- **Issue #13: Detect USB disconnect via timer polling `BytesToRead`** (`af604f4`).
- **Issue #15: Password change dialog improvements** (4 commits, VB 1.9 parity):
  - Length validation 8-16 chars in edit mode (`ca9a670`).
  - Parse device bitmask response for password change (`b44991a`).
  - Correct button position in edit mode to avoid label overlap (`4a0afb5`).
  - Dialog stays open during device command (`c173310`).
- **Issue #21: `cmbCOM` resize quirk in Maximized state** — Multiple intermediate attempts (`Dock.Fill`, `Anchor`, `BeginInvoke`) converged on VB 1.9 parity. See **Changed** section above.

### QA / Documentation
- QA report — field report 260513 (`75d2105`).
- QA validation tracking for issues #3, #6, #7, #9, #12, #13, #17, #19 (`9540fc4`, `3ca0689`, `3c023ea`, `f795b4e`, `1cdfb25`, `ee350ad`, `639c73f`, `96eaa5e`, `577f51c`).

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
