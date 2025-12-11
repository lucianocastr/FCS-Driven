namespace Fiplex.Control.Software.WinForms.Core.Serial.Models;

/// <summary>
/// Contains performance metrics for a serial command execution.
/// </summary>
/// <param name="BytesSent">Number of bytes transmitted to the device.</param>
/// <param name="BytesReceived">Number of bytes received from the device.</param>
/// <param name="AckLatency">Time elapsed from sending command to receiving ACK, if applicable.</param>
/// <param name="TotalRoundTripTime">Total time from command send to final response.</param>
/// <param name="RetryCount">Number of retry attempts performed.</param>
public record SerialMetrics(
    int BytesSent,
    int BytesReceived,
    TimeSpan? AckLatency,
    TimeSpan TotalRoundTripTime,
    int RetryCount
);
