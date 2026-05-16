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
    /// Indicates whether the parser is waiting for LF (end of frame).
    /// </summary>
    bool IsWaitingLF { get; }
    
    /// <summary>
    /// Indicates whether the pipeline is waiting for device response.
    /// </summary>
    bool IsWaitingAnswer { get; }
    
    /// <summary>
    /// Indicates whether there is a pending response to process.
    /// </summary>
    bool IsPendingAnswer { get; }
    
    /// <summary>
    /// Current length of the receive buffer.
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
    /// Cancels all pending commands in the queue.
    /// </summary>
    void CancelPendingCommands();

    /// <summary>
    /// Flushes the serial input buffer and resets the protocol parser.
    /// Mirrors VB 1.9 CancelCommands(True) → FlushRS232() + instRx="".
    /// Called before each production command to avoid residual-byte contamination.
    /// </summary>
    void FlushInputBuffer();

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

    /// <summary>
    /// Fires on each command attempt with the token type received (ACK/NACK/Timeout/etc.).
    /// Used for production-test diagnostics.
    /// </summary>
    event Action<string>? CommandAttemptDiagnostic;
}
