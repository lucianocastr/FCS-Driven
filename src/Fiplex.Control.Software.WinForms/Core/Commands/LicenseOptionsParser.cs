using Fiplex.Control.Software.WinForms.Models;
using Microsoft.Extensions.Logging;
using System.Text;

namespace Fiplex.Control.Software.WinForms.Core.Commands;

/// <summary>
/// Parser for hardware license options (M0/M1 commands).
/// 
/// Hex format of 14 characters:
/// [1-2]   Boot mask       - bit0=1 → VHF/UHF, bit0=0 → 700/800
/// [3-4]   FW0 mask        - 700/800 band options
/// [5-6]   PowerDL 700     - Signed byte (-128..127)
/// [7-8]   PowerDL 800     - Signed byte (-128..127)
/// [9-10]  FW1 mask        - VHF/UHF band options
/// [11-12] PowerDL VHF     - Signed byte (-128..127)
/// [13-14] PowerDL UHF     - Signed byte (-128..127)
/// 
/// FW mask bits:
///   bit0: chEnabled[band0] (Narrow Filters)
///   bit1: adjEnabled[band0] (AdjBW Filters)
///   bit2: chEnabled[band1] (Narrow Filters)
///   bit3: adjEnabled[band1] (AdjBW Filters)
///   bit4: singleEnabled[band0] (Single Band)
///   bit5: singleEnabled[band1] (Single Band)
/// </summary>
public class LicenseOptionsParser
{
    private const int ExpectedHexLength = 14;
    private const int BootMaskOffset = 0;
    private const int FW0Offset = 2;
    private const int FW1Offset = 8;
    private const int FWBlockSize = 6;
    
    private readonly ILogger<LicenseOptionsParser> _logger;

    public LicenseOptionsParser(ILogger<LicenseOptionsParser> logger)
    {
        _logger = logger;
    }
    
    /// <summary>
    /// Validates if a string is valid hex for M1.
    /// </summary>
    public bool IsValidHex(string? hexResponse)
    {
        if (string.IsNullOrEmpty(hexResponse) || hexResponse.Length < ExpectedHexLength)
            return false;
        
        return hexResponse.Take(ExpectedHexLength).All(c => 
            (c >= '0' && c <= '9') || 
            (c >= 'A' && c <= 'F') || 
            (c >= 'a' && c <= 'f'));
    }

    /// <summary>
    /// Decodes hex response from M1 command.
    /// </summary>
    /// <param name="hexResponse">14-character hex string from M1 command</param>
    /// <returns>Decoded license options</returns>
    public LicenseOptions Parse(string hexResponse)
    {
        var result = new LicenseOptions();

        if (!IsValidHex(hexResponse))
        {
            _logger.LogWarning("Parse: invalid hex response: '{Response}' (expected {Expected} hex characters)", 
                hexResponse ?? "null", ExpectedHexLength);
            return result;
        }

        try
        {
            // [1-2] Boot mask
            //                     .bootFirmware = 0
            //                     If (mask And &H1) <> 0 Then .bootFirmware = 1
            int bootMask = ParseHexByte(hexResponse, BootMaskOffset);
            result.BootFirmware = (short)((bootMask & 0x01) != 0 ? 1 : 0);

            // Process FW0 (700/800) and FW1 (VHF/UHF)
            for (int fw = 0; fw <= 1; fw++)
            {
                // Offset: FW0 starts at position 2, FW1 at position 8
                int offset = FW0Offset + (fw * FWBlockSize);
                int mask = ParseHexByte(hexResponse, offset);

                int band0 = fw * 2;      // 0 or 2
                int band1 = band0 + 1;   // 1 or 3

                // Decode mask bits
                //   .chEnabled(2 * i) = mask And &H1
                //   .adjEnabled(2 * i) = mask And &H2
                //   .chEnabled(2 * i + 1) = mask And &H4
                //   .adjEnabled(2 * i + 1) = mask And &H8
                //   .singleEnabled(2 * i) = mask And &H10
                //   .singleEnabled(2 * i + 1) = mask And &H20
                result.NarrowFiltersEnabled[band0] = (mask & 0x01) != 0;
                result.AdjBwFiltersEnabled[band0] = (mask & 0x02) != 0;
                result.NarrowFiltersEnabled[band1] = (mask & 0x04) != 0;
                result.AdjBwFiltersEnabled[band1] = (mask & 0x08) != 0;
                result.SingleBandEnabled[band0] = (mask & 0x10) != 0;
                result.SingleBandEnabled[band1] = (mask & 0x20) != 0;

                // Power DL (signed byte)
                //   .powerDL(2 * i) = AsciiToInt(Mid(s, 5 + 6 * i, 2))
                //   If .powerDL(2 * i) > 127 Then .powerDL(2 * i) = .powerDL(2 * i) - 256
                result.PowerLimitDownlink[band0] = ParseSignedByte(hexResponse, offset + 2);
                result.PowerLimitDownlink[band1] = ParseSignedByte(hexResponse, offset + 4);
            }

            _logger.LogDebug("Parse successful: Boot={Boot}, Narrow=[{N0},{N1},{N2},{N3}], Power=[{P0},{P1},{P2},{P3}]",
                result.BootFirmware,
                result.NarrowFiltersEnabled[0], result.NarrowFiltersEnabled[1],
                result.NarrowFiltersEnabled[2], result.NarrowFiltersEnabled[3],
                result.PowerLimitDownlink[0], result.PowerLimitDownlink[1],
                result.PowerLimitDownlink[2], result.PowerLimitDownlink[3]);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error parsing license options: {Hex}", hexResponse);
        }

        return result;
    }

    /// <summary>
    /// Encodes options to hex string for M0 command.
    /// </summary>
    /// <param name="options">Options to encode</param>
    /// <returns>Hex string of 14 characters to send with M0</returns>
    public string ToHexString(LicenseOptions options)
    {
        var sb = new StringBuilder(14);

        try
        {
            // Boot mask
            //   mask = 0
            //   If .bootFirmware = 1 Then mask = mask Or &H1
            //   res = res & VB.Right("0" & Hex(mask), 2)
            int bootMask = options.BootFirmware == 1 ? 0x01 : 0x00;
            sb.Append(bootMask.ToString("X2"));

            // FW0 and FW1
            for (int fw = 0; fw <= 1; fw++)
            {
                int band0 = fw * 2;
                int band1 = band0 + 1;

                // Build options mask
                //   mask = 0
                //   If .chEnabled(2 * i) Then mask = mask Or &H1
                //   If .adjEnabled(2 * i) Then mask = mask Or &H2
                //   If .chEnabled(2 * i + 1) Then mask = mask Or &H4
                //   If .adjEnabled(2 * i + 1) Then mask = mask Or &H8
                //   If .singleEnabled(2 * i) Then mask = mask Or &H10
                //   If .singleEnabled(2 * i + 1) Then mask = mask Or &H20
                int mask = 0;
                if (options.NarrowFiltersEnabled[band0]) mask |= 0x01;
                if (options.AdjBwFiltersEnabled[band0]) mask |= 0x02;
                if (options.NarrowFiltersEnabled[band1]) mask |= 0x04;
                if (options.AdjBwFiltersEnabled[band1]) mask |= 0x08;
                if (options.SingleBandEnabled[band0]) mask |= 0x10;
                if (options.SingleBandEnabled[band1]) mask |= 0x20;

                sb.Append(mask.ToString("X2"));

                // Power DL as unsigned byte
                //   resi = .powerDL(2 * i)
                //   If resi < 0 Then resi = resi + 256
                //   res = res & VB.Right("0" & Hex(resi), 2)
                sb.Append(ToUnsignedHex(options.PowerLimitDownlink[band0]));
                sb.Append(ToUnsignedHex(options.PowerLimitDownlink[band1]));
            }

            _logger.LogDebug("ToHexString: {Hex}", sb.ToString());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error encoding license options");
        }

        return sb.ToString();
    }

    /// <summary>
    /// Parses 2 hex characters to integer.
    /// </summary>
    private static int ParseHexByte(string hex, int offset)
    {
        return Convert.ToInt32(hex.Substring(offset, 2), 16);
    }

    /// <summary>
    /// Parses 2 hex characters to signed byte (-128 to 127).
    /// </summary>
    private static short ParseSignedByte(string hex, int offset)
    {
        int value = ParseHexByte(hex, offset);
        return (short)(value > 127 ? value - 256 : value);
    }

    /// <summary>
    /// Converts signed short to a 2-character hex string (unsigned).
    /// </summary>
    private static string ToUnsignedHex(short value)
    {
        int unsigned = value < 0 ? value + 256 : value;
        return unsigned.ToString("X2");
    }
}
