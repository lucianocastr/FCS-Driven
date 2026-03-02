# Issue #11 — Factory Accessible via External Browser

> **Branch**: `fix/3.0.0-restrict-factory-external-browser-access`  
> **Date**: 5/1/2026  
> **Priority**: High  
> **Target**: `release/3.0.0`

---

## 1. Incident Description

The embedded HTTP server (`EmbeddedHttpServer`) listens on `http://localhost:{port}/` (ports 8080–8090) and serves all static files from the device's `htdocs_*` folder **without any access restriction**.

This means that **any process on the machine** — including an external browser — can access:

```
http://localhost:8080/factory/index.html
```

The `/factory/` path exposes the **factory mode interface**, which contains calibration controls, serial number editing, equalizer settings, and other privileged operations that should only be available within the application's WebView2 control.

---

## 2. Root Cause Analysis

### 2.1 No Origin Validation

In `EmbeddedHttpServer.ListenAsync()` (line 148), every incoming request is processed without inspecting **who** is making the request:

```
context → IsCommandRoute? → HandleCommandRequestAsync / ServeStaticFileAsync
```

There is **no check** on:
- `User-Agent` header
- `Origin` / `Referer` header
- Custom authentication token
- Any request-level allowlist

### 2.2 No Route-Level Access Control

`ServeStaticFileAsync()` (line 354) maps **any** URL path directly to the filesystem:

```csharp
var filePath = Path.Combine(_rootPath, path);  // line 369
```

There is no concept of "restricted paths" vs "public paths". The `/factory/` directory is served with the exact same logic as `/index.html`.

### 2.3 Listener Binds to localhost (Both Aliases)

```csharp
_listener.Prefixes.Add($"http://localhost:{port}/");   // line 79
_listener.Prefixes.Add($"http://127.0.0.1:{port}/");   // line 80
```

While binding to localhost prevents **remote** network access, it does **not** prevent other local processes (browsers, scripts, malware) from reaching the server.

### 2.4 Factory Mode Entry Point

The factory UI is activated through navigation parameters. In `navi.js`:

```javascript
function showFactory() {
    if (loadPageVar("isFactory") == "true") { ... }
}
```

And the entry point `factory/index.html` loads a frameset that directly includes `navi.html?isFactory=true` and `factory/fact.zhtml`, making the full factory interface immediately available.

---

## 3. Impact Assessment

| Aspect | Risk | Severity |
|--------|------|----------|
| Factory calibration accessible without app authentication | Unauthorized device configuration | **Critical** |
| Serial commands can be triggered via `/command/` or `/api/` routes | Device state corruption | **High** |
| Configuration save/load (`SaveCFG`) exposed | Persistent device misconfiguration | **High** |
| No audit trail for external access | Compliance/traceability gap | **Medium** |

---

## 4. Proposed Strategy: **Server-Side Token Validation**

After evaluating multiple approaches, the recommended strategy is to implement a **per-session secret token** that WebView2 injects into every request and the server validates before serving any content.

### 4.1 Why This Strategy

| Approach | Pros | Cons | Verdict |
|----------|------|------|---------|
| **A) User-Agent filtering** | Simple | Easily spoofed; WebView2 UA is public | ❌ Rejected |
| **B) Restrict by path (`/factory/`)** | Targeted | Doesn't protect `/command/` or `/api/`; partial fix | ❌ Rejected |
| **C) Custom HTTP header** | Moderate effort | Requires WebView2 `WebResourceRequested` interception | ⚠️ Possible |
| **D) Per-session secret token (query param or header)** | Strong; simple; covers all routes | Token must be injected on every request | ✅ **Recommended** |
| **E) Bind to random high port only** | Obscures port | Security by obscurity; doesn't prevent access | ❌ Rejected |

### 4.2 How It Works

```
┌─────────────────────────────────────────────────────────┐
│                    Application Start                     │
│                                                          │
│  1. Generate cryptographic token (GUID or random bytes)  │
│  2. Pass token to EmbeddedHttpServer.StartAsync()        │
│  3. Inject token into WebView2 via                       │
│     AddWebResourceRequestedFilter +                      │
│     WebResourceRequested event (adds header)             │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────┐
│              EmbeddedHttpServer.ListenAsync()            │
│                                                          │
│  For EVERY request:                                      │
│  4. Extract token from header: X-Fiplex-Token            │
│  5. Compare with stored session token                    │
│  6. If mismatch → 403 Forbidden + log warning            │
│  7. If match → proceed to route/serve normally           │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────┐
│                  External Browser                        │
│                                                          │
│  ❌ Cannot know the token                                │
│  ❌ Gets 403 on every request                            │
│  ❌ No access to factory, commands, or static files      │
└─────────────────────────────────────────────────────────┘
```

### 4.3 Implementation Plan

#### Phase 1 — Server-Side Token Validation (EmbeddedHttpServer)

**File**: `Core/Http/EmbeddedHttpServer.cs`

1. Add a `_sessionToken` field.
2. Extend `StartAsync()` to accept and store the token.
3. In `ListenAsync()`, before routing, validate the `X-Fiplex-Token` header.
4. Return `403 Forbidden` if the token is missing or invalid.

**File**: `Core/Http/Interfaces/IEmbeddedHttpServer.cs`

5. Update `StartAsync` signature to include the token parameter.

#### Phase 2 — Token Generation and WebView2 Injection (frmMain)

**File**: `Forms/frmMain.cs`

6. Generate token in `ConnectAsync()` (Phase 6: HTTP Server).
7. Pass token to `_httpServer.StartAsync(port, devicePath, sessionToken, _cts.Token)`.
8. After WebView2 initialization, use `CoreWebView2.AddWebResourceRequestedFilter` to intercept requests to `localhost:{port}`.
9. In the `WebResourceRequested` handler, add the `X-Fiplex-Token` header to every request.

#### Phase 3 — Logging and Diagnostics

10. Log all rejected requests with source IP and path (for auditing).
11. Ensure HTTP command logs under `%LocalAppData%/Fiplex.Control.Software/HttpCommandLogs/` capture rejection events.

### 4.4 Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Use custom header (`X-Fiplex-Token`) instead of query param | Headers are not visible in browser history/logs; cleaner |
| Token is per-session (generated on each `ConnectAsync`) | Limits exposure window; fresh token per device connection |
| Validate on ALL routes (not just `/factory/`) | Prevents external access to commands, config, and all device UI |
| Token is a `Guid.NewGuid().ToString("N")` | Sufficient entropy; no crypto dependency needed |

### 4.5 Files to Modify

| File | Change |
|------|--------|
| `Core/Http/Interfaces/IEmbeddedHttpServer.cs` | Add `sessionToken` parameter to `StartAsync` |
| `Core/Http/EmbeddedHttpServer.cs` | Store token, validate on every request |
| `Forms/frmMain.cs` | Generate token, pass to server, inject in WebView2 |

### 4.6 Files NOT Modified

- `pages/htdocs_*/factory/**` — No changes to HTML/JS files (server-side enforcement only).
- `DeviceCommandRouter` — Token validation happens before routing.
- `SerialCommandPipeline` — Unaffected (downstream from HTTP layer).

---

## 5. Testing Plan

| Scenario | Expected Result |
|----------|-----------------|
| WebView2 navigates to `/factory/index.html` | ✅ 200 OK — token injected automatically |
| WebView2 executes `/command/version` | ✅ 200 OK — token present |
| External browser opens `http://localhost:8080/factory/index.html` | ❌ 403 Forbidden |
| External browser opens `http://localhost:8080/index.html` | ❌ 403 Forbidden |
| External browser opens `http://localhost:8080/command/version` | ❌ 403 Forbidden |
| cURL with guessed token | ❌ 403 Forbidden (token is random per session) |
| Connect → Disconnect → Reconnect | ✅ New token generated; old token invalid |

---

## 6. Rollback Plan

If issues are detected after implementation:
1. Remove the token validation block in `ListenAsync()` (single `if` block).
2. Revert `StartAsync` signature to original (remove token parameter).
3. Remove WebView2 `WebResourceRequested` handler in `frmMain`.

The changes are isolated to the HTTP layer and do not affect serial communication, device routing, or UI rendering.

---

**Previous**: [Code Quality](code-quality.md) | **Next**: [Overview](../00-introduction/overview.md)
