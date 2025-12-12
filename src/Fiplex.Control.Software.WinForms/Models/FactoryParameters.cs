namespace Fiplex.Control.Software.WinForms.Models;

/// <summary>
/// Factory frequency parameters for a band (Uplink or Downlink).
/// </summary>
public record FreqFactoryParameters
{
    /// <summary>Start frequency in Hz.</summary>
    public double FStart { get; init; }
    
    /// <summary>Stop frequency in Hz.</summary>
    public double FStop { get; init; }
    
    /// <summary>Reference frequency in Hz.</summary>
    public double FRef { get; init; }
    
    /// <summary>Frequency step in Hz.</summary>
    public double FStep { get; init; }
    
    /// <summary>Frequency modulus.</summary>
    public double Modulo { get; init; }
    
    /// <summary>Frequency step for adjustable bandwidth (ADJ BW).</summary>
    public double FStepAdj { get; init; }
    
    /// <summary>Modulus for adjustable bandwidth.</summary>
    public double ModuloAdj { get; init; }
    
    /// <summary>Gain limit in dB.</summary>
    public double GainLimit { get; init; }
    
    /// <summary>Power limit in dBm.</summary>
    public double PowerLimit { get; init; }
}

/// <summary>
/// Device-specific factory parameters by device type.
/// </summary>
/// <remarks>
/// Contains the device's factory configuration including
/// frequency limits, channels, and supported capabilities.
/// </remarks>
public record FactoryParameters
{
    /// <summary>Unique device identifier.</summary>
    public string DeviceId { get; init; } = string.Empty;
    
    /// <summary>Additional device settings.</summary>
    public Dictionary<string, string> Settings { get; init; } = new();
    
    /// <summary>Device calibration data.</summary>
    public Dictionary<string, double> Calibration { get; init; } = new();
    
    /// <summary>
    /// Device type (e.g., "1c", "2c", "5dm").
    /// </summary>
    public string TDev { get; init; } = string.Empty;
    
    /// <summary>
    /// Device firmware version.
    /// </summary>
    public double NDev { get; init; }
    
    /// <summary>
    /// Indicates whether the device supports adjustable bandwidth (ADJ BW).
    /// </summary>
    public bool IsAdjBW { get; init; }
    
    /// <summary>
    /// Device bandwidth in Hz.
    /// </summary>
    /// <remarks>
    /// Typical values: 12.5 MHz, 25 MHz, 50 MHz.
    /// </remarks>
    public double BandWidth { get; init; }
    
    /// <summary>
    /// Indicates whether the device supports multiple channels.
    /// </summary>
    public bool SupportsMultiChannel { get; init; }
    
    /// <summary>
    /// Indicates whether the device requires multipart commands (O1+U1).
    /// </summary>
    /// <remarks>Specific to DAS devices (type 5dm).</remarks>
    public bool RequiresMultipartCommand { get; init; }
    
    /// <summary>
    /// Band 0 parameters (Uplink).
    /// </summary>
    public FreqFactoryParameters Band0 { get; init; } = new();
    
    /// <summary>
    /// Band 1 parameters (Downlink).
    /// </summary>
    public FreqFactoryParameters Band1 { get; init; } = new();
    
    /// <summary>
    /// Maximum number of supported channels.
    /// </summary>
    public short MaxChannels { get; init; } = 24;
    
    /// <summary>
    /// Maximum number of channels for ADJ BW mode.
    /// </summary>
    public short MaxChannelsAdj { get; init; }
    
    /// <summary>
    /// Indicates whether UL/DL frequencies are linked (tracking).
    /// </summary>
    public bool LinkedFreq { get; init; }
}
