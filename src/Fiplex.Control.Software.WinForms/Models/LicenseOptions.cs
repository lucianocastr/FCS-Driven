namespace Fiplex.Control.Software.WinForms.Models;

/// <summary>
/// Opciones de licencia de hardware para dispositivos multi-banda.
/// </summary>
/// <remarks>
/// Configuración de licencias por banda de frecuencia:
/// <list type="table">
///   <listheader><term>Índice</term><description>Banda</description></listheader>
///   <item><term>0</term><description>FW0 BAND0 (700 MHz)</description></item>
///   <item><term>1</term><description>FW0 BAND1 (800 MHz)</description></item>
///   <item><term>2</term><description>FW1 BAND0 (VHF)</description></item>
///   <item><term>3</term><description>FW1 BAND1 (UHF)</description></item>
/// </list>
/// </remarks>
public class LicenseOptions
{
    /// <summary>Número de bandas soportadas por el sistema.</summary>
    public const int NumBands = 4;

    /// <summary>
    /// Indica si los filtros estrechos (Narrow Filters) están habilitados por banda.
    /// </summary>
    /// <remarks>Índices: [700 MHz, 800 MHz, VHF, UHF]</remarks>
    public bool[] NarrowFiltersEnabled { get; } = new bool[NumBands];

    /// <summary>
    /// Indica si los filtros de ancho de banda ajustable están habilitados por banda.
    /// </summary>
    public bool[] AdjBwFiltersEnabled { get; } = new bool[NumBands];

    /// <summary>
    /// Indica si el modo de banda única está habilitado por banda.
    /// </summary>
    public bool[] SingleBandEnabled { get; } = new bool[NumBands];

    /// <summary>
    /// Límite de potencia en downlink por banda.
    /// </summary>
    /// <remarks>Rango válido: -128 a 127 dBm.</remarks>
    public short[] PowerLimitDownlink { get; } = new short[NumBands];

    /// <summary>
    /// Firmware de arranque seleccionado.
    /// </summary>
    /// <remarks>0 = 700/800 MHz, 1 = VHF/UHF.</remarks>
    public short BootFirmware { get; set; }

    /// <summary>
    /// Crea una copia profunda de las opciones.
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
    /// Compara igualdad de valores con otra instancia.
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
    /// Representación de cadena para debugging.
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
