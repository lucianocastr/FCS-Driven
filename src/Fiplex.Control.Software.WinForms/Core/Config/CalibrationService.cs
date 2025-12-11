using System.Text;
using Fiplex.Control.Software.WinForms.Core.Config.Interfaces;
using Fiplex.Control.Software.WinForms.Core.Serial.Interfaces;
using Fiplex.Control.Software.WinForms.Core.Serial.Models;
using Microsoft.Extensions.Logging;

namespace Fiplex.Control.Software.WinForms.Core.Config;

/// <summary>
/// Implementation of <see cref="ICalibrationService"/> for saving and loading device calibration data.
/// </summary>
/// <remarks>
/// Calibration files are stored in a simple key=value format with comment lines starting with #.
/// Values are read from the device via serial commands through the <see cref="ISerialCommandPipeline"/>.
/// </remarks>
public class CalibrationService : ICalibrationService
{
    private readonly ISerialCommandPipeline _pipeline;
    private readonly ILogger<CalibrationService> _logger;

    public CalibrationService(
        ISerialCommandPipeline pipeline,
        ILogger<CalibrationService> logger)
    {
        _pipeline = pipeline;
        _logger = logger;
    }

    public async Task<bool> SaveCalibrationAsync(
        string filePath,
        Dictionary<string, string> calibrationData,
        CancellationToken ct = default)
    {
        _logger.LogInformation("Saving calibration to {Path}", filePath);

        var content = new StringBuilder();
        content.AppendLine("# Fiplex Calibration File");
        content.AppendLine($"# Generated: {DateTime.Now:yyyy-MM-dd HH:mm:ss}");
        content.AppendLine();

        var successCount = 0;

        foreach (var kvp in calibrationData)
        {
            if (ct.IsCancellationRequested)
            {
                _logger.LogWarning("Save calibration cancelled");
                return false;
            }

            var command = new SerialCommand
            {
                Payload = kvp.Key,
                ExpectsAck = true,
                ExpectsData = true,
                MaxRetries = 3,
                CancellationToken = ct
            };

            var result = await _pipeline.EnqueueCommandAsync(command);

            if (!result.Success)
            {
                _logger.LogError("Failed to read calibration {Command}: {Status}", kvp.Key, result.Status);
                return false;
            }

            content.AppendLine($"{kvp.Key}={result.Data}");
            successCount++;
        }

        await File.WriteAllTextAsync(filePath, content.ToString(), ct);
        _logger.LogInformation("Calibration saved: {Count} values to {Path}", successCount, filePath);
        return true;
    }

    public async Task<Dictionary<string, string>> LoadCalibrationAsync(
        string filePath,
        CancellationToken ct = default)
    {
        var calibrationData = new Dictionary<string, string>();

        if (!File.Exists(filePath))
        {
            _logger.LogWarning("Calibration file not found: {Path}", filePath);
            return calibrationData;
        }

        _logger.LogInformation("Loading calibration from {Path}", filePath);

        var lines = await File.ReadAllLinesAsync(filePath, ct);

        foreach (var line in lines)
        {
            if (string.IsNullOrWhiteSpace(line) || line.StartsWith("#"))
                continue;

            if (ct.IsCancellationRequested)
            {
                _logger.LogWarning("Load calibration cancelled");
                break;
            }

            // Formato: Command=Value
            var parts = line.Split('=', 2);
            if (parts.Length == 2)
            {
                var command = parts[0].Trim();
                var value = parts[1].Trim();
                
                calibrationData[command] = value;

                // Escribir al dispositivo
                var payload = $"{command}={value}";
                
                var serialCommand = new SerialCommand
                {
                    Payload = payload,
                    ExpectsAck = true,
                    ExpectsData = false,
                    MaxRetries = 3,
                    CancellationToken = ct
                };

                var result = await _pipeline.EnqueueCommandAsync(serialCommand);

                if (!result.Success)
                {
                    _logger.LogError("Failed to write calibration {Command}: {Status}", payload, result.Status);
                }
            }
        }

        _logger.LogInformation("Calibration loaded: {Count} values from {Path}", calibrationData.Count, filePath);
        return calibrationData;
    }
}
