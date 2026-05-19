# Guía de entrega — nueva versión al cliente

Ejecutar en orden. Cada paso debe completarse antes de pasar al siguiente.

Variables de entorno utilizadas en los scripts — ajustar según la máquina:

```powershell
$repoRoot     = "<ruta_repositorio_fuente>"      # raíz del repo activo
$entregas     = "<ruta_carpeta_entregas>"         # carpeta donde se crean las entregas
$logoOriginal = "<ruta_logo_original_limpio>"     # logo sin texto de versión
$logoTemp     = "<ruta_temporal>\logo_new.png"    # archivo de trabajo
```

---

## 1. Actualizar versión en el código fuente

**Carpeta:** `src/Fiplex.Control.Software.WinForms/`

| Archivo | Qué cambiar |
|---|---|
| `Fiplex.Control.Software.WinForms.csproj` | `<Version>X.Y.Z</Version>` |
| `Forms/frmMain.cs` | fallback `?? "X.Y.Z"` (~línea 95) |
| `Core/Configuration/VersionCheckService.cs` | fallback `?? "X.Y.Z"` (~línea 86) |
| `pages/htdocs_2c2/home.html` | footer `Version X.Y.Z` (~línea 1050) |

> **NO modificar** `pages/htdocs_1a2/navi.html` — la versión `[WEB: X.Y.Z]` es mantenida por Fiplex, no por este proyecto.

---

## 2. Actualizar imagen splash

**Archivo destino:** `pages/htdocs_default/logo.png`

Parámetros confirmados (no modificar sin validar visualmente):

| Parámetro | Valor |
|---|---|
| Rectángulo fondo | `y=705..737`, ancho completo, color blanco (255,255,255) |
| Texto | `vX.Y.Z` centrado en la banda |
| Fuente | Segoe UI Regular, 27pt, GraphicsUnit.Point |
| Color texto | RGB(150, 150, 150) |

Script PowerShell:

```powershell
Add-Type -AssemblyName System.Drawing

$bmp = [System.Drawing.Bitmap]::new($logoOriginal)
$g   = [System.Drawing.Graphics]::FromImage($bmp)
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

$g.FillRectangle([System.Drawing.SolidBrush]::new([System.Drawing.Color]::White), 0, 705, $bmp.Width, 33)

$font  = [System.Drawing.Font]::new("Segoe UI", 27, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Point)
$brush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(150, 150, 150))
$text  = "vX.Y.Z"   # <-- cambiar aquí
$sz    = $g.MeasureString($text, $font)
$g.DrawString($text, $font, $brush, ($bmp.Width - $sz.Width) / 2, 705 + (33 - $sz.Height) / 2)

$g.Dispose()
$bmp.Save($logoTemp, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()

Copy-Item $logoTemp "$repoRoot\src\Fiplex.Control.Software.WinForms\pages\htdocs_default\logo.png" -Force
```

Verificar visualmente el resultado antes de continuar.

---

## 3. Actualizar CHANGELOG.md en el repo

Agregar sección `## [X.Y.Z] - YYYY-MM-DD` con los cambios de esta versión.  
No incluir referencias a ramas internas (`fix/...`, `release/...`) ni links a repositorios.

---

## 4. Commit y build final

```powershell
# Desde $repoRoot
git add -p   # revisar cambios antes de stagear
git commit -m "chore: bump version X.Y.Z"

dotnet build src/Fiplex.Control.Software.WinForms/Fiplex.Control.Software.WinForms.csproj --configuration Release
```

El build debe terminar con **0 Errores**.

---

## 5. Crear carpeta de entrega

```powershell
$ver = "3-2"   # <-- ajustar a la versión de entrega
$src = $repoRoot
$dst = "$entregas\FCS-$ver"

New-Item -ItemType Directory -Force $dst

# Copiar código fuente (sin bin, obj, .git, .vs)
robocopy "$src\src" "$dst\src" /E /XD bin obj .vs .git /XF "*.user" "*.suo" /NFL /NDL /NP /NJS /NJH

# Copiar archivos raíz (sin docs, sin app, sin CONTRIBUTING)
Copy-Item "$src\Fiplex.Control.Software.sln" $dst -Force
Copy-Item "$src\README.md"   $dst -Force
Copy-Item "$src\CHANGELOG.md" $dst -Force
```

---

## 6. Limpiar README.md en la carpeta de entrega

Secciones a eliminar antes de entregar:

| Sección | Motivo |
|---|---|
| `Option 3: Build from Source` (con URL de repo) | URL de repositorio interno |
| `Documentation` (con links a `docs/`) | Carpeta `docs/` no se entrega |
| `Contributing` | Apunta a `CONTRIBUTING.md` no entregado |

El encabezado `![Fiplex Logo](docs/assets/logo.png)` también debe eliminarse.

---

## 7. Limpiar CHANGELOG.md en la carpeta de entrega

- Agregar entrada `[X.Y.Z]` con resumen de cambios orientado al cliente
- Eliminar referencias a ramas internas (`branch: fix/...`)
- Eliminar links de comparación al final del archivo
- Actualizar tabla "Version History Summary"

---

## 8. Verificación final

Ejecutar en la carpeta de entrega:

```powershell
$dest = "$entregas\FCS-X-Y"   # <-- ajustar

$patterns = @{
    "Datos personales"         = "luciano|luchi|lcastro|lucianocastr|mauricio"
    "Herramientas de desarrollo" = "Co-Authored|co-authored"
    "Nombre del repo fuente"   = "FCS302OK|FCSDev|FCS-Driven"
    "Ramas internas"           = "fix/|release/"
    "Version anterior"         = "X\.Y\.(Z-1)"   # reemplazar con version anterior real
    "Rutas de desarrollo"      = "E:\\\\|C:\\\\Users\\\\"
}

foreach ($label in $patterns.Keys) {
    $hits = Get-ChildItem $dest -Recurse -File |
            Where-Object { $_.Extension -match '\.(cs|csproj|json|md|html|js|css|sln|cfg|txt)$' } |
            Select-String -Pattern $patterns[$label] -CaseSensitive:$false
    if ($hits) {
        Write-Host "[ISSUE] $label"
        $hits | ForEach-Object { Write-Host "  $($_.Filename):$($_.LineNumber)  $($_.Line.Trim())" }
    } else {
        Write-Host "[OK] $label"
    }
}
```

Todos los ítems deben mostrar `[OK]`.

Verificar también que no existan carpetas prohibidas:

```powershell
@("bin","obj",".git","docs",".vs") | ForEach-Object {
    if (Test-Path "$dest\$_") { Write-Host "[WARN] Carpeta prohibida: $_" }
    if (Test-Path "$dest\src\Fiplex.Control.Software.WinForms\$_") { Write-Host "[WARN] Carpeta prohibida en src: $_" }
}
```

---

## 9. Prueba de ejecución desde la carpeta de entrega

```powershell
dotnet run --project "$dest\src\Fiplex.Control.Software.WinForms\Fiplex.Control.Software.WinForms.csproj"
```

Verificar:
- Login funciona
- Splash muestra versión correcta
- Scan de dispositivos lista todos los conectados
- Footer de home.html muestra versión correcta

---

## 10. Comprimir y entregar

```powershell
$ver = "3-2"
Compress-Archive -Path "$entregas\FCS-$ver" `
                 -DestinationPath "$entregas\FCS-$ver.zip" `
                 -Force
Write-Host "Listo: $entregas\FCS-$ver.zip"
```

---

## Checklist rápido

```
[ ] 1. Version bump en .csproj, frmMain.cs, VersionCheckService.cs, home.html
[ ] 2. Logo splash actualizado y verificado visualmente
[ ] 3. CHANGELOG.md actualizado en el repo
[ ] 4. Build Release sin errores
[ ] 5. Carpeta FCS-X-Y creada con robocopy
[ ] 6. README.md limpiado en entrega
[ ] 7. CHANGELOG.md limpiado en entrega
[ ] 8. Verificación automática — todos [OK]
[ ] 9. Prueba de ejecución desde carpeta de entrega
[ ] 10. ZIP generado
```
