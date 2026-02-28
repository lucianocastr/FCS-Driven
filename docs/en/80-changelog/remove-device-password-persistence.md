# Remove Device Password Persistence

- **Branch:** `fix/3.0.0-edit-password-menu-fails`
- **Date:** 2025-07-14
- **Type:** Security / UX Simplification

## Summary

Removed all persistent storage and automatic retrieval of the device password (`DevicePassword` key in `settings.json`). The password now exists only in memory (`_validatedPassword`) during the active connection session and is cleared on disconnect.

## Motivation

- **Security:** Storing the device password in plain text in `%APPDATA%\Fiplex\ControlSoftware\settings.json` represented a security risk.
- **Simplification:** The auto-authentication flow added complexity to the connection logic with minimal UX benefit; users connect infrequently enough that re-entering the password is acceptable.
- **Bug context:** The `mnuPassword_Click` handler (Edit Password menu) was saving the new password to `settings.json` after a successful change, which could cause stale credentials on subsequent auto-authentication attempts if the device password was changed externally.

## Changes

### 1. Remove saved password retrieval and auto-authentication from `ConnectAsync`

**File:** `src/Fiplex.Control.Software.WinForms/Forms/frmMain.cs`

Removed the following blocks from the `AuthResult.PasswordRequired` case:

| Block removed | Description |
|---|---|
| Retrieve saved password | `_appSettings.GetSettingAsync<string>("DevicePassword")` with try/catch |
| Automatic authentication | `_authService.AuthenticateAsync(savedPassword, ...)` with break on success |
| Pre-populate dialog | `passwordDialog.Password = savedPassword` before `ShowDialog` |

**Before:**
```
PasswordRequired → Retrieve saved password → Auto-auth → (fail) → Show dialog (pre-populated) → Auth → Save if remember → Configure pipeline
```

**After:**
```
PasswordRequired → Show dialog → Auth → Configure pipeline
```

### 2. Remove "Remember Password" UI control

**Files:**
- `src/Fiplex.Control.Software.WinForms/Forms/frmPassword.cs`
- `src/Fiplex.Control.Software.WinForms/Forms/frmPassword.Designer.cs`

| Item removed | File |
|---|---|
| `RememberPassword` property | `frmPassword.cs` |
| `chkRemember.Visible` toggles in `UpdateModeDisplay()` | `frmPassword.cs` |
| `chkRemember` control declaration, instantiation, configuration, and `Controls.Add` | `frmPassword.Designer.cs` |

### 3. Remove password save on successful authentication

**File:** `src/Fiplex.Control.Software.WinForms/Forms/frmMain.cs` — `ConnectAsync`

Removed the block that checked `passwordDialog.RememberPassword` and called `_appSettings.SaveSettingAsync("DevicePassword", ...)`.

### 4. Remove saved password fallback from `OnPipelineCredentialsRequired`

**File:** `src/Fiplex.Control.Software.WinForms/Forms/frmMain.cs`

Removed the try/catch block that retrieved `DevicePassword` from `_appSettings` as a fallback when the pipeline raised `INVALID CREDENTIALS`. The method now relies solely on `_validatedPassword` (in-memory) or prompts the user via dialog.

### 5. Remove password save on password change

**File:** `src/Fiplex.Control.Software.WinForms/Forms/frmMain.cs` — `mnuPassword_Click`

Removed `_appSettings.SaveSettingAsync("DevicePassword", newPassword)` after a successful device password change via the `^0` serial command. The new password is still stored in memory (`_validatedPassword`, pipeline, and router) for the duration of the session.

## Files Modified

| File | Changes |
|---|---|
| `Forms/frmMain.cs` | Removed 4 `DevicePassword` interactions (2 reads, 2 writes) |
| `Forms/frmPassword.cs` | Removed `RememberPassword` property and `chkRemember` references |
| `Forms/frmPassword.Designer.cs` | Removed `chkRemember` control entirely |

## Password Lifecycle After Changes

```
Connect → PasswordRequired → User enters password → Auth succeeds
  → _validatedPassword = password (memory only)
  → _pipeline.SetStoredPassword(password)
  → _commandRouter.SetStoredPassword(password)

Disconnect → _validatedPassword = null
  → _pipeline.ClearStoredPassword()
  → _commandRouter.Reset()
```

## Verification

- `dotnet build Fiplex.Control.Software.sln` — Compiles without errors.
- No remaining references to `"DevicePassword"` in any `.cs` file under `src/`.
- The `IAppSettingsService` interface and `AppSettingsService` implementation remain unchanged (still used for `LastUsedComPort`).

## Impact Assessment

| Area | Impact |
|---|---|
| Connection flow | Simplified — always shows password dialog when device requires auth |
| Password change (`mnuPassword`) | No regression — password still updated in memory for session |
| Pipeline retry (`INVALID CREDENTIALS`) | Falls back to dialog instead of saved password |
| `settings.json` | `DevicePassword` key is no longer written; existing keys become orphaned |
| `frmPassword` UI | Checkbox removed; form is shorter in capture mode |
