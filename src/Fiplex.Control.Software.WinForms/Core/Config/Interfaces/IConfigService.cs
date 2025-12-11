using Fiplex.Control.Software.WinForms.Models;

namespace Fiplex.Control.Software.WinForms.Core.Config.Interfaces;

/// <summary>
/// Provides methods for saving and loading device configuration to/from files.
/// </summary>
/// <remarks>
/// Configuration data is persisted using serial command responses in a text format.
/// </remarks>
public interface IConfigService
{
    /// <summary>
    /// Saves device configuration by reading command responses and writing to a file.
    /// </summary>
    /// <param name="filePath">The path where the configuration file will be saved.</param>
    /// <param name="commands">List of command definitions to read from the device.</param>
    /// <param name="ct">Cancellation token for the operation.</param>
    /// <returns><c>true</c> if configuration was successfully saved; otherwise, <c>false</c>.</returns>
    Task<bool> SaveConfigAsync(
        string filePath, 
        List<CommandDefinition> commands, 
        CancellationToken ct = default);

    /// <summary>
    /// Loads configuration from a file and applies it to the device via serial commands.
    /// </summary>
    /// <param name="filePath">The path to the configuration file.</param>
    /// <param name="ct">Cancellation token for the operation.</param>
    /// <returns><c>true</c> if configuration was successfully loaded and applied; otherwise, <c>false</c>.</returns>
    Task<bool> LoadConfigAsync(
        string filePath, 
        CancellationToken ct = default);
}
