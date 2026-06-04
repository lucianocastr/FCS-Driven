# Propuesta — Sistema de Logging de Diagnóstico FCS
**Estado:** Borrador para revisión y especificación por parte de Fiplex  
**Fecha:** 20/05/2026  
**Versión objetivo:** FCS 3.4 (o siguiente entrega acordada)

---

## Contexto

Durante las sesiones de QA de campo se identificó la necesidad de un mecanismo de logging estructurado que permita al personal de Fiplex diagnosticar problemas remotamente, sin necesidad de estar presente en la instalación del cliente.

El FCS ya cuenta con dos sistemas de registro parciales:

| Sistema actual | Destino | Cobertura |
|---|---|---|
| `USBmessages_YYYYMMDD.txt` | `%APPDATA%\FiplexControlSoftware\` | Tráfico serial TX/RX |
| Log interno MEL | Consola / IDE (invisible en campo) | Todos los eventos de la app |

La propuesta unifica y extiende estos mecanismos en un log de diagnóstico configurable, accesible exclusivamente desde el menú factory.

---

## Propuesta técnica

### Archivo de salida

```
%APPDATA%\FiplexControlSoftware\FCSLog_YYYYMMDD.txt
```

- Un archivo por día, en el mismo directorio que `USBmessages_YYYYMMDD.txt`
- Fiplex ya conoce esta ruta por el workflow de diagnóstico serial existente
- Retención: últimos 7 días (los archivos más antiguos se eliminan automáticamente al iniciar la app)
- Formato legible como texto plano, sin herramientas especiales

### Formato de cada línea

```
2026-05-20 14:32:15.123 [INFO] Device connected — COM8 Signal Booster 2c/2.0
2026-05-20 14:32:15.789 [DBG ] SerialPipeline — Command enqueued: U1 (queue: 0)
2026-05-20 14:32:16.124 [DBG ] ACK ok (334ms) — U1
2026-05-20 14:32:16.125 [TRC ] Tx1 U1
2026-05-20 14:32:16.890 [TRC ] Rx1 1650 chars
2026-05-20 14:32:17.001 [INFO] Save from Device — completed (config.cfgr, 3174 bytes)
2026-05-20 14:32:45.010 [WARN] COM scan — port COM122 open timeout (4000ms), skipped
2026-05-20 14:32:46.200 [ERR ] Password change failed — device returned error bitmask
```

### Tres niveles de verbosidad

| Nivel | Prefijo | Qué registra |
|---|---|---|
| **Info** | `[INFO]` | Eventos de sesión: connect/disconnect, operaciones de usuario (save, load, password change), errores, advertencias de scan |
| **Debug** | `[DBG ]` | Todo lo anterior + cada comando serial procesado, tiempos de ACK, progreso de scan puerto a puerto, requests HTTP internos |
| **Trace** | `[TRC ]` | Todo lo anterior + payloads TX/RX completos (equivalente a fusionar `USBmessages` dentro del log general) |

### Activación desde menú factory

El nivel se controla mediante una tecla dentro del contexto de factory (después de activar el menú factory con la secuencia habitual). La propuesta es la tecla **`L`**, que cicla en orden:

```
Info  →  Debug  →  Trace  →  Info  →  ...
```

El nivel activo se muestra en la barra de título de la aplicación:

```
Fiplex Control Software v3.4.0  (Log: DEBUG)
```

El cliente no accede a esta funcionalidad — permanece dentro del menú factory.

### Privacidad y datos sensibles

Los siguientes datos **nunca aparecen** en el log, independientemente del nivel activo:

- Contraseñas del dispositivo (la línea `*0{password}` se registra como `*0[***]`)
- Claves de licencia
- Secuencias de acceso al menú factory

El contenido de los payloads de configuración (C0, U1, F0) sí aparece en nivel Trace, ya que es necesario para diagnóstico de protocolo.

### Arquitectura de implementación (resumen técnico)

La solución se apoya en la infraestructura de logging ya existente en el proyecto (`Microsoft.Extensions.Logging`). Se agrega un proveedor de archivo custom que captura todos los eventos internos de la aplicación sin modificar el código de lógica de negocio. El nivel activo se controla desde `frmMain.cs` mediante un objeto singleton thread-safe.

Archivos nuevos estimados: 3–4 clases pequeñas (~80 líneas en total).  
Archivos modificados: `Program.cs` (registro del proveedor) y `frmMain.cs` (tecla toggle).

---

## Decisiones que requieren especificación de Fiplex

A continuación se listan los puntos de diseño abiertos que necesitan validación antes de comenzar el desarrollo. Para cada punto se indica la opción recomendada y las alternativas.

---

### Decisión 1 — Nivel por defecto al iniciar la aplicación

**Pregunta:** ¿En qué nivel debe arrancar el FCS cuando el cliente lo usa normalmente?

| Opción | Descripción | Ventaja | Desventaja |
|---|---|---|---|
| **A — Info siempre activo** *(recomendada)* | El log se escribe desde el primer uso, sin que nadie lo active | Cuando Fiplex pide el log, ya hay historial desde la instalación | Genera un archivo diario aunque no haya problemas |
| B — Todo apagado por defecto | El log no se escribe hasta que Fiplex lo activa remotamente | Sin archivos innecesarios | Si el problema ocurrió antes de activarlo, no hay registro |

**Especificar:** ¿Opción A o B?

---

### Decisión 2 — Persistencia del nivel entre sesiones

**Pregunta:** Si Fiplex activa el modo Debug remotamente, ¿debe mantenerse al reiniciar la aplicación?

| Opción | Descripción |
|---|---|
| **A — No persiste** *(recomendada)* | Al cerrar y reabrir la app vuelve al nivel por defecto (Info) |
| B — Persiste en archivo de configuración | El nivel queda guardado en disco hasta que alguien lo cambie |

**Riesgo de opción B:** si el cliente tiene modo Trace activo indefinidamente, el archivo crece sin control.

**Especificar:** ¿Opción A o B?

---

### Decisión 3 — Relación con USBmessages (log serial actual)

**Pregunta:** ¿El log de diagnóstico debe convivir con `USBmessages_YYYYMMDD.txt` o reemplazarlo?

| Opción | Descripción |
|---|---|
| **A — Conviven separados** *(recomendada)* | `USBmessages` sigue igual. `FCSLog` agrega la capa de aplicación. Fiplex pide ambos según el tipo de problema |
| B — Fusionados en un solo archivo | Nivel Trace del `FCSLog` incluye el contenido de `USBmessages`. Un solo archivo para enviar |
| C — USBmessages queda deprecated | Se reemplaza completamente por el nivel Trace del nuevo log |

**Especificar:** ¿Cuál preferís?

---

### Decisión 4 — Retención de archivos

**Pregunta:** ¿Cuántos días de logs deben conservarse en el equipo del cliente?

| Opción | Días conservados | Tamaño estimado (nivel Info) |
|---|---|---|
| 7 días *(recomendado)* | Últimos 7 | ~100–200 KB total |
| 14 días | Últimos 14 | ~200–400 KB total |
| 30 días | Últimos 30 | ~500 KB – 1 MB total |
| Sin límite | Todos | Crece indefinidamente |

**Especificar:** ¿Cuántos días?

---

### Decisión 5 — Mecanismo para obtener los logs del cliente

**Pregunta:** ¿Cómo obtiene Fiplex el archivo de log del equipo del cliente?

| Opción | Descripción |
|---|---|
| **A — El cliente lo envía manualmente** | Fiplex le indica al cliente la ruta `%APPDATA%\FiplexControlSoftware\` y le pide que adjunte el archivo |
| B — Botón "Export Log" en factory menu | Desde el menú factory, un botón empaqueta los logs de los últimos N días en un ZIP y abre el explorador en esa ubicación |
| C — Acceso remoto al equipo del cliente | Fiplex accede directamente (TeamViewer, AnyDesk, etc.) y copia los archivos |

La opción B agrega funcionalidad de UI dentro del factory menu pero simplifica el proceso para el cliente.

**Especificar:** ¿Cuál es el workflow actual cuando Fiplex pide archivos al cliente?

---

### Decisión 6 — Cobertura del nivel Trace

**Pregunta:** En nivel Trace, ¿deben incluirse los payloads completos de configuración (U1, C0, F0)?

Estos payloads pueden contener hasta ~1650 caracteres de datos de configuración del dispositivo. Son necesarios para diagnosticar problemas de protocolo (como el caso #4 Clear EEPROM donde el payload correcto era determinante), pero aumentan significativamente el tamaño del archivo.

| Opción | Descripción |
|---|---|
| **A — Sí, payload completo en Trace** | Máxima información disponible para diagnóstico de protocolo |
| B — Solo primeros 80 chars del payload | Balance entre diagnóstico y tamaño de archivo |
| C — Solo longitud del payload (sin contenido) | `Rx1 1650 chars` — sin exponer datos de configuración |

**Especificar:** ¿Opción A, B o C?

---

## Resumen de preguntas para Fiplex

| # | Pregunta | Opciones |
|---|---|---|
| 1 | Nivel por defecto al iniciar | A (Info activo) / B (apagado) |
| 2 | ¿Persiste el nivel entre sesiones? | A (no persiste) / B (persiste) |
| 3 | Relación con USBmessages | A (conviven) / B (fusionados) / C (reemplaza) |
| 4 | Días de retención | 7 / 14 / 30 / sin límite |
| 5 | ¿Cómo obtienen los logs? | A (cliente envía) / B (botón Export) / C (acceso remoto) |
| 6 | Payloads en nivel Trace | A (completo) / B (80 chars) / C (solo longitud) |

---

## Estimación de esfuerzo

| Fase | Descripción | Estimación |
|---|---|---|
| Core logging | `AppLogLevelSwitch`, `AppFileLoggerProvider`, `AppFileLogger` | 1–2 horas |
| Integración DI | Registro en `Program.cs`, toggle en `frmMain.cs` | 30 min |
| Retención | Auto-delete de archivos viejos al iniciar | 30 min |
| Export ZIP (si Decisión 5 = B) | Botón en factory, empaquetado, abrir explorador | 1–2 horas adicionales |
| **Total sin Export** | | **~2–3 horas** |
| **Total con Export** | | **~4–5 horas** |

La estimación asume que las respuestas de Fiplex no implican cambios arquitecturales significativos respecto a esta propuesta.

---

*Documento preparado para revisión de Fiplex — pendiente de especificación en los puntos indicados.*
