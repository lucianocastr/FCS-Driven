using System.Diagnostics.Metrics;

namespace Fiplex.Control.Software.WinForms.Core.Metrics;

/// <summary>
/// Métricas de comandos seriales usando System.Diagnostics.Metrics.
/// Compatible con OpenTelemetry y exportadores estándar.
/// </summary>
public class CommandMetrics : IDisposable
{
    private readonly Meter _meter;
    private readonly Counter<int> _commandCounter;
    private readonly Counter<int> _errorCounter;
    private readonly Histogram<double> _commandDuration;
    private readonly Counter<int> _retryCounter;

    public CommandMetrics()
    {
        _meter = new Meter("Fiplex.Commands", "1.0.0");
        
        _commandCounter = _meter.CreateCounter<int>(
            "commands_total", 
            "count", 
            "Total number of commands executed");
            
        _errorCounter = _meter.CreateCounter<int>(
            "command_errors_total", 
            "count", 
            "Total number of command errors");
            
        _commandDuration = _meter.CreateHistogram<double>(
            "command_duration_seconds", 
            "seconds", 
            "Command execution duration");
            
        _retryCounter = _meter.CreateCounter<int>(
            "command_retries_total", 
            "count", 
            "Total number of command retries");
    }

    /// <summary>
    /// Registra la ejecución de un comando con sus métricas.
    /// </summary>
    /// <param name="command">Nombre del comando (ej: /test, /version)</param>
    /// <param name="status">Estado del resultado (success, timeout, error)</param>
    /// <param name="durationSeconds">Duración en segundos</param>
    /// <param name="retries">Número de reintentos realizados</param>
    public void RecordCommand(string command, string status, double durationSeconds, int retries)
    {
        _commandCounter.Add(1, 
            new KeyValuePair<string, object?>("command", command),
            new KeyValuePair<string, object?>("status", status));
            
        if (status != "success")
        {
            _errorCounter.Add(1,
                new KeyValuePair<string, object?>("command", command),
                new KeyValuePair<string, object?>("error_type", status));
        }
        
        _commandDuration.Record(durationSeconds,
            new KeyValuePair<string, object?>("command", command));
            
        if (retries > 0)
        {
            _retryCounter.Add(retries,
                new KeyValuePair<string, object?>("command", command));
        }
    }

    public void Dispose()
    {
        _meter?.Dispose();
    }
}
