using Fiplex.Control.Software.WinForms.Models;

namespace Fiplex.Control.Software.WinForms.Core.Config.Interfaces;

/// <summary>
/// Service for Ethernet Rabbit module management.
/// </summary>
public interface IEthernetModuleService
{
    /// <summary>
    /// Reads the factory parameters from the device.
    /// </summary>
    /// <param name="header">Optional header for PSC Master (5dm): "00" or "01"</param>
    /// <param name="ct">Cancellation token</param>
    /// <returns>Result with parameters string or error</returns>
    Task<EthernetModuleResult> ReadFactoryStringAsync(
        string? header = null, 
        CancellationToken ct = default);
    
    /// <summary>
    /// Writes modified factory parameters to the device.
    /// </summary>
    /// <param name="factoryString">Modified factory parameters string</param>
    /// <param name="header">Optional header for PSC Master (5dm)</param>
    /// <param name="ct">Cancellation token</param>
    /// <returns>True si el dispositivo responde ACK</returns>
    Task<bool> WriteFactoryStringAsync(
        string factoryString, 
        string? header = null, 
        CancellationToken ct = default);
    
    /// <summary>
    /// Checks if the Ethernet module is installed according to the factory string.
    /// </summary>
    /// <param name="factoryString">Factory parameters string</param>
    /// <returns>True if Ethernet is installed (bit 7 = 0)</returns>
    bool IsEthernetInstalled(string factoryString);
    
    /// <summary>
    /// Checks if the device has common UL (PSC Master).
    /// </summary>
    /// <param name="factoryString">Factory parameters string</param>
    /// <returns>True if commonUl is active</returns>
    bool IsCommonUl(string factoryString);
    
    /// <summary>
    /// Modifica el bit de Ethernet en el factory string.
    /// </summary>
    /// <param name="factoryString">Original factory parameters string</param>
    /// <param name="installed">True to activate Ethernet, False to deactivate</param>
    /// <returns>Modified factory parameters string</returns>
    string SetEthernetInstalled(string factoryString, bool installed);
}
