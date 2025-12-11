namespace Fiplex.Control.Software.WinForms.Core.Serial.Models;

/// <summary>
/// Represents a serial command to be sent to a Fiplex device.
/// </summary>
/// <remarks>
/// <para>
/// Commands are queued in <see cref="ISerialCommandPipeline"/> and executed sequentially.
/// The protocol uses CR/LF termination with ACK/NAK handshaking.
/// </para>
/// <para>
/// Command format: *{Payload}\r\n (e.g., "*V1\r\n" for version query)
/// </para>
/// </remarks>
/// <example>
/// Creating a read command:
/// <code>
/// var readVersion = new SerialCommand
/// {
///     Payload = "V1",
///     ExpectsAck = true,
///     ExpectsData = true,
///     AckTimeout = TimeSpan.FromMilliseconds(500),
///     DataTimeout = TimeSpan.FromSeconds(2)
/// };
/// </code>
/// </example>
/// <example>
/// Creating a write command:
/// <code>
/// var writeConfig = new SerialCommand
/// {
///     Payload = "C2=45",
///     ExpectsAck = true,
///     ExpectsData = false  // Write commands may not return data
/// };
/// </code>
/// </example>
/// <seealso cref="SerialResult"/>
/// <seealso cref="ISerialCommandPipeline"/>
public record SerialCommand
{
    /// <summary>Gets the unique identifier for this command instance.</summary>
    public Guid Id { get; init; } = Guid.NewGuid();

    /// <summary>Gets the command payload without protocol framing (e.g., "V1", "C1").</summary>
    public string Payload { get; init; } = string.Empty;

    /// <summary>Gets a value indicating whether the command expects an ACK response.</summary>
    public bool ExpectsAck { get; init; } = true;

    /// <summary>Gets a value indicating whether the command expects data after ACK.</summary>
    public bool ExpectsData { get; init; } = true;

    /// <summary>Gets the timeout duration for ACK response.</summary>
    public TimeSpan AckTimeout { get; init; } = TimeSpan.FromMilliseconds(800);

    /// <summary>Gets the timeout duration for data response after ACK.</summary>
    public TimeSpan DataTimeout { get; init; } = TimeSpan.FromSeconds(3);

    /// <summary>
    /// Gets the maximum number of retry attempts on failure.
    /// </summary>
    /// <remarks>
    /// Retries occur on timeout, NAK, or INVALID CREDENTIALS (with stored password).
    /// </remarks>
    public int MaxRetries { get; init; } = 3;

    /// <summary>
    /// Gets expected response lengths for validation (e.g., ">=10", "==20").
    /// </summary>
    /// <remarks>
    /// If empty, no length validation is performed. Supports: &gt;=, &lt;=, ==, or exact number.
    /// </remarks>
    public string[] ExpectedLengths { get; init; } = Array.Empty<string>();

    /// <summary>
    /// Gets a value indicating whether this is a multipart command (O1/U1 concatenation).
    /// </summary>
    /// <remarks>
    /// Used for 5dm DAS Master devices that return responses in two parts.
    /// </remarks>
    public bool IsMultipart { get; init; } = false;

    /// <summary>Gets the cancellation token for this command.</summary>
    public CancellationToken CancellationToken { get; init; }
}
