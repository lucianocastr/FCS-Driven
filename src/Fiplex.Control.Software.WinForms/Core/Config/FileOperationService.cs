using System.Diagnostics;
using System.Text;
using Fiplex.Control.Software.WinForms.Core.Config.Interfaces;
using Fiplex.Control.Software.WinForms.Core.Serial.Interfaces;
using Fiplex.Control.Software.WinForms.Core.Serial.Models;
using Microsoft.Extensions.Logging;

namespace Fiplex.Control.Software.WinForms.Core.Config;

/// <summary>
/// Implementación del servicio de operaciones de archivo.
/// Ejecuta secuencias de comandos para SaveCFG, LoadCFG, SaveCAL, LoadCAL.
///
/// - Uso de saveCfgCommands[], loadCfgCommands[], saveCalCommands[], loadCalCommands[]
/// - Funciones mnuSaveConfig_Click, mnuLoadConfig_Click, mnuSaveCal_Click, mnuLoadCal_Click
/// - Función LoadCal(fname As String) para carga de calibración
/// </summary>
public class FileOperationService : IFileOperationService
{
    private readonly ISerialCommandPipeline _serialPipeline;
    private readonly ILogger<FileOperationService> _logger;
    private static readonly TimeSpan CommandTimeout = TimeSpan.FromSeconds(40);
    private static readonly TimeSpan AckTimeout = TimeSpan.FromMilliseconds(800);
    private const string AckResponse = "ACK";
    private const string NackResponse = "NACK";
    
    // Delimitador de 3 tabs consecutivos para splitwith3tabs 
    private static readonly string ThreeTabsDelimiter = "\t\t\t";
    private const string ModeSplitTabCfg = "splittabcfg";     // 24 dispositivos remotos
    private const string ModeSplitTabTag = "splittabtag";     // 3 expansiones + 24 remotos (tags)
    private const string ModeSplitTabThr = "splittabthr";     // Umbrales con valores por defecto
    
    // Número de dispositivos remotos y expansiones 
    private const int NumRemoteDevices = 24;
    private const int NumExpansionDevices = 3;
    private const int TagLength = 30;
    
    // Valores umbral por defecto 
    private const string DefaultExpansionThreshold = "E702E702E702E702E702E702E702E702500A";
    private const string DefaultRemoteThreshold = "2202500AE702E702CE02CE02";
    
    // Padding de ceros para remotos ausentes en splittabcfg (162 caracteres)
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
            // Validar que haya comandos
            if (!commandList.Any())
            {
                _logger.LogWarning("No commands provided for {OperationType}", operationType);
                return FileOperationResult.Failed("No commands defined for this operation", 0, 0);
            }

            // Calcular total de comandos individuales
            var totalIndividualCommands = commandList.Sum(c => c.Commands.Length);
            var currentCommandIndex = 0;

            // Para operaciones de carga, leer y validar archivo primero
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
                // El número de líneas en el archivo debe coincidir con el número de comandos
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

            // Preparar StringBuilder para operaciones de guardado
            StringBuilder? saveContent = null;
            if (operationType == FileOperationType.SaveConfig || 
                operationType == FileOperationType.SaveCalibration)
            {
                saveContent = new StringBuilder();
            }
            
            // Para LoadCAL: Cancelar comandos pendientes antes de empezar
            if (operationType == FileOperationType.LoadCalibration)
            {
                _serialPipeline.CancelPendingCommands();
                _logger.LogDebug("Cleared pending commands before LoadCalibration");
            }

            // Ejecutar cada grupo de comandos
            var commandIndex = 0;
            foreach (var cmdGroup in commandList)
            {
                ct.ThrowIfCancellationRequested();

                _logger.LogDebug(
                    "Executing command group {Index}: {Commands}, Message: {Message}",
                    commandIndex, string.Join(",", cmdGroup.Commands), cmdGroup.Message);

                // Reportar progreso con mensaje del grupo
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
                
                // Para operaciones de carga de configuración, usar lógica específica con retry
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

                // Para SaveCAL, usar lógica específica con retry NACK
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
                    
                    // Agregar respuesta al archivo 
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
                
                // Para SaveConfig con modos especiales (splittabcfg, splittabtag, splittabthr)
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
                    
                    // Las líneas ya fueron agregadas por el método específico
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

                // Ejecutar cada comando individual del grupo (lógica genérica fallback)
                foreach (var serialCommand in cmdGroup.Commands)
                {
                    ct.ThrowIfCancellationRequested();
                    currentCommandIndex++;

                    if (string.IsNullOrWhiteSpace(serialCommand))
                        continue;

                    var commandToSend = serialCommand.Trim();

                    // Para operaciones de carga de configuración, agregar datos del archivo
                    if (fileDataLines != null && operationType == FileOperationType.LoadConfig)
                    {
                        var dataLine = ExtractDataForConfigCommand(fileDataLines, commandToSend);
                        if (!string.IsNullOrEmpty(dataLine))
                        {
                            commandToSend = $"{commandToSend}{dataLine}";
                        }
                    }

                    _logger.LogDebug("Sending command: {Command}", commandToSend);

                    // Ejecutar comando serial
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

                    // Guardar respuesta
                    responses[serialCommand] = result.Data;
                    executedCount++;

                    // Para SaveConfig, agregar respuesta con formato COMMAND=DATA
                    if (saveContent != null && !string.IsNullOrEmpty(result.Data))
                    {
                        saveContent.AppendLine($"{serialCommand}={result.Data}");
                    }

                    _logger.LogDebug(
                        "Command {Command} succeeded: {ResponseLength} chars",
                        serialCommand, result.Data?.Length ?? 0);

                    // Pequeño delay entre comandos 
                    await Task.Delay(50, ct);
                }
                
                commandIndex++;
            }

            // Guardar archivo si es operación de guardado
            if (saveContent != null)
            {
                var directory = Path.GetDirectoryName(filePath);
                if (!string.IsNullOrEmpty(directory) && !Directory.Exists(directory))
                {
                    Directory.CreateDirectory(directory);
                }
                // Para compatibilidad, guardamos sin BOM
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
    /// Ejecuta un comando de carga de calibración.
    /// </summary>
    private async Task<CalibrationCommandResult> ExecuteLoadCalibrationCommandAsync(
        FileOperationCommand cmdGroup,
        string fileDataLine,
        int frameIndex,
        CancellationToken ct)
    {
        // Validar longitud del frame antes de enviar
        if (!string.IsNullOrEmpty(cmdGroup.LengthValidation) && 
            !ValidateResponseLength(fileDataLine, cmdGroup.LengthValidation))
        {
            var errorMsg = $"File not valid. Wrong CAL frame length at frame {frameIndex}";
            _logger.LogError(errorMsg);
            return new CalibrationCommandResult(false, null, errorMsg);
        }
        
        // Cancelar comandos pendientes antes de cada envío
        _serialPipeline.CancelPendingCommands();
        
        // Concatenar comando + datos del archivo
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
        
        // Verificar respuesta ACK
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
    /// Ejecuta un comando de guardado de calibración con retry para NACK.
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
            
            // Si no es NACK, salir del loop (éxito o error diferente)
            if (!result.Data.Equals(NackResponse, StringComparison.OrdinalIgnoreCase))
            {
                // Validar longitud de respuesta
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
        
        // Si llegamos aquí, todos los comandos dieron NACK
        _logger.LogError("SaveCal all command variants returned NACK");
        return new CalibrationCommandResult(false, lastResponse, "Error saving - all commands returned NACK");
    }

    /// <summary>
    /// Ejecuta un comando serial individual con reintentos.
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
                // Validar longitud si está especificada
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
    /// Valida la longitud de la respuesta según el formato de validación.
    /// 
    /// donde vbTab & vbTab & vbTab = 3 tabs consecutivos como delimitador, NO cuenta tabs individuales.
    /// </summary>
    private bool ValidateResponseLength(string response, string lengthValidation)
    {
        if (string.IsNullOrEmpty(response) || string.IsNullOrEmpty(lengthValidation))
            return true; // Sin validación

        try
        {
            var lens = lengthValidation;
            string[] strToChecks;

            // splitwith3tabs:N - Dividir respuesta por 3 tabs consecutivos
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
                // Para otros casos, validar la cadena completa
                strToChecks = new[] { response };
            }

            // Parsear longitudes aceptables (separadas por coma)
            var acceptableLengths = lens.Split(',')
                .Select(s => s.Trim())
                .Where(s => !string.IsNullOrEmpty(s))
                .Select(s => long.TryParse(s, out var len) ? len : -1)
                .Where(len => len >= 0)
                .ToArray();

            if (acceptableLengths.Length == 0)
                return true; // Sin longitudes definidas

            // Validar cada segmento
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
    /// Extrae datos del archivo para un comando de configuración.
    /// Busca líneas en formato "COMMAND=DATA" o formato legacy (solo datos).
    /// </summary>
    private static string? ExtractDataForConfigCommand(string[] fileLines, string command)
    {
        // Buscar línea que empiece con el comando
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
    /// Ejecuta un comando de carga de configuración con retry para non-ACK.
    /// 
    /// 1. Validar longitud del frame (CheckLenCommand)
    /// 2. Enviar comando + datos
    /// 3. Si no es ACK, reintentar UNA vez
    /// 4. Si aún no es ACK, error
    /// </summary>
    private async Task<ConfigCommandResult> ExecuteLoadConfigurationCommandAsync(
        FileOperationCommand cmdGroup,
        string fileDataLine,
        int frameIndex,
        CancellationToken ct)
    {
        // Validar longitud del frame antes de enviar
        if (!string.IsNullOrEmpty(cmdGroup.LengthValidation) && 
            !ValidateResponseLength(fileDataLine, cmdGroup.LengthValidation))
        {
            var errorMsg = $"File not valid. Wrong CFG frame length at frame {frameIndex}";
            _logger.LogError(errorMsg);
            return new ConfigCommandResult(false, null, null, errorMsg);
        }
        
        // Obtener comando principal
        var primaryCommand = cmdGroup.Commands.FirstOrDefault();
        if (string.IsNullOrEmpty(primaryCommand))
        {
            return new ConfigCommandResult(false, null, null, "No command defined for configuration frame");
        }
        
        // Concatenar comando + datos del archivo
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
        
        // RETRY si no es ACK
        if (!result.Data.Equals(AckResponse, StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogWarning("LoadConfig frame {Index} got {Response}, retrying...", frameIndex, result.Data);
            result = await _serialPipeline.EnqueueCommandAsync(serialCmd);
        }
        
        // Verificar ACK final
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
    /// Ejecuta un comando de guardado de configuración con modos especiales.
    /// 
    /// Modos soportados:
    /// - splittabcfg: Split por Tab, expande a 24 remotos con padding
    /// - splittabtag: 3 expansiones + 24 remotos con tags (Space(30))
    /// - splittabthr: Umbrales con valores por defecto para dispositivos ausentes
    /// - (vacío): Modo normal, solo guarda respuesta
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
        
        // Ejecutar comando y obtener respuesta
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
        
        // Validar longitud con retry
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
        
        // Procesar según el modo
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
                // Modo normal: solo agregar la respuesta
                responseLines.Add(result.Data);
                break;
        }
        
        // Agregar líneas al contenido de guardado
        foreach (var line in responseLines)
        {
            if (isLegacyFormat)
            {
                saveContent.Append(line);
                saveContent.Append('\n');
            }
            else
            {
                // Formato nuevo: datos + CRLF (sin prefijo de comando para compatibilidad)
                saveContent.Append(line);
                saveContent.Append('\n');
            }
        }
        
        _logger.LogDebug("SaveConfig command {Command} processed: {LineCount} lines", 
            primaryCommand, responseLines.Count);
        
        return new SaveConfigResult(true, result.Data, responseLines.ToArray(), null);
    }
    
    /// <summary>
    /// Procesa modo splittabcfg: Split por Tab, expande a 25 líneas (1 master + 24 remotos).
    /// </summary>
    private List<string>? ProcessSplitTabCfgMode(string response)
    {
        var lines = new List<string>();
        
        // Split por Tab individual
        var buff = response.Split('\t');
        
        // Validar prefijo "0000" del primer elemento
        if (buff.Length == 0 || !buff[0].StartsWith("0000"))
        {
            _logger.LogError("SaveConfig splittabcfg: Invalid prefix, expected '0000'");
            return null;
        }
        
        // Agregar primer elemento (master)
        lines.Add(buff[0]);
        
        int buffIndex = 1;
        
        // Procesar 24 remotos
        for (int j = 1; j <= NumRemoteDevices; j++)
        {
            // Generar prefijo esperado: "XX01" donde XX es el hex de j
            var expectedPrefix = $"{j:X2}01";
            
            if (buffIndex < buff.Length && buff[buffIndex].StartsWith(expectedPrefix, StringComparison.OrdinalIgnoreCase))
            {
                // Remoto presente
                lines.Add(buff[buffIndex]);
                buffIndex++;
            }
            else
            {
                // Remoto ausente: agregar padding de ceros
                lines.Add($"{expectedPrefix}{ZeroPadding}");
            }
        }
        
        _logger.LogDebug("ProcessSplitTabCfgMode: Generated {Count} lines", lines.Count);
        return lines;
    }
    
    /// <summary>
    /// Procesa modo splittabtag: Split por Tab, 28 líneas (1 master + 3 expansiones + 24 remotos).
    /// </summary>
    private List<string>? ProcessSplitTabTagMode(string response)
    {
        var lines = new List<string>();
        var tagPadding = new string(' ', TagLength);
        
        // Split por Tab individual
        var buff = response.Split('\t');
        
        // Validar prefijo "0000" del primer elemento
        if (buff.Length == 0 || !buff[0].StartsWith("0000"))
        {
            _logger.LogError("SaveConfig splittabtag: Invalid prefix, expected '0000'");
            return null;
        }
        
        // Agregar primer elemento (master)
        lines.Add(buff[0]);
        
        int buffIndex = 1;
        
        // Procesar 3 expansiones
        for (int j = 1; j <= NumExpansionDevices; j++)
        {
            // Generar prefijo esperado: "00XX" donde XX es el hex de j
            var expectedPrefix = $"00{j:X2}";
            
            if (buffIndex < buff.Length && buff[buffIndex].StartsWith(expectedPrefix, StringComparison.OrdinalIgnoreCase))
            {
                lines.Add(buff[buffIndex]);
                buffIndex++;
            }
            else
            {
                // Expansión ausente: agregar tag con espacios
                lines.Add($"{expectedPrefix}{tagPadding}");
            }
        }
        
        // Procesar 24 remotos
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
                // Remoto ausente: agregar tag con espacios
                lines.Add($"{expectedPrefix}{tagPadding}");
            }
        }
        
        _logger.LogDebug("ProcessSplitTabTagMode: Generated {Count} lines", lines.Count);
        return lines;
    }
    
    /// <summary>
    /// Procesa modo splittabthr: Split por Tab, 28 líneas con umbrales por defecto.
    /// </summary>
    private List<string>? ProcessSplitTabThrMode(string response)
    {
        var lines = new List<string>();
        
        // Split por Tab individual
        var buff = response.Split('\t');
        
        // Validar prefijo "0000" del primer elemento
        if (buff.Length == 0 || !buff[0].StartsWith("0000"))
        {
            _logger.LogError("SaveConfig splittabthr: Invalid prefix, expected '0000'");
            return null;
        }
        
        // Agregar primer elemento (master)
        lines.Add(buff[0]);
        
        int buffIndex = 1;
        
        // Procesar 3 expansiones con umbral por defecto
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
                // Expansión ausente: umbral por defecto
                lines.Add($"{expectedPrefix}{DefaultExpansionThreshold}");
            }
        }
        
        // Procesar 24 remotos con umbral por defecto
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
                // Remoto ausente: umbral por defecto
                lines.Add($"{expectedPrefix}{DefaultRemoteThreshold}");
            }
        }
        
        _logger.LogDebug("ProcessSplitTabThrMode: Generated {Count} lines", lines.Count);
        return lines;
    }
    
    /// <summary>
    /// Determina si el archivo usa formato legacy (.cfgr).
    /// </summary>
    private static bool IsLegacyConfigFormat(string filePath)
    {
        return Path.GetExtension(filePath).Equals(".cfgr", StringComparison.OrdinalIgnoreCase);
    }
}

/// <summary>
/// Resultado interno para operaciones de calibración.
/// </summary>
internal record CalibrationCommandResult(bool Success, string? Data, string? ErrorMessage);

/// <summary>
/// Resultado interno para operaciones de carga de configuración.
/// </summary>
internal record ConfigCommandResult(bool Success, string? Data, string[]? ResponseLines, string? ErrorMessage);

/// <summary>
/// Resultado interno para operaciones de guardado de configuración.
/// </summary>
internal record SaveConfigResult(bool Success, string? Data, string[]? ResponseLines, string? ErrorMessage);
