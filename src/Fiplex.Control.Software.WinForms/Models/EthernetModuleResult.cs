namespace Fiplex.Control.Software.WinForms.Models;

/// <summary>
/// Result of the Ethernet module parameter read operation.
/// </summary>
/// <remarks>
/// Contains the information extracted from the device about the installation
/// and configuration of the Ethernet module.
/// </remarks>
public record EthernetModuleResult
{
    /// <summary>
    /// Indicates whether the operation was successful.
    /// </summary>
    public bool IsSuccess { get; init; }
    
    /// <summary>
    /// Factory parameters string read from the device.
    /// Must have at least 482 characters to be valid.
    /// </summary>
    public string FactoryString { get; init; } = string.Empty;
    
    /// <summary>
    /// Error message if the operation failed.
    /// </summary>
    public string? ErrorMessage { get; init; }
    
    /// <summary>
    /// Indicates whether the Ethernet module is installed.
    /// Extracted from bit 7 at position 93-94.
    /// </summary>
    public bool EthernetInstalled { get; init; }
    
    /// <summary>
    /// Indicates whether the device has common UL (for PSC Master 5dm).
    /// Extracted from bit 7 at position 3-4.
    /// </summary>
    public bool CommonUl { get; init; }
    
    /// <summary>
    /// Creates a successful result with the read parameters.
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
    /// Creates an error result.
    /// </summary>
    public static EthernetModuleResult Failed(string error) => new()
    {
        IsSuccess = false,
        ErrorMessage = error
    };
}
