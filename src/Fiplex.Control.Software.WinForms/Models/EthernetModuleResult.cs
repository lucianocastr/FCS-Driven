namespace Fiplex.Control.Software.WinForms.Models;

/// <summary>
/// Resultado de la operación de lectura de parámetros del módulo Ethernet.
/// </summary>
/// <remarks>
/// Contiene la información extraída del dispositivo sobre la instalación
/// y configuración del módulo Ethernet.
/// </remarks>
public record EthernetModuleResult
{
    /// <summary>
    /// Indica si la operación fue exitosa.
    /// </summary>
    public bool IsSuccess { get; init; }
    
    /// <summary>
    /// Cadena de parámetros de fábrica leída del dispositivo.
    /// Debe tener al menos 482 caracteres para ser válida.
    /// </summary>
    public string FactoryString { get; init; } = string.Empty;
    
    /// <summary>
    /// Mensaje de error si la operación falló.
    /// </summary>
    public string? ErrorMessage { get; init; }
    
    /// <summary>
    /// Indica si el módulo Ethernet está instalado.
    /// Extraído del bit 7 de la posición 93-94.
    /// </summary>
    public bool EthernetInstalled { get; init; }
    
    /// <summary>
    /// Indica si el dispositivo tiene UL común (para PSC Master 5dm).
    /// Extraído del bit 7 de la posición 3-4.
    /// </summary>
    public bool CommonUl { get; init; }
    
    /// <summary>
    /// Crea un resultado exitoso con los parámetros leídos.
    /// </summary>
    public static EthernetModuleResult Success(
        string factoryString, 
        bool ethernetInstalled, 
        bool commonUl) => new()
    {
        IsSuccess = true,
        FactoryString = factoryString,
        EthernetInstalled = ethernetInstalled,
        CommonUl = commonUl
    };
    
    /// <summary>
    /// Crea un resultado de error.
    /// </summary>
    public static EthernetModuleResult Failed(string error) => new()
    {
        IsSuccess = false,
        ErrorMessage = error
    };
}
