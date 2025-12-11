namespace Fiplex.Control.Software.WinForms.Core.Serial.Models;

/// <summary>
/// Represents a complete serial communication frame including command, response, and timing information.
/// </summary>
/// <param name="Command">The command that was sent.</param>
/// <param name="Response">The response received from the device.</param>
/// <param name="Elapsed">The total time elapsed for the command execution.</param>
/// <param name="RetryCount">The number of retries performed before success or failure.</param>
public record SerialFrame(
    string Command,
    string Response,
    TimeSpan Elapsed,
    int RetryCount
);
