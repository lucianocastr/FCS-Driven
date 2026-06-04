using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging;

namespace Fiplex.Control.Software.WinForms.Core.Diagnostics;

/// <summary>
/// ILogger instance per MEL category. Enqueues formatted lines to AppFileLoggerProvider.
/// Never touches the StreamWriter directly — fire-and-forget enqueue only.
/// </summary>
internal sealed class AppFileLogger : ILogger
{
    private readonly string _category;
    private readonly AppLogLevelSwitch _switch;
    private readonly AppFileLoggerProvider _provider;

    // Categories with a fixed minimum level that overrides the active AppLogLevelSwitch.
    // Used to suppress high-frequency background noise (keepalive loops, etc.) even at Debug.
    private static readonly Dictionary<string, LogLevel> CategoryMinLevels = new()
    {
        { "WatchdogService", LogLevel.Warning },
    };

    private static readonly (Regex Pattern, string Replacement)[] Sanitizers =
    [
        (new Regex(@"\*0\S+",                                             RegexOptions.Compiled), "*0[***]"),
        (new Regex(@"(?i)(password|secret)\s*[:=]\s*\S+",                RegexOptions.Compiled), "$1=[***]"),
        (new Regex(@"(?i)Bearer\s+\S+",                                   RegexOptions.Compiled), "Bearer [***]"),
        (new Regex(@"(?i)Claim:\s+'[^']+'\s+=\s+'[^']+'",               RegexOptions.Compiled), "Claim: '[type]' = '[***]'"),
    ];

    internal AppFileLogger(string category, AppLogLevelSwitch sw, AppFileLoggerProvider provider)
    {
        _category = category;
        _switch = sw;
        _provider = provider;
    }

    public bool IsEnabled(LogLevel logLevel)
    {
        if (!_switch.IsEnabled) return false;
        var effectiveMin = _switch.CurrentLevel;
        var shortCat = _category.Contains('.') ? _category[(_category.LastIndexOf('.') + 1)..] : _category;
        if (CategoryMinLevels.TryGetValue(shortCat, out var catMin) && catMin > effectiveMin)
            effectiveMin = catMin;
        return logLevel >= effectiveMin;
    }

    public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;

    public void Log<TState>(
        LogLevel logLevel,
        EventId eventId,
        TState state,
        Exception? exception,
        Func<TState, Exception?, string> formatter)
    {
        if (!IsEnabled(logLevel)) return;

        var message = formatter(state, exception);
        if (exception != null)
            message += $" | {exception.GetType().Name}: {exception.Message}";

        message = Sanitize(message);

        var prefix = logLevel switch
        {
            LogLevel.Trace       => "TRC ",
            LogLevel.Debug       => "DBG ",
            LogLevel.Information => "INFO",
            LogLevel.Warning     => "WARN",
            LogLevel.Error       => "ERR ",
            _                    => "CRIT"
        };

        var shortCat = AbbreviateCategory(_category);
        var line = $"{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff} [{prefix}] {shortCat,-16} — {message}";

        _provider.Enqueue(line);

        if (logLevel >= LogLevel.Error)
            _provider.SignalImmediateFlush();
    }

    private static string Sanitize(string msg)
    {
        foreach (var (pattern, replacement) in Sanitizers)
            msg = pattern.Replace(msg, replacement);
        return msg;
    }

    private static string AbbreviateCategory(string category)
    {
        var lastDot = category.LastIndexOf('.');
        return lastDot >= 0 ? category[(lastDot + 1)..] : category;
    }
}
