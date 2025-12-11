namespace Fiplex.Control.Software.WinForms.Core.Serial.Models;

/// <summary>
/// Represents the result of a serial command execution.
/// </summary>
/// <param name="CommandId">Unique identifier of the command.</param>
/// <param name="Success">Whether the command completed successfully.</param>
/// <param name="Status">The final status of the command execution.</param>
/// <param name="Data">The response data received, if any.</param>
/// <param name="Error">The exception that occurred, if the command failed.</param>
/// <param name="Metrics">Performance metrics for the command execution.</param>
public record SerialResult(
    Guid CommandId,
    bool Success,
    CommandResultStatus Status,
    string Data = "",
    Exception? Error = null,
    SerialMetrics? Metrics = null
);
