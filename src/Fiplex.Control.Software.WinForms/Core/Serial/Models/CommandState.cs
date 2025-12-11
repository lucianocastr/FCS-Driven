namespace Fiplex.Control.Software.WinForms.Core.Serial.Models;

/// <summary>
/// Represents the execution state of a serial command in the pipeline.
/// </summary>
public enum CommandState
{
    /// <summary>Command is waiting in the queue to be sent.</summary>
    Queued,

    /// <summary>Command is currently being transmitted.</summary>
    Sending,

    /// <summary>Waiting for acknowledgment (ACK) from the device.</summary>
    AwaitingAck,

    /// <summary>Waiting for data response from the device.</summary>
    AwaitingData,

    /// <summary>Command completed successfully.</summary>
    Completed,

    /// <summary>Command failed after exhausting retries or due to error.</summary>
    Failed
}
