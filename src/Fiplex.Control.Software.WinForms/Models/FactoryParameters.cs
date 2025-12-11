namespace Fiplex.Control.Software.WinForms.Models;

/// <summary>
/// Parámetros de frecuencia de fábrica para una banda (Uplink o Downlink).
/// </summary>
public record FreqFactoryParameters
{
    /// <summary>Frecuencia de inicio en Hz.</summary>
    public double FStart { get; init; }
    
    /// <summary>Frecuencia de parada en Hz.</summary>
    public double FStop { get; init; }
    
    /// <summary>Frecuencia de referencia en Hz.</summary>
    public double FRef { get; init; }
    
    /// <summary>Paso de frecuencia en Hz.</summary>
    public double FStep { get; init; }
    
    /// <summary>Módulo de frecuencia.</summary>
    public double Modulo { get; init; }
    
    /// <summary>Paso de frecuencia para ancho de banda ajustable (ADJ BW).</summary>
    public double FStepAdj { get; init; }
    
    /// <summary>Módulo para ancho de banda ajustable.</summary>
    public double ModuloAdj { get; init; }
    
    /// <summary>Límite de ganancia en dB.</summary>
    public double GainLimit { get; init; }
    
    /// <summary>Límite de potencia en dBm.</summary>
    public double PowerLimit { get; init; }
}

/// <summary>
/// Parámetros de fábrica específicos por tipo de dispositivo.
/// </summary>
/// <remarks>
/// Contiene la configuración de fábrica del dispositivo incluyendo
/// límites de frecuencia, canales y capacidades soportadas.
/// </remarks>
public record FactoryParameters
{
    /// <summary>Identificador único del dispositivo.</summary>
    public string DeviceId { get; init; } = string.Empty;
    
    /// <summary>Configuraciones adicionales del dispositivo.</summary>
    public Dictionary<string, string> Settings { get; init; } = new();
    
    /// <summary>Datos de calibración del dispositivo.</summary>
    public Dictionary<string, double> Calibration { get; init; } = new();
    
    /// <summary>
    /// Tipo de dispositivo (ej: "1c", "2c", "5dm").
    /// </summary>
    public string TDev { get; init; } = string.Empty;
    
    /// <summary>
    /// Versión del firmware del dispositivo.
    /// </summary>
    public double NDev { get; init; }
    
    /// <summary>
    /// Indica si el dispositivo soporta ancho de banda ajustable (ADJ BW).
    /// </summary>
    public bool IsAdjBW { get; init; }
    
    /// <summary>
    /// Ancho de banda del dispositivo en Hz.
    /// </summary>
    /// <remarks>
    /// Valores típicos: 12.5 MHz, 25 MHz, 50 MHz.
    /// </remarks>
    public double BandWidth { get; init; }
    
    /// <summary>
    /// Indica si el dispositivo soporta múltiples canales.
    /// </summary>
    public bool SupportsMultiChannel { get; init; }
    
    /// <summary>
    /// Indica si el dispositivo requiere comandos multipart (O1+U1).
    /// </summary>
    /// <remarks>Específico para dispositivos DAS (tipo 5dm).</remarks>
    public bool RequiresMultipartCommand { get; init; }
    
    /// <summary>
    /// Parámetros de la banda 0 (Uplink).
    /// </summary>
    public FreqFactoryParameters Band0 { get; init; } = new();
    
    /// <summary>
    /// Parámetros de la banda 1 (Downlink).
    /// </summary>
    public FreqFactoryParameters Band1 { get; init; } = new();
    
    /// <summary>
    /// Número máximo de canales soportados.
    /// </summary>
    public short MaxChannels { get; init; } = 24;
    
    /// <summary>
    /// Número máximo de canales para modo ADJ BW.
    /// </summary>
    public short MaxChannelsAdj { get; init; }
    
    /// <summary>
    /// Indica si las frecuencias UL/DL están enlazadas (tracking).
    /// </summary>
    public bool LinkedFreq { get; init; }
}
