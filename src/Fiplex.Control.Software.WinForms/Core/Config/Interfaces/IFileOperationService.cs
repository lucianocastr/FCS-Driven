using Fiplex.Control.Software.WinForms.Models;

namespace Fiplex.Control.Software.WinForms.Core.Config.Interfaces;

/// <summary>
/// Servicio para ejecutar operaciones de archivo (SaveCFG, LoadCFG, SaveCAL, LoadCAL).
/// </summary>
public interface IFileOperationService
{
    /// <summary>
    /// Ejecuta secuencia de comandos SaveCFG para guardar configuración del dispositivo a archivo.
    /// </summary>
    /// <param name="filePath">Ruta del archivo donde guardar</param>
    /// <param name="commands">Comandos de la sección SaveCFG</param>
    /// <param name="progress">Callback de progreso opcional</param>
    /// <param name="ct">Token de cancelación</param>
    /// <returns>True si exitoso</returns>
    Task<FileOperationResult> SaveConfigurationAsync(
        string filePath,
        IEnumerable<FileOperationCommand> commands,
        IProgress<FileOperationProgress>? progress = null,
        CancellationToken ct = default);

    /// <summary>
    /// Ejecuta secuencia de comandos LoadCFG para cargar configuración desde archivo al dispositivo.
    /// </summary>
    /// <param name="filePath">Ruta del archivo a cargar</param>
    /// <param name="commands">Comandos de la sección LoadCFG</param>
    /// <param name="progress">Callback de progreso opcional</param>
    /// <param name="ct">Token de cancelación</param>
    /// <returns>True si exitoso</returns>
    Task<FileOperationResult> LoadConfigurationAsync(
        string filePath,
        IEnumerable<FileOperationCommand> commands,
        IProgress<FileOperationProgress>? progress = null,
        CancellationToken ct = default);

    /// <summary>
    /// Ejecuta secuencia de comandos SaveCAL para guardar calibración.
    /// </summary>
    Task<FileOperationResult> SaveCalibrationAsync(
        string filePath,
        IEnumerable<FileOperationCommand> commands,
        IProgress<FileOperationProgress>? progress = null,
        CancellationToken ct = default);

    /// <summary>
    /// Ejecuta secuencia de comandos LoadCAL para cargar calibración.
    /// </summary>
    Task<FileOperationResult> LoadCalibrationAsync(
        string filePath,
        IEnumerable<FileOperationCommand> commands,
        IProgress<FileOperationProgress>? progress = null,
        CancellationToken ct = default);

    /// <summary>
    /// Ejecuta operación de archivo genérica basada en el tipo de operación.
    /// </summary>
    /// <param name="operationType">Tipo: SaveCFG, LoadCFG, SaveCAL, LoadCAL</param>
    /// <param name="filePath">Ruta del archivo</param>
    /// <param name="commands">Comandos a ejecutar</param>
    /// <param name="progress">Callback de progreso opcional</param>
    /// <param name="ct">Token de cancelación</param>
    Task<FileOperationResult> ExecuteFileOperationAsync(
        FileOperationType operationType,
        string filePath,
        IEnumerable<FileOperationCommand> commands,
        IProgress<FileOperationProgress>? progress = null,
        CancellationToken ct = default);
}

/// <summary>
/// Tipos de operación de archivo soportados (equivale a secciones en settings.cfg)
/// </summary>
public enum FileOperationType
{
    /// <summary>Guardar configuración del dispositivo</summary>
    SaveConfig,
    
    /// <summary>Cargar configuración al dispositivo</summary>
    LoadConfig,
    
    /// <summary>Guardar calibración del dispositivo</summary>
    SaveCalibration,
    
    /// <summary>Cargar calibración al dispositivo</summary>
    LoadCalibration,
    
    /// <summary>Upload de firmware</summary>
    FirmwareUpload
}

/// <summary>
/// Comando individual para operación de archivo.
/// </summary>
public record FileOperationCommand
{
    /// <summary>
    /// Comandos seriales a ejecutar .
    /// Ej: "C1,F1" ejecuta C1 y luego F1.
    /// </summary>
    public string[] Commands { get; init; } = Array.Empty<string>();

    /// <summary>
    /// Longitud esperada de respuesta para validación.
    /// Formato: número simple, "splitwith3tabs:N", o lista "128,256".
    /// </summary>
    public string LengthValidation { get; init; } = string.Empty;

    /// <summary>
    /// Mensaje a mostrar durante la operación.
    /// </summary>
    public string Message { get; init; } = string.Empty;

    /// <summary>
    /// Modo de operación adicional.
    /// </summary>
    public string Mode { get; init; } = string.Empty;

    /// <summary>
    /// Tipo de operación padre (SaveCFG, LoadCFG, etc.)
    /// </summary>
    public FileOperationType OperationType { get; init; }
}

/// <summary>
/// Resultado de una operación de archivo
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
/// Progreso de una operación de archivo
/// </summary>
public record FileOperationProgress
{
    public int CurrentCommand { get; init; }
    public int TotalCommands { get; init; }
    public string CurrentCommandName { get; init; } = string.Empty;
    public string Message { get; init; } = string.Empty;
    public double PercentComplete => TotalCommands > 0 ? (double)CurrentCommand / TotalCommands * 100 : 0;
}
