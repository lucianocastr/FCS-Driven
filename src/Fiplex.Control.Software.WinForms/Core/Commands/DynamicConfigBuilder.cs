using System.Text;
using Fiplex.Control.Software.WinForms.Core.Serial;
using Fiplex.Control.Software.WinForms.Core.Serial.Interfaces;
using Fiplex.Control.Software.WinForms.Core.Serial.Models;
using Fiplex.Control.Software.WinForms.Models;
using Microsoft.Extensions.Logging;

namespace Fiplex.Control.Software.WinForms.Core.Commands;

/// <summary>
/// Builds dynamic configuration frames for devices that don't have
/// hardcoded configurations (1c v4/v5, 1dm, 1dr, 1cm).
/// </summary>
public class DynamicConfigBuilder
{
    private readonly ISerialCommandPipeline _pipeline;
    private readonly ILogger<DynamicConfigBuilder> _logger;

    public DynamicConfigBuilder(
        ISerialCommandPipeline pipeline,
        ILogger<DynamicConfigBuilder> logger)
    {
        _pipeline = pipeline;
        _logger = logger;
    }

    /// <summary>
    /// Builds the dynamic configuration frames for the device.
    /// </summary>
    /// <param name="tdev">Device type</param>
    /// <param name="ndev">Device version</param>
    /// <param name="factoryParams">Factory parameters</param>
    /// <param name="nchannels">Number of channels (1, 2, 6)</param>
    /// <param name="mode">Mode for 2 channels (0=start, 1=center, 2=stop)</param>
    /// <param name="clearROM">Whether to clear EEPROM</param>
    /// <returns>List of commands to send</returns>
    public async Task<List<ProductionCommand>> BuildConfigFramesAsync(
        string tdev,
        double ndev,
        FactoryParameters factoryParams,
        short nchannels,
        short mode,
        bool clearROM)
    {
        var commands = new List<ProductionCommand>();

        try
        {
            // Verify if it's an ADJBW device and not clearROM
            if (factoryParams.IsAdjBW && !clearROM)
            {
                _logger.LogWarning("This option is not available for ADJBW BDA");
                return commands;
            }

            string[] configFrames;

            // Get current device configuration and format
            switch (tdev)
            {
                case "1dr" when ndev >= 2.1:
                    configFrames = await BuildDRFramesAsync(factoryParams, nchannels, mode);
                    break;

                case "1dm" when ndev >= 4.1:
                    configFrames = await BuildDMFramesAsync(factoryParams, nchannels, mode);
                    break;

                case "1cm" when ndev >= 0:
                    configFrames = await BuildCMFramesAsync(factoryParams, nchannels, mode);
                    break;

                case "1c" when (int)ndev == 4 || (int)ndev == 5:
                    configFrames = await BuildC4C5FramesAsync(factoryParams, nchannels, mode, (int)ndev);
                    break;

                case "1c" when ndev >= 2 && ndev < 7 && (int)ndev != 4 && (int)ndev != 5:
                    configFrames = await BuildCFramesAsync(factoryParams, nchannels, mode, ndev);
                    break;

                default:
                    _logger.LogDebug("No dynamic config builder for {TDev} v{NDev}", tdev, ndev);
                    return commands;
            }

            if (configFrames.Length == 0)
            {
                return commands;
            }

            // Apply default values if clearROM
            if (clearROM)
            {
                SetDefaultValues(configFrames, tdev, ndev, factoryParams);
            }

            // Apply prefixes according to device type
            ApplyCommandPrefixes(configFrames, tdev, ndev);

            // Convert to production commands
            for (int i = 0; i < configFrames.Length; i++)
            {
                if (!string.IsNullOrEmpty(configFrames[i]))
                {
                    commands.Add(new ProductionCommand
                    {
                        Payload = configFrames[i],
                        Description = $"Dynamic config frame {i + 1}",
                        ExpectsAck = true,
                        TimeoutSeconds = 10
                    });
                }
            }

            // Add additional commands for clearROM
            if (clearROM)
            {
                AddClearROMCommands(commands, tdev, ndev);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error building dynamic config frames for {TDev} v{NDev}", tdev, ndev);
        }

        return commands;
    }

    #region Frame Builders

    /// <summary>
    /// Builds frames for 1dr (Remote) device.
    /// </summary>
    private async Task<string[]> BuildDRFramesAsync(FactoryParameters factoryParams, short nchannels, short mode)
    {
        var result = await SendCommandAsync("C1");
        if (string.IsNullOrEmpty(result))
        {
            return Array.Empty<string>();
        }

        var frames = new string[1];
        frames[0] = FormatDRFrame(result, factoryParams, nchannels, mode);
        return frames;
    }

    /// <summary>
    /// Builds frames for 1dm (Master) device.
    /// </summary>
    private async Task<string[]> BuildDMFramesAsync(FactoryParameters factoryParams, short nchannels, short mode)
    {
        var frames = new string[7];

        frames[0] = await SendCommandAsync("C10000");
        frames[1] = await SendCommandAsync("C10101");
        frames[2] = await SendCommandAsync("C10201");
        frames[3] = await SendCommandAsync("C10301");
        frames[4] = await SendCommandAsync("C10401");
        frames[5] = await SendCommandAsync("C10501");
        frames[6] = await SendCommandAsync("C10601");

        if (frames.Any(string.IsNullOrEmpty))
        {
            return Array.Empty<string>();
        }

        FormatDMFrames(frames, factoryParams, nchannels, mode);
        return frames;
    }

    /// <summary>
    /// Builds frames for 1cm device.
    /// </summary>
    private async Task<string[]> BuildCMFramesAsync(FactoryParameters factoryParams, short nchannels, short mode)
    {
        var frames = new string[2];

        frames[0] = await SendCommandAsync("C10000");
        frames[1] = await SendCommandAsync("C10101");

        if (frames.Any(string.IsNullOrEmpty))
        {
            return Array.Empty<string>();
        }

        FormatCMFrames(frames, factoryParams, nchannels, mode);
        return frames;
    }

    /// <summary>
    /// Builds frames for 1c v4/v5 device.
    /// </summary>
    private async Task<string[]> BuildC4C5FramesAsync(FactoryParameters factoryParams, short nchannels, short mode, int version)
    {
        // Get D frames (frequencies) and B frames (RF config)
        var d1Response = await SendCommandAsync("D1");
        var b1Response = await SendCommandAsync("B1");

        if (string.IsNullOrEmpty(d1Response) || string.IsNullOrEmpty(b1Response))
        {
            return Array.Empty<string>();
        }

        var dParts = d1Response.Split('\t');
        var bParts = b1Response.Split('\t');

        if (dParts.Length < 2 || bParts.Length < 2)
        {
            return Array.Empty<string>();
        }

        var frames = version == 4 && factoryParams.NDev >= 4.2
            ? new string[5]
            : new string[4];

        frames[0] = dParts[0];
        frames[1] = dParts[1];
        frames[2] = bParts[0];
        frames[3] = bParts[1];

        // For v4.2+, add C1 frame for ADJ
        if (version == 4 && factoryParams.NDev >= 4.2)
        {
            frames[4] = await SendCommandAsync("C1");
        }

        if (version == 4)
        {
            FormatC4Frames(frames, factoryParams, nchannels, mode);
        }
        else
        {
            FormatC5Frames(frames, factoryParams, nchannels, mode);
        }

        return frames;
    }

    /// <summary>
    /// Builds frames for 1c v2/v3 device (non-ADJBW).
    /// </summary>
    private async Task<string[]> BuildCFramesAsync(FactoryParameters factoryParams, short nchannels, short mode, double ndev)
    {
        var result = await SendCommandAsync("C1");
        if (string.IsNullOrEmpty(result))
        {
            return Array.Empty<string>();
        }

        // If it's ADJBW, don't use this builder
        if (factoryParams.IsAdjBW)
        {
            return Array.Empty<string>();
        }

        var frames = new string[1];
        frames[0] = FormatCFrame(result, factoryParams, nchannels, mode);
        return frames;
    }

    #endregion

    #region Frame Formatters

    /// <summary>
    /// Formats frame for 1dr.
    /// </summary>
    private string FormatDRFrame(string cfg, FactoryParameters factoryParams, short nchannels, short mode)
    {
        var sb = new StringBuilder();
        sb.Append(cfg.Substring(0, Math.Min(12, cfg.Length)));

        var freqs = ComputeFreqs(nchannels, mode, 0, factoryParams);

        for (int i = 0; i < factoryParams.MaxChannels; i++)
        {
            int startPos = 12 + 6 * i;
            if (startPos + 4 > cfg.Length) break;

            int freq = AsciiToInt(cfg.Substring(startPos, 4)) & 0x7;
            freq |= (freqs[i] & 0x1FFF) << 3;
            sb.Append(freq.ToString("X4"));

            if (startPos + 6 <= cfg.Length)
            {
                sb.Append(cfg.Substring(startPos + 4, 2));
            }
        }

        // STANDBY mask
        int maskStby = 0xFFFFFF;
        for (int i = 0; i < nchannels; i++)
        {
            maskStby ^= (1 << i);
        }
        sb.Append(maskStby.ToString("X6"));

        // Rest of the frame
        int processedLength = sb.Length;
        if (processedLength < cfg.Length)
        {
            sb.Append(cfg.Substring(processedLength));
        }

        return sb.ToString();
    }

    /// <summary>
    /// Formats frames for 1dm.
    /// </summary>
    private void FormatDMFrames(string[] frames, FactoryParameters factoryParams, short nchannels, short mode)
    {
        var aux = new string[frames.Length];

        // Frame 0 - UL config
        aux[0] = frames[0].Substring(0, Math.Min(24, frames[0].Length));
        var freqsUL = ComputeFreqs(nchannels, mode, 1, factoryParams);
        aux[0] = AppendFreqsAndMask(aux[0], frames[0], 24, freqsUL, factoryParams.MaxChannels, nchannels);

        // Frames 1-6 - DL config
        var freqsDL = ComputeFreqs(nchannels, mode, 0, factoryParams);
        for (int j = 1; j <= 6; j++)
        {
            if (j < frames.Length && !string.IsNullOrEmpty(frames[j]))
            {
                aux[j] = frames[j].Substring(0, Math.Min(16, frames[j].Length));
                aux[j] = AppendFreqsAndMask(aux[j], frames[j], 16, freqsDL, factoryParams.MaxChannels, nchannels);
            }
        }

        Array.Copy(aux, frames, aux.Length);
    }

    /// <summary>
    /// Formats frames for 1cm.
    /// </summary>
    private void FormatCMFrames(string[] frames, FactoryParameters factoryParams, short nchannels, short mode)
    {
        var aux = new string[frames.Length];

        // Frame 0 - DL
        aux[0] = frames[0].Substring(0, Math.Min(24, frames[0].Length));
        var freqsDL = ComputeFreqs(nchannels, mode, 1, factoryParams);
        aux[0] = AppendFreqsAndMask(aux[0], frames[0], 24, freqsDL, factoryParams.MaxChannels, nchannels);

        // Frame 1 - UL
        aux[1] = frames[1].Substring(0, Math.Min(16, frames[1].Length));
        var freqsUL = ComputeFreqs(nchannels, mode, 0, factoryParams);
        aux[1] = AppendFreqsAndMask(aux[1], frames[1], 16, freqsUL, factoryParams.MaxChannels, nchannels);

        Array.Copy(aux, frames, aux.Length);
    }

    /// <summary>
    /// Formats frames for 1c v4.
    /// </summary>
    private void FormatC4Frames(string[] frames, FactoryParameters factoryParams, short nchannels, short mode)
    {
        var aux = new string[frames.Length];

        // D frames (frequencies)
        var freqsDL = ComputeFreqs(nchannels, mode, 0, factoryParams);
        aux[0] = frames[0].Substring(0, 2);
        for (int i = 0; i < factoryParams.MaxChannels; i++)
        {
            if (i < nchannels)
            {
                aux[0] += freqsDL[i].ToString("X4");
            }
            else
            {
                int pos = 2 + i * 4;
                if (pos + 4 <= frames[0].Length)
                    aux[0] += frames[0].Substring(pos, 4);
            }
        }

        var freqsUL = ComputeFreqs(nchannels, mode, 1, factoryParams);
        aux[1] = frames[1].Substring(0, 2);
        for (int i = 0; i < factoryParams.MaxChannels; i++)
        {
            if (i < nchannels)
            {
                aux[1] += freqsUL[i].ToString("X4");
            }
            else
            {
                int pos = 2 + i * 4;
                if (pos + 4 <= frames[1].Length)
                    aux[1] += frames[1].Substring(pos, 4);
            }
        }

        // B frames (RF config)
        aux[2] = FormatRFConfigFrame(frames[2], factoryParams.MaxChannels, nchannels);
        aux[3] = FormatRFConfigFrame(frames[3], factoryParams.MaxChannels, nchannels);

        // Frame 4 (ADJ) is kept intact if it exists
        if (frames.Length > 4 && !string.IsNullOrEmpty(frames[4]))
        {
            aux[4] = frames[4];
        }

        Array.Copy(aux, frames, aux.Length);
    }

    /// <summary>
    /// Formats frames for 1c v5.
    /// </summary>
    private void FormatC5Frames(string[] frames, FactoryParameters factoryParams, short nchannels, short mode)
    {
        var aux = new string[frames.Length];

        // D frames (frequencies) with FirstNet support (CH31)
        var freqsDL = ComputeFreqs(nchannels, mode, 0, factoryParams);
        aux[0] = frames[0].Substring(0, 2);
        for (int i = 0; i < factoryParams.MaxChannels; i++)
        {
            if (i < nchannels)
            {
                aux[0] += freqsDL[i].ToString("X4");
            }
            else
            {
                int pos = 2 + i * 4;
                if (pos + 4 <= frames[0].Length)
                    aux[0] += frames[0].Substring(pos, 4);
            }
        }
        aux[0] += "0000"; // CH31 stuff
        if (frames[0].Length >= 130)
            aux[0] += frames[0].Substring(126, 4); // Keep Sq Enable and threshold (FirstNet)

        var freqsUL = ComputeFreqs(nchannels, mode, 1, factoryParams);
        aux[1] = frames[1].Substring(0, 2);
        for (int i = 0; i < factoryParams.MaxChannels; i++)
        {
            if (i < nchannels)
            {
                aux[1] += freqsUL[i].ToString("X4");
            }
            else
            {
                int pos = 2 + i * 4;
                if (pos + 4 <= frames[1].Length)
                    aux[1] += frames[1].Substring(pos, 4);
            }
        }
        aux[1] += "0000"; // CH31 stuff
        if (frames[1].Length >= 130)
            aux[1] += frames[1].Substring(126, 4); // Keep Sq Enable and threshold

        // B frames (RF config)
        aux[2] = FormatRFConfigFrame(frames[2], factoryParams.MaxChannels, nchannels);
        aux[3] = FormatRFConfigFrame(frames[3], factoryParams.MaxChannels, nchannels);

        Array.Copy(aux, frames, aux.Length);
    }

    /// <summary>
    /// Formats C frame for 1c v2/v3.
    /// </summary>
    private string FormatCFrame(string cfg, FactoryParameters factoryParams, short nchannels, short mode)
    {
        // Simplified implementation - the C frame for v2/v3 is more complex
        // and depends on multiple factors. For now we return the original frame.
        _logger.LogDebug("FormatCFrame: Using original frame for 1c v2/v3");
        return cfg;
    }

    /// <summary>
    /// Formats RF configuration frame (B frames).
    /// </summary>
    private string FormatRFConfigFrame(string frame, short maxChannels, short nchannels)
    {
        var sb = new StringBuilder();
        sb.Append(frame.Substring(0, 2));

        // Mask bytes at positions 2-3 and 4-5
        int mask1 = AsciiToInt(frame.Substring(2, 2));
        mask1 &= 0x83; // Clear bits for power distribution
        sb.Append(mask1.ToString("X2"));

        int mask2 = AsciiToInt(frame.Substring(4, 2));
        mask2 &= 0xF7;
        sb.Append(mask2.ToString("X2"));

        sb.Append(frame.Substring(6, 6));

        // Channel config
        for (int i = 0; i < maxChannels; i++)
        {
            int pos = 12 + i * 4;
            if (pos + 2 > frame.Length) break;

            int mask = AsciiToInt(frame.Substring(pos, 2));
            if (i < nchannels)
            {
                mask &= 0x7F; // Enable channel (clear bit 7)
            }
            else
            {
                mask |= 0x80; // Disable channel (set bit 7)
            }
            mask &= 0xBF; // Clear bit 6 (filter grouping)
            sb.Append(mask.ToString("X2"));

            if (pos + 4 <= frame.Length)
            {
                sb.Append(frame.Substring(pos + 2, 2));
            }
        }

        return sb.ToString();
    }

    #endregion

    #region Helper Methods

    /// <summary>
    /// Computes frequencies to program.
    /// </summary>
    private int[] ComputeFreqs(short nchannels, short mode, int band, FactoryParameters factoryParams)
    {
        var freqs = new int[factoryParams.MaxChannels];
        var bandParams = band == 0 ? factoryParams.Band0 : factoryParams.Band1;

        if (bandParams.FStep <= 0)
        {
            _logger.LogWarning("Invalid FStep for band {Band}", band);
            return freqs;
        }

        // Default: center frequency
        double centerFreq = (bandParams.FStart + bandParams.FStop) / 2;
        for (int i = 0; i < factoryParams.MaxChannels; i++)
        {
            freqs[i] = (int)((centerFreq - bandParams.FRef) / bandParams.FStep);
        }

        // 6 channels: distributed across band
        if (nchannels == 6)
        {
            double bw = bandParams.FStop - bandParams.FStart;
            for (int i = 0; i <= 6 && i < factoryParams.MaxChannels; i++)
            {
                double freq = (bw / 5 * i) + bandParams.FStart;
                freqs[i] = (int)((freq - bandParams.FRef) / bandParams.FStep);
            }
        }

        // 2 channels with mode
        if (nchannels == 2)
        {
            switch (mode)
            {
                case 0: // Start
                    freqs[0] = (int)((bandParams.FStart + 400000 - bandParams.FRef) / bandParams.FStep);
                    freqs[1] = (int)((bandParams.FStart + 600000 - bandParams.FRef) / bandParams.FStep);
                    break;
                case 1: // Center
                    freqs[0] = (int)((centerFreq - 100000 - bandParams.FRef) / bandParams.FStep);
                    freqs[1] = (int)((centerFreq + 100000 - bandParams.FRef) / bandParams.FStep);
                    break;
                case 2: // Stop
                    freqs[0] = (int)((bandParams.FStop - 600000 - bandParams.FRef) / bandParams.FStep);
                    freqs[1] = (int)((bandParams.FStop - 400000 - bandParams.FRef) / bandParams.FStep);
                    break;
            }
        }

        return freqs;
    }

    /// <summary>
    /// Appends frequencies and standby mask to the frame.
    /// </summary>
    private string AppendFreqsAndMask(string aux, string original, int startOffset, int[] freqs, short maxChannels, short nchannels)
    {
        var sb = new StringBuilder(aux);

        for (int i = 0; i < maxChannels; i++)
        {
            int pos = startOffset + 6 * i;
            if (pos + 4 > original.Length) break;

            int freq = AsciiToInt(original.Substring(pos, 4)) & 0x7;
            freq |= (freqs[i] & 0x1FFF) << 3;
            sb.Append(freq.ToString("X4"));

            if (pos + 6 <= original.Length)
            {
                sb.Append(original.Substring(pos + 4, 2));
            }
        }

        // STANDBY mask
        int maskStby = 0xFFFFFF;
        for (int i = 0; i < nchannels; i++)
        {
            maskStby ^= (1 << i);
        }
        sb.Append(maskStby.ToString("X6"));

        // Rest of the frame
        int expectedLength = startOffset + (maxChannels * 6) + 6;
        if (expectedLength < original.Length)
        {
            sb.Append(original.Substring(expectedLength));
        }

        return sb.ToString();
    }

    /// <summary>
    /// Applies default values when clearROM = true.
    /// </summary>
    private void SetDefaultValues(string[] frames, string tdev, double ndev, FactoryParameters factoryParams)
    {
        // The SetDefaultValues implementation is very device-specific
        // and modifies frames to reset to factory values.
        // For now, we leave the frames as they are since formatting
        // already applied the channel logic.
        _logger.LogDebug("SetDefaultValues called for {TDev} v{NDev}", tdev, ndev);
    }

    /// <summary>
    /// Applies command prefixes according to device type.
    /// </summary>
    private void ApplyCommandPrefixes(string[] frames, string tdev, double ndev)
    {
        if ((int)ndev == 4 || (int)ndev == 5 && tdev == "1c")
        {
            // 1c v4/v5 uses special prefixes
            if (frames.Length >= 2)
            {
                frames[0] = "D0" + frames[0];
                frames[1] = "D0" + frames[1];
            }
            if (frames.Length >= 4)
            {
                frames[2] = "B0" + frames[2];
                frames[3] = "B0" + frames[3];
            }
            if (frames.Length >= 5 && (int)ndev == 4 && ndev >= 4.2)
            {
                frames[4] = "C0" + frames[4];
            }
        }
        else
        {
            // Other devices use C0 prefix
            for (int i = 0; i < frames.Length; i++)
            {
                if (!string.IsNullOrEmpty(frames[i]))
                {
                    frames[i] = "C0" + frames[i];
                }
            }
        }
    }

    /// <summary>
    /// Adds additional commands for clearROM.
    /// </summary>
    private void AddClearROMCommands(List<ProductionCommand> commands, string tdev, double ndev)
    {
        // Tag according to device type
        string tagPayload = tdev switch
        {
            "1dm" when (int)ndev == 8 => "T00000MASTER FIPLEX  0.0 0.0        ",
            "1dm" => "T00000MASTER FIPLEX                 ",
            "1dr" when (int)ndev == 4 => "T0REMOTE FIPLEX  0.0 0.0        ",
            "1dr" => "T0REMOTE FIPLEX                 ",
            "1cm" => "T00000BDA FIPLEX                    ",
            "1c" => "T0BDA FIPLEX                    ",
            _ => "T0BDA FIPLEX                    "
        };

        commands.Add(new ProductionCommand
        {
            Payload = tagPayload,
            Description = "Tag reset (T command)",
            ExpectsAck = true,
            TimeoutSeconds = 5
        });

        // Additional commands for 1dm v8
        if (tdev == "1dm")
        {
            commands.Add(new ProductionCommand
            {
                Payload = "N2",
                Description = "Network config",
                ExpectsAck = false,
                TimeoutSeconds = 5
            });
            commands.Add(new ProductionCommand
            {
                Payload = "T2",
                Description = "Additional tag",
                ExpectsAck = false,
                TimeoutSeconds = 5
            });
        }

        // Thresholds for 1dr v4
        if (tdev == "1dr" && (int)ndev == 4)
        {
            commands.Add(new ProductionCommand
            {
                Payload = "U02202500AE702E702CE02CE02",
                Description = "Thresholds (U command)",
                ExpectsAck = true,
                TimeoutSeconds = 5
            });
        }

        // Thresholds for 1dm v8
        if (tdev == "1dm" && (int)ndev == 8)
        {
            commands.Add(new ProductionCommand
            {
                Payload = "U00000E702E702E702E702E702E702E702500A",
                Description = "Thresholds (U command)",
                ExpectsAck = true,
                TimeoutSeconds = 5
            });
        }
    }

    /// <summary>
    /// Converts hexadecimal string to integer.
    /// </summary>
    private int AsciiToInt(string hex)
    {
        if (string.IsNullOrEmpty(hex))
            return 0;

        try
        {
            return Convert.ToInt32(hex, 16);
        }
        catch
        {
            return 0;
        }
    }

    /// <summary>
    /// Sends command and gets response.
    /// </summary>
    private async Task<string> SendCommandAsync(string command)
    {
        try
        {
            var serialCommand = new SerialCommand
            {
                Payload = command,
                ExpectsAck = false,
                ExpectsData = true,
                MaxRetries = 2,
                AckTimeout = TimeSpan.FromSeconds(5)
            };

            var result = await _pipeline.EnqueueCommandAsync(serialCommand);
            return result.Success ? result.Data ?? string.Empty : string.Empty;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending command {Command}", command);
            return string.Empty;
        }
    }

    #endregion
}
