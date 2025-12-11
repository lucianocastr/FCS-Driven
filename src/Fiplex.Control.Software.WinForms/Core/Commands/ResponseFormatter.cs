using Microsoft.Extensions.Logging;

namespace Fiplex.Control.Software.WinForms.Core.Commands;

/// <summary>
/// Formatea respuestas seriales según especificaciones de settings.cfg
/// Implementa formato "splitwith3tabs" para compatibilidad con frontend JavaScript
/// 
/// Algunos dispositivos (1c5.2, etc.) ya envían la respuesta CON los triple tabs y datos de remotes.
/// En ese caso, NO debemos reformatear - solo pasar la respuesta tal cual.
/// Otros dispositivos (5dm1, etc.) envían solo datos del master y requieren que agreguemos
/// los frames de remotes vacíos.
/// </summary>
public class ResponseFormatter
{
    private readonly ILogger<ResponseFormatter> _logger;
    
    // Separador triple tab usado en protocolo Fiplex
    private const string TripleTab = "\t\t\t";

    public ResponseFormatter(ILogger<ResponseFormatter> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Aplica formato splitwith3tabs a respuesta hex raw.
    /// Formato esperado por JavaScript: frames separados por "\t\t\t", cada frame con estructura interna separada por "\t"
    /// Para global_conf (U1): Master + 8 Remotes
    /// 
    /// - Si la respuesta YA contiene triple tabs, el dispositivo ya formateó → pasar sin modificar
    /// - Si la respuesta NO contiene triple tabs pero tiene datos extra al final (IDs de remotes),
    ///   extraer esos datos y formatear correctamente
    /// - Solo generar "0000" para remotes cuando el dispositivo no envió información de remotes
    /// </summary>
    /// <param name="rawResponse">Respuesta hex completa del dispositivo</param>
    /// <param name="lengthSpec">Especificación de formato (ej: "splitwith3tabs:3104,2870,2528,4")</param>
    /// <param name="nrOfRemotes">Número de dispositivos remotos (típicamente 8)</param>
    /// <returns>Respuesta formateada con separadores de tabuladores</returns>
    public string FormatResponse(string rawResponse, string lengthSpec, int nrOfRemotes = 8)
    {
        if (string.IsNullOrEmpty(rawResponse))
        {
            _logger.LogWarning("FormatResponse: respuesta vacía");
            return rawResponse;
        }

        if (!lengthSpec.StartsWith("splitwith3tabs:", StringComparison.OrdinalIgnoreCase))
        {
            // No requiere formato especial
            return rawResponse;
        }
        if (rawResponse.Contains(TripleTab))
        {
            _logger.LogDebug("FormatResponse: Respuesta ya contiene triple tabs - preservando formato original");
            return rawResponse;
        }

        try
        {
            // Parse: "splitwith3tabs:3104,2870,2528,4" -> [3104, 2870, 2528, 4]
            // Donde: masterLen, remoteLen1, remoteLen2, headerLen
            var specParts = lengthSpec.Substring("splitwith3tabs:".Length).Split(',');
            if (specParts.Length < 1)
            {
                _logger.LogError("FormatResponse: spec inválida, se esperan al menos 1 valor: {LengthSpec}", lengthSpec);
                return rawResponse;
            }

            int expectedMasterLength = int.Parse(specParts[0]);
            
            // Longitud de cada ID de remote (típicamente 4 chars hex: "0100", "0200", etc.)
            const int remoteIdLength = 4;
            int expectedTotalWithRemotes = expectedMasterLength + (nrOfRemotes * remoteIdLength);

            _logger.LogDebug("FormatResponse: Respuesta raw={RawLen} chars, esperado master={Expected}, con remotes={TotalExpected}",
                rawResponse.Length, expectedMasterLength, expectedTotalWithRemotes);

            var frames = new List<string>();

            // Frame 0: Master
            string masterFrame = rawResponse.Length >= expectedMasterLength 
                ? rawResponse.Substring(0, expectedMasterLength)
                : rawResponse;
            
            frames.Add(masterFrame);
            _logger.LogDebug("FormatResponse: Master frame ({Length} chars)", masterFrame.Length);
            // Algunos dispositivos envían: [master data][0100][0200][0300]...[0800]
            // En lugar de enviar con tabs como: [master]\t\t\t[remote1]\t\t\t[remote2]...
            if (rawResponse.Length >= expectedTotalWithRemotes)
            {
                // El dispositivo incluyó los IDs de remotes - extraerlos
                _logger.LogDebug("FormatResponse: Dispositivo incluyó IDs de remotes al final");
                
                int remoteDataStart = expectedMasterLength;
                for (int i = 0; i < nrOfRemotes; i++)
                {
                    int startPos = remoteDataStart + (i * remoteIdLength);
                    if (startPos + remoteIdLength <= rawResponse.Length)
                    {
                        string remoteId = rawResponse.Substring(startPos, remoteIdLength);
                        frames.Add(remoteId);
                        _logger.LogDebug("FormatResponse: Remote {Index} ID: {RemoteId}", i + 1, remoteId);
                    }
                    else
                    {
                        frames.Add("0000"); // Fallback si no hay suficientes datos
                        _logger.LogDebug("FormatResponse: Remote {Index} frame (sin datos, usando 0000)", i + 1);
                    }
                }
            }
            else
            {
                // El dispositivo NO incluyó datos de remotes - generar frames vacíos
                // Esto es típico cuando no hay remotes conectados
                _logger.LogDebug("FormatResponse: Dispositivo no incluyó IDs de remotes, generando frames vacíos");
                
                for (int i = 0; i < nrOfRemotes; i++)
                {
                    // Header de 4 caracteres hex: "0000" = no conectado
                    // El JavaScript verifica substring(2,4) == "01" para marcar como conectado
                    frames.Add("0000");
                    _logger.LogDebug("FormatResponse: Remote {Index} frame (vacío/desconectado)", i + 1);
                }
            }

            // Unir frames con triple tab
            string formatted = string.Join(TripleTab, frames);
            
            _logger.LogInformation("FormatResponse: {FrameCount} frames formateados ({TotalChars} chars -> {FormattedChars} chars)",
                frames.Count, rawResponse.Length, formatted.Length);

            return formatted;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "FormatResponse: Error aplicando splitwith3tabs a respuesta de {Length} chars", rawResponse.Length);
            return rawResponse; // Fallback: retornar sin formatear
        }
    }
}
