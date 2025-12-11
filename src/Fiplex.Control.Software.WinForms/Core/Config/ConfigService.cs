using System.Text;
using Fiplex.Control.Software.WinForms.Core.Config.Interfaces;
using Fiplex.Control.Software.WinForms.Core.Serial.Interfaces;
using Fiplex.Control.Software.WinForms.Core.Serial.Models;
using Fiplex.Control.Software.WinForms.Models;
using Microsoft.Extensions.Logging;

namespace Fiplex.Control.Software.WinForms.Core.Config;

/// <summary>
/// Implementation of <see cref="IConfigService"/> for saving and loading device configuration.
/// </summary>
/// <remarks>
/// Configuration data is persisted in a simple command=value text format.
/// Reading and writing to devices is performed through the serial command pipeline.
/// </remarks>
public class ConfigService : IConfigService
{
    private readonly ISerialCommandPipeline _pipeline;
    private readonly ILogger<ConfigService> _logger;

    public ConfigService(
        ISerialCommandPipeline pipeline,
        ILogger<ConfigService> logger)
    {
        _pipeline = pipeline;
        _logger = logger;
    }

    public async Task<bool> SaveConfigAsync(
        string filePath,
        List<CommandDefinition> commands,
        CancellationToken ct = default)
    {
        _logger.LogInformation("Saving config to {Path}", filePath);

        var content = new StringBuilder();
        var successCount = 0;

        foreach (var cmd in commands)
        {
            if (ct.IsCancellationRequested)
            {
                _logger.LogWarning("Save config cancelled");
                return false;
            }

            var command = new SerialCommand
            {
                Payload = cmd.Command,
                ExpectsAck = true,
                ExpectsData = true,
                MaxRetries = 3,
                CancellationToken = ct
            };

            var result = await _pipeline.EnqueueCommandAsync(command);

            if (!result.Success)
            {
                _logger.LogError("Failed to read {Command}: {Status}", cmd.Command, result.Status);
                return false;
            }

            content.AppendLine($"{cmd.Command}={result.Data}");
            successCount++;
        }

        await File.WriteAllTextAsync(filePath, content.ToString(), ct);
        _logger.LogInformation("Config saved: {Count} commands to {Path}", successCount, filePath);
        return true;
    }

    public async Task<bool> LoadConfigAsync(string filePath, CancellationToken ct = default)
    {
        if (!File.Exists(filePath))
        {
            _logger.LogWarning("Config file not found: {Path}", filePath);
            return false;
        }

        _logger.LogInformation("Loading config from {Path}", filePath);

        var lines = await File.ReadAllLinesAsync(filePath, ct);
        var successCount = 0;

        foreach (var line in lines)
        {
            if (string.IsNullOrWhiteSpace(line) || line.StartsWith("#"))
                continue;

            if (ct.IsCancellationRequested)
            {
                _logger.LogWarning("Load config cancelled");
                return false;
            }

            // Formato: Command=Value
            var parts = line.Split('=', 2);
            if (parts.Length == 2)
            {
                var payload = $"{parts[0].Trim()}={parts[1].Trim()}";
                
                var command = new SerialCommand
                {
                    Payload = payload,
                    ExpectsAck = true,
                    ExpectsData = false,
                    MaxRetries = 3,
                    CancellationToken = ct
                };

                var result = await _pipeline.EnqueueCommandAsync(command);

                if (!result.Success)
                {
                    _logger.LogError("Failed to write {Command}: {Status}", payload, result.Status);
                    return false;
                }

                successCount++;
            }
        }

        _logger.LogInformation("Config loaded: {Count} commands from {Path}", successCount, filePath);
        return true;
    }
}
