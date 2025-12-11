namespace Fiplex.Control.Software.WinForms.Core.Serial.Models;

/// <summary>
/// Configuración centralizada de timeouts seriales.
/// Soporta perfiles específicos por tipo de dispositivo.
/// </summary>
public class SerialTimeouts
{
    public TimeSpan AckTimeout { get; set; } = TimeSpan.FromMilliseconds(800);
    public TimeSpan DataTimeoutGet { get; set; } = TimeSpan.FromSeconds(5);
    public TimeSpan DataTimeoutPost { get; set; } = TimeSpan.FromSeconds(10);
    public int MaxRetries { get; set; } = 3;
    public TimeSpan RetryDelay { get; set; } = TimeSpan.FromMilliseconds(200);

    public static SerialTimeouts Default => new();
    
    /// <summary>
    /// Retorna timeouts optimizados según tipo de dispositivo.
    /// </summary>
    public static SerialTimeouts ForDevice(string deviceType) => deviceType switch
    {
        "5dm" => new SerialTimeouts 
        { 
            DataTimeoutGet = TimeSpan.FromSeconds(8),
            MaxRetries = 2 
        },
        "1dm" when deviceType.Contains("8.0") => new SerialTimeouts 
        { 
            AckTimeout = TimeSpan.FromSeconds(1) 
        },
        _ => Default
    };
}
