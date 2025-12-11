using Fiplex.Control.Software.WinForms.Models;

namespace Fiplex.Control.Software.WinForms.Core.Config.Interfaces;

/// <summary>
/// Parses device settings files (settings.cfg/settingsW.cfg) to extract command definitions.
/// </summary>
/// <remarks>
/// Settings files define the mapping between HTTP endpoints and serial commands for each device type.
/// </remarks>
public interface ISettingsParser
{
    /// <summary>
    /// Parses a device settings configuration file and returns the list of command definitions.
    /// </summary>
    /// <param name="filePath">Path to the settings.cfg or settingsW.cfg file.</param>
    /// <returns>List of command definitions parsed from the settings file.</returns>
    Task<List<CommandDefinition>> ParseSettingsAsync(string filePath);
}
