using Fiplex.Control.Software.WinForms.Core.Serial.Models;

namespace Fiplex.Control.Software.WinForms.Core.Serial.Interfaces;

/// <summary>
/// Pipeline for serial command execution with queuing, retry logic, and response processing.
/// </summary>
/// <remarks>
/// <para>
/// The pipeline manages a FIFO queue of serial commands, handling ACK/NAK responses,
/// timeouts, and automatic retry with stored credentials when INVALID CREDENTIALS is received.
/// </para>
/// <para>
/// Typical flow: Command queued → Sent to device → Wait for ACK → Wait for data → Complete/Fail.
/// </para>
/// </remarks>
/// <example>
/// Basic command execution:
/// <code>
/// var command = new SerialCommand
/// {
///     Payload = "V1",
///     ExpectsAck = true,
///     ExpectsData = true,
///     MaxRetries = 3
/// };
/// var result = await pipeline.EnqueueCommandAsync(command);
/// if (result.Success)
/// {
///     Console.WriteLine($"Response: {result.Data}");
/// }
/// </code>
/// </example>
/// <seealso cref="SerialCommand"/>
/// <seealso cref="SerialResult"/>
/// <seealso cref="ISerialPort"/>
public interface ISerialCommandPipeline : IDisposable
{
    /// <summary>
    /// Indica si el parser está esperando LF (fin de trama).
    /// </summary>
    bool IsWaitingLF { get; }
    
    /// <summary>
    /// Indica si el pipeline está esperando respuesta del dispositivo.
    /// </summary>
    bool IsWaitingAnswer { get; }
    
    /// <summary>
    /// Indica si hay una respuesta pendiente de procesar.
    /// </summary>
    bool IsPendingAnswer { get; }
    
    /// <summary>
    /// Longitud actual del buffer de recepción.
    /// </summary>
    int BufferLength { get; }

    /// <summary>
    /// Enqueues a command for execution and waits for the result.
    /// </summary>
    /// <param name="command">The serial command to execute.</param>
    /// <returns>The result containing success status, data, and metrics.</returns>
    /// <exception cref="OperationCanceledException">Thrown when the command's cancellation token is triggered.</exception>
    /// <example>
    /// <code>
    /// var cmd = new SerialCommand { Payload = "C1", MaxRetries = 2 };
    /// var result = await pipeline.EnqueueCommandAsync(cmd);
    /// </code>
    /// </example>
    Task<SerialResult> EnqueueCommandAsync(SerialCommand command);
    
    /// <summary>
    /// Start the pipeline processing
    /// </summary>
    Task StartAsync(CancellationToken ct = default);
    
    /// <summary>
    /// Stop the pipeline processing
    /// </summary>
    Task StopAsync();
    
    /// <summary>
    /// Set the stored password for INVALID CREDENTIALS retry
    /// </summary>
    void SetStoredPassword(string password);
    
    /// <summary>
    /// Clear the stored password
    /// </summary>
    void ClearStoredPassword();
    
    /// <summary>
    /// Cancela todos los comandos pendientes en la cola.
    /// </summary>
    void CancelPendingCommands();

    /// <summary>
    /// Raised when a command transitions between states in the pipeline.
    /// </summary>
    /// <example>
    /// <code>
    /// pipeline.CommandStateChanged += (id, state) =>
    /// {
    ///     Debug.WriteLine($"Command {id}: {state}");
    /// };
    /// </code>
    /// </example>
    /// <seealso cref="CommandState"/>
    event Action<Guid, CommandState>? CommandStateChanged;

    /// <summary>
    /// Raised when a command completes (successfully or with failure).
    /// </summary>
    /// <seealso cref="SerialResult"/>
    event Action<Guid, SerialResult>? CommandCompleted;

    /// <summary>
    /// Raised when INVALID CREDENTIALS is received and no stored password is available.
    /// The handler should return the password or null to cancel authentication.
    /// </summary>
    /// <example>
    /// <code>
    /// pipeline.CredentialsRequired += async () =>
    /// {
    ///     using var dialog = new frmPassword();
    ///     return dialog.ShowDialog() == DialogResult.OK ? dialog.Password : null;
    /// };
    /// </code>
    /// </example>
    event Func<Task<string?>>? CredentialsRequired;
}
