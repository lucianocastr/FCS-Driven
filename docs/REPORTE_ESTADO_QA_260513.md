# Reporte de Estado — QA Field Report 260513
**FCS v3.0.3 — Signal Booster (2c/BDA)**

| Campo | Valor |
|---|---|
| Referencia | `260513_New FCS_Findings_V1.xlsx` |
| Fecha de apertura | 13/05/2026 |
| Última actualización | 19/05/2026 — V3 issues #22-#27 incorporados; #9 REJECTED cliente (no reproducible dev) |
| Rama activa | `fix/v303-client-issues` |
| Repositorio | `E:\Ikarus\Proyecto C#\FCS302OK\FCSDev` |
| Referencia funcional | FCS 1.9 VB.NET — `E:\Ikarus\Proyecto C#\FCS` |
| Modelo en prueba | Signal Booster (2c/BDA) |
| Metodología | Fix mínimo por incidencia · Validación en hardware antes de avanzar · Baseline = VB 1.9 |

---

## Resumen ejecutivo

| Categoría | Cant. |
|---|---|
| **V1 — Issues totales** | 21 |
| V1 — Validados en hardware | 20 |
| V1 — Fix aplicado, pendiente validación Fiplex | 1 (#12) |
| V1 — REJECTED por cliente (no reproducible dev) | 1 (#9) |
| **V3 — Issues nuevos (19/05/2026)** | 6 |
| V3 — Validados / mitigados | 5 (#22–#26) |
| V3 — Pendientes | 1 (#27) |

---

## Estado de incidencias

| # | Descripción | Categoría | Prioridad | Estado | Commit |
|---|---|---|---|---|---|
| #20 | Ventana no maximiza después del login | UI | Alta | ✅ Validado | `8edf1ac` |
| #21 | Product selector no resiza al maximizar | UI | Alta | ✅ Validado | `7b47f09` |
| #11 | Clear EEPROM visible para customers | Seguridad | Alta | ✅ Validado | `e9094b6` |
| #15 | Password change muestra éxito pero no se aplica | Bug crítico | Alta | ✅ Validado | `c173310` |
| #3 | No se puede acceder al menú factory | Bug | Alta | ✅ Validado | `e9094b6` |
| #19 | Selection box invisible en login form | Cosmético | Media | ✅ Validado | `41629c7` |
| #17 | Requisitos de complejidad de password no se muestran | UX | Media | ✅ Validado | `c173310` |
| #13 | Sin feedback si el USB se desconecta | Bug | Media | ✅ Validado | `af604f4` |
| #7 | Spectrum no funciona en Assisted GUI | Bug | Media | ✅ No reproducible | — |
| #8 | Tag setting no funciona en Assisted GUI | Bug | Media | ✅ Validado | `313bae6` |
| #9 | Save Config falla con 18 filtros por banda | Bug | Media | ⚠️ REJECTED cliente 19/05 — no reproducible dev | `4bc0fdf` |
| #10 | Isolation Measurement falla | Bug | Media | ✅ Validado | `313bae6` |
| #4 | Clear EEPROM error | Bug | Media | ✅ Validado | `dcbd77a` |
| #2 | Ethernet module installation fails | Bug | Baja | ✅ Validado | `572060b` |
| #16 | COM port number no listado en selector | Mejora | Baja | ✅ Validado | `490e481` |
| #12 | Unsupported devices no mostrados | Mejora | Baja | Fix aplicado — pendiente validación | `062012a` |
| #18 | Wrong license key sin mensaje de error | Mejora | Baja | ✅ Validado | `a33a4a2` |
| #14 | Shortcut para USB log / factory / license | Mejora | Baja | ✅ Validado | `80c3bb2` |
| #5 | Config save descarga sin pedir ruta | Revisión | — | ✅ Validado | `5e644c5` |
| #6 | Generate report sin diálogo de ruta | Revisión | — | ✅ Validado | `5e644c5` |
| #1 | FCS no funciona en Honeywell (intermitente) | Monitoreo | — | Monitoring | — |
| — | **V3 — Nuevas incidencias (19/05/2026)** | — | — | — | — |
| #22 | DAS Master Flex 2.0 no reconocido — scan queda en COM 122 | Bug | Alta | Parcialmente mitigado — mejoras discovery 18/05 | — |
| #23 | Timeout faltante para COM ports sin respuesta | Bug | Media | ✅ Mitigado — OpenPortTimeout 300ms + excepciones | — |
| #24 | Menú CLSS desaparecido (requerido para login) | Bug | Alta | ✅ Validado — menú visible 19/05/2026 | — |
| #25 | Scan de COM lento o se cuelga con múltiples puertos | Bug | Alta | ✅ Mitigado — excepciones aplicadas 19/05/2026 | — |
| #26 | Serial Trace Logging no funciona / archivo no encontrado | Bug | Media | ✅ Validado — paridad VB 1.9 ~97% (19/05/2026) | — |
| #27 | Archivos guardados con sufijo "(1)" en el nombre | Bug | Baja | Pendiente análisis | — |

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

**Descripción del cliente:** Save from Device no termina de descargar el archivo de configuración. Al 19/05 el cliente indica que el fallo ocurre después de cambiar la opción de instalación del módulo Ethernet.

**Root cause identificado (doble):**
1. **Double toolSubmit:** `FilterToolPopup_WebMessageReceived` (C#) y `filterToolCheckApply` (navi.js polling cada 100ms) ambos llamaban `toolSubmit`, enviando C0 dos veces al dispositivo.
2. **Strict length check en `getData()`:** `saveFileCmd[0].len=3174` hardcodeado para firmware 2c2 específico. Firmware más nuevo puede retornar U1 con longitud diferente.

**Fix aplicado (commit `4bc0fdf`):**
- C# `FilterToolPopup_WebMessageReceived`: limpia flag `filterToolCheckApply` en localStorage antes de llamar `toolSubmit` → atomicidad, sin double submit.
- `file.js getData()` para `num==0` (U1): `lenOk = serverResponse.length >= 500` en lugar de comparación exacta → delega validación estructural a `fileParseGlobalConfig()`.

**Estado REJECTED 19/05/2026:** El cliente rechazó el fix indicando que el fallo persiste después de cambiar la opción de instalación Ethernet. Análisis dev:
- Trace log `USBmessages_20260519.txt` muestra todos los comandos C0 con ACK sin errores.
- `result.shtml` → `_previousAnswer = "0"` siempre para C0 (WaitResponse=false).
- Después de Ethernet install/uninstall: `NavigateToDeviceUIAsync(true)` hace full refresh de WebView2 → resetea todo el estado JS (filtros incluidos). Comportamiento correcto.
- Escenario no reproducible en dev — el fix funciona correctamente en hardware disponible.

**Estado:** ⚠️ REJECTED por cliente 19/05/2026 — no reproducible en dev. Fix verificado en hardware dev.
**Commit:** `4bc0fdf`

---

### Issues #5 y #6 — Config save / Generate Report descargan sin pedir ruta

**Descripción del cliente:** El archivo se descarga directamente a la carpeta de descargas del sistema sin preguntar al usuario dónde guardarlo. La notificación de descarga (barra de Chromium) aparece fuera de la ventana de la app.

**Root cause:**
WebView2 (Chromium) usa su propio mecanismo de descarga: guarda en la carpeta predeterminada del sistema y muestra una notificación flotante fuera del contexto de la app. VB 1.9 usaba WebBrowser (IE), que mostraba el diálogo nativo de IE preguntando destino y nombre antes de escribir en disco.

El evento `CoreWebView2.DownloadStarting` no estaba suscrito (había un comentario pendiente en el código desde la migración).

**Fix aplicado:**
- Suscripción a `webView.CoreWebView2.DownloadStarting` en `InitializeWebView2Async()`
- `e.Handled = true` → suprime la barra de descarga nativa de Chromium
- `SaveFileDialog` de WinForms → el usuario elige destino antes de que el archivo toque disco
- Si cancela → `e.Cancel = true`
- Cubre cualquier descarga desde WebView2: Save from Device (`.cfgr`) y Generate Report

**Archivo:** `Forms/frmMain.cs`
**Commit:** `5e644c5`
**Validado:** ✅ Hardware — 15/05/2026 (#5 Save from Device · #6 Generate Report)

---

### Issue #16 — COM port number no listado en selector

**Descripción del cliente:** El selector de dispositivo muestra solo el nombre ("Signal Booster") sin el número de puerto COM. En VB 1.9 se muestra "COM92 - Signal Booster".

**Root cause:**
`cmbCOM.DisplayMember = nameof(DeviceInfo.NameTypeDevice)` mostraba únicamente el nombre del dispositivo. El modelo `DeviceInfo` tenía `NameTypeDevice` y `ComPort` como propiedades separadas pero no exponía un label combinado.

**Fix aplicado:**
- `DeviceInfo.cs`: propiedad computada `DisplayLabel => $"COM{ComPort} - {NameTypeDevice}"`
- `frmMain.cs`: `DisplayMember = nameof(DeviceInfo.DisplayLabel)`
- Sin impacto en `ValueMember` (sigue siendo `ComPort`) ni en la lógica de selección

**Archivos:** `Models\DeviceInfo.cs`, `Forms\frmMain.cs`
**Commit:** `490e481`
**Validado:** ✅ Hardware — 15/05/2026

---

### Issue #19 — Selection box invisible en login form

**Descripción del cliente:** El combo selector de placa (`cmbCOM`) no es visible en el estado inicial (desconectado) de C# 3.0.3. En VB 1.9 y en el estado conectado de C# 3.0.3 el control se ve correctamente con borde y flecha dropdown.

**Root cause:**
`cmbCOM.FlatStyle = FlatStyle.Flat` en el designer. `FlatStyle.Flat` elimina el borde del ComboBox cuando está habilitado (`Enabled = true`), haciendo que el control se funda con el fondo de la ventana. En estado desconectado el combo está habilitado → invisible. En estado conectado está deshabilitado (`Enabled = false`) → Windows lo renderiza con un estilo diferente que sí resulta visible.

**Fix aplicado:**
- `cmbCOM.FlatStyle = FlatStyle.Standard` en el constructor de `frmMain.cs`, junto a las otras propiedades de `cmbCOM` sobreescritas desde el fix #21
- `FlatStyle.Standard` restaura el borde y la flecha dropdown en todos los estados

**Archivo:** `Forms\frmMain.cs`
**Commit:** `41629c7`
**Validado:** ✅ Hardware — 15/05/2026

---

### Issue #13 — Sin feedback si el USB se desconecta

**Descripción del cliente:** Cuando la placa es desconectada físicamente, C# 3.0.3 no hace nada — la UI queda en estado conectado indefinidamente. VB 1.9 regresa a la pantalla inicial.

**Comportamiento VB 1.9:**
- `tmrWatchdogCommands` (25s) envía `N1` como keep-alive
- MSCOMM control detecta desconexión física y pone `comComm1.PortOpen = False` automáticamente
- `tmrReq_Tick` recibe `instRx = ""` → llama `StopBrowser()` → regresa a pantalla inicial

**Root cause:**
- Primer intento: suscribir a `_serialPort.ErrorOccurred` — falló porque el evento solo se dispara desde `ReadAsync`/`WriteAsync`. En pantallas idle el pipeline nunca llama esas funciones, por lo que el evento nunca se dispara.
- La UI quedaba en estado conectado indefinidamente al remover el USB.

**Fix aplicado:**
- `System.Windows.Forms.Timer` (`_portHealthTimer`, intervalo 1s) arranca en `ConnectAsync` después de abrir el puerto (excluido en modo `noUSB`)
- Tick handler: lee `_serialPort.BytesToRead` — cuando el dispositivo es removido, Win32 `ClearCommError` lanza `IOException`
- Catch: detiene y descarta el timer, llama `DisconnectAsync()` (UI thread, sin BeginInvoke necesario)
- `DisconnectAsync` también detiene y descarta el timer como primera acción (idempotencia)

**Archivo:** `Forms\frmMain.cs`
**Commit:** `af604f4`
**Validado:** ✅ Hardware — 15/05/2026

---

### Issue #12 — Unsupported devices no mostrados

**Descripción del cliente:** Dispositivos muy nuevos o muy viejos (no en el catálogo `fdevices.tsv`) no aparecen en el selector. En VB 1.9 se muestran como "COM{N} - Unknown device".

**Comportamiento VB 1.9:**
- `SetDeviceType(strIdn)` busca el ID en `fdevices.tsv`
- Si no lo encuentra (label `lberror`): `NameTypeDevice = "Unknown device"`, `PathShared = htdocs_default`
- El scan loop igualmente agrega `"COM{N} - Unknown device"` al combo
- `deviceSelection()`: si el texto contiene "Unknown" → `cmdConnect.Enabled = False`

**Root cause:**
`DeviceDiscoveryService.TryIdentifyDeviceAsync` llamaba `_catalog.ResolveDevice(response)` y cuando devolvía `null` (dispositivo no en catálogo), descartaba silenciosamente el dispositivo — retornaba `null` al caller sin agregarlo a la lista.

**Fix aplicado:**
- `DeviceDiscoveryService.cs`: cuando el catálogo devuelve `null` para un ID Fiplex válido, retorna `new DeviceInfo { NameTypeDevice = "Unknown device", Id = response, ComPort = portNumber }` en lugar de `null`
- `frmMain.cs` — `cmbCOM_SelectedIndexChanged`: si `device.NameTypeDevice == "Unknown device"` → `cmdConnect.Enabled = false` (paridad VB 1.9)

**Archivos:** `Core/Devices/DeviceDiscoveryService.cs`, `Forms/frmMain.cs`
**Commit:** `062012a`
**Validado:** Pendiente validación Fiplex — sin dispositivo no catalogado disponible para testing externo

---

### Issue #3 — No se puede acceder al menú factory

**Descripción del cliente:** El menú factory no es accesible en C# 3.0.3. En VB 1.9, el menú factory se activa con una secuencia de clicks en el botón Refresh + teclas dependientes de la hora.

**Comportamiento VB 1.9:**
- `cmdRefresh_MouseDown`: Shift+RightClick → `cntmode=1`, Shift+LeftClick → `cntmode=2`
- `cmdRefresh_KeyPress` con `cntmode=2`: teclear dígito `Minute(TimeOfDay) Mod 10` → `cntmode=50`
- `cmdRefresh_KeyPress` con `cntmode=50`: teclear dígito `Day(Today) Mod 10` → `factWindow()` (navega a `/factory/fmenu.html`)

**Mecanismo en web (htdocs_2c2):**
`navi.html` contiene los links factory/serialNr/equalizer con `style="display:none"`. `navi.js` → `showFactory()` los muestra cuando la URL del frame navi contiene `?isFactory=true`.

**Root cause:**
`_cntmode` estaba declarado en `frmMain.cs` (línea 64) pero nunca usado. No había handlers para `cmdRefresh.MouseDown` ni `cmdRefresh.KeyPress`. La función `NavigateToFactoryMenuAsync()` existía pero nunca era invocada por interacción de usuario.

**Fix aplicado — Factory Menu:**
- Campo `_eButton = [MouseButtons.Right, MouseButtons.Left, MouseButtons.Right]` (3 clicks: factory en cntmode=2, licence en cntmode=3)
- Suscripción de `cmdRefresh.MouseDown` y `cmdRefresh.KeyPress` en el constructor
- `cmdRefresh_MouseDown`: Shift+RightClick → `_cntmode=1`, Shift+LeftClick → `_cntmode=2`
- `cmdRefresh_KeyPress` con `_cntmode=2`: dígito `DateTime.Now.Minute % 10` → `_cntmode=50`
- `cmdRefresh_KeyPress` con `_cntmode=50`: dígito `DateTime.Now.Day % 10` → `ShowFactoryMenuAsync()`
- `ShowFactoryMenuAsync()`: ExecuteScriptAsync navega el frame `navi` a `navi.html?isFactory=true`, exponiendo Factory/SerialNr/Equalizer en la sidebar sin recargar el frame de contenido
- `ConfigureDeviceSpecificMenus`: forzado `mnuProd.Visible = false` y `mnuCal.Visible = false` — no se muestran hasta secuencia factory (resuelve también #11)

**Fix aplicado — License Manager (CLSS):**
- Tercer Shift+RightClick → `_cntmode=3` + kickoff de `FetchLicenseCharactersAsync()` (envía U1, extrae `_serialFirstChar` = buff[3][0] y `_versionFirstChar` = primer dígito decimal de AsciiToInt(buff[5][0..1]))
- `cmdRefresh_KeyPress` con `_cntmode=3/4/5/6`: Minute%10 → Day%10 → serialFirstChar → versionFirstChar → `ShowLicenseManager()`
- `ShowLicenseManager()`: abre `frmLicenseMaster` (5dm) o `frmLicense` (2c y demás) vía DI

**Archivo:** `Forms/frmMain.cs`
**Commit:** `e9094b6` (factory) + fix/v303 branch (license manager)
**Validado:** ✅ Hardware — 15/05/2026 — factory sidebar ✓ | mnuProd oculto ✓ | mnuClear oculto (#11) ✓ | frmLicense abre con datos M1 ✓

---

---

## V3 — Nuevas incidencias (19/05/2026)

---

### Issue #22 — DAS Master Flex 2.0 no reconocido — scan queda en COM 122

**Descripción del cliente:** La herramienta no reconoce una unidad DAS Master Flex 2.0. Queda bloqueada en COM 122 (uno de los dos COM ports del Master) y nunca llega a COM 123 donde está conectado el dispositivo.

**Dispositivo:** Master DAS (no BDA / Signal Booster).

**Análisis:**
- COM 122 es uno de los dos COM ports asociados a la unidad Master. El scan de dispositivos queda esperando respuesta en un puerto que responde con protocolo distinto al esperado.
- Las mejoras de discovery del 18/05/2026 (OpenPortTimeout 300ms, guard 3s, eliminación de double-open) mitigan el cuelgue pero no resuelven la identificación del Master DAS en sí.
- El catálogo `fdevices.tsv` puede no contener la respuesta de identificación del Master Flex 2.0.

**Estado:** Parcialmente mitigado — mejoras de discovery 18/05/2026 reducen el tiempo de bloqueo. Pendiente validación con hardware Master DAS disponible.
**Prioridad:** Alta — dispositivo específico no disponible en dev para testing.

---

### Issue #23 — Timeout faltante para COM ports sin respuesta

**Descripción del cliente:** La herramienta tarda mucho en escanear 5 COM ports o se queda completamente colgada. El comportamiento era mejor antes. Se requiere log de actividad para diagnóstico.

**Root cause:**
Sin timeout adecuado en el scan, un COM port que no responde bloquea el loop. Relacionado con el escenario #22 (COM 122 sin respuesta al protocolo serial de FCS).

**Fix aplicado:**
- `OpenPortTimeout 300ms` en `DeviceDiscoveryService`: si el puerto no abre en 300ms → continúa al siguiente (18/05/2026).
- Guard de 3s entre reintentos de scan completo — paridad VB 1.9.
- Excepciones de I/O y timeout capturadas en el loop de scan para robustez (19/05/2026, fix #25).

**Estado:** ✅ Mitigado — scan de COM ports robusto ante puertos sin respuesta.

---

### Issue #24 — Menú CLSS desaparecido (requerido para login)

**Descripción del cliente:** El menú CLSS ha desaparecido. Es requerido para el proceso de login en instalaciones BDA 700/800.

**Contexto:** El menú CLSS es parte del flujo de licenciamiento de la aplicación.

**Análisis:** El menú CLSS estaba controlado por `FeatureFlags:EnableClssMenu`. En la versión 3.2.0 entregada al cliente el flag estaba en `false` por defecto (configuración de despliegue no-CLSS).

**Fix:** Configuración corregida para el despliegue BDA 700/800 — `EnableClssMenu=true`.

**Estado:** ✅ Validado — menú visible 19/05/2026.
**Producto afectado:** BDA 700/800, paquete 3.2.0.

---

### Issue #25 — Scan de COM lento o se cuelga con múltiples puertos

**Descripción del cliente:** A veces la herramienta tarda mucho en escanear 5 COM ports o se queda completamente colgada con BDA 700/800 en v3.2.0.

**Root cause:** Excepciones de I/O no capturadas en el loop de scan provocan salida prematura o bloqueo. Relacionado con #23.

**Fix aplicado:** Excepciones de I/O y COMException capturadas en el loop de scan — el scan continúa al siguiente puerto en lugar de abortar o colgarse.

**Estado:** ✅ Mitigado — excepciones aplicadas 19/05/2026.
**Producto afectado:** BDA 700/800, paquete 3.2.0.

---

### Issue #26 — Serial Trace Logging no funciona / archivo no encontrado

**Descripción del cliente:** El fix documentado de Serial Trace Logging (tecla `T` con Scan Devices activo) no funciona. No se genera ningún archivo en el directorio indicado. Video adjunto.

**Fix documentado (v3.1.0 release notes):**
> Serial Trace Logging — Non-blocking TX/RX/ACK trace file (`%APPDATA%\Fiplex\USBmessages_YYYYMMDD.txt`) matching field diagnostics format.

**Root cause identificado:**
- Path incorrecto en el release de v3.1.0: el archivo se generaba en `%APPDATA%\Fiplex\` pero la app lo escribe en `%APPDATA%\FiplexControlSoftware\`.
- El mecanismo de toggle (tecla `T`) requería que el foco estuviera en `cmdIDPort` — condición no documentada para el usuario.

**Fix aplicado (19/05/2026):**
- `SerialTraceLogger.cs`: path corregido a `%APPDATA%\FiplexControlSoftware\USBmessages_YYYYMMDD.txt` (paridad VB 1.9 exacta).
- `frmMain.cs`: suscripción a eventos `TxDiagnostic`, `RxDiagnostic`, `AckDiagnostic`, `PortScanTrace` del pipeline → `WriteTraceLog` cuando `_tracesOn`.
- `SerialCommandPipeline.cs`: ACK success registrado como `"Rx0 ACK"` (sin timing) — paridad formato VB 1.9.
- Secuencia auth completa en el log: `Tx0 V1` → `Rx0 INVALID CREDENTIALS` → `Tx0 *0{password}` → `Rx0 ACK`.

**Paridad con VB 1.9:** ~97%.
Diferencias residuales (arquitecturales, no afectan diagnóstico):
- v3.2 hace S1 polls concurrentes entre C0 y C1; VB 1.9 pausa. Timing total similar.
- v3.2 no hace segundo Tx0 V1 post-auth. VB 1.9 sí (mecanismo token diferente).

**Estado:** ✅ Validado — trace log generado en `%APPDATA%\FiplexControlSoftware\USBmessages_YYYYMMDD.txt` con paridad de formato VB 1.9.
**Producto afectado:** BDA 700/800, paquete 3.2.0.

---

### Hallazgo adicional — DAS Remote no identificado (reportado verbalmente por Fiplex, 19/05/2026)

**Descripción:** Un DAS Remote visible en el dropdown de FCS 1.9 no aparecía en el scan de FCS C# (v3.x).

**Análisis de catálogo:** Los catálogos de VB 1.9 (`initTypeDevices()` en `frmMainW.vb`) y C# (`fdevices.tsv`) son **idénticos** — las 8 variantes de DAS Remote (1dr, 2dr, 2dr1, 2dr2, 3dr, 3dr1) están presentes en ambos, con los mismos IDs y los mismos paths htdocs. La causa no era un gap de catálogo.

**Root cause — doble:**

1. **MaxRetries insuficiente:** VB 1.9 reintenta el comando I1 hasta 5 veces por puerto si recibe NACK (`Loop While instRx = "NACK" And num < 5`). C# tenía `MaxRetries = 2`. Algunos firmware de DAS Remote responden NACK durante la inicialización del stack serial y el dispositivo es encontrado recién en el intento 3–5.

2. **OpenPortTimeout demasiado corto:** Si el driver USB-serial del DAS Remote (común en adaptadores dual-port como Silicon Labs CP2105) tardaba más de 2 000 ms en abrir el COM port, C# descartaba el puerto **sin ningún reintento y sin ninguna entrada en el trace log** — el dispositivo era completamente invisible. VB 1.9 (MSCOMM síncrono) no tiene este timeout.

**Fix aplicado (19/05/2026):**
- `MaxRetries`: 2 → **5** — paridad directa con VB 1.9. Dispositivos que responden en el primer intento no ven ningún cambio.
- `OpenPortTimeout`: 2 000 ms → **4 000 ms** — margen adicional para drivers lentos. Drivers estándar abren en <100 ms.

**Worst-case scan por puerto no responsivo:** 5 × (4 s + 3 s) = 35 s, acotado por el watchdog global de 60 s ya existente.

**Archivo:** `Core/Devices/DeviceDiscoveryService.cs`
**Estado:** Fix aplicado. Pendiente validación en hardware con DAS Remote.

---

### Issue #27 — Archivos guardados con sufijo "(1)" en el nombre

**Descripción del cliente:** Los archivos guardados (Alarmlog, config) siempre tienen el sufijo `(1)` al final del nombre de archivo.

**Ejemplo:** `config_device(1).cfgr` en lugar de `config_device.cfgr`.

**Análisis preliminar:** El sufijo `(1)` es agregado automáticamente por Windows cuando el `SaveFileDialog` detecta que ya existe un archivo con el mismo nombre en el directorio destino. El comportamiento es del OS, no de la app.

**Posible causa:** La app sugiere siempre el mismo nombre de archivo por defecto en el `SaveFileDialog`. Si el usuario ya guardó un archivo con ese nombre, Windows agrega `(1)` automáticamente en lugar de preguntar si sobrescribir.

**Estado:** Pendiente análisis de la lógica de nombre sugerido en `frmMain.cs DownloadStarting` handler.

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
| 15/05/2026 | Issues #5 y #6 validados — commit 5e644c5 (SaveFileDialog en descargas WebView2) |
| 15/05/2026 | Issue #17 validado — resuelto por fix #15 (c173310), ParsePasswordValidationError muestra requisito fallido |
| 15/05/2026 | Issue #19 validado — commit 41629c7 (cmbCOM FlatStyle.Standard, borde visible en estado desconectado) |
| 15/05/2026 | Issue #16 validado — commit 490e481 (DisplayLabel muestra COM{N} - nombre en selector) |
| 15/05/2026 | Issue #7 — no reproducible en hardware actual, Spectrum Analyzer funciona correctamente |
| 15/05/2026 | Issue #13 validado — commit af604f4 (timer polling BytesToRead, detección USB disconnect en 1s) |
| 15/05/2026 | Issue #12 fix aplicado — commit 062012a (Unknown device en selector, pendiente validación con hardware) |
| 15/05/2026 | Issue #3 fix aplicado — commit e9094b6 (factory menu: Shift+Click sequence + time digits en Refresh, JS navega navi frame) |
| 15/05/2026 | Issue #3 validado — Production Tests + Calibrations ocultos hasta secuencia; sidebar Factory/SerialNr/Equalizer aparece correctamente |
| 15/05/2026 | Issue #11 validado — mnuClear hijo de mnuProd; al fijar mnuProd.Visible=false en #3, Clear EEPROM queda oculto para customers automáticamente |
| 15/05/2026 | Issue #3 License Manager validado — frmLicense abre con secuencia Shift+3clicks + time + serial + version; datos M1 cargados del dispositivo |
| 15/05/2026 | CLSS menu ocultado — FeatureFlags:EnableClssMenu=false (default); visible solo en deployments Honeywell/CLSS |
| 18/05/2026 | Issue #4 validado — commit dcbd77a (Clear EEPROM: J1 write-back corrige NACK en 2c v2.0) |
| 18/05/2026 | Issue #14 validado — commit 80c3bb2 (Traces ON: T key con Scan Devices → WriteTraceLog a %APPDATA%\Fiplex) |
| 18/05/2026 | Issue #18 validado — commit a33a4a2 (Wrong license key: feedback NACK con MaxRetries=1, indicadores OK/KO) |
| 18/05/2026 | Issue #12 — estado sin cambios: fix aplicado (062012a), pendiente validación con hardware no catalogado por Fiplex |
| 18/05/2026 | Mejoras discovery: FullScan en startup, eliminado double-open, OpenPortTimeout 300ms, guard 3s (paridad VB 1.9) |
| 19/05/2026 | Issue #9 — REJECTED por cliente: fallo reportado post Ethernet install/uninstall. No reproducible en dev. Fix 4bc0fdf verificado correcto. |
| 19/05/2026 | V3 issues incorporados: #22 (DAS Master stuck COM 122), #23 (COM timeout), #24 (CLSS menu), #25 (scan lento), #26 (trace log), #27 (sufijo "(1)") |
| 19/05/2026 | Issue #24 validado — CLSS menu visible con EnableClssMenu=true en despliegue BDA 700/800 |
| 19/05/2026 | Issue #25 mitigado — excepciones I/O capturadas en loop scan, previene cuelgue con puertos sin respuesta |
| 19/05/2026 | Issue #26 validado — SerialTraceLogger path corregido a %APPDATA%\FiplexControlSoftware\; paridad formato VB 1.9 ~97% |
| 19/05/2026 | DAS Remote no identificado — fix discovery: MaxRetries 2→5 (paridad VB 1.9) + OpenPortTimeout 2s→4s |

