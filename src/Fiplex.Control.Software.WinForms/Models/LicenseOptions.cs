namespace Fiplex.Control.Software.WinForms.Models;

/// <summary>
/// Hardware license options for multi-band devices.
/// </summary>
/// <remarks>
/// License configuration per frequency band:
/// <list type="table">
///   <listheader><term>Index</term><description>Band</description></listheader>
///   <item><term>0</term><description>FW0 BAND0 (700 MHz)</description></item>
///   <item><term>1</term><description>FW0 BAND1 (800 MHz)</description></item>
///   <item><term>2</term><description>FW1 BAND0 (VHF)</description></item>
///   <item><term>3</term><description>FW1 BAND1 (UHF)</description></item>
/// </list>
/// </remarks>
public class LicenseOptions
{
    /// <summary>Number of bands supported by the system.</summary>
    public const int NumBands = 4;

    /// <summary>
    /// Indicates if Narrow Filters are enabled per band.
    /// </summary>
    /// <remarks>Indices: [700 MHz, 800 MHz, VHF, UHF]</remarks>
    public bool[] NarrowFiltersEnabled { get; } = new bool[NumBands];

    /// <summary>
    /// Indicates if adjustable bandwidth filters are enabled per band.
    /// </summary>
    public bool[] AdjBwFiltersEnabled { get; } = new bool[NumBands];

    /// <summary>
    /// Indicates if single band mode is enabled per band.
    /// </summary>
    public bool[] SingleBandEnabled { get; } = new bool[NumBands];

    /// <summary>
    /// Downlink power limit per band.
    /// </summary>
    /// <remarks>Valid range: -128 to 127 dBm.</remarks>
    public short[] PowerLimitDownlink { get; } = new short[NumBands];

    /// <summary>
    /// Selected boot firmware.
    /// </summary>
    /// <remarks>0 = 700/800 MHz, 1 = VHF/UHF.</remarks>
    public short BootFirmware { get; set; }

    /// <summary>
    /// Creates a deep copy of the options.
    /// </summary>
    public LicenseOptions Clone()
    {
        var clone = new LicenseOptions { BootFirmware = BootFirmware };
        
        for (int i = 0; i < NumBands; i++)
        {
            clone.NarrowFiltersEnabled[i] = NarrowFiltersEnabled[i];
            clone.AdjBwFiltersEnabled[i] = AdjBwFiltersEnabled[i];
            clone.SingleBandEnabled[i] = SingleBandEnabled[i];
            clone.PowerLimitDownlink[i] = PowerLimitDownlink[i];
        }
        
        return clone;
    }
    
    /// <summary>
    /// Compares value equality with another instance.
    /// </summary>
    public bool ValueEquals(LicenseOptions? other)
    {
        if (other is null) return false;
        if (ReferenceEquals(this, other)) return true;
        
        if (BootFirmware != other.BootFirmware) return false;
        
        for (int i = 0; i < NumBands; i++)
        {
            if (NarrowFiltersEnabled[i] != other.NarrowFiltersEnabled[i]) return false;
            if (AdjBwFiltersEnabled[i] != other.AdjBwFiltersEnabled[i]) return false;
            if (SingleBandEnabled[i] != other.SingleBandEnabled[i]) return false;
            if (PowerLimitDownlink[i] != other.PowerLimitDownlink[i]) return false;
        }
        
        return true;
    }
    
    /// <summary>
    /// String representation for debugging.
    /// </summary>
    public override string ToString()
    {
        return $"LicenseOptions[Boot={BootFirmware}, " +
               $"Narrow=[{string.Join(",", NarrowFiltersEnabled)}], " +
               $"AdjBw=[{string.Join(",", AdjBwFiltersEnabled)}], " +
               $"Single=[{string.Join(",", SingleBandEnabled)}], " +
               $"PowerDL=[{string.Join(",", PowerLimitDownlink)}]]";
    }
}
