using Microsoft.Extensions.Logging;

namespace Fiplex.Control.Software.WinForms.Core.Diagnostics;

/// <summary>
/// Thread-safe singleton that holds the active diagnostic log level.
/// Cycle: Warning (Error) → Information → Debug → Trace → Warning.
/// Default is Warning — captures errors/warnings from first run with no user action.
/// </summary>
public sealed class AppLogLevelSwitch
{
    private volatile int _level = (int)LogLevel.Warning;

    public LogLevel CurrentLevel => (LogLevel)_level;
    public bool IsEnabled => CurrentLevel != LogLevel.None;

    public event EventHandler<LogLevel>? LevelChanged;

    public void SetLevel(LogLevel level)
    {
        Interlocked.Exchange(ref _level, (int)level);
        LevelChanged?.Invoke(this, level);
    }

    public void CycleLevel()
    {
        var next = CurrentLevel switch
        {
            LogLevel.Warning     => LogLevel.Information,
            LogLevel.Information => LogLevel.Debug,
            LogLevel.Debug       => LogLevel.Trace,
            _                    => LogLevel.Warning
        };
        SetLevel(next);
    }

    public string DisplayLabel => CurrentLevel switch
    {
        LogLevel.Warning     => "[Log: ERR]",
        LogLevel.Information => "[Log: INFO]",
        LogLevel.Debug       => "[Log: DBG]",
        LogLevel.Trace       => "[Log: TRC]",
        _                    => "[Log: ERR]"
    };
}
