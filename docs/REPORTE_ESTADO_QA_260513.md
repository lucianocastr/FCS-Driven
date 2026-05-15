# Reporte de Estado — QA Field Report 260513
**FCS v3.0.3 — Signal Booster (2c/BDA)**

| Campo | Valor |
|---|---|
| Referencia | `260513_New FCS_Findings_V1.xlsx` |
| Fecha de apertura | 13/05/2026 |
| Última actualización | 14/05/2026 |
| Rama activa | `fix/v303-client-issues` |
| Repositorio | `E:\Ikarus\Proyecto C#\FCS302OK\FCSDev` |
| Referencia funcional | FCS 1.9 VB.NET — `E:\Ikarus\Proyecto C#\FCS` |
| Modelo en prueba | Signal Booster (2c/BDA) |
| Metodología | Fix mínimo por incidencia · Validación en hardware antes de avanzar · Baseline = VB 1.9 |

---

## Resumen ejecutivo

| Categoría | Cant. |
|---|---|
| Issues totales reportados | 21 |
| Validados en hardware | 7 |
| Fix aplicado — pendiente validación | 0 |
| En análisis | 0 |
| Pendientes | 14 |

---

## Estado de incidencias

| # | Descripción | Categoría | Prioridad | Estado | Commit |
|---|---|---|---|---|---|
| #20 | Ventana no maximiza después del login | UI | Alta | ✅ Validado | `8edf1ac` |
| #21 | Product selector no resiza al maximizar | UI | Alta | ✅ Validado | `7b47f09` |
| #11 | Clear EEPROM visible para customers | Seguridad | Alta | Pendiente | — |
| #15 | Password change muestra éxito pero no se aplica | Bug crítico | Alta | ✅ Validado | `c173310` |
| #3 | No se puede acceder al menú factory | Bug | Alta | Pendiente | — |
| #19 | Selection box invisible en login form | Cosmético | Media | Pendiente | — |
| #17 | Requisitos de complejidad de password no se muestran | UX | Media | Pendiente | — |
| #13 | Sin feedback si el USB se desconecta | Bug | Media | Pendiente | — |
| #7 | Spectrum no funciona en Assisted GUI | Bug | Media | Pendiente | — |
| #8 | Tag setting no funciona en Assisted GUI | Bug | Media | ✅ Validado | `313bae6` |
| #9 | Save Config falla con 18 filtros por banda | Bug | Media | ✅ No reproducible | — |
| #10 | Isolation Measurement falla | Bug | Media | ✅ Validado | `313bae6` |
| #4 | Clear EEPROM error | Bug | Media | Pendiente | — |
| #2 | Ethernet module installation fails | Bug | Baja | ✅ Validado | `572060b` |
| #16 | COM port number no listado en selector | Mejora | Baja | Pendiente | — |
| #12 | Unsupported devices no mostrados | Mejora | Baja | Pendiente | — |
| #18 | Wrong license key sin mensaje de error | Mejora | Baja | Pendiente | — |
| #14 | Shortcut para USB log / factory / license | Mejora | Baja | Pendiente | — |
| #5 | Config save descarga sin pedir ruta | Revisión | — | Pendiente revisión | — |
| #6 | Generate report sin diálogo de ruta | Revisión | — | Pendiente revisión | — |
| #1 | FCS no funciona en Honeywell (intermitente) | Monitoreo | — | Monitoring | — |

---

## Detalle de fixes validados

---

### Issue #20 — Ventana no maximiza después del login

**Descripción del cliente:** La ventana debería maximizarse automáticamente después de un login exitoso, replicando el comportamiento de FCS 1.9.

**Comportamiento VB 1.9:**
- Flag `maximized As Boolean` inicializada en `False`
- Se maximiza cuando se carga la UI del dispositivo por primera vez
- Flag se resetea a `False` en cada desconexión
- Trigger: `PathShared <> default path And Not maximized` → `SW_SHOWMAXIMIZED`

**Root cause:**
`UpdateUIForConnectedState()` en `frmMain.cs` forzaba `WindowState = Normal` y tamaño fijo `1350×800`. La ventana nunca se maximizaba.

**Fix aplicado:**
- Campo `private bool _hasMaximized = false` (espejo del `maximized As Boolean` de VB 1.9)
- En `UpdateUIForConnectedState()`: si `!_hasMaximized` → `BeginInvoke(() => WindowState = Maximized)` + `_hasMaximized = true`
- En `UpdateUIForDisconnectedState()`: reset `_hasMaximized = false`
- El `BeginInvoke` difiere la maximización al siguiente tick del message loop, evitando conflictos de layout síncronos

**Archivo:** `Forms\frmMain.cs`
**Commit:** `8edf1ac`
**Validado:** ✅ Hardware — 13/05/2026

---

### Issue #21 — Product selector no resiza al maximizar

**Descripción del cliente:** El combo selector de producto (COM port) no ocupa el ancho completo de la ventana al maximizar. En VB 1.9 sí lo hace.

**Comportamiento VB 1.9 (referencia `frmMainW.vb` líneas 259–271):**
```vb
Private Sub frmMain_Resize(...) Handles MyBase.Resize
    Dim aux As Integer
    aux = Me.ClientRectangle.Width - 16
    If aux > 0 Then
        cmbCOM.Width = VB6.ToPixelsUserWidth(aux, 681, 681)  ' = aux × 1 = aux
    End If
End Sub
```
VB 1.9 usaba asignación directa de ancho en el evento Resize, sin `Dock` ni `Anchor.Right`.

**Root cause:**
- `cmbCOM` tenía `Dock = DockStyle.Fill` en `tlpMainLayout`
- El native Win32 ComboBox HWND no reposiciona su botón dropdown cuando la ventana se maximiza programáticamente en el mismo frame de layout
- Adicionalmente, usar `Anchor.Right` creaba un desincronismo entre el managed wrapper y el HWND nativo, produciendo dos flechas dropdown superpuestas

**Fix aplicado:**
1. En el constructor: `cmbCOM.Dock = DockStyle.None; cmbCOM.Anchor = AnchorStyles.Left | AnchorStyles.Top`
   — replica VB 1.9: sin Dock, sin Anchor.Right
2. Override de `OnResize`: `cmbCOM.Width = ClientSize.Width - 16`
   — replica VB 1.9 `frmMain_Resize` directamente
3. En `OnResize`, cuando `WindowState == Maximized`: `cmbCOM.Visible = false; cmbCOM.Visible = true`
   — el toggle fuerza al HWND nativo a repintar el botón dropdown en la posición correcta, necesario en cualquier maximize (inicial o manual)
4. Maximize en `UpdateUIForConnectedState` vía `BeginInvoke` (diferido), no se reitera gracias a `_hasMaximized`

**Archivos:** `Forms\frmMain.cs`
**Commits:** `21cedc3` → `7c7b6a5` (debug cleanup) → `a172bbe` (revertido — causó cierre de app) → `f963362` → `7b47f09`
**Validado:** ✅ Hardware — 14/05/2026
**Ciclos de validación:** Connect ✓ | Reducir tamaño ✓ | Re-maximizar ✓ | Training Details OK ✓

---

### Issue #15 — Password change muestra éxito pero no se aplica

**Descripción del cliente:** Al cambiar la contraseña el diálogo muestra "Password Changed" exitoso, pero al reconectar con la nueva contraseña el login falla.

**Root cause:**
- El pipeline clasificaba la respuesta de error del dispositivo (bitmask hex) como DataFrame → `result.Success = true`, `result.Data = bitmask`
- El código anterior no distinguía ACK genuino de bitmask de error — trataba todo Success como cambio exitoso
- Validación client-side incorrecta: se había agregado un chequeo de longitud (8-16 chars) que no existe en VB 1.9

**Comportamiento VB 1.9:**
- Validación client-side: solo verifica que contraseñas coincidan
- Envía `^0{password}` al dispositivo
- Si respuesta == "ACK": texto verde "Password was successfully changed" por 1.5s → cierra
- Si respuesta != "ACK": `processAns()` parsea bitmask y muestra error inline → diálogo queda abierto

**Fix aplicado:**
- Distinción genuino ACK: `result.Data` vacío = ACK real; no vacío = payload de error (bitmask)
- Diálogo permanece abierto durante el envío al dispositivo (`ChangePasswordCommand` delegate async)
- Controles deshabilitados con "Sending..." mientras espera respuesta
- Éxito: texto verde "Password changed successfully." → 1.5s → cierra
- Error: texto rojo inline, diálogo sigue abierto, usuario puede reintentar
- Validación client-side: solo coincidencia de contraseñas (paridad VB 1.9)

**Archivos:** `Forms\frmPassword.cs`, `Forms\frmMain.cs`
**Commit:** `c173310`
**Validado:** ✅ Hardware — 14/05/2026

---

---

### Issue #10 — Isolation Measurement y Clear Alarm fallan en Assisted GUI

**Descripción del cliente:** En Assisted GUI, Step 2 "Run Isolation Measurement" y Step 3 "Clear Alarm" muestran icono rojo FAIL en C# 3.0.3. En VB 1.9 ambos muestran OK verde.

**Root cause:**
`save_config()` en `global.js` envía el POST al dispositivo con `$.post("home.html", { ctl_conf_str: frame })`. En VB 1.9, el servidor HTTP procesa `ctl_conf_str` de cualquier POST independientemente de la URL.

En C# 3.0.3, `IsLegacyPostbackRoute` en `EmbeddedHttpServer.cs` solo aceptaba POSTs a rutas `.zhtml`. Un POST a `home.html` era tratado como archivo estático — el body con `ctl_conf_str` era ignorado, el comando `C0{frame}` nunca llegaba al dispositivo. `_previousAnswer` quedaba vacío (`""`). El JS (`check_result()`) reintentaba GET a `/result.shtml` 10 veces recibiendo respuesta vacía y finalmente mostraba ERR_FAIL.

**Evidencia confirmada:** DevTools Network — los `result.shtml` respondían `Content-Length: 0` antes del fix.

**Fix aplicado:**
- `IsLegacyPostbackRoute`: acepta cualquier POST con body que no sea ruta `/command/` o `/api/` (paridad VB 1.9)
- Sin cambios en JS, `settings.cfg`, ni pipeline serial

**Archivo:** `Core/Http/EmbeddedHttpServer.cs`
**Commit:** `313bae6`
**Validado:** ✅ Hardware — 15/05/2026
**Ciclos de validación:** Step 2 Run Isolation Measurement ✓ | Step 3 Clear Alarm ✓

---

### Issue #9 — Save Config falla con 18 filtros por banda

**Descripción del cliente:** Save from Device no termina de descargar el archivo de configuración. Fiplex indica posible relación con la instalación del módulo Ethernet.

**Resultado de reproducción:** No reproducible al 15/05/2026. Save from Device descarga el archivo `.cfgr` correctamente. Posible relación con el fix #2 (Ethernet module, commit `572060b`) que corrigió el pipeline de escritura/lectura del factory string.

**Estado:** ✅ No reproducible — funciona correctamente en hardware actual.
**Fecha de verificación:** 15/05/2026

---

## Historial de cambios del documento

| Fecha | Cambio |
|---|---|
| 14/05/2026 | Creación del documento — issues #20 y #21 validados |
| 14/05/2026 | Issue #15 validado — commit c173310 |
| 14/05/2026 | Issue #2 validado — commit 572060b |
| 15/05/2026 | Issue #10 validado — commit 313bae6 |
| 15/05/2026 | Issue #8 validado — mismo fix (313bae6), resuelto por el mismo root cause |
| 15/05/2026 | Issue #9 — no reproducible en hardware actual, Save from Device descarga correctamente |

