using Fiplex.Control.Software.WinForms.Models;

namespace Fiplex.Control.Software.WinForms.Core.Devices.Interfaces;

/// <summary>
/// Service for managing the catalog of supported Fiplex devices.
/// </summary>
/// <remarks>
/// The catalog is loaded from the embedded resource fdevices.tsv which contains device definitions
/// including ID, path, name, type/version, and authentication requirements.
/// </remarks>
public interface IDeviceCatalogService
{
    /// <summary>
    /// Loads the device catalog from the embedded TSV resource.
    /// </summary>
    Task LoadCatalogAsync();

    /// <summary>
    /// Resolves a device from its raw identifier string (e.g., "Fiplex000000081 ABCD").
    /// </summary>
    /// <param name="rawDeviceIdentifier">The raw device identifier received from the device.</param>
    /// <returns>The matching <see cref="DeviceInfo"/> if found; otherwise, <c>null</c>.</returns>
    DeviceInfo? ResolveDevice(string rawDeviceIdentifier);

    /// <summary>
    /// Gets all device entries from the loaded catalog.
    /// </summary>
    /// <returns>Read-only list of all device definitions.</returns>
    IReadOnlyList<DeviceInfo> GetAllEntries();
}
