# Referencia rápida — bump de versión

> Para el proceso completo de entrega al cliente, ver [`GUIA_ENTREGA_NUEVA_VERSION.md`](GUIA_ENTREGA_NUEVA_VERSION.md).

---

## Archivos a modificar

| # | Archivo | Campo |
|---|---------|-------|
| 1 | `src/…/Fiplex.Control.Software.WinForms.csproj` | `<Version>X.Y.Z</Version>` y `<Copyright>… YYYY</Copyright>` |
| 2 | `src/…/Forms/frmMain.cs` | fallback `?? "X.Y.Z"` (~línea 111) |
| 3 | `src/…/Core/Configuration/VersionCheckService.cs` | fallback `?? "X.Y.Z"` (~línea 86) |
| 4 | `src/…/pages/htdocs_2c2/home.html` | footer `Version X.Y.Z` (~línea 1050) |
| 5 | `src/…/pages/htdocs_default/logo.png` | ejecutar script de logo (ver abajo) |
| 6 | `CHANGELOG.md` | actualizar `- TBD` → fecha real |

### NO modificar
- `<AssemblyVersion>` / `<FileVersion>` — no corresponden a la versión de la app.
- `htdocs_1a2/navi.html` → `[WEB: X.Y.Z]` — versión web mantenida por Fiplex.
- `htdocs_2c/home.html` y `htdocs_2c1/home.html` — no contienen línea de versión.

---

## Logo splash — parámetros

| Parámetro | Valor |
|---|---|
| Rectángulo fondo | `x=237, y=704, width=1062, height=34`, blanco `(255,255,255)` |
| Texto | `vX.Y.Z` centrado |
| Fuente | Segoe UI Regular, **27pt**, `GraphicsUnit.Point` |
| Color | **RGB(4, 79, 154)** — azul Fiplex |
| `SmoothingMode` | `AntiAlias` |
| `TextRenderingHint` | `AntiAlias` |

Script PowerShell:

```powershell
$VERSION_TAG = "v3.4.0"   # <-- cambiar aquí
$SRC  = "E:\Ikarus\Proyecto C#\FCS302OK\FCSDev\src\Fiplex.Control.Software.WinForms\pages\htdocs_default\logo.png"
$DEST = $SRC
$TMP  = "E:\tmp\logo_new.png"

Add-Type -AssemblyName System.Drawing

$bmp = [System.Drawing.Bitmap]::new($SRC)
$g   = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode     = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias

$bgBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::White)
$g.FillRectangle($bgBrush, 237, 704, 1062, 34)

$font      = [System.Drawing.Font]::new("Segoe UI", 27, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Point)
$textBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(4, 79, 154))
$sf        = [System.Drawing.StringFormat]::new()
$sf.Alignment     = [System.Drawing.StringAlignment]::Center
$sf.LineAlignment = [System.Drawing.StringAlignment]::Center

$g.DrawString($VERSION_TAG, $font, $textBrush, [System.Drawing.RectangleF]::new(237, 704, 1062, 34), $sf)

$font.Dispose(); $textBrush.Dispose(); $bgBrush.Dispose(); $sf.Dispose(); $g.Dispose()

$bmp.Save($TMP, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()

Copy-Item $TMP $DEST -Force
Write-Host "logo.png actualizado a $VERSION_TAG"
```

> Cerrar la app antes de ejecutar para evitar lock de GDI+.

---

## Commit rápido

```powershell
git add src/Fiplex.Control.Software.WinForms/Fiplex.Control.Software.WinForms.csproj `
        src/Fiplex.Control.Software.WinForms/Forms/frmMain.cs `
        src/Fiplex.Control.Software.WinForms/Core/Configuration/VersionCheckService.cs `
        src/Fiplex.Control.Software.WinForms/pages/htdocs_2c2/home.html `
        src/Fiplex.Control.Software.WinForms/pages/htdocs_default/logo.png `
        CHANGELOG.md

git commit -m "chore: bump version X.Y.Z"
git tag vX.Y.Z
```
