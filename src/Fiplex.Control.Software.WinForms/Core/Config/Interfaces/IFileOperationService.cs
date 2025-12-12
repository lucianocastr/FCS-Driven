using Fiplex.Control.Software.WinForms.Models;

namespace Fiplex.Control.Software.WinForms.Core.Config.Interfaces;

/// <summary>
/// Service for executing file operations (SaveCFG, LoadCFG, SaveCAL, LoadCAL).
/// </summary>
public interface IFileOperationService
{
    /// <summary>
    /// Executes SaveCFG command sequence to save device configuration to file.
    /// </summary>
    /// <param name="filePath">File path where to save</param>
    /// <param name="commands">Commands from SaveCFG section</param>
    /// <param name="progress">Optional progress callback</param>
    /// <param name="ct">Cancellation token</param>
    /// <returns>True if successful</returns>
    Task<FileOperationResult> SaveConfigurationAsync(
        string filePath,
        IEnumerable<FileOperationCommand> commands,
        IProgress<FileOperationProgress>? progress = null,
        CancellationToken ct = default);

    /// <summary>
    /// Executes LoadCFG command sequence to load configuration from file to device.
    /// </summary>
    /// <param name="filePath">File path to load</param>
    /// <param name="commands">Commands from LoadCFG section</param>
    /// <param name="progress">Optional progress callback</param>
    /// <param name="ct">Cancellation token</param>
    /// <returns>True if successful</returns>
    Task<FileOperationResult> LoadConfigurationAsync(
        string filePath,
        IEnumerable<FileOperationCommand> commands,
        IProgress<FileOperationProgress>? progress = null,
        CancellationToken ct = default);

    /// <summary>
    /// Executes SaveCAL command sequence to save calibration.
    /// </summary>
    Task<FileOperationResult> SaveCalibrationAsync(
        string filePath,
        IEnumerable<FileOperationCommand> commands,
        IProgress<FileOperationProgress>? progress = null,
        CancellationToken ct = default);

    /// <summary>
    /// Executes LoadCAL command sequence to load calibration.
    /// </summary>
    Task<FileOperationResult> LoadCalibrationAsync(
        string filePath,
        IEnumerable<FileOperationCommand> commands,
        IProgress<FileOperationProgress>? progress = null,
        CancellationToken ct = default);

    /// <summary>
    /// Executes generic file operation based on operation type.
    /// </summary>
    /// <param name="operationType">Type: SaveCFG, LoadCFG, SaveCAL, LoadCAL</param>
    /// <param name="filePath">File path</param>
    /// <param name="commands">Commands to execute</param>
    /// <param name="progress">Optional progress callback</param>
    /// <param name="ct">Cancellation token</param>
    Task<FileOperationResult> ExecuteFileOperationAsync(
        FileOperationType operationType,
        string filePath,
        IEnumerable<FileOperationCommand> commands,
        IProgress<FileOperationProgress>? progress = null,
        CancellationToken ct = default);
}

/// <summary>
/// Supported file operation types (equivalent to sections in settings.cfg)
/// </summary>
public enum FileOperationType
{
    /// <summary>Save device configuration</summary>
    SaveConfig,
    
    /// <summary>Load configuration to device</summary>
    LoadConfig,
    
    /// <summary>Save device calibration</summary>
    SaveCalibration,
    
    /// <summary>Load calibration to device</summary>
    LoadCalibration,
    
    /// <summary>Firmware upload</summary>
    FirmwareUpload
}

/// <summary>
/// Individual command for file operation.
/// </summary>
public record FileOperationCommand
{
    /// <summary>
    /// Serial commands to execute.
    /// Example: "C1,F1" executes C1 and then F1.
    /// </summary>
    public string[] Commands { get; init; } = Array.Empty<string>();

    /// <summary>
    /// Expected response length for validation.
    /// Format: simple number, "splitwith3tabs:N", or list "128,256".
    /// </summary>
    public string LengthValidation { get; init; } = string.Empty;

    /// <summary>
    /// Message to display during the operation.
    /// </summary>
    public string Message { get; init; } = string.Empty;

    /// <summary>
    /// Additional operation mode.
    /// </summary>
    public string Mode { get; init; } = string.Empty;

    /// <summary>
    /// Parent operation type (SaveCFG, LoadCFG, etc.)
    /// </summary>
    public FileOperationType OperationType { get; init; }
}

/// <summary>
/// Result of a file operation
/// </summary>
public record FileOperationResult
{
    public bool Success { get; init; }
    public string? ErrorMessage { get; init; }
    public int CommandsExecuted { get; init; }
    public int TotalCommands { get; init; }
    public TimeSpan Duration { get; init; }
    public Dictionary<string, string> CommandResponses { get; init; } = new();

    public static FileOperationResult Successful(int executed, int total, TimeSpan duration, Dictionary<string, string>? responses = null)
        => new()
        {
            Success = true,
            CommandsExecuted = executed,
            TotalCommands = total,
            Duration = duration,
            CommandResponses = responses ?? new()
        };

    public static FileOperationResult Failed(string error, int executed, int total)
        => new()
        {
            Success = false,
            ErrorMessage = error,
            CommandsExecuted = executed,
            TotalCommands = total
        };
}

/// <summary>
/// Progress of a file operation
/// </summary>
public record FileOperationProgress
{
    public int CurrentCommand { get; init; }
    public int TotalCommands { get; init; }
    public string CurrentCommandName { get; init; } = string.Empty;
    public string Message { get; init; } = string.Empty;
    public double PercentComplete => TotalCommands > 0 ? (double)CurrentCommand / TotalCommands * 100 : 0;
}
