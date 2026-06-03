# Guía de entrega — nueva versión al cliente

Ejecutar en orden. Cada paso debe completarse antes de pasar al siguiente.

---

## 0. Tipos de paquete (lectura obligatoria antes de ejecutar)

A partir de v3.5.0, el proceso reconoce **dos paquetes distintos** con propósitos no intercambiables. La auditoría operativa determinó que entregar al cliente un paquete fuente genera fricción (el cliente debe construir Release manualmente). Por lo tanto:

### SOURCE PACKAGE — `FCS-<VERSION>-source.zip`

| Campo | Definición |
|---|---|
| **Formato** | `FCS-<VERSION>-source.zip` (ej. `FCS-3-5-0-source.zip`) |
| **Contenido** | Repositorio fuente (`src/`), documentación pública (`README.md`, `CHANGELOG.md`, `docs/GUIA_LOGS_DIAGNOSTICO.*`), solución (`.sln`), artefactos de auditoría externos cuando corresponda |
| **NO incluye** | `.git/`, `bin/`, `obj/`, `.vs/`, `*.user`, `*.suo`, `docs/` internos del proyecto |
| **Uso autorizado** | Continuidad técnica · auditoría externa · soporte interno · respaldo legal/contractual |
| **Audiencia** | Interna · auditores · custodio del código · soporte L3 |

### DEPLOYMENT PACKAGE — `FCS-<VERSION>-deploy.zip`

| Campo | Definición |
|---|---|
| **Formato** | `FCS-<VERSION>-deploy.zip` (ej. `FCS-3-5-0-deploy.zip`) |
| **Contenido** | Únicamente artefactos ejecutables: `Fiplex.Control.Software.WinForms.exe`, DLLs, `*.deps.json`, `*.runtimeconfig.json`, `appsettings.json`, `Assets/`, `pages/`, `runtimes/win-*/native/` |
| **NO incluye** | Código fuente (`*.cs`), proyecto (`*.csproj`, `*.sln`), `src/`, `docs/`, `.git/`, `obj/`, `bin/Debug/`, `*.pdb`, `*.xml` de IntelliSense, `runtimes/{android,linux,osx,maccatalyst}-*/` |
| **Uso autorizado** | **Entrega operativa al cliente final** — único paquete válido para distribución productiva |
| **Audiencia** | Cliente · técnico de campo · operador en sitio |

### Regla de distribución (FORMAL)

> **PROHIBIDO** enviar al cliente el `SOURCE PACKAGE` como mecanismo estándar de distribución productiva.
>
> El cliente recibe exclusivamente el `DEPLOYMENT PACKAGE`. El `SOURCE PACKAGE` se entrega únicamente bajo solicitud explícita justificada (auditoría contractual, escrow, traspaso de propiedad intelectual) y con autorización del responsable del proyecto.

### Prerequisitos en máquina cliente (DEPLOYMENT PACKAGE)

El `DEPLOYMENT PACKAGE` es framework-dependent. El cliente debe tener instalados:

1. **.NET 10 Desktop Runtime** (`Microsoft.NETCore.App` + `Microsoft.WindowsDesktop.App` v10.0.0).
2. **Microsoft Edge WebView2 Runtime** (Evergreen Bootstrapper o ya presente en Windows 11).

Documentar ambos prerequisitos en `INSTALL.txt` dentro del ZIP de despliegue.

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

## 11. Comprimir SOURCE PACKAGE

> Este ZIP es el **SOURCE PACKAGE**. **NO** es el artefacto de entrega al cliente. Sigue al Paso 12.

```powershell
Compress-Archive -Path "$entregas\FCS-$ver" `
                 -DestinationPath "$entregas\FCS-$ver-source.zip" `
                 -Force
Write-Host "SOURCE PACKAGE listo: $entregas\FCS-$ver-source.zip"
```

---

## 12. Generar DEPLOYMENT PACKAGE (entregable al cliente)

Carpeta canónica de origen (build output funcional verificado en auditoría):

```
$repoRoot\src\Fiplex.Control.Software.WinForms\bin\Release\net10.0-windows\
```

El build output del Paso 5 es **suficiente** (clasificación de auditoría: `BUILD_OUTPUT_SUFFICIENT`). NO ejecutar `dotnet publish` salvo que un release futuro requiera cambiar la app a `<SelfContained>true</SelfContained>` o `<PublishSingleFile>true</PublishSingleFile>`, en cuyo caso reauditar.

### 12.1 Staging limpio

> ⚠️ **REGLA CRÍTICA DE FILTRADO DE `runtimes/`** (incidente v3.5.0 deployment package).
>
> El árbol `runtimes/` contiene **dos clases distintas** de subcarpetas:
>
> 1. **RID-genérico** (`win`, `unix`) — contiene **managed assemblies RID-specific** bajo `lib/net{TFM}/`. Ejemplo: `runtimes/win/lib/net10.0/System.IO.Ports.dll`. El runtime .NET resuelve estos vía `runtimeTargets` con `rid="win"` y `assetType="runtime"` declarado en `deps.json`. **Su ausencia provoca `FileNotFoundException` / `Could not load file or assembly System.IO.Ports, Version=X.Y.Z`** aunque exista un binario homónimo en la raíz (es un facade RID-agnóstico distinto).
> 2. **RID-arquitectura-específico** (`win-x64`, `win-x86`, `win-arm64`, `linux-x64`, `osx-arm64`, …) — contiene **native libraries** bajo `native/`. Ejemplo: `runtimes/win-x64/native/WebView2Loader.dll`.
>
> Para distribución Windows se conservan **ambos** árboles `win/` y `win-{arch}/`. Se eliminan únicamente los árboles RID-arquitectura-específicos de otras plataformas (`android-*`, `linux-*`, `osx-*`, `maccatalyst-*`) y el RID-genérico `unix` (sin impacto en Windows).
>
> Patrón correcto: preservar `^win$` y `^win-` (con guion). Eliminar todo lo demás.
> Patrón incorrecto (incidente v3.5.0): preservar solo `win-*` — esto elimina `runtimes/win/` y rompe la resolución de `System.IO.Ports`.

```powershell
$binRelease = "$repoRoot\src\Fiplex.Control.Software.WinForms\bin\Release\net10.0-windows"
$deployDir  = "$entregas\FCS-$ver-deploy"

if (Test-Path $deployDir) { Remove-Item $deployDir -Recurse -Force }
New-Item -ItemType Directory -Force $deployDir | Out-Null

# Copia base (sin runtimes para filtrar después)
robocopy $binRelease $deployDir /E `
    /XF "*.pdb" "Microsoft.Web.WebView2.Core.xml" "Microsoft.Web.WebView2.WinForms.xml" "Microsoft.Web.WebView2.Wpf.xml" `
    /NFL /NDL /NP /NJS /NJH | Out-Null

# Eliminar runtimes NO-Windows.
# CRÍTICO: preservar BOTH 'win' (RID-genérico, managed) Y 'win-*' (RID-arch, native).
# Elimina: android-*, linux-*, osx-*, maccatalyst-*, unix.
Get-ChildItem "$deployDir\runtimes" -Directory |
    Where-Object { $_.Name -ne 'win' -and $_.Name -notmatch '^win-' } |
    Remove-Item -Recurse -Force

# Verificación obligatoria: el managed Windows debe estar presente.
$winMgd = "$deployDir\runtimes\win\lib\net10.0\System.IO.Ports.dll"
if (-not (Test-Path $winMgd)) {
    throw "STAGING FAIL: $winMgd ausente. Filtrado de runtimes incorrecto."
}
```

### 12.2 Agregar INSTALL.txt con prerequisitos

```powershell
@"
Fiplex Control Software v$VERSION — Instalación

Prerequisitos:
1. .NET 10 Desktop Runtime
   https://dotnet.microsoft.com/download/dotnet/10.0
2. Microsoft Edge WebView2 Runtime (incluido en Windows 11)
   https://developer.microsoft.com/microsoft-edge/webview2/

Ejecución:
- Doble click sobre Fiplex.Control.Software.WinForms.exe

Soporte: BDAsystemsTS@honeywell.com
"@ | Out-File -FilePath "$deployDir\INSTALL.txt" -Encoding utf8
```

### 12.3 Validación del DEPLOYMENT PACKAGE

```powershell
$violations = @()

# (a) exe en raíz
if (-not (Test-Path "$deployDir\Fiplex.Control.Software.WinForms.exe")) {
    $violations += "FALTA exe en raíz"
}

# (b) Sin código fuente / proyecto
$forbidden = Get-ChildItem $deployDir -Recurse -File |
             Where-Object { $_.Extension -in '.cs','.csproj','.sln' }
if ($forbidden) { $violations += "Contiene archivos fuente: $($forbidden.Count)" }

# (c) Sin carpetas prohibidas
@('src','docs','.git','obj','.vs','bin') | ForEach-Object {
    if (Test-Path "$deployDir\$_") { $violations += "Carpeta prohibida: $_" }
}

# (d) Sin pdb/xml/runtimes no-Windows
$pdbs = Get-ChildItem $deployDir -Recurse -File -Filter "*.pdb"
if ($pdbs) { $violations += "Contiene .pdb: $($pdbs.Count)" }

$nonWin = Get-ChildItem "$deployDir\runtimes" -Directory -EA SilentlyContinue |
          Where-Object { $_.Name -ne 'win' -and $_.Name -notmatch '^win-' }
if ($nonWin) { $violations += "Runtimes no-Windows: $($nonWin.Name -join ',')" }

# (e) CRÍTICO: managed RID-specific Windows debe estar presente.
$mustExist = @(
    "$deployDir\runtimes\win\lib\net10.0\System.IO.Ports.dll",
    "$deployDir\runtimes\win-x64\native\WebView2Loader.dll"
)
foreach ($f in $mustExist) {
    if (-not (Test-Path $f)) { $violations += "FALTA archivo crítico runtime: $f" }
}

if ($violations.Count -eq 0) {
    Write-Host "[OK] DEPLOYMENT PACKAGE válido"
} else {
    Write-Host "[FAIL] Violaciones:"
    $violations | ForEach-Object { Write-Host "   - $_" }
}
```

### 12.4 Comprimir y publicar hash

```powershell
$deployZip = "$entregas\FCS-$ver-deploy.zip"

Compress-Archive -Path "$deployDir\*" -DestinationPath $deployZip -Force

$size = (Get-Item $deployZip).Length
$sha  = (Get-FileHash $deployZip -Algorithm SHA256).Hash

Write-Host "DEPLOYMENT PACKAGE: $deployZip"
Write-Host "  Tamaño: $([math]::Round($size/1MB, 2)) MB"
Write-Host "  SHA-256: $sha"
```

### 12.5 Smoke test en máquina limpia (recomendado)

Antes de entregar al cliente:

1. Copiar `FCS-$ver-deploy.zip` a una máquina sin .NET SDK pero con .NET 10 Desktop Runtime + WebView2 Runtime instalados.
2. Descomprimir el ZIP.
3. Doble click sobre `Fiplex.Control.Software.WinForms.exe`.
4. Verificar: app abre · login funciona · splash con versión correcta · scan COM lista dispositivos · footer `home.html` con versión correcta.

> Esta validación es **obligatoria** antes de entregar a un cliente productivo cuando se cambia versión mayor o menor. Para parches puntuales (X.Y.Z+1) puede sustituirse por validación en una sesión Windows distinta a la de desarrollo.

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
[ ] 11. SOURCE PACKAGE generado (FCS-X-Y-Z-source.zip) — uso interno / auditoría
[ ] 12. DEPLOYMENT PACKAGE generado (FCS-X-Y-Z-deploy.zip) — entregable al cliente
       [ ] exe en raíz · sin .cs/.csproj/.sln · sin src/docs/.git/obj/bin
       [ ] sin .pdb · sin .xml IntelliSense · sin runtimes no-Windows
       [ ] INSTALL.txt con prerequisitos (.NET 10 Desktop Runtime + WebView2 Runtime)
       [ ] SHA-256 calculado y publicado
       [ ] Smoke test en máquina limpia (PASS)
```

> **REGLA DE DISTRIBUCIÓN AL CLIENTE**: El cliente recibe **exclusivamente** `FCS-X-Y-Z-deploy.zip`. Enviar `FCS-X-Y-Z-source.zip` como mecanismo estándar de distribución productiva está **PROHIBIDO**.
