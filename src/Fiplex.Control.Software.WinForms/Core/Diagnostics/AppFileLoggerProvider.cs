using System.Collections.Concurrent;
using System.Text;
using Microsoft.Extensions.Logging;

namespace Fiplex.Control.Software.WinForms.Core.Diagnostics;

/// <summary>
/// ILoggerProvider that routes all MEL events to a daily diagnostic log file.
/// File: %APPDATA%\FiplexControlSoftware\FCSLog_YYYYMMDD.txt
/// Non-blocking: enqueue on caller thread, flush every 200ms on background loop.
/// Error/Critical events signal immediate flush via SemaphoreSlim.
/// Retains files for 7 days; older files are deleted on startup.
/// </summary>
public sealed class AppFileLoggerProvider : ILoggerProvider
{
    private const int RetentionDays = 7;
    private const string FilePrefix = "FCSLog_";

    private readonly AppLogLevelSwitch _switch;
    private readonly string _version;
    private readonly ConcurrentQueue<string> _queue = new();
    private readonly SemaphoreSlim _flushSignal = new(0, 1);

    private StreamWriter? _writer;
    private CancellationTokenSource? _cts;
    private Task? _flushTask;

    public AppFileLoggerProvider(AppLogLevelSwitch sw, string version = "")
    {
        _switch = sw;
        _version = version;
        OpenFile();
        PurgeOldFiles();
    }

    public ILogger CreateLogger(string categoryName) =>
        new AppFileLogger(categoryName, _switch, this);

    internal void Enqueue(string line) => _queue.Enqueue(line);

    internal void SignalImmediateFlush()
    {
        if (_flushSignal.CurrentCount == 0)
            _flushSignal.Release(1);
    }

    /// <summary>
    /// Synchronous drain — called from crash handlers before process exits.
    /// </summary>
    public void ForceFlush(string? finalMessage = null)
    {
        if (finalMessage != null)
            _queue.Enqueue($"{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff} [ERR ] AppLog          — {finalMessage}");
        DrainQueue();
    }

    private void OpenFile()
    {
        try
        {
            var dir = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
                "FiplexControlSoftware");
            Directory.CreateDirectory(dir);

            var file = Path.Combine(dir, $"{FilePrefix}{DateTime.Now:yyyyMMdd}.txt");
            _writer = new StreamWriter(file, append: true, Encoding.UTF8) { AutoFlush = false };

            _cts = new CancellationTokenSource();
            _flushTask = Task.Run(() => FlushLoop(_cts.Token));

            var header = $"{"─",60}".Replace(" ", "─");
            var levelLabel = _switch.DisplayLabel.Replace("[", "").Replace("]", "");
            _queue.Enqueue(header);
            _queue.Enqueue($"SESSION START  {DateTime.Now:yyyy-MM-dd HH:mm:ss}  FCS {_version}  [{levelLabel}]");
            _queue.Enqueue(header);
        }
        catch
        {
            // If file cannot be opened (permissions, disk full), log silently fails.
            // App continues normally — diagnostics are best-effort.
        }
    }

    private void PurgeOldFiles()
    {
        try
        {
            var dir = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
                "FiplexControlSoftware");

            var cutoff = DateTime.Now.AddDays(-RetentionDays);
            foreach (var file in Directory.GetFiles(dir, $"{FilePrefix}*.txt"))
            {
                if (File.GetLastWriteTime(file) < cutoff)
                    File.Delete(file);
            }
        }
        catch { }
    }

    private async Task FlushLoop(CancellationToken ct)
    {
        try
        {
            while (!ct.IsCancellationRequested)
            {
                await Task.WhenAny(Task.Delay(200, ct), _flushSignal.WaitAsync(ct))
                          .ConfigureAwait(false);
                DrainQueue();
            }
        }
        catch (OperationCanceledException) { }
        finally
        {
            DrainQueue();
        }
    }

    private void DrainQueue()
    {
        if (_writer is null) return;
        bool wrote = false;
        while (_queue.TryDequeue(out var line))
        {
            _writer.WriteLine(line);
            wrote = true;
        }
        if (wrote) _writer.Flush();
    }

    public void Dispose()
    {
        _cts?.Cancel();
        _flushTask?.Wait(TimeSpan.FromSeconds(2));

        var footer = $"{"─",60}".Replace(" ", "─");
        _queue.Enqueue(footer);
        _queue.Enqueue($"SESSION END    {DateTime.Now:yyyy-MM-dd HH:mm:ss}");
        _queue.Enqueue(footer);
        DrainQueue();

        _writer?.Dispose();
        _writer = null;
        _cts?.Dispose();
        _flushSignal.Dispose();
    }
}
