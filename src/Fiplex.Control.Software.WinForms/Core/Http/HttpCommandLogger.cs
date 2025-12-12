using System.Collections.Concurrent;
using System.Text;
using Microsoft.Extensions.Logging;
using Timer = System.Threading.Timer;

namespace Fiplex.Control.Software.WinForms.Core.Http;

/// <summary>
/// Dedicated logging service for HTTP GET commands from the embedded server.
/// 
/// Log format per command:
/// ================================================================================
/// [2024-11-27 14:32:15.123] GET /update.shtml
/// --------------------------------------------------------------------------------
/// REQUEST:
///   Page: /update.shtml
///   Command: S1
///   QueryParams: {}
///   Encode: false
///   ExpectedLengths: [splitwith3tabs:1796,1528,1528,4]
/// --------------------------------------------------------------------------------
/// SERIAL:
///   Payload Sent: S1
///   Raw Response: 48656C6C6F...
///   Response Length: 1796
///   Elapsed: 245ms
///   Retries: 0
/// --------------------------------------------------------------------------------
/// OUTPUT:
///   Format Applied: splitwith3tabs
///   Frame Count: 9
///   Total Length: 14000
///   First 200 chars: ...
/// ================================================================================
/// </summary>
public class HttpCommandLogger : IDisposable
{
    private readonly ILogger<HttpCommandLogger> _logger;
    private readonly string _logDirectory;
    private readonly object _fileLock = new();
    private StreamWriter? _writer;
    private string? _currentLogFile;
    private bool _isEnabled;
    private readonly ConcurrentQueue<CommandLogEntry> _pendingEntries = new();
    private readonly Timer _flushTimer;

    public bool IsEnabled => _isEnabled;

    public HttpCommandLogger(ILogger<HttpCommandLogger> logger)
    {
        _logger = logger;
        _logDirectory = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "Fiplex.Control.Software",
            "HttpCommandLogs");
        
        // Timer for periodic flush (every 5 seconds)
        _flushTimer = new Timer(FlushPendingEntries, null, Timeout.Infinite, Timeout.Infinite);
    }

    /// <summary>
    /// Enables HTTP command logging.
    /// Creates a new log file with timestamp.
    /// </summary>
    public void Enable()
    {
        lock (_fileLock)
        {
            if (_isEnabled) return;

            try
            {
                Directory.CreateDirectory(_logDirectory);
                
                var timestamp = DateTime.Now.ToString("yyyy-MM-dd_HH-mm-ss");
                _currentLogFile = Path.Combine(_logDirectory, $"http_commands_{timestamp}.log");
                
                _writer = new StreamWriter(_currentLogFile, append: false, Encoding.UTF8)
                {
                    AutoFlush = false
                };
                
                WriteHeader();
                
                _isEnabled = true;
                
                // Start flush timer
                _flushTimer.Change(TimeSpan.FromSeconds(5), TimeSpan.FromSeconds(5));
                
                _logger.LogInformation("HTTP Command logging enabled: {LogFile}", _currentLogFile);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to enable HTTP command logging");
            }
        }
    }

    /// <summary>
    /// Disables HTTP command logging.
    /// </summary>
    public void Disable()
    {
        lock (_fileLock)
        {
            if (!_isEnabled) return;

            try
            {
                _flushTimer.Change(Timeout.Infinite, Timeout.Infinite);
                FlushPendingEntries(null);
                
                WriteFooter();
                
                _writer?.Flush();
                _writer?.Dispose();
                _writer = null;
                
                _isEnabled = false;
                
                _logger.LogInformation("HTTP Command logging disabled. Log file: {LogFile}", _currentLogFile);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error disabling HTTP command logging");
            }
        }
    }

    /// <summary>
    /// Logs a GET command with all its details.
    /// Thread-safe and non-blocking (uses internal queue).
    /// </summary>
    public void LogCommand(CommandLogEntry entry)
    {
        if (!_isEnabled) return;
        
        _pendingEntries.Enqueue(entry);
    }

    /// <summary>
    /// Gets the current log file path.
    /// </summary>
    public string? GetCurrentLogFile() => _currentLogFile;

    /// <summary>
    /// Gets the log directory path.
    /// </summary>
    public string GetLogDirectory() => _logDirectory;

    private void WriteHeader()
    {
        if (_writer == null) return;

        var sb = new StringBuilder();
        sb.AppendLine("╔════════════════════════════════════════════════════════════════════════════════╗");
        sb.AppendLine("║            FIPLEX CONTROL SOFTWARE - HTTP COMMAND LOG                         ║");
        sb.AppendLine("╠════════════════════════════════════════════════════════════════════════════════╣");
        sb.AppendLine($"║  Started: {DateTime.Now:yyyy-MM-dd HH:mm:ss}                                                  ║");
        sb.AppendLine($"║  Machine: {Environment.MachineName,-55}║");
        sb.AppendLine($"║  Version: C# (.NET {Environment.Version})                                               ║");
        sb.AppendLine("║                                                                                  ║");
        sb.AppendLine("╚════════════════════════════════════════════════════════════════════════════════╝");
        sb.AppendLine();
        
        _writer.Write(sb.ToString());
    }

    private void WriteFooter()
    {
        if (_writer == null) return;

        var sb = new StringBuilder();
        sb.AppendLine();
        sb.AppendLine("╔════════════════════════════════════════════════════════════════════════════════╗");
        sb.AppendLine($"║  Ended: {DateTime.Now:yyyy-MM-dd HH:mm:ss}                                                    ║");
        sb.AppendLine("╚════════════════════════════════════════════════════════════════════════════════╝");
        
        _writer.Write(sb.ToString());
    }

    private void FlushPendingEntries(object? state)
    {
        if (!_isEnabled) return;

        lock (_fileLock)
        {
            if (_writer == null) return;

            try
            {
                while (_pendingEntries.TryDequeue(out var entry))
                {
                    WriteEntry(entry);
                }
                
                _writer.Flush();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error flushing HTTP command log entries");
            }
        }
    }

    private void WriteEntry(CommandLogEntry entry)
    {
        if (_writer == null) return;

        var sb = new StringBuilder();
        
        // Entry separator
        sb.AppendLine("================================================================================");
        sb.AppendLine($"[{entry.Timestamp:yyyy-MM-dd HH:mm:ss.fff}] GET {entry.Page}");
        sb.AppendLine("--------------------------------------------------------------------------------");
        
        // REQUEST section
        sb.AppendLine("REQUEST:");
        sb.AppendLine($"  Page: {entry.Page}");
        sb.AppendLine($"  Command: {entry.SerialCommand}");
        sb.AppendLine($"  QueryParams: {FormatDictionary(entry.QueryParams)}");
        sb.AppendLine($"  Encode: {entry.RequiresEncoding.ToString().ToLower()}");
        sb.AppendLine($"  ExpectedLengths: [{string.Join(", ", entry.ExpectedLengths ?? Array.Empty<string>())}]");
        sb.AppendLine("--------------------------------------------------------------------------------");
        
        // SERIAL section
        sb.AppendLine("SERIAL:");
        sb.AppendLine($"  Payload Sent: {entry.PayloadSent}");
        sb.AppendLine($"  Raw Response Length: {entry.RawResponse?.Length ?? 0}");
        sb.AppendLine($"  Elapsed: {entry.ElapsedMs:F0}ms");
        sb.AppendLine($"  Retries: {entry.Retries}");
        sb.AppendLine($"  Status: {entry.Status}");
        
        if (!string.IsNullOrEmpty(entry.ErrorMessage))
        {
            sb.AppendLine($"  Error: {entry.ErrorMessage}");
        }
        
        // COMPLETE Raw Response (not truncated for analysis)
        sb.AppendLine("  Raw Response [FULL]:");
        sb.AppendLine("  <<<BEGIN_RAW_RESPONSE>>>");
        sb.AppendLine(entry.RawResponse ?? "(empty)");
        sb.AppendLine("  <<<END_RAW_RESPONSE>>>");
        sb.AppendLine("--------------------------------------------------------------------------------");
        
        // OUTPUT section
        sb.AppendLine("OUTPUT:");
        sb.AppendLine($"  Format Applied: {entry.FormatApplied ?? "none"}");
        sb.AppendLine($"  Frame Count: {entry.FrameCount}");
        sb.AppendLine($"  Final Response Length: {entry.FinalResponse?.Length ?? 0}");
        
        // COMPLETE Final Response (not truncated for analysis)
        sb.AppendLine("  Final Response [FULL]:");
        sb.AppendLine("  <<<BEGIN_FINAL_RESPONSE>>>");
        sb.AppendLine(entry.FinalResponse ?? "(empty)");
        sb.AppendLine("  <<<END_FINAL_RESPONSE>>>");
        
        // Cache info
        if (entry.WasCached)
        {
            sb.AppendLine($"  [CACHED] Returned from previousans/dpreviousans cache");
        }
        
        sb.AppendLine("================================================================================");
        sb.AppendLine();
        
        _writer.Write(sb.ToString());
    }

    private static string FormatDictionary(IDictionary<string, string?>? dict)
    {
        if (dict == null || dict.Count == 0)
            return "{}";
        
        var pairs = dict.Select(kvp => $"{kvp.Key}={kvp.Value ?? "null"}");
        return $"{{{string.Join(", ", pairs)}}}";
    }

    private static string TruncateString(string? str, int maxLength)
    {
        if (string.IsNullOrEmpty(str))
            return "(empty)";
        
        if (str.Length <= maxLength)
            return str;
        
        return str.Substring(0, maxLength) + $"... [{str.Length - maxLength} more chars]";
    }

    public void Dispose()
    {
        Disable();
        _flushTimer.Dispose();
    }
}

/// <summary>
/// Log entry for an HTTP GET command.
/// Contains all details needed for comparative analysis.
/// </summary>
public class CommandLogEntry
{
    /// <summary>Command timestamp</summary>
    public DateTime Timestamp { get; init; } = DateTime.Now;
    
    /// <summary>HTTP page/route requested (e.g.: /update.shtml)</summary>
    public string Page { get; init; } = string.Empty;
    
    /// <summary>Mapped serial command (e.g.: S1, U1, C1)</summary>
    public string SerialCommand { get; init; } = string.Empty;
    
    /// <summary>Query string parameters</summary>
    public IDictionary<string, string?>? QueryParams { get; init; }
    
    /// <summary>Whether the command requires hex encoding</summary>
    public bool RequiresEncoding { get; init; }
    
    /// <summary>Expected lengths from settings.cfg</summary>
    public string[]? ExpectedLengths { get; init; }
    
    /// <summary>Payload actually sent to serial port</summary>
    public string PayloadSent { get; init; } = string.Empty;
    
    /// <summary>Raw response from device</summary>
    public string? RawResponse { get; init; }
    
    /// <summary>Execution time in milliseconds</summary>
    public double ElapsedMs { get; init; }
    
    /// <summary>Number of retries</summary>
    public int Retries { get; init; }
    
    /// <summary>Command status (success, timeout, error)</summary>
    public string Status { get; init; } = "unknown";
    
    /// <summary>Error message if applicable</summary>
    public string? ErrorMessage { get; init; }
    
    /// <summary>Format applied (splitwith3tabs, none)</summary>
    public string? FormatApplied { get; init; }
    
    /// <summary>Number of frames generated (for splitwith3tabs)</summary>
    public int FrameCount { get; init; }
    
    /// <summary>Final response sent to HTTP client</summary>
    public string? FinalResponse { get; init; }
    
    /// <summary>Whether the response came from cache (previousans/dpreviousans)</summary>
    public bool WasCached { get; init; }
}
