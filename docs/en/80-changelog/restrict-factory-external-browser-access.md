# Restrict Factory External Browser Access

- **Branch:** `fix/3.0.0-restrict-factory-external-browser-access`
- **Date:** 2026-03-01
- **Type:** Security
- **Issue:** #11 — Factory can be accessed with external browser with `http://localhost:8081/factory/index.html`

## Summary

Added per-session token validation to the embedded HTTP server. Every request must now include a secret `X-Fiplex-Token` header that only the application's WebView2 control can provide. External browsers receive `403 Forbidden` on all routes.

## Motivation

- **Security:** The embedded HTTP server listened on `localhost:8080-8090` and served all content — including the factory interface, serial command endpoints, and device configuration routes — without any access restriction.
- **Impact:** Any local process (browser, script, malware) could navigate to `http://localhost:{port}/factory/index.html` and access calibration controls, serial number editing, and device configuration without authentication.
- **Scope:** The vulnerability affected all routes, not just `/factory/`. The `/command/`, `/api/`, and `.shtml` endpoints were equally exposed.

## Changes

### 1. Add `sessionToken` parameter to `IEmbeddedHttpServer.StartAsync`

**File:** `src/Fiplex.Control.Software.WinForms/Core/Http/Interfaces/IEmbeddedHttpServer.cs`

Extended the interface contract to require a session token on server start:

| Before | After |
|---|---|
| `StartAsync(int port, string documentRoot, CancellationToken ct)` | `StartAsync(int port, string documentRoot, string sessionToken, CancellationToken ct)` |

### 2. Implement server-side token validation in `EmbeddedHttpServer`

**File:** `src/Fiplex.Control.Software.WinForms/Core/Http/EmbeddedHttpServer.cs`

| Change | Description |
|---|---|
| Added `TokenHeaderName` constant | `"X-Fiplex-Token"` — custom header name |
| Added `_sessionToken` field | Stores the per-session secret token |
| Updated `StartAsync` | Accepts and validates `sessionToken` parameter |
| Added token gate in `ListenAsync` | Checks `X-Fiplex-Token` header before routing any request |
| 403 response for invalid tokens | Returns `403 Forbidden` with `LogWarning` for rejected requests |
| Token cleanup in `StopAsync` | Clears `_sessionToken` when server stops |

**Request flow after change:**

```
Request → Extract X-Fiplex-Token header
  ├─ Token matches _sessionToken → Route normally (command or static file)
  └─ Token missing or invalid → 403 Forbidden + log warning
```

### 3. Generate token and inject into WebView2 in `frmMain`

**File:** `src/Fiplex.Control.Software.WinForms/Forms/frmMain.cs`

| Change | Description |
|---|---|
| Added `_sessionToken` field | Per-session GUID stored alongside HTTP state |
| Token generation in `ConnectAsync` | `Guid.NewGuid().ToString("N")` before `StartAsync` |
| `AddWebResourceRequestedFilter` | Registers filter for `localhost:{port}` and `127.0.0.1:{port}` |
| `CoreWebView2_WebResourceRequested` handler | Injects `X-Fiplex-Token` header into every WebView2 request |
| Cleanup in `DisconnectAsync` | Removes `WebResourceRequested` handler and clears `_sessionToken` |

**Connect flow after change:**

```
ConnectAsync (Phase 7)
  → _sessionToken = Guid.NewGuid().ToString("N")
  → _httpServer.StartAsync(port, path, _sessionToken, ct)
  → webView.CoreWebView2.AddWebResourceRequestedFilter(localhost:{port}/*)
  → webView.CoreWebView2.WebResourceRequested += handler
  → Navigate to index.html (token injected automatically)
```

**Disconnect flow after change:**

```
DisconnectAsync
  → webView.CoreWebView2.WebResourceRequested -= handler
  → _httpServer.StopAsync() (clears server-side token)
  → _sessionToken = null
```

## Files Modified

| File | Changes |
|---|---|
| `Core/Http/Interfaces/IEmbeddedHttpServer.cs` | Added `sessionToken` parameter to `StartAsync` (+6 lines) |
| `Core/Http/EmbeddedHttpServer.cs` | Token field, validation gate, cleanup (+24 lines) |
| `Forms/frmMain.cs` | Token generation, WebView2 injection, disconnect cleanup (+35 lines) |

## Security Model

```
┌──────────────────────┐     X-Fiplex-Token: abc123     ┌──────────────────┐
│  WebView2 (internal) │ ─────────────────────────────── │ EmbeddedHttpServer│
│  Token injected via  │           ✅ 200 OK            │ Token validated   │
│  WebResourceRequested│                                 │ before routing    │
└──────────────────────┘                                 └──────────────────┘

┌──────────────────────┐     (no token)                  ┌──────────────────┐
│  External Browser    │ ─────────────────────────────── │ EmbeddedHttpServer│
│  Chrome, Edge, cURL  │           ❌ 403 Forbidden      │ Token missing     │
└──────────────────────┘                                 └──────────────────┘
```

## Verification

- `dotnet build Fiplex.Control.Software.sln` — Compiles without errors.
- Token is per-session: regenerated on each `ConnectAsync`, invalidated on `DisconnectAsync`.
- No changes to `htdocs_*` HTML/JS files, `DeviceCommandRouter`, or `SerialCommandPipeline`.

## Impact Assessment

| Area | Impact |
|---|---|
| WebView2 navigation | No change — token injected transparently via `WebResourceRequested` |
| Factory mode (`/factory/`) | Protected — external browsers blocked |
| Command routes (`/command/`, `/api/`) | Protected — external browsers blocked |
| Static files (`.html`, `.js`, `.css`) | Protected — external browsers blocked |
| Serial communication | No impact — token validation is upstream in the HTTP layer |
| Connect/Disconnect flow | Minimal addition — token generation and cleanup integrated into existing phases |
