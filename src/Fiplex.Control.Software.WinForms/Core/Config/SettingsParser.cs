using Fiplex.Control.Software.WinForms.Core.Config.Interfaces;
using Fiplex.Control.Software.WinForms.Models;
using Microsoft.Extensions.Logging;

namespace Fiplex.Control.Software.WinForms.Core.Config;

/// <summary>
/// Parser dual de archivos settings.cfg del dispositivo.
/// Soporta AMBOS formatos:
/// 
/// ---GET---
/// /page	COMMAND	encode	length	noEncode	urlParams
/// ---POST---
/// /page	COMMAND	encode	waitResponse	noEncode
/// ---SaveCFG---
/// COMMAND1,COMMAND2	length	message	mode
/// 
/// FORMATO C# NUEVO (separado por |):
/// [GET:PageName]
/// Command|encode|length|message
/// </summary>
public class SettingsParser : ISettingsParser
{
    private readonly ILogger<SettingsParser> _logger;

    public SettingsParser(ILogger<SettingsParser> logger) 
        => _logger = logger;

    /// <summary>
    /// Parsea archivo settings.cfg detectando automáticamente el formato.
    /// </summary>
    public async Task<List<CommandDefinition>> ParseSettingsAsync(string filePath)
    {
        if (!File.Exists(filePath))
        {
            _logger.LogWarning("Settings file not found: {Path}", filePath);
            return new List<CommandDefinition>();
        }

        var content = await File.ReadAllTextAsync(filePath);
        
        // Detectar formato por presencia de marcadores
        if (content.Contains("---GET---") || content.Contains("---POST---"))
        {
            _logger.LogInformation("Detected legacy format in {Path}", filePath);
            return await ParseVbNetFormatAsync(filePath, content);
        }
        else if (content.Contains("[GET:") || content.Contains("[POST:") || content.Contains("["))
        {
            _logger.LogInformation("Detected C# new format in {Path}", filePath);
            return await ParseCSharpFormatAsync(filePath, content);
        }
        else
        {
            _logger.LogWarning("Unknown settings format in {Path}, trying legacy format", filePath);
            return await ParseVbNetFormatAsync(filePath, content);
        }
    }

    /// <summary>
    /// También soporta formato "--- GET Commands", "--- POST Commands", etc.
    /// Campos separados por TAB.
    /// </summary>
    private Task<List<CommandDefinition>> ParseVbNetFormatAsync(string filePath, string content)
    {
        var commands = new List<CommandDefinition>();
        
        // Normalizar saltos de línea
        content = content.Replace("\r\n", "\n");
        
        // Dividir por secciones usando ---
        var sections = content.Split(new[] { "---" }, StringSplitOptions.RemoveEmptyEntries);
        
        foreach (var section in sections)
        {
            var lines = section.Split('\n', StringSplitOptions.RemoveEmptyEntries);
            if (lines.Length == 0) continue;
            
            // Primera línea es el nombre de sección
            // Puede ser: "GET---", "POST---", "GET Commands", "POST Commands", etc.
            var rawSectionName = lines[0].Trim().TrimEnd('-').ToUpperInvariant();
            
            // Extraer solo la palabra clave (primera palabra)
            // "GET COMMANDS" -> "GET", "SAVECFG" -> "SAVECFG"
            var sectionName = rawSectionName.Split(' ', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault() ?? "";
            
            _logger.LogDebug("Procesando sección: '{RawName}' -> '{SectionName}'", rawSectionName, sectionName);
            
            // Procesar según tipo de sección
            for (int i = 1; i < lines.Length; i++)
            {
                var line = lines[i].Trim();
                
                // Saltar comentarios y líneas vacías
                if (string.IsNullOrWhiteSpace(line) || line.StartsWith("#") || line.StartsWith(";"))
                    continue;
                
                // Las líneas están separadas por TAB
                var parts = line.Split('\t');
                
                if (sectionName == "GET" && parts.Length >= 2)
                {
                    var cmd = ParseGetCommand(parts);
                    if (cmd != null)
                    {
                        commands.Add(cmd);
                        _logger.LogDebug("GET: {Page} -> {Command}", cmd.Page, cmd.Command);
                    }
                }
                else if (sectionName == "POST" && parts.Length >= 2)
                {
                    var cmd = ParsePostCommand(parts);
                    if (cmd != null)
                    {
                        commands.Add(cmd);
                        _logger.LogDebug("POST: {Page} -> {Command}", cmd.Page, cmd.Command);
                    }
                }
                else if ((sectionName == "SAVECFG" || sectionName == "LOADCFG" ||
                          sectionName == "SAVECAL" || sectionName == "LOADCAL") && parts.Length >= 1)
                {
                    var cmd = ParseFileCommand(parts, sectionName);
                    if (cmd != null)
                    {
                        commands.Add(cmd);
                        _logger.LogDebug("FILE ({Section}): {Command}", sectionName, cmd.Command);
                    }
                }
            }
        }
        
        _logger.LogInformation("Loaded {Count} commands from settings file", commands.Count);
        return Task.FromResult(commands);
    }

    /// <summary>
    /// Parsea línea GET:
    /// </summary>
    private CommandDefinition? ParseGetCommand(string[] parts)
    {
        if (parts.Length < 2) return null;
        
        var page = parts[0].Trim();
        var command = parts[1].Trim();
        
        // encode: "hex" o "ascii" o "0"/"1"
        var encodeStr = parts.Length > 2 ? parts[2].Trim().ToLowerInvariant() : "0";
        var hexEncoding = encodeStr == "hex" || encodeStr == "1";
        
        // length: puede ser número, "splitwith3tabs:N", o lista separada por comas
        var lengthStr = parts.Length > 3 ? parts[3].Trim() : "";
        int expectedLength = ParseLength(lengthStr);
        
        // noEncode: parámetros que no codificar (opcional)
        var noEncode = parts.Length > 4 ? parts[4].Trim() : "";
        
        // urlParams: parámetros URL esperados (opcional)
        var urlParams = parts.Length > 5 ? parts[5].Trim() : "";
        
        return new CommandDefinition(
            Page: page,
            Command: command,
            RequiresEncoding: hexEncoding,
            LengthValidation: lengthStr,
            Message: ""
        )
        {
            HttpMethod = "GET",
            ExpectedLength = expectedLength,
            HexEncoding = hexEncoding,
            WaitResponse = true,
            NoEncodeParams = noEncode,
            UrlParameters = urlParams
        };
    }

    /// <summary>
    /// /page	COMMAND	encode	waitResponse	noEncode
    /// </summary>
    private CommandDefinition? ParsePostCommand(string[] parts)
    {
        if (parts.Length < 2) return null;
        
        var page = parts[0].Trim();
        var command = parts[1].Trim();
        
        // encode: "hex" o "1"
        var encodeStr = parts.Length > 2 ? parts[2].Trim().ToLowerInvariant() : "0";
        var hexEncoding = encodeStr == "hex" || encodeStr == "1";
        
        // waitResponse: "1" espera respuesta, "0" fire-and-forget
        var waitResponseStr = parts.Length > 3 ? parts[3].Trim() : "1";
        var waitResponse = waitResponseStr == "1";
        
        // noEncode: parámetros que no codificar (opcional)
        var noEncode = parts.Length > 4 ? parts[4].Trim() : "";
        
        return new CommandDefinition(
            Page: page,
            Command: command,
            RequiresEncoding: hexEncoding,
            LengthValidation: "",
            Message: ""
        )
        {
            HttpMethod = "POST",
            ExpectedLength = -1,
            HexEncoding = hexEncoding,
            WaitResponse = waitResponse,
            NoEncodeParams = noEncode
        };
    }

    /// <summary>
    /// Parsea línea FILE (SaveCFG, LoadCFG, SaveCAL, LoadCAL):
    /// COMMAND1,COMMAND2	length	message	mode
    /// 
    /// Ejemplo settings.cfg:
    /// ---SaveCFG---
    /// C1,F1,S1	splitwith3tabs:40	Saving configuration...	normal
    /// </summary>
    private CommandDefinition? ParseFileCommand(string[] parts, string sectionName)
    {
        if (parts.Length < 1) return null;
        
        // Primer campo: comandos separados por coma
        var commands = parts[0].Trim();
        
        // Segundo campo: longitud esperada (opcional)
        var lengthStr = parts.Length > 1 ? parts[1].Trim() : "";
        
        // Tercer campo: mensaje UI (opcional)
        var message = parts.Length > 2 ? parts[2].Trim() : "";
        
        // Cuarto campo: modo (opcional)
        var mode = parts.Length > 3 ? parts[3].Trim() : "";
        
        // Mapear nombre de sección a FileOperationType string
        var operationType = sectionName switch
        {
            "SAVECFG" => "SaveCFG",
            "LOADCFG" => "LoadCFG",
            "SAVECAL" => "SaveCAL",
            "LOADCAL" => "LoadCAL",
            _ => sectionName
        };
        
        return new CommandDefinition(
            Page: operationType, // Usamos el tipo de operación como identificador
            Command: commands,   // Lista de comandos separados por coma
            RequiresEncoding: false,
            LengthValidation: lengthStr,
            Message: message
        )
        {
            HttpMethod = "FILE",
            ExpectedLength = ParseLength(lengthStr),
            HexEncoding = false,
            WaitResponse = true,
            FileMode = mode
        };
    }

    /// <summary>
    /// Parsea string de longitud que puede ser:
    /// - Número: "128"
    /// - Lista: "128,256,512"
    /// - SplitWith3Tabs: "splitwith3tabs:40"
    /// - Vacío: "" (sin validación)
    /// </summary>
    private int ParseLength(string lengthStr)
    {
        if (string.IsNullOrWhiteSpace(lengthStr)) return -1;
        
        // SplitWith3Tabs format
        if (lengthStr.StartsWith("splitwith3tabs:", StringComparison.OrdinalIgnoreCase))
        {
            var countStr = lengthStr.Substring("splitwith3tabs:".Length);
            if (int.TryParse(countStr, out var count))
                return count * -1; // Negativo indica formato splitwith3tabs
        }
        
        // Lista de longitudes (tomar primera)
        if (lengthStr.Contains(','))
        {
            var firstLen = lengthStr.Split(',')[0].Trim();
            if (int.TryParse(firstLen, out var len))
                return len;
        }
        
        // Número simple
        if (int.TryParse(lengthStr, out var length))
            return length;
        
        return -1;
    }

    /// <summary>
    /// Parsea formato C# nuevo con secciones [GET:PageName].
    /// Campos separados por |.
    /// </summary>
    private Task<List<CommandDefinition>> ParseCSharpFormatAsync(string filePath, string content)
    {
        var commands = new List<CommandDefinition>();
        var lines = content.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);

        string? currentPage = null;
        string currentMethod = "GET";

        foreach (var rawLine in lines)
        {
            var line = rawLine.Trim();

            // Comentarios
            if (line.StartsWith("#") || line.StartsWith(";") || string.IsNullOrWhiteSpace(line))
                continue;

            // Sección [PageName] o [GET:PageName], [POST:PageName]
            if (line.StartsWith("[") && line.EndsWith("]"))
            {
                var section = line.Trim('[', ']');
                
                // Detectar método HTTP explícito
                if (section.Contains(':'))
                {
                    var sectionParts = section.Split(':', 2);
                    currentMethod = sectionParts[0].Trim().ToUpperInvariant();
                    currentPage = sectionParts[1].Trim();
                }
                else
                {
                    currentPage = section;
                    currentMethod = "GET";
                }
                
                _logger.LogDebug("Found section: {Method} {Page}", currentMethod, currentPage);
                continue;
            }

            // Comando: Command|RequiresEncoding|LengthValidation|Message
            if (currentPage != null && line.Contains('|'))
            {
                var parts = line.Split('|');
                if (parts.Length >= 3)
                {
                    var command = parts[0].Trim();
                    var requiresEncoding = parts[1].Trim() == "1";
                    var lengthValidation = parts[2].Trim();
                    var message = parts.Length > 3 ? parts[3].Trim() : string.Empty;

                    int expectedLength = ParseLength(lengthValidation);

                    var commandDef = new CommandDefinition(
                        Page: currentPage,
                        Command: command,
                        RequiresEncoding: requiresEncoding,
                        LengthValidation: lengthValidation,
                        Message: message
                    )
                    {
                        HttpMethod = currentMethod,
                        ExpectedLength = expectedLength,
                        HexEncoding = requiresEncoding,
                        WaitResponse = currentMethod == "POST"
                    };

                    commands.Add(commandDef);
                }
            }
        }

        _logger.LogInformation("Parsed {Count} commands from C# format {Path}", commands.Count, filePath);
        return Task.FromResult(commands);
    }
}
