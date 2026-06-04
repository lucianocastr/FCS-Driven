using System.Collections.Concurrent;
using System.Text;

namespace Fiplex.Control.Software.WinForms.Core.Diagnostics;

/// <summary>
/// Non-blocking trace logger that mirrors VB 1.9 WriteLog().
/// Writes to %APPDATA%\Fiplex\USBmessages_YYYYMMDD.txt via a background flush loop.
/// Pipeline threads enqueue fire-and-forget — zero blocking on serial hot path.
/// </summary>
public sealed class SerialTraceLogger : IDisposable
{
    private readonly ConcurrentQueue<string> _queue = new();
    private StreamWriter? _writer;
    private CancellationTokenSource? _cts;
    private Task? _flushTask;

    public bool IsEnabled { get; private set; }

    public void Enable(string version, string machine)
    {
        if (IsEnabled) return;

        var dir = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "Fiplex");
        Directory.CreateDirectory(dir);
        var file = Path.Combine(dir, $"USBmessages_{DateTime.Now:yyyyMMdd}.txt");
        _writer = new StreamWriter(file, append: true, Encoding.UTF8) { AutoFlush = false };
        IsEnabled = true;
        _cts = new CancellationTokenSource();
        _flushTask = Task.Run(() => FlushLoop(_cts.Token));

        Log("=== Traces ON ===");
        Log($"=== FCS {version}  Machine: {machine} ===");
    }

    public void Disable()
    {
        if (!IsEnabled) return;

        Log("=== Traces OFF ===");
        IsEnabled = false;
        _cts?.Cancel();
        _flushTask?.Wait(TimeSpan.FromSeconds(2));
        DrainQueue();
        _writer?.Dispose();
        _writer = null;
        _cts?.Dispose();
        _cts = null;
    }

    /// <summary>
    /// Enqueues a timestamped line. Never blocks — safe to call from any thread.
    /// </summary>
    public void Log(string msg)
    {
        var line = $"{DateTime.Now:HH:mm:ss.fff}\t{msg}";
        _queue.Enqueue(line);
    }

    private async Task FlushLoop(CancellationToken ct)
    {
        try
        {
            while (!ct.IsCancellationRequested)
            {
                await Task.Delay(200, ct).ConfigureAwait(false);
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

    public void Dispose() => Disable();
}
