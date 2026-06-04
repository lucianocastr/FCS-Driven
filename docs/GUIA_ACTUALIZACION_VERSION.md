# Guía de actualización de versión — FCS

Referencia rápida para bump de versión. Aplica tanto al repo de trabajo como a la carpeta de entrega.

---

## Archivos a modificar

| # | Archivo | Qué cambiar |
|---|---------|-------------|
| 1 | `src/.../Fiplex.Control.Software.WinForms.csproj` | `<Version>X.Y.Z</Version>` y `<Copyright>... YYYY</Copyright>` |
| 2 | `src/.../Forms/frmMain.cs` | Fallback `?? "X.Y.Z"` (~línea 86) |
| 3 | `src/.../Core/Configuration/VersionCheckService.cs` | Fallback `?? "X.Y.Z"` (~línea 86) |
| 4 | `src/.../pages/htdocs_2c2/home.html` | Footer `Version X.Y.Z` (~línea 1050) |
| 5 | `src/.../pages/htdocs_default/logo.png` | Imagen splash — ver script abajo |
| 6 | `CHANGELOG.md` | Agregar sección `## [X.Y.Z] - YYYY-MM-DD` al inicio |

### NO modificar
- `<AssemblyVersion>` / `<FileVersion>` en el `.csproj` — no corresponden a la versión de la app
- `navi.html` → `[WEB: X.Y.Z]` — versión web independiente del ejecutable

---

## Archivo 1 — .csproj

```xml
<!-- Solo este campo -->
<Version>3.2.0</Version>
<Copyright>Copyright © Fiplex Communications 2026</Copyright>
```

---

## Archivo 2 y 3 — Fallbacks en C#

Buscar `?? "` en `frmMain.cs` y `VersionCheckService.cs`:

```csharp
// De:
?.InformationalVersion ?? "3.1.0")
// A:
?.InformationalVersion ?? "3.2.0")
```

---

## Archivo 4 — home.html footer

```html
<!-- De: -->
<p class="fl_right padddingvolver">Version 3.1.0</p>
<!-- A: -->
<p class="fl_right padddingvolver">Version 3.2.0</p>
```

---

## Archivo 5 — logo.png (imagen splash)

**Datos fijos del PNG** (no cambian entre versiones):
- Tamaño: 1536 × 1024 px
- DPI: **72** (1 pt = 1 px — importante para el tamaño de fuente)
- Texto de versión: y=704..738, fuente **Segoe UI 27pt**, color **R=4 G=79 B=154**
- Región horizontal del texto: x=237, width=1062 (centrado dentro de esa banda)

**Script PowerShell** — ejecutar desde cualquier terminal con .NET:

```powershell
# ── CONFIGURAR ──────────────────────────────────────────────────────
$VERSION = "v3.2.0"       # <-- cambiar aquí

$SRC  = "E:\Ikarus\Proyecto C#\FCS302OK\FCSDev\src\Fiplex.Control.Software.WinForms\pages\htdocs_default\logo.png"
$DEST = "E:\Ikarus\Proyecto C#\FCS302OK\FCSDev\src\Fiplex.Control.Software.WinForms\pages\htdocs_default\logo.png"
$TMP  = "E:\tmp\logo_new.png"
# ────────────────────────────────────────────────────────────────────

Add-Type -AssemblyName System.Drawing

$bmp = [System.Drawing.Bitmap]::new($SRC)
$g   = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode     = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias

# Borrar texto anterior
$bgBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::White)
$g.FillRectangle($bgBrush, 237, 704, 1062, 34)

# Dibujar nueva versión
$font      = [System.Drawing.Font]::new("Segoe UI", 27, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Point)
$textBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(4, 79, 154))
$sf        = [System.Drawing.StringFormat]::new()
$sf.Alignment     = [System.Drawing.StringAlignment]::Center
$sf.LineAlignment = [System.Drawing.StringAlignment]::Center

$g.DrawString($VERSION, $font, $textBrush, [System.Drawing.RectangleF]::new(237, 704, 1062, 34), $sf)

$font.Dispose(); $textBrush.Dispose(); $bgBrush.Dispose(); $g.Dispose()

# Guardar en tmp primero (evita GDI+ lock si el archivo está abierto)
$bmp.Save($TMP, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()

Copy-Item $TMP $DEST -Force
Write-Host "logo.png actualizado a $VERSION"
```

> **Nota:** Cerrar la app antes de ejecutar el script para evitar que el archivo esté bloqueado.

---

## Archivo 6 — CHANGELOG.md

Agregar al inicio del archivo (antes de la sección anterior):

```markdown
## [3.2.0] - 2026-MM-DD

### Fixed
- **#N — Descripción** (`Archivo.cs`)
  - Root cause y fix resumidos.
```

---

## Checklist de entrega

Después de actualizar todos los archivos, verificar en FCS-3-1 (o carpeta de entrega):

```powershell
# Sin referencias internas (esperado: sin resultados)
Select-String -Path "E:\Ikarus\Proyecto C#\FCS-3-1\**\*.{cs,html,json,md,csproj}" `
  -Pattern "luciano|lcastro|luchi|Claude|Anthropic|Co-Authored|FCS302OK" -Recurse

# Sin versión anterior en archivos de código (CHANGELOG es OK tenerla)
Select-String -Path "E:\Ikarus\Proyecto C#\FCS-3-1\src\**\*.{cs,csproj,html}" `
  -Pattern "3\.1\.0" -Recurse
```
