# Guía de entrega — nueva versión al cliente

Ejecutar en orden. Cada paso debe completarse antes de pasar al siguiente.

---

## Variables de configuración

Ajustar antes de ejecutar cualquier script:

```powershell
$VERSION     = "3.4.0"                                  # versión semántica sin "v"
$VERSION_TAG = "v$VERSION"                              # con prefijo para logo y git tag
$repoRoot    = "E:\Ikarus\Proyecto C#\FCS302OK\FCSDev"  # raíz del repo activo
$entregas    = "E:\Ikarus\Proyecto C#"                  # carpeta donde se crean las entregas
$tmpDir      = "E:\tmp"
```

---

## 1. Actualizar versión en el código fuente

| # | Archivo | Campo | Valor |
|---|---------|-------|-------|
| 1 | `src/…/Fiplex.Control.Software.WinForms.csproj` | `<Version>X.Y.Z</Version>` | nueva versión |
| 2 | `src/…/Fiplex.Control.Software.WinForms.csproj` | `<Copyright>… YYYY</Copyright>` | año actual |
| 3 | `src/…/Forms/frmMain.cs` | fallback `?? "X.Y.Z"` (~línea 111) | nueva versión |
| 4 | `src/…/Core/Configuration/VersionCheckService.cs` | fallback `?? "X.Y.Z"` (~línea 86) | nueva versión |
| 5 | `src/…/pages/htdocs_2c2/home.html` | footer `Version X.Y.Z` (~línea 1050) | nueva versión |

> **NO modificar:**
> - `<AssemblyVersion>` / `<FileVersion>` en `.csproj` — no corresponden a la versión de la app.
> - `pages/htdocs_1a2/navi.html` → `[WEB: X.Y.Z]` — versión web mantenida por Fiplex.
> - `pages/htdocs_2c/home.html` y `htdocs_2c1/home.html` — no contienen línea de versión.

---

## 2. Actualizar imagen splash

**Archivo:** `src/…/pages/htdocs_default/logo.png`

Parámetros del splash (no modificar sin validar visualmente):

| Parámetro | Valor |
|---|---|
| Rectángulo fondo | `x=237, y=704, width=1062, height=34`, color blanco `(255,255,255)` |
| Texto | `vX.Y.Z` centrado en la banda |
| Fuente | Segoe UI Regular, **27pt**, `GraphicsUnit.Point` |
| Color texto | **RGB(4, 79, 154)** — azul Fiplex |
| `SmoothingMode` | `AntiAlias` |
| `TextRenderingHint` | `AntiAlias` |

Script PowerShell (reemplaza el archivo en la misma ruta, pasa por tmp para evitar lock de GDI+):

```powershell
$VERSION_TAG = "v3.4.0"   # <-- ajustar
$SRC  = "$repoRoot\src\Fiplex.Control.Software.WinForms\pages\htdocs_default\logo.png"
$DEST = $SRC
$TMP  = "$tmpDir\logo_new.png"

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

> **Nota:** Cerrar la app antes de ejecutar — evita que GDI+ bloquee el archivo.  
> Verificar visualmente el resultado antes de continuar.

---

## 3. Actualizar CHANGELOG.md en el repo

Cambiar `## [X.Y.Z] - TBD` → `## [X.Y.Z] - YYYY-MM-DD` con la fecha de entrega.  
No incluir referencias a ramas internas (`fix/…`, `release/…`) ni links a repositorios.

---

## 4. Commit y tag

```powershell
cd $repoRoot

git add src/Fiplex.Control.Software.WinForms/Fiplex.Control.Software.WinForms.csproj `
        src/Fiplex.Control.Software.WinForms/Forms/frmMain.cs `
        src/Fiplex.Control.Software.WinForms/Core/Configuration/VersionCheckService.cs `
        src/Fiplex.Control.Software.WinForms/pages/htdocs_2c2/home.html `
        src/Fiplex.Control.Software.WinForms/pages/htdocs_default/logo.png `
        CHANGELOG.md

git commit -m "chore: bump version $VERSION"
git tag $VERSION_TAG
```

---

## 5. Build Release

```powershell
dotnet build "$repoRoot\src\Fiplex.Control.Software.WinForms\Fiplex.Control.Software.WinForms.csproj" `
             --configuration Release
```

El build debe terminar con **0 Errores**.

---

## 6. Crear carpeta de entrega

```powershell
$ver = $VERSION -replace '\.', '-'   # "3.4.0" → "3-4-0"
$dst = "$entregas\FCS-$ver"

New-Item -ItemType Directory -Force $dst

# Código fuente (sin bin, obj, .git, .vs)
robocopy "$repoRoot\src" "$dst\src" /E /XD bin obj .vs .git /XF "*.user" "*.suo" /NFL /NDL /NP /NJS /NJH

# Archivos raíz
Copy-Item "$repoRoot\Fiplex.Control.Software.sln" $dst -Force
Copy-Item "$repoRoot\README.md"    $dst -Force
Copy-Item "$repoRoot\CHANGELOG.md" $dst -Force

# Documentación de soporte (se entrega)
New-Item -ItemType Directory -Force "$dst\docs"
Copy-Item "$repoRoot\docs\GUIA_LOGS_DIAGNOSTICO.md"  "$dst\docs" -Force
Copy-Item "$repoRoot\docs\GUIA_LOGS_DIAGNOSTICO.pdf" "$dst\docs" -Force
```

---

## 7. Limpiar README.md en la carpeta de entrega

Secciones a eliminar antes de entregar:

| Sección | Motivo |
|---|---|
| `Option 3: Build from Source` (con URL de repo) | URL de repositorio interno |
| `Documentation` (con links a `docs/`) | Solo `GUIA_LOGS_DIAGNOSTICO` se entrega; los demás docs son internos |
| `Contributing` | Apunta a `CONTRIBUTING.md` no entregado |
| `![Fiplex Logo](docs/assets/logo.png)` | Imagen interna no entregada |

---

## 8. Limpiar CHANGELOG.md en la carpeta de entrega

- Mantener solo `## [X.Y.Z]` con resumen orientado al cliente.
- Eliminar referencias a ramas internas (`branch: fix/…`).
- Eliminar links de comparación al final del archivo.
- Actualizar tabla "Version History Summary" si existe.

---

## 9. Verificación automática

```powershell
$dest = "$entregas\FCS-$ver"

$patterns = @{
    "Datos personales"            = "luciano|luchi|lcastro|mauricio"
    "Herramientas de desarrollo"  = "Co-Authored|co-authored|Claude|Anthropic"
    "Nombre del repo fuente"      = "FCS302OK|FCSDev|FCS-Driven"
    "Ramas internas"              = "fix/|release/"
    "Rutas de desarrollo"         = "E:\\\\Ikarus|C:\\\\Users\\\\"
    "Versión anterior"            = "3\.3\.0"
}

foreach ($label in $patterns.Keys) {
    $hits = Get-ChildItem $dest -Recurse -File |
            Where-Object { $_.Extension -match '\.(cs|csproj|json|md|html|js|css|sln|cfg|txt)$' } |
            Select-String -Pattern $patterns[$label] -CaseSensitive:$false
    if ($hits) {
        Write-Host "[ISSUE] $label"
        $hits | ForEach-Object { Write-Host "  $($_.Filename):$($_.LineNumber)  $($_.Line.Trim())" }
    } else {
        Write-Host "[OK]    $label"
    }
}
```

Verificar también carpetas prohibidas:

```powershell
@("bin","obj",".git",".vs") | ForEach-Object {
    if (Test-Path "$dest\$_")     { Write-Host "[WARN] Carpeta prohibida en raíz: $_" }
    if (Test-Path "$dest\src\Fiplex.Control.Software.WinForms\$_") {
        Write-Host "[WARN] Carpeta prohibida en src: $_"
    }
}
```

Todos los ítems deben mostrar `[OK]`.

---

## 10. Prueba de ejecución desde la carpeta de entrega

```powershell
dotnet run --project "$dest\src\Fiplex.Control.Software.WinForms\Fiplex.Control.Software.WinForms.csproj"
```

Verificar:
- Login funciona
- Splash muestra versión correcta (texto azul Fiplex)
- Scan de dispositivos lista todos los conectados
- Footer de `home.html` muestra `Version X.Y.Z`
- Menú LOG visible y cicla entre niveles correctamente

---

## 11. Comprimir y entregar

```powershell
Compress-Archive -Path "$entregas\FCS-$ver" `
                 -DestinationPath "$entregas\FCS-$ver.zip" `
                 -Force
Write-Host "Listo: $entregas\FCS-$ver.zip"
```

---

## Checklist rápido

```
[ ] 1. Version bump: .csproj (Version + Copyright), frmMain.cs, VersionCheckService.cs, home.html
[ ] 2. Logo splash actualizado y verificado visualmente (azul RGB 4,79,154)
[ ] 3. CHANGELOG.md — fecha actualizada, entrada [X.Y.Z] completa
[ ] 4. Commit + git tag vX.Y.Z
[ ] 5. Build Release — 0 errores
[ ] 6. Carpeta FCS-X-Y-Z creada con robocopy + docs de soporte copiados
[ ] 7. README.md limpiado en la entrega
[ ] 8. CHANGELOG.md limpiado en la entrega
[ ] 9. Verificación automática — todos [OK]
[ ] 10. Prueba de ejecución desde carpeta de entrega
[ ] 11. ZIP generado
```
