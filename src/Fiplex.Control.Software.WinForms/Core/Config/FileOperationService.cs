using System.Diagnostics;
using System.Text;
using Fiplex.Control.Software.WinForms.Core.Config.Interfaces;
using Fiplex.Control.Software.WinForms.Core.Serial.Interfaces;
using Fiplex.Control.Software.WinForms.Core.Serial.Models;
using Microsoft.Extensions.Logging;

namespace Fiplex.Control.Software.WinForms.Core.Config;

/// <summary>
/// Implementation of the file operations service.
/// Executes command sequences for SaveCFG, LoadCFG, SaveCAL, LoadCAL.
///
/// - Uses saveCfgCommands[], loadCfgCommands[], saveCalCommands[], loadCalCommands[]
/// - Functions mnuSaveConfig_Click, mnuLoadConfig_Click, mnuSaveCal_Click, mnuLoadCal_Click
/// - Function LoadCal(fname As String) for calibration loading
/// </summary>
public class FileOperationService : IFileOperationService
{
    private readonly ISerialCommandPipeline _serialPipeline;
    private readonly ILogger<FileOperationService> _logger;
    private static readonly TimeSpan CommandTimeout = TimeSpan.FromSeconds(40);
    private static readonly TimeSpan AckTimeout = TimeSpan.FromMilliseconds(800);
    private const string AckResponse = "ACK";
    private const string NackResponse = "NACK";
    
    // Delimiter of 3 consecutive tabs for splitwith3tabs
    private static readonly string ThreeTabsDelimiter = "\t\t\t";
    private const string ModeSplitTabCfg = "splittabcfg";     // 24 remote devices
    private const string ModeSplitTabTag = "splittabtag";     // 3 expansions + 24 remotes (tags)
    private const string ModeSplitTabThr = "splittabthr";     // Thresholds with default values
    
    // Number of remote devices and expansions
    private const int NumRemoteDevices = 24;
    private const int NumExpansionDevices = 3;
    private const int TagLength = 30;
    
    // Default threshold values
    private const string DefaultExpansionThreshold = "E702E702E702E702E702E702E702E702500A";
    private const string DefaultRemoteThreshold = "2202500AE702E702CE02CE02";
    
    // Zero padding for absent remotes in splittabcfg (162 characters)
    private static readonly string ZeroPadding = new('0', 162);

    public FileOperationService(
        ISerialCommandPipeline serialPipeline,
        ILogger<FileOperationService> logger)
    {
        _serialPipeline = serialPipeline ?? throw new ArgumentNullException(nameof(serialPipeline));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <inheritdoc/>
    public Task<FileOperationResult> SaveConfigurationAsync(
        string filePath,
        IEnumerable<FileOperationCommand> commands,
        IProgress<FileOperationProgress>? progress = null,
        CancellationToken ct = default)
    {
        return ExecuteFileOperationAsync(FileOperationType.SaveConfig, filePath, commands, progress, ct);
    }

    /// <inheritdoc/>
    public Task<FileOperationResult> LoadConfigurationAsync(
        string filePath,
        IEnumerable<FileOperationCommand> commands,
        IProgress<FileOperationProgress>? progress = null,
        CancellationToken ct = default)
    {
        return ExecuteFileOperationAsync(FileOperationType.LoadConfig, filePath, commands, progress, ct);
    }

    /// <inheritdoc/>
    public Task<FileOperationResult> SaveCalibrationAsync(
        string filePath,
        IEnumerable<FileOperationCommand> commands,
        IProgress<FileOperationProgress>? progress = null,
        CancellationToken ct = default)
    {
        return ExecuteFileOperationAsync(FileOperationType.SaveCalibration, filePath, commands, progress, ct);
    }

    /// <inheritdoc/>
    public Task<FileOperationResult> LoadCalibrationAsync(
        string filePath,
        IEnumerable<FileOperationCommand> commands,
        IProgress<FileOperationProgress>? progress = null,
        CancellationToken ct = default)
    {
        return ExecuteFileOperationAsync(FileOperationType.LoadCalibration, filePath, commands, progress, ct);
    }

    /// <inheritdoc/>
    public async Task<FileOperationResult> ExecuteFileOperationAsync(
        FileOperationType operationType,
        string filePath,
        IEnumerable<FileOperationCommand> commands,
        IProgress<FileOperationProgress>? progress = null,
        CancellationToken ct = default)
    {
        var stopwatch = Stopwatch.StartNew();
        var commandList = commands.ToList();
        var responses = new Dictionary<string, string>();
        var executedCount = 0;

        _logger.LogInformation(
            "Starting file operation {OperationType} with {CommandCount} command groups, file: {FilePath}",
            operationType, commandList.Count, filePath);

        try
        {
            // Validate that there are commands
            if (!commandList.Any())
            {
                _logger.LogWarning("No commands provided for {OperationType}", operationType);
                return FileOperationResult.Failed("No commands defined for this operation", 0, 0);
            }

            // Calculate total individual commands
            var totalIndividualCommands = commandList.Sum(c => c.Commands.Length);
            var currentCommandIndex = 0;

            // For load operations, read and validate file first
            string[]? fileDataLines = null;
            if (operationType == FileOperationType.LoadConfig || 
                operationType == FileOperationType.LoadCalibration)
            {
                if (!File.Exists(filePath))
                {
                    _logger.LogError("File not found for load operation: {FilePath}", filePath);
                    return FileOperationResult.Failed($"File not found: {filePath}", 0, totalIndividualCommands);
                }
                
                var fileContent = await File.ReadAllTextAsync(filePath, ct);
                _logger.LogDebug("Loaded file content: {Length} bytes", fileContent.Length);
                var normalizedContent = fileContent.Replace("\r\n", "\n").Replace("\r", "\n");
                fileDataLines = normalizedContent.Split('\n', StringSplitOptions.RemoveEmptyEntries);
                // The number of lines in the file must match the number of commands
                if (operationType == FileOperationType.LoadCalibration)
                {
                    if (fileDataLines.Length != commandList.Count)
                    {
                        var errorMsg = $"File not valid. Wrong number of CAL frames. Expected {commandList.Count}, found {fileDataLines.Length}";
                        _logger.LogError(errorMsg);
                        return FileOperationResult.Failed(errorMsg, 0, totalIndividualCommands);
                    }
                    _logger.LogDebug("Calibration file validation passed: {Count} frames", fileDataLines.Length);
                }
                if (operationType == FileOperationType.LoadConfig)
                {
                    if (fileDataLines.Length != commandList.Count)
                    {
                        var errorMsg = $"File not valid. Wrong number of CFG frames. Expected {commandList.Count}, found {fileDataLines.Length}";
                        _logger.LogError(errorMsg);
                        return FileOperationResult.Failed(errorMsg, 0, totalIndividualCommands);
                    }
                    _logger.LogDebug("Configuration file validation passed: {Count} frames", fileDataLines.Length);
                }
            }

            // Prepare StringBuilder for save operations
            StringBuilder? saveContent = null;
            if (operationType == FileOperationType.SaveConfig || 
                operationType == FileOperationType.SaveCalibration)
            {
                saveContent = new StringBuilder();
            }
            
            // For LoadCAL: Cancel pending commands before starting
            if (operationType == FileOperationType.LoadCalibration)
            {
                _serialPipeline.CancelPendingCommands();
                _logger.LogDebug("Cleared pending commands before LoadCalibration");
            }

            // Execute each command group
            var commandIndex = 0;
            foreach (var cmdGroup in commandList)
            {
                ct.ThrowIfCancellationRequested();

                _logger.LogDebug(
                    "Executing command group {Index}: {Commands}, Message: {Message}",
                    commandIndex, string.Join(",", cmdGroup.Commands), cmdGroup.Message);

                // Report progress with group message
                progress?.Report(new FileOperationProgress
                {
                    CurrentCommand = currentCommandIndex,
                    TotalCommands = totalIndividualCommands,
                    CurrentCommandName = string.Join(",", cmdGroup.Commands),
                    Message = cmdGroup.Message
                });
                if (operationType == FileOperationType.LoadCalibration && fileDataLines != null)
                {
                    var loadResult = await ExecuteLoadCalibrationCommandAsync(
                        cmdGroup, fileDataLines[commandIndex], commandIndex, ct);
                    
                    if (!loadResult.Success)
                    {
                        stopwatch.Stop();
                        return FileOperationResult.Failed(
                            loadResult.ErrorMessage ?? "Error sending calibration",
                            executedCount,
                            totalIndividualCommands);
                    }
                    
                    executedCount++;
                    commandIndex++;
                    continue;
                }
                
                // For configuration load operations, use specific logic with retry
                if (operationType == FileOperationType.LoadConfig && fileDataLines != null)
                {
                    var loadResult = await ExecuteLoadConfigurationCommandAsync(
                        cmdGroup, fileDataLines[commandIndex], commandIndex, ct);
                    
                    if (!loadResult.Success)
                    {
                        stopwatch.Stop();
                        return FileOperationResult.Failed(
                            loadResult.ErrorMessage ?? "Error sending configuration",
                            executedCount,
                            totalIndividualCommands);
                    }
                    
                    executedCount++;
                    commandIndex++;
                    continue;
                }

                // For SaveCAL, use specific logic with NACK retry
                if (operationType == FileOperationType.SaveCalibration)
                {
                    var saveResult = await ExecuteSaveCalibrationCommandAsync(cmdGroup, ct);
                    
                    if (!saveResult.Success)
                    {
                        stopwatch.Stop();
                        return FileOperationResult.Failed(
                            saveResult.ErrorMessage ?? "Error saving calibration",
                            executedCount,
                            totalIndividualCommands);
                    }
                    
                    // Add response to file
                    if (saveContent != null && !string.IsNullOrEmpty(saveResult.Data))
                    {
                        saveContent.Append(saveResult.Data);
                        saveContent.Append('\n'); // vbLf
                    }
                    
                    responses[string.Join(",", cmdGroup.Commands)] = saveResult.Data ?? string.Empty;
                    executedCount++;
                    commandIndex++;
                    continue;
                }
                
                // For SaveConfig with special modes (splittabcfg, splittabtag, splittabthr)
                if (operationType == FileOperationType.SaveConfig)
                {
                    var saveResult = await ExecuteSaveConfigurationCommandAsync(
                        cmdGroup, saveContent!, filePath, ct);
                    
                    if (!saveResult.Success)
                    {
                        stopwatch.Stop();
                        return FileOperationResult.Failed(
                            saveResult.ErrorMessage ?? "Error saving configuration",
                            executedCount,
                            totalIndividualCommands);
                    }
                    
                    // Lines were already added by the specific method
                    if (saveResult.ResponseLines != null)
                    {
                        foreach (var line in saveResult.ResponseLines)
                        {
                            responses[$"{cmdGroup.Commands.FirstOrDefault()}_{responses.Count}"] = line;
                        }
                    }
                    
                    executedCount++;
                    commandIndex++;
                    continue;
                }

                // Execute each individual command in the group (generic fallback logic)
                foreach (var serialCommand in cmdGroup.Commands)
                {
                    ct.ThrowIfCancellationRequested();
                    currentCommandIndex++;

                    if (string.IsNullOrWhiteSpace(serialCommand))
                        continue;

                    var commandToSend = serialCommand.Trim();

                    // For configuration load operations, add data from file
                    if (fileDataLines != null && operationType == FileOperationType.LoadConfig)
                    {
                        var dataLine = ExtractDataForConfigCommand(fileDataLines, commandToSend);
                        if (!string.IsNullOrEmpty(dataLine))
                        {
                            commandToSend = $"{commandToSend}{dataLine}";
                        }
                    }

                    _logger.LogDebug("Sending command: {Command}", commandToSend);

                    // Execute serial command
                    var result = await ExecuteSerialCommandAsync(commandToSend, cmdGroup.LengthValidation, ct);

                    if (!result.Success)
                    {
                        _logger.LogError(
                            "Command {Command} failed: {Status}",
                            serialCommand, result.Status);

                        stopwatch.Stop();
                        return FileOperationResult.Failed(
                            $"Command {serialCommand} failed: {result.Status}",
                            executedCount,
                            totalIndividualCommands);
                    }

                    // Save response
                    responses[serialCommand] = result.Data;
                    executedCount++;

                    // For SaveConfig, add response with COMMAND=DATA format
                    if (saveContent != null && !string.IsNullOrEmpty(result.Data))
                    {
                        saveContent.AppendLine($"{serialCommand}={result.Data}");
                    }

                    _logger.LogDebug(
                        "Command {Command} succeeded: {ResponseLength} chars",
                        serialCommand, result.Data?.Length ?? 0);

                    // Small delay between commands 
                    await Task.Delay(50, ct);
                }
                
                commandIndex++;
            }

            // Save file if it's a save operation
            if (saveContent != null)
            {
                var directory = Path.GetDirectoryName(filePath);
                if (!string.IsNullOrEmpty(directory) && !Directory.Exists(directory))
                {
                    Directory.CreateDirectory(directory);
                }
                // For compatibility, save without BOM
                await File.WriteAllTextAsync(filePath, saveContent.ToString(), new UTF8Encoding(false), ct);
                _logger.LogInformation("Saved file to {FilePath}", filePath);
            }

            stopwatch.Stop();

            _logger.LogInformation(
                "File operation {OperationType} completed successfully: {Executed}/{Total} commands in {Duration}ms",
                operationType, executedCount, totalIndividualCommands, stopwatch.ElapsedMilliseconds);

            return FileOperationResult.Successful(
                executedCount,
                totalIndividualCommands,
                stopwatch.Elapsed,
                responses);
        }
        catch (OperationCanceledException)
        {
            _logger.LogWarning("File operation {OperationType} cancelled", operationType);
            stopwatch.Stop();
            return FileOperationResult.Failed("Operation cancelled", executedCount, commandList.Sum(c => c.Commands.Length));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during file operation {OperationType}", operationType);
            stopwatch.Stop();
            return FileOperationResult.Failed(ex.Message, executedCount, commandList.Sum(c => c.Commands.Length));
        }
    }
    
    /// <summary>
    /// Executes a load calibration command.
    /// </summary>
    private async Task<CalibrationCommandResult> ExecuteLoadCalibrationCommandAsync(
        FileOperationCommand cmdGroup,
        string fileDataLine,
        int frameIndex,
        CancellationToken ct)
    {
        // Validate frame length before sending
        if (!string.IsNullOrEmpty(cmdGroup.LengthValidation) && 
            !ValidateResponseLength(fileDataLine, cmdGroup.LengthValidation))
        {
            var errorMsg = $"File not valid. Wrong CAL frame length at frame {frameIndex}";
            _logger.LogError(errorMsg);
            return new CalibrationCommandResult(false, null, errorMsg);
        }
        
        // Cancel pending commands before each send
        _serialPipeline.CancelPendingCommands();
        
        // Concatenate command + data from file
        var primaryCommand = cmdGroup.Commands.FirstOrDefault();
        if (string.IsNullOrEmpty(primaryCommand))
        {
            return new CalibrationCommandResult(false, null, "No command defined for calibration frame");
        }
        
        var fullCommand = $"{primaryCommand}{fileDataLine}";
        _logger.LogDebug("LoadCal sending: {Command}", fullCommand);
        
        var serialCmd = new SerialCommand
        {
            Payload = fullCommand,
            ExpectsAck = true,
            ExpectsData = true,
            AckTimeout = AckTimeout,
            DataTimeout = CommandTimeout,
            MaxRetries = 1,
            CancellationToken = ct
        };
        
        var result = await _serialPipeline.EnqueueCommandAsync(serialCmd);
        
        // Verify ACK response
        if (!result.Success || !result.Data.Equals(AckResponse, StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogError("LoadCal frame {Index} failed: expected ACK, got {Response}", 
                frameIndex, result.Data);
            return new CalibrationCommandResult(false, result.Data, "Error sending calibration");
        }
        
        _logger.LogDebug("LoadCal frame {Index} succeeded with ACK", frameIndex);
        return new CalibrationCommandResult(true, result.Data, null);
    }
    
    /// <summary>
    /// Executes a save calibration command with NACK retry.
    /// </summary>
    private async Task<CalibrationCommandResult> ExecuteSaveCalibrationCommandAsync(
        FileOperationCommand cmdGroup,
        CancellationToken ct)
    {
        // nc = 0
        // Do
        //     anscmds(i) = GetUSBAnswer(saveCalCommands(i).command_Renamed(nc))
        //     nc = nc + 1
        // Loop While (anscmds(i) = "NACK" And nc <= UBound(saveCalCommands(i).command_Renamed))
        
        string? lastResponse = null;
        
        for (int cmdIndex = 0; cmdIndex < cmdGroup.Commands.Length; cmdIndex++)
        {
            var command = cmdGroup.Commands[cmdIndex];
            if (string.IsNullOrWhiteSpace(command))
                continue;
                
            _logger.LogDebug("SaveCal trying command variant {Index}: {Command}", cmdIndex, command);
            
            var serialCmd = new SerialCommand
            {
                Payload = command.Trim(),
                ExpectsAck = true,
                ExpectsData = true,
                AckTimeout = AckTimeout,
                DataTimeout = CommandTimeout,
                MaxRetries = 1,
                CancellationToken = ct
            };
            
            var result = await _serialPipeline.EnqueueCommandAsync(serialCmd);
            lastResponse = result.Data;
            
            // If not NACK, exit the loop (success or different error)
            if (!result.Data.Equals(NackResponse, StringComparison.OrdinalIgnoreCase))
            {
                // Validate response length
                if (!string.IsNullOrEmpty(cmdGroup.LengthValidation) &&
                    !ValidateResponseLength(result.Data, cmdGroup.LengthValidation))
                {
                    _logger.LogError("SaveCal response length validation failed for command {Command}", command);
                    return new CalibrationCommandResult(false, result.Data, "Error saving");
                }
                
                _logger.LogDebug("SaveCal command succeeded: {Response}", result.Data);
                return new CalibrationCommandResult(true, result.Data, null);
            }
            
            _logger.LogWarning("SaveCal got NACK for command {Command}, trying next variant", command);
        }
        
        // If we reach here, all commands returned NACK
        _logger.LogError("SaveCal all command variants returned NACK");
        return new CalibrationCommandResult(false, lastResponse, "Error saving - all commands returned NACK");
    }

    /// <summary>
    /// Executes an individual serial command with retries.
    /// </summary>
    private async Task<SerialResult> ExecuteSerialCommandAsync(
        string command,
        string lengthValidation,
        CancellationToken ct)
    {
        const int maxRetries = 3;
        SerialResult? lastResult = null;

        for (int attempt = 1; attempt <= maxRetries; attempt++)
        {
            var serialCmd = new SerialCommand
            {
                Payload = command,
                ExpectsAck = true,
                ExpectsData = true,
                AckTimeout = AckTimeout,
                DataTimeout = CommandTimeout,
                MaxRetries = 1,
                CancellationToken = ct
            };

            lastResult = await _serialPipeline.EnqueueCommandAsync(serialCmd);

            if (lastResult.Success)
            {
                // Validate length if specified
                if (!string.IsNullOrEmpty(lengthValidation) && !ValidateResponseLength(lastResult.Data, lengthValidation))
                {
                    _logger.LogWarning(
                        "Response length validation failed for {Command}, attempt {Attempt}/{MaxRetries}",
                        command, attempt, maxRetries);

                    if (attempt < maxRetries)
                    {
                        await Task.Delay(200, ct);
                        continue;
                    }
                }

                return lastResult;
            }

            _logger.LogWarning(
                "Command {Command} failed, attempt {Attempt}/{MaxRetries}: {Status}",
                command, attempt, maxRetries, lastResult.Status);

            if (attempt < maxRetries)
            {
                await Task.Delay(200, ct);
            }
        }

        return lastResult ?? new SerialResult(
            Guid.NewGuid(),
            false,
            CommandResultStatus.MaxRetriesExceeded,
            string.Empty
        );
    }

    /// <summary>
    /// Validates the response length according to the validation format.
    /// 
    /// where vbTab & vbTab & vbTab = 3 consecutive tabs as delimiter, does NOT count individual tabs.
    /// </summary>
    private bool ValidateResponseLength(string response, string lengthValidation)
    {
        if (string.IsNullOrEmpty(response) || string.IsNullOrEmpty(lengthValidation))
            return true; // No validation

        try
        {
            var lens = lengthValidation;
            string[] strToChecks;

            // splitwith3tabs:N - Split response by 3 consecutive tabs
            // If InStr(1, lengths, "splitwith3tabs:") > 0 Then
            //     lens = Replace(lens, "splitwith3tabs:", "")
            //     strToChecks = Split(strToCheck, (vbTab & vbTab & vbTab))
            if (lengthValidation.StartsWith("splitwith3tabs:", StringComparison.OrdinalIgnoreCase))
            {
                lens = lengthValidation.Substring("splitwith3tabs:".Length);
                strToChecks = response.Split(new[] { ThreeTabsDelimiter }, StringSplitOptions.None);
            }
            else
            {
                // For other cases, validate the complete string
                strToChecks = new[] { response };
            }

            // Parse acceptable lengths (comma-separated)
            var acceptableLengths = lens.Split(',')
                .Select(s => s.Trim())
                .Where(s => !string.IsNullOrEmpty(s))
                .Select(s => long.TryParse(s, out var len) ? len : -1)
                .Where(len => len >= 0)
                .ToArray();

            if (acceptableLengths.Length == 0)
                return true; // No lengths defined

            // Validate each segment
            // For j = 0 To UBound(strToChecks)
            //     lencomp = Len(strToChecks(j))
            //     While i <= UBound(buff) And Not aux
            //         If lencomp = CLng(buff(i)) Then aux = True
            //     End While
            //     If Not aux Then Exit For
            // Next
            foreach (var segment in strToChecks)
            {
                var segmentLength = segment.Length;
                var matchFound = acceptableLengths.Contains(segmentLength);
                
                if (!matchFound)
                {
                    _logger.LogDebug(
                        "Length validation failed: segment length {SegmentLength} not in acceptable lengths [{Acceptable}]",
                        segmentLength, string.Join(",", acceptableLengths));
                    return false;
                }
            }

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error in ValidateResponseLength, returning true as fallback");
            return true;
        }
    }

    /// <summary>
    /// Extracts data from file for a configuration command.
    /// Searches for lines in "COMMAND=DATA" format or legacy format (data only).
    /// </summary>
    private static string? ExtractDataForConfigCommand(string[] fileLines, string command)
    {
        // Search for line that starts with the command
        var commandPrefix = command.Length >= 2 ? command.Substring(0, 2) : command;

        foreach (var line in fileLines)
        {
            if (line.StartsWith($"{commandPrefix}=", StringComparison.OrdinalIgnoreCase))
            {
                var parts = line.Split('=', 2);
                if (parts.Length == 2)
                {
                    return parts[1].Trim();
                }
            }
        }

        return null;
    }
    
    /// <summary>
    /// Executes a configuration load command with retry for non-ACK.
    /// 
    /// 1. Validate frame length (CheckLenCommand)
    /// 2. Send command + data
    /// 3. If not ACK, retry ONCE
    /// 4. If still not ACK, error
    /// </summary>
    private async Task<ConfigCommandResult> ExecuteLoadConfigurationCommandAsync(
        FileOperationCommand cmdGroup,
        string fileDataLine,
        int frameIndex,
        CancellationToken ct)
    {
        // Validate frame length before sending
        if (!string.IsNullOrEmpty(cmdGroup.LengthValidation) && 
            !ValidateResponseLength(fileDataLine, cmdGroup.LengthValidation))
        {
            var errorMsg = $"File not valid. Wrong CFG frame length at frame {frameIndex}";
            _logger.LogError(errorMsg);
            return new ConfigCommandResult(false, null, null, errorMsg);
        }
        
        // Get primary command
        var primaryCommand = cmdGroup.Commands.FirstOrDefault();
        if (string.IsNullOrEmpty(primaryCommand))
        {
            return new ConfigCommandResult(false, null, null, "No command defined for configuration frame");
        }
        
        // Concatenate command + data from file
        var fullCommand = $"{primaryCommand}{fileDataLine}";
        _logger.LogDebug("LoadConfig sending frame {Index}: {Command}", frameIndex, fullCommand);
        
        var serialCmd = new SerialCommand
        {
            Payload = fullCommand,
            ExpectsAck = true,
            ExpectsData = true,
            AckTimeout = AckTimeout,
            DataTimeout = CommandTimeout,
            MaxRetries = 1,
            CancellationToken = ct
        };
        
        var result = await _serialPipeline.EnqueueCommandAsync(serialCmd);
        
        // RETRY if not ACK
        if (!result.Data.Equals(AckResponse, StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogWarning("LoadConfig frame {Index} got {Response}, retrying...", frameIndex, result.Data);
            result = await _serialPipeline.EnqueueCommandAsync(serialCmd);
        }
        
        // Verify final ACK
        if (!result.Data.Equals(AckResponse, StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogError("LoadConfig frame {Index} failed: expected ACK, got {Response}", 
                frameIndex, result.Data);
            return new ConfigCommandResult(false, result.Data, null, "Error sending configuration");
        }
        
        _logger.LogDebug("LoadConfig frame {Index} succeeded with ACK", frameIndex);
        return new ConfigCommandResult(true, result.Data, null, null);
    }
    
    /// <summary>
    /// Executes a save configuration command with special modes.
    /// 
    /// Supported modes:
    /// - splittabcfg: Split by Tab, expands to 24 remotes with padding
    /// - splittabtag: 3 expansions + 24 remotes with tags (Space(30))
    /// - splittabthr: Thresholds with default values for absent devices
    /// - (empty): Normal mode, only saves response
    /// </summary>
    private async Task<SaveConfigResult> ExecuteSaveConfigurationCommandAsync(
        FileOperationCommand cmdGroup,
        StringBuilder saveContent,
        string filePath,
        CancellationToken ct)
    {
        var primaryCommand = cmdGroup.Commands.FirstOrDefault();
        if (string.IsNullOrEmpty(primaryCommand))
        {
            return new SaveConfigResult(false, null, null, "No command defined");
        }
        
        // Execute command and get response
        var serialCmd = new SerialCommand
        {
            Payload = primaryCommand.Trim(),
            ExpectsAck = true,
            ExpectsData = true,
            AckTimeout = AckTimeout,
            DataTimeout = CommandTimeout,
            MaxRetries = 1,
            CancellationToken = ct
        };
        
        var result = await _serialPipeline.EnqueueCommandAsync(serialCmd);
        
        // Validate length with retry
        if (!string.IsNullOrEmpty(cmdGroup.LengthValidation) && 
            !ValidateResponseLength(result.Data, cmdGroup.LengthValidation))
        {
            _logger.LogWarning("SaveConfig length validation failed for {Command}, retrying", primaryCommand);
            result = await _serialPipeline.EnqueueCommandAsync(serialCmd);
            
            if (!ValidateResponseLength(result.Data, cmdGroup.LengthValidation))
            {
                _logger.LogError("SaveConfig validation failed after retry");
                return new SaveConfigResult(false, null, null, "Error saving");
            }
        }
        
        var responseLines = new List<string>();
        var isLegacyFormat = IsLegacyConfigFormat(filePath);
        
        // Process according to mode
        switch (cmdGroup.Mode.ToLowerInvariant())
        {
            case ModeSplitTabCfg:
                var cfgLines = ProcessSplitTabCfgMode(result.Data);
                if (cfgLines == null)
                {
                    return new SaveConfigResult(false, null, null, "Error saving");
                }
                responseLines.AddRange(cfgLines);
                break;
                
            case ModeSplitTabTag:
                var tagLines = ProcessSplitTabTagMode(result.Data);
                if (tagLines == null)
                {
                    return new SaveConfigResult(false, null, null, "Error saving");
                }
                responseLines.AddRange(tagLines);
                break;
                
            case ModeSplitTabThr:
                var thrLines = ProcessSplitTabThrMode(result.Data);
                if (thrLines == null)
                {
                    return new SaveConfigResult(false, null, null, "Error saving");
                }
                responseLines.AddRange(thrLines);
                break;
                
            default:
                // Normal mode: only add the response
                responseLines.Add(result.Data);
                break;
        }
        
        // Add lines to save content
        foreach (var line in responseLines)
        {
            if (isLegacyFormat)
            {
                saveContent.Append(line);
                saveContent.Append('\n');
            }
            else
            {
                // New format: data + CRLF (without command prefix for compatibility)
                saveContent.Append(line);
                saveContent.Append('\n');
            }
        }
        
        _logger.LogDebug("SaveConfig command {Command} processed: {LineCount} lines", 
            primaryCommand, responseLines.Count);
        
        return new SaveConfigResult(true, result.Data, responseLines.ToArray(), null);
    }
    
    /// <summary>
    /// Processes splittabcfg mode: Split by Tab, expands to 25 lines (1 master + 24 remotes).
    /// </summary>
    private List<string>? ProcessSplitTabCfgMode(string response)
    {
        var lines = new List<string>();
        
        // Split by single Tab
        var buff = response.Split('\t');
        
        // Validate '0000' prefix of first element
        if (buff.Length == 0 || !buff[0].StartsWith("0000"))
        {
            _logger.LogError("SaveConfig splittabcfg: Invalid prefix, expected '0000'");
            return null;
        }
        
        // Add first element (master)
        lines.Add(buff[0]);
        
        int buffIndex = 1;
        
        // Process 24 remote devices
        for (int j = 1; j <= NumRemoteDevices; j++)
        {
            // Generate expected prefix: "XX01" where XX is the hex of j
            var expectedPrefix = $"{j:X2}01";
            
            if (buffIndex < buff.Length && buff[buffIndex].StartsWith(expectedPrefix, StringComparison.OrdinalIgnoreCase))
            {
                // Remote device present
                lines.Add(buff[buffIndex]);
                buffIndex++;
            }
            else
            {
                // Remote device absent: add zero padding
                lines.Add($"{expectedPrefix}{ZeroPadding}");
            }
        }
        
        _logger.LogDebug("ProcessSplitTabCfgMode: Generated {Count} lines", lines.Count);
        return lines;
    }
    
    /// <summary>
    /// Processes splittabtag mode: Split by Tab, 28 lines (1 master + 3 expansions + 24 remotes).
    /// </summary>
    private List<string>? ProcessSplitTabTagMode(string response)
    {
        var lines = new List<string>();
        var tagPadding = new string(' ', TagLength);
        
        // Split by single Tab
        var buff = response.Split('\t');
        
        // Validate "0000" prefix of first element
        if (buff.Length == 0 || !buff[0].StartsWith("0000"))
        {
            _logger.LogError("SaveConfig splittabtag: Invalid prefix, expected '0000'");
            return null;
        }
        
        // Add first element (master)
        lines.Add(buff[0]);
        
        int buffIndex = 1;
        
        // Process 3 expansion devices
        for (int j = 1; j <= NumExpansionDevices; j++)
        {
            // Generate expected prefix: "00XX" where XX is the hex of j
            var expectedPrefix = $"00{j:X2}";
            
            if (buffIndex < buff.Length && buff[buffIndex].StartsWith(expectedPrefix, StringComparison.OrdinalIgnoreCase))
            {
                lines.Add(buff[buffIndex]);
                buffIndex++;
            }
            else
            {
                // Expansion device absent: add tag with spaces
                lines.Add($"{expectedPrefix}{tagPadding}");
            }
        }
        
        // Process 24 remote devices
        for (int j = 1; j <= NumRemoteDevices; j++)
        {
            var expectedPrefix = $"{j:X2}01";
            
            if (buffIndex < buff.Length && buff[buffIndex].StartsWith(expectedPrefix, StringComparison.OrdinalIgnoreCase))
            {
                lines.Add(buff[buffIndex]);
                buffIndex++;
            }
            else
            {
                // Remote device absent: add tag with spaces
                lines.Add($"{expectedPrefix}{tagPadding}");
            }
        }
        
        _logger.LogDebug("ProcessSplitTabTagMode: Generated {Count} lines", lines.Count);
        return lines;
    }
    
    /// <summary>
    /// Processes splittabthr mode: Split by Tab, 28 lines with default thresholds.
    /// </summary>
    private List<string>? ProcessSplitTabThrMode(string response)
    {
        var lines = new List<string>();
        
        // Split by single Tab
        var buff = response.Split('\t');
        
        // Validate "0000" prefix of first element
        if (buff.Length == 0 || !buff[0].StartsWith("0000"))
        {
            _logger.LogError("SaveConfig splittabthr: Invalid prefix, expected '0000'");
            return null;
        }
        
        // Add first element (master)
        lines.Add(buff[0]);
        
        int buffIndex = 1;
        
        // Process 3 expansion devices with default threshold
        for (int j = 1; j <= NumExpansionDevices; j++)
        {
            var expectedPrefix = $"00{j:X2}";
            
            if (buffIndex < buff.Length && buff[buffIndex].StartsWith(expectedPrefix, StringComparison.OrdinalIgnoreCase))
            {
                lines.Add(buff[buffIndex]);
                buffIndex++;
            }
            else
            {
                // Expansion device absent: use default threshold
                lines.Add($"{expectedPrefix}{DefaultExpansionThreshold}");
            }
        }
        
        // Process 24 remote devices with default threshold
        for (int j = 1; j <= NumRemoteDevices; j++)
        {
            var expectedPrefix = $"{j:X2}01";
            
            if (buffIndex < buff.Length && buff[buffIndex].StartsWith(expectedPrefix, StringComparison.OrdinalIgnoreCase))
            {
                lines.Add(buff[buffIndex]);
                buffIndex++;
            }
            else
            {
                // Remote device absent: use default threshold
                lines.Add($"{expectedPrefix}{DefaultRemoteThreshold}");
            }
        }
        
        _logger.LogDebug("ProcessSplitTabThrMode: Generated {Count} lines", lines.Count);
        return lines;
    }
    
    /// <summary>
    /// Determines if the file uses legacy format (.cfgr).
    /// </summary>
    private static bool IsLegacyConfigFormat(string filePath)
    {
        return Path.GetExtension(filePath).Equals(".cfgr", StringComparison.OrdinalIgnoreCase);
    }
}

/// <summary>
/// Internal result for calibration operations.
/// </summary>
internal record CalibrationCommandResult(bool Success, string? Data, string? ErrorMessage);

/// <summary>
/// Internal result for load configuration operations.
/// </summary>
internal record ConfigCommandResult(bool Success, string? Data, string[]? ResponseLines, string? ErrorMessage);

/// <summary>
/// Internal result for save configuration operations.
/// </summary>
internal record SaveConfigResult(bool Success, string? Data, string[]? ResponseLines, string? ErrorMessage);
