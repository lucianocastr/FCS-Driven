using Fiplex.Control.Software.WinForms.Models;

namespace Fiplex.Control.Software.WinForms.Core.Config.Interfaces;

/// <summary>
/// Servicio para gestión del módulo Ethernet Rabbit.
/// </summary>
public interface IEthernetModuleService
{
    /// <summary>
    /// Lee los parámetros de fábrica del dispositivo.
    /// </summary>
    /// <param name="header">Header opcional para PSC Master (5dm): "00" o "01"</param>
    /// <param name="ct">Token de cancelación</param>
    /// <returns>Resultado con string de parámetros o error</returns>
    Task<EthernetModuleResult> ReadFactoryStringAsync(
        string? header = null, 
        CancellationToken ct = default);
    
    /// <summary>
    /// Escribe los parámetros de fábrica modificados al dispositivo.
    /// </summary>
    /// <param name="factoryString">Cadena de parámetros de fábrica modificada</param>
    /// <param name="header">Header opcional para PSC Master (5dm)</param>
    /// <param name="ct">Token de cancelación</param>
    /// <returns>True si el dispositivo responde ACK</returns>
    Task<bool> WriteFactoryStringAsync(
        string factoryString, 
        string? header = null, 
        CancellationToken ct = default);
    
    /// <summary>
    /// Verifica si el módulo Ethernet está instalado según el factory string.
    /// </summary>
    /// <param name="factoryString">Cadena de parámetros de fábrica</param>
    /// <returns>True si Ethernet está instalado (bit 7 = 0)</returns>
    bool IsEthernetInstalled(string factoryString);
    
    /// <summary>
    /// Verifica si el dispositivo tiene UL común (PSC Master).
    /// </summary>
    /// <param name="factoryString">Cadena de parámetros de fábrica</param>
    /// <returns>True si commonUl está activo</returns>
    bool IsCommonUl(string factoryString);
    
    /// <summary>
    /// Modifica el bit de Ethernet en el factory string.
    /// </summary>
    /// <param name="factoryString">Cadena de parámetros de fábrica original</param>
    /// <param name="installed">True para activar Ethernet, False para desactivar</param>
    /// <returns>Cadena de parámetros de fábrica modificada</returns>
    string SetEthernetInstalled(string factoryString, bool installed);
}
