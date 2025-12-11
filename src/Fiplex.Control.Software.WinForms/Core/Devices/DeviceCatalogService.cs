using System.Reflection;
using Fiplex.Control.Software.WinForms.Core.Devices.Interfaces;
using Fiplex.Control.Software.WinForms.Models;
using Microsoft.Extensions.Logging;

namespace Fiplex.Control.Software.WinForms.Core.Devices;

/// <summary>
/// Implementation of <see cref="IDeviceCatalogService"/> that loads device definitions from an embedded TSV resource.
/// </summary>
/// <remarks>
/// The catalog is loaded from the embedded resource fdevices.tsv at application startup.
/// Each entry maps a device ID to its UI path, name, type/version, and authentication requirements.
/// </remarks>
public class DeviceCatalogService : IDeviceCatalogService
{
    private readonly ILogger<DeviceCatalogService> _logger;
    private readonly List<DeviceInfo> _catalog = new();

    public DeviceCatalogService(ILogger<DeviceCatalogService> logger) 
        => _logger = logger;

    public async Task LoadCatalogAsync()
    {
        var assembly = Assembly.GetExecutingAssembly();
        var resourceName = "Fiplex.Control.Software.WinForms.Resources.fdevices.tsv";

        await using var stream = assembly.GetManifestResourceStream(resourceName);
        if (stream == null)
        {
            _logger.LogError("Resource {Name} not found", resourceName);
            return;
        }

        using var reader = new StreamReader(stream);
        string? line;
        
        while ((line = await reader.ReadLineAsync()) != null)
        {
            if (string.IsNullOrWhiteSpace(line) || line.StartsWith("#")) 
                continue;

            var parts = line.Split('\t');
            if (parts.Length >= 5)
            {
                var typeVersion = parts[3].Split('/');
                _catalog.Add(new DeviceInfo
                {
                    Id = parts[0].Trim(),
                    PathShared = Path.Combine(
                        AppDomain.CurrentDomain.BaseDirectory, 
                        parts[1].TrimStart('\\').Replace('\\', Path.DirectorySeparatorChar)),
                    NameTypeDevice = parts[2].Trim(),
                    TDev = typeVersion[0].Trim(),
                    NDev = double.Parse(typeVersion[1].Trim()),
                    DeviceWithPass = parts[4].Trim() == "1"
                });
            }
        }

        _logger.LogInformation("Loaded {Count} device definitions from catalog", _catalog.Count);
    }

    public DeviceInfo? ResolveDevice(string rawDeviceIdentifier)
    {
        if (string.IsNullOrWhiteSpace(rawDeviceIdentifier) || 
            rawDeviceIdentifier.Length < 15 || 
            !rawDeviceIdentifier.StartsWith("Fiplex"))
        {
            return null;
        }

        var deviceId = rawDeviceIdentifier.Split(' ')[0];
        var device = _catalog.FirstOrDefault(d => d.Id == deviceId);
        
        if (device == null)
        {
            _logger.LogWarning("Device {Id} not found in catalog", deviceId);
        }
        
        return device;
    }

    public IReadOnlyList<DeviceInfo> GetAllEntries() 
        => _catalog.AsReadOnly();
}
