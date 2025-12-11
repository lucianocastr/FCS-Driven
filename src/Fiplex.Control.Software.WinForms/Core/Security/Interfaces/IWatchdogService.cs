namespace Fiplex.Control.Software.WinForms.Core.Security.Interfaces;

public interface IWatchdogService : IDisposable
{
    Task StartAsync(TimeSpan interval, CancellationToken ct = default);
    Task StopAsync();
    
    /// <summary>
    /// Resetea el timer del watchdog.
    /// Debe llamarse en cada comando serial enviado para mantener sesión activa.
    /// </summary>
    void Reset();
    
    /// <summary>
    /// Indica si el watchdog está activo.
    /// </summary>
    bool IsEnabled { get; }
    
    event EventHandler<WatchdogEventArgs>? WatchdogFailed;
}
