using Microsoft.Extensions.Logging;
using Fiplex.Control.Software.WinForms.Models;

namespace Fiplex.Control.Software.WinForms.Core.Config;

/// <summary>
/// Service that obtains device-specific factory parameters by type/version.
/// </summary>
public class FactoryParametersService
{
    private readonly ILogger<FactoryParametersService> _logger;
    
    public FactoryParametersService(ILogger<FactoryParametersService> logger)
    {
        _logger = logger;
    }
    
    /// <summary>
    /// Gets factory parameters for a specific device.
    /// </summary>
    /// <param name="deviceType">Device type (1cm, 1c, 1dm, 2c, 5dm, etc.)</param>
    /// <param name="deviceVersion">Device version</param>
    /// <param name="ct">Cancellation token</param>
    /// <returns>FactoryParameters or null if not applicable</returns>
    public Task<FactoryParameters?> GetFactoryParametersAsync(
        string deviceType, 
        double deviceVersion, 
        CancellationToken ct = default)
    {
        if (string.IsNullOrEmpty(deviceType))
        {
            _logger.LogWarning("GetFactoryParametersAsync called with empty deviceType");
            return Task.FromResult<FactoryParameters?>(null);
        }

        _logger.LogInformation(
            "Getting factory parameters for {Type} v{Version}", 
            deviceType, deviceVersion);
            
        var parameters = deviceType.ToLowerInvariant() switch
        {
            "1cm" => GetParametersFor1cm(deviceVersion),
            "1c" when deviceVersion >= 2.0 => GetParametersFor1c(deviceVersion),
            "1dm" when deviceVersion >= 4.1 => GetParametersFor1dm(deviceVersion),
            "2c" => GetParametersFor2c(deviceVersion),
            "5dm" => GetParametersFor5dm(deviceVersion),
            _ => null
        };

        if (parameters != null)
        {
            _logger.LogInformation(
                "Factory params: IsAdjBW={IsAdjBW}, BandWidth={BandWidth}, MultiChannel={MultiChannel}",
                parameters.IsAdjBW, parameters.BandWidth, parameters.SupportsMultiChannel);
        }
        else
        {
            _logger.LogDebug("No factory parameters for {Type} v{Version}", deviceType, deviceVersion);
        }

        return Task.FromResult(parameters);
    }
    
    private FactoryParameters GetParametersFor1cm(double version)
    {
        return new FactoryParameters
        {
            IsAdjBW = false,
            BandWidth = 25000000.0, // 25 MHz
            SupportsMultiChannel = version >= 1.0
        };
    }
    
    private FactoryParameters GetParametersFor1c(double version)
    {
        return new FactoryParameters
        {
            IsAdjBW = version >= 2.2,
            BandWidth = version switch
            {
                >= 5.0 => 50000000.0, // 50 MHz
                >= 2.2 => 25000000.0, // 25 MHz
                _ => 12500000.0       // 12.5 MHz
            },
            SupportsMultiChannel = version >= 2.0
        };
    }
    
    private FactoryParameters GetParametersFor1dm(double version)
    {
        return new FactoryParameters
        {
            IsAdjBW = version >= 8.0,
            BandWidth = 25000000.0,
            SupportsMultiChannel = false
        };
    }
    
    private FactoryParameters GetParametersFor2c(double version)
    {
        return new FactoryParameters
        {
            IsAdjBW = true,
            BandWidth = 50000000.0,
            SupportsMultiChannel = true
        };
    }
    
    private FactoryParameters GetParametersFor5dm(double version)
    {
        return new FactoryParameters
        {
            IsAdjBW = false,
            BandWidth = 12500000.0,
            SupportsMultiChannel = false,
            RequiresMultipartCommand = true // Flag for Stage 2
        };
    }
}

