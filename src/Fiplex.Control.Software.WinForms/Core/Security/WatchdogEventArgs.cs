namespace Fiplex.Control.Software.WinForms.Core.Security;

/// <summary>
/// Event arguments for watchdog timeout events.
/// </summary>
/// <remarks>
/// The watchdog monitors device communication and raises events when failures are detected.
/// </remarks>
public class WatchdogEventArgs : EventArgs
{
    /// <summary>Gets or sets the exception that caused the watchdog failure, if any.</summary>
    public Exception? Exception { get; set; }

    /// <summary>Gets or sets the number of consecutive failures detected.</summary>
    public int FailureCount { get; set; }

    /// <summary>Gets or sets the timestamp of the last successful communication.</summary>
    public DateTime LastSuccessTime { get; set; }
}
