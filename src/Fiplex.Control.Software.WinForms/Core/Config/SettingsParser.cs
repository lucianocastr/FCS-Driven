using Fiplex.Control.Software.WinForms.Core.Config.Interfaces;
using Fiplex.Control.Software.WinForms.Models;
using Microsoft.Extensions.Logging;

namespace Fiplex.Control.Software.WinForms.Core.Config;

/// <summary>
/// Dual parser for device settings.cfg files.
/// Soporta AMBOS formatos:
/// 
/// ---GET---
/// /page	COMMAND	encode	length	noEncode	urlParams
/// ---POST---
/// /page	COMMAND	encode	waitResponse	noEncode
/// ---SaveCFG---
/// COMMAND1,COMMAND2	length	message	mode
/// 
/// NEW C# FORMAT (pipe-separated):
/// [GET:PageName]
/// Command|encode|length|message
/// </summary>
public class SettingsParser : ISettingsParser
{
    private readonly ILogger<SettingsParser> _logger;

    public SettingsParser(ILogger<SettingsParser> logger) 
        => _logger = logger;

    /// <summary>
    /// Parses settings.cfg file automatically detecting the format.
    /// </summary>
    public async Task<List<CommandDefinition>> ParseSettingsAsync(string filePath)
    {
        if (!File.Exists(filePath))
        {
            _logger.LogWarning("Settings file not found: {Path}", filePath);
            return new List<CommandDefinition>();
        }

        var content = await File.ReadAllTextAsync(filePath);
        
        // Detect format by presence of markers
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
    /// Also supports format "--- GET Commands", "--- POST Commands", etc.
    /// Fields separated by TAB.
    /// </summary>
    private Task<List<CommandDefinition>> ParseVbNetFormatAsync(string filePath, string content)
    {
        var commands = new List<CommandDefinition>();
        
        // Normalize line breaks
        content = content.Replace("\r\n", "\n");
        
        // Split by sections using ---
        var sections = content.Split(new[] { "---" }, StringSplitOptions.RemoveEmptyEntries);
        
        foreach (var section in sections)
        {
            var lines = section.Split('\n', StringSplitOptions.RemoveEmptyEntries);
            if (lines.Length == 0) continue;
            
            // First line is the section name
            // Can be: "GET---", "POST---", "GET Commands", "POST Commands", etc.
            var rawSectionName = lines[0].Trim().TrimEnd('-').ToUpperInvariant();
            
            // Extract only the keyword (first word)
            // "GET COMMANDS" -> "GET", "SAVECFG" -> "SAVECFG"
            var sectionName = rawSectionName.Split(' ', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault() ?? "";
            
            _logger.LogDebug("Processing section: '{RawName}' -> '{SectionName}'", rawSectionName, sectionName);
            
            // Process according to section type
            for (int i = 1; i < lines.Length; i++)
            {
                var line = lines[i].Trim();
                
                // Skip comments and empty lines
                if (string.IsNullOrWhiteSpace(line) || line.StartsWith("#") || line.StartsWith(";"))
                    continue;
                
                // Lines are separated by TAB
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
    /// Parses GET line:
    /// </summary>
    private CommandDefinition? ParseGetCommand(string[] parts)
    {
        if (parts.Length < 2) return null;
        
        var page = parts[0].Trim();
        var command = parts[1].Trim();
        
        // encode: "hex" o "ascii" o "0"/"1"
        var encodeStr = parts.Length > 2 ? parts[2].Trim().ToLowerInvariant() : "0";
        var hexEncoding = encodeStr == "hex" || encodeStr == "1";
        
        // length: can be number, "splitwith3tabs:N", or comma-separated list
        var lengthStr = parts.Length > 3 ? parts[3].Trim() : "";
        int expectedLength = ParseLength(lengthStr);
        
        // noEncode: parameters not to encode (optional)
        var noEncode = parts.Length > 4 ? parts[4].Trim() : "";
        
        // urlParams: expected URL parameters (optional)
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
        
        // waitResponse: "1" waits for response, "0" fire-and-forget
        var waitResponseStr = parts.Length > 3 ? parts[3].Trim() : "1";
        var waitResponse = waitResponseStr == "1";
        
        // noEncode: parameters not to encode (optional)
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
    /// Parses FILE line (SaveCFG, LoadCFG, SaveCAL, LoadCAL):
    /// COMMAND1,COMMAND2	length	message	mode
    /// 
    /// Example settings.cfg:
    /// ---SaveCFG---
    /// C1,F1,S1	splitwith3tabs:40	Saving configuration...	normal
    /// </summary>
    private CommandDefinition? ParseFileCommand(string[] parts, string sectionName)
    {
        if (parts.Length < 1) return null;
        
        // First field: commands separated by comma
        var commands = parts[0].Trim();
        
        // Second field: expected length (optional)
        var lengthStr = parts.Length > 1 ? parts[1].Trim() : "";
        
        // Third field: UI message (optional)
        var message = parts.Length > 2 ? parts[2].Trim() : "";
        
        // Fourth field: mode (optional)
        var mode = parts.Length > 3 ? parts[3].Trim() : "";
        
        // Map section name to FileOperationType string
        var operationType = sectionName switch
        {
            "SAVECFG" => "SaveCFG",
            "LOADCFG" => "LoadCFG",
            "SAVECAL" => "SaveCAL",
            "LOADCAL" => "LoadCAL",
            _ => sectionName
        };
        
        return new CommandDefinition(
            Page: operationType, // We use the operation type as identifier
            Command: commands,   // List of commands separated by comma
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
    /// Parses length string that can be:
    /// - Number: "128"
    /// - List: "128,256,512"
    /// - SplitWith3Tabs: "splitwith3tabs:40"
    /// - Empty: "" (no validation)
    /// </summary>
    private int ParseLength(string lengthStr)
    {
        if (string.IsNullOrWhiteSpace(lengthStr)) return -1;
        
        // SplitWith3Tabs format
        if (lengthStr.StartsWith("splitwith3tabs:", StringComparison.OrdinalIgnoreCase))
        {
            var countStr = lengthStr.Substring("splitwith3tabs:".Length);
            if (int.TryParse(countStr, out var count))
                return count * -1; // Negative indicates splitwith3tabs format
        }
        
        // List of lengths (take first)
        if (lengthStr.Contains(','))
        {
            var firstLen = lengthStr.Split(',')[0].Trim();
            if (int.TryParse(firstLen, out var len))
                return len;
        }
        
        // Simple number
        if (int.TryParse(lengthStr, out var length))
            return length;
        
        return -1;
    }

    /// <summary>
    /// Parses new C# format with [GET:PageName] sections.
    /// Fields separated by |.
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

            // Comments
            if (line.StartsWith("#") || line.StartsWith(";") || string.IsNullOrWhiteSpace(line))
                continue;

            // Section [PageName] or [GET:PageName], [POST:PageName]
            if (line.StartsWith("[") && line.EndsWith("]"))
            {
                var section = line.Trim('[', ']');
                
                // Detect explicit HTTP method
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

            // Command: Command|RequiresEncoding|LengthValidation|Message
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
