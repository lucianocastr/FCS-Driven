using Fiplex.Control.Software.WinForms.Core.Security.Interfaces;
using Fiplex.Control.Software.WinForms.Core.Serial.Interfaces;
using Fiplex.Control.Software.WinForms.Core.Serial.Models;
using Microsoft.Extensions.Logging;

namespace Fiplex.Control.Software.WinForms.Core.Security;

public class WatchdogService : IWatchdogService
{
    private readonly ISerialCommandPipeline _pipeline;
    private readonly ILogger<WatchdogService> _logger;
    
    private PeriodicTimer? _timer;
    private CancellationTokenSource? _cts;
    private Task? _watchdogTask;
    private DateTime _lastSuccessTime;
    private DateTime _lastResetTime;
    private int _consecutiveFailures;
    private TimeSpan _interval = TimeSpan.FromSeconds(25);
    private volatile bool _isEnabled = false;

    public event EventHandler<WatchdogEventArgs>? WatchdogFailed;
    
    /// <summary>
    /// Indicates whether the watchdog is active.
    /// </summary>
    public bool IsEnabled => _isEnabled;

    public WatchdogService(
        ISerialCommandPipeline pipeline,
        ILogger<WatchdogService> logger)
    {
        _pipeline = pipeline;
        _logger = logger;
    }
    
    /// <summary>
    /// Resets the watchdog timer.
    /// </summary>
    public void Reset()
    {
        if (!_isEnabled)
            return;
            
        _lastResetTime = DateTime.UtcNow;
        _logger.LogDebug("Watchdog timer reset");
    }

    public Task StartAsync(TimeSpan interval, CancellationToken ct = default)
    {
        if (_timer != null)
        {
            throw new InvalidOperationException("Watchdog already running");
        }

        _interval = interval;
        _cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        _timer = new PeriodicTimer(interval);
        _lastSuccessTime = DateTime.UtcNow;
        _lastResetTime = DateTime.UtcNow;
        _consecutiveFailures = 0;
        _isEnabled = true;

        _watchdogTask = Task.Run(() => WatchdogLoopAsync(_cts.Token), _cts.Token);

        _logger.LogInformation("Watchdog started with {Interval}s interval", interval.TotalSeconds);
        return Task.CompletedTask;
    }

    public async Task StopAsync()
    {
        _isEnabled = false;
        
        if (_cts != null)
        {
            _cts.Cancel();
            
            if (_watchdogTask != null)
            {
                try
                {
                    await _watchdogTask;
                }
                catch (OperationCanceledException)
                {
                    // Expected
                }
            }

            _cts.Dispose();
            _cts = null;
        }

        if (_timer != null)
        {
            _timer.Dispose();
            _timer = null;
        }

        _logger.LogInformation("Watchdog stopped");
    }

    private async Task WatchdogLoopAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested && _timer != null && _isEnabled)
        {
            try
            {
                await _timer.WaitForNextTickAsync(ct);
                
                // If watchdog is disabled, stop
                if (!_isEnabled)
                {
                    _logger.LogDebug("Watchdog disabled, stopping loop");
                    break;
                }
                
                // If there was a recent reset, don't send command yet
                var timeSinceReset = DateTime.UtcNow - _lastResetTime;
                if (timeSinceReset < _interval * 0.9)
                {
                    _logger.LogDebug("Watchdog skipped due to recent reset ({Ms}ms ago)", 
                        timeSinceReset.TotalMilliseconds);
                    continue;
                }

                var command = new SerialCommand
                {
                    Payload = "N1",
                    ExpectsAck = true,
                    ExpectsData = false,
                    MaxRetries = 2,
                    AckTimeout = TimeSpan.FromSeconds(1),
                    IsSilent = true,
                    CancellationToken = ct
                };

                var result = await _pipeline.EnqueueCommandAsync(command);

                if (result.Success)
                {
                    _consecutiveFailures = 0;
                    _lastSuccessTime = DateTime.UtcNow;
                    _logger.LogDebug("Watchdog keepalive sent successfully");
                }
                else
                {
                    _consecutiveFailures++;
                    _logger.LogWarning(
                        "Watchdog failed ({Count} consecutive): {Status}",
                        _consecutiveFailures,
                        result.Status);

                    WatchdogFailed?.Invoke(this, new WatchdogEventArgs
                    {
                        Exception = result.Error,
                        FailureCount = _consecutiveFailures,
                        LastSuccessTime = _lastSuccessTime
                    });

                    // Stop if too many failures
                    if (_consecutiveFailures >= 3)
                    {
                        _logger.LogError("Watchdog stopped after {Count} consecutive failures", _consecutiveFailures);
                        _isEnabled = false;
                        break;
                    }
                }
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Watchdog loop error");
                
                WatchdogFailed?.Invoke(this, new WatchdogEventArgs
                {
                    Exception = ex,
                    FailureCount = ++_consecutiveFailures,
                    LastSuccessTime = _lastSuccessTime
                });
            }
        }
    }

    public void Dispose()
    {
        StopAsync().GetAwaiter().GetResult();
    }
}
