#

## [3.3.0] - 2026-05-19

### Added
- **Factory mode access** — Sequence Shift+Right click × 2 on Refresh button, followed by two time-based digits (`sum = Minute + Day%10`, inverted: Digit1=`sum%10`, Digit2=`sum/10`). On activation, application auto-navigates to factory page (`/factory/fact.zhtml`, or `/factory/index.html` for Expander devices), matching FCS 1.9 behavior.
- **License Options access** — Extended sequence Shift+Right × 2 + Shift+Left on Refresh button, followed by four digits: Digit1/Digit2 same time-based algorithm as factory, Digit3=first char of Serial Number, Digit4=first digit of Firmware version.

### Changed
- **License Options dialog** — Redesigned layout: checkboxes 20×20 px, Power Limit Downlink values centered, BAND0/BAND1 column headers aligned with input grid (64 px wide, centered), GDI+ confirmation icon (green check / red X circle) matching Ethernet Module dialog style.

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
