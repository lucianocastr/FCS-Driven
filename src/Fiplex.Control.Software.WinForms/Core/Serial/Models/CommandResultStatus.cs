namespace Fiplex.Control.Software.WinForms.Core.Serial.Models;

/// <summary>
/// Status codes for serial command execution results.
/// </summary>
/// <remarks>
/// Used in <see cref="SerialResult"/> to indicate the outcome of a command execution.
/// </remarks>
/// <seealso cref="SerialResult"/>
/// <seealso cref="ISerialCommandPipeline"/>
public enum CommandResultStatus
{
    /// <summary>Command executed successfully</summary>
    Success,
    
    /// <summary>Timeout waiting for ACK</summary>
    AckTimeout,
    
    /// <summary>Timeout waiting for data</summary>
    DataTimeout,
    
    /// <summary>Maximum retries exceeded</summary>
    MaxRetriesExceeded,
    
    /// <summary>Command cancelled</summary>
    Cancelled,
    
    /// <summary>Generic error</summary>
    Error,
    
    /// <summary>Authentication error (INVALID CREDENTIALS)</summary>
    AuthenticationFailed,
    
    /// <summary>Response validation failed</summary>
    ValidationFailed,
    
    /// <summary>Protocol error</summary>
    ProtocolError
}
