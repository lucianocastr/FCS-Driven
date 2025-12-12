namespace Fiplex.Control.Software.WinForms.Core.Security.Interfaces;

public interface IWatchdogService : IDisposable
{
    Task StartAsync(TimeSpan interval, CancellationToken ct = default);
    Task StopAsync();
    
    /// <summary>
    /// Resets the watchdog timer.
    /// Must be called on each serial command sent to keep the session active.
    /// </summary>
    void Reset();
    
    /// <summary>
    /// Indicates whether the watchdog is active.
    /// </summary>
    bool IsEnabled { get; }
    
    event EventHandler<WatchdogEventArgs>? WatchdogFailed;
}
