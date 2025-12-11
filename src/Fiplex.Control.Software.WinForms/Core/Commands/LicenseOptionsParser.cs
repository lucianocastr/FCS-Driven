using Fiplex.Control.Software.WinForms.Models;
using Microsoft.Extensions.Logging;
using System.Text;

namespace Fiplex.Control.Software.WinForms.Core.Commands;

/// <summary>
/// Parser para opciones de licencia de hardware (comandos M0/M1).
/// 
/// Formato hex de 14 caracteres:
/// [1-2]   Boot mask       - bit0=1 → VHF/UHF, bit0=0 → 700/800
/// [3-4]   FW0 mask        - Opciones banda 700/800
/// [5-6]   PowerDL 700     - Signed byte (-128..127)
/// [7-8]   PowerDL 800     - Signed byte (-128..127)
/// [9-10]  FW1 mask        - Opciones banda VHF/UHF
/// [11-12] PowerDL VHF     - Signed byte (-128..127)
/// [13-14] PowerDL UHF     - Signed byte (-128..127)
/// 
/// Bits de máscara FW:
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
    /// Valida si una cadena es hex válido para M1.
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
    /// Decodifica respuesta hex del comando M1.
    /// </summary>
    /// <param name="hexResponse">String hex de 14 caracteres desde comando M1</param>
    /// <returns>Opciones de licencia decodificadas</returns>
    public LicenseOptions Parse(string hexResponse)
    {
        var result = new LicenseOptions();

        if (!IsValidHex(hexResponse))
        {
            _logger.LogWarning("Parse: respuesta hex inválida: '{Response}' (esperado {Expected} caracteres hex)", 
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

            // Procesar FW0 (700/800) y FW1 (VHF/UHF)
            for (int fw = 0; fw <= 1; fw++)
            {
                // Offset: FW0 comienza en posición 2, FW1 en posición 8
                int offset = FW0Offset + (fw * FWBlockSize);
                int mask = ParseHexByte(hexResponse, offset);

                int band0 = fw * 2;      // 0 o 2
                int band1 = band0 + 1;   // 1 o 3

                // Decodificar bits de máscara
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

            _logger.LogDebug("Parse exitoso: Boot={Boot}, Narrow=[{N0},{N1},{N2},{N3}], Power=[{P0},{P1},{P2},{P3}]",
                result.BootFirmware,
                result.NarrowFiltersEnabled[0], result.NarrowFiltersEnabled[1],
                result.NarrowFiltersEnabled[2], result.NarrowFiltersEnabled[3],
                result.PowerLimitDownlink[0], result.PowerLimitDownlink[1],
                result.PowerLimitDownlink[2], result.PowerLimitDownlink[3]);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error parseando opciones de licencia: {Hex}", hexResponse);
        }

        return result;
    }

    /// <summary>
    /// Codifica opciones a string hex para comando M0.
    /// </summary>
    /// <param name="options">Opciones a codificar</param>
    /// <returns>String hex de 14 caracteres para enviar con M0</returns>
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

            // FW0 y FW1
            for (int fw = 0; fw <= 1; fw++)
            {
                int band0 = fw * 2;
                int band1 = band0 + 1;

                // Construir máscara de opciones
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

                // Power DL como unsigned byte
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
            _logger.LogError(ex, "Error codificando opciones de licencia");
        }

        return sb.ToString();
    }

    /// <summary>
    /// Parsea 2 caracteres hex a entero.
    /// </summary>
    private static int ParseHexByte(string hex, int offset)
    {
        return Convert.ToInt32(hex.Substring(offset, 2), 16);
    }

    /// <summary>
    /// Parsea 2 caracteres hex a signed byte (-128 a 127).
    /// </summary>
    private static short ParseSignedByte(string hex, int offset)
    {
        int value = ParseHexByte(hex, offset);
        return (short)(value > 127 ? value - 256 : value);
    }

    /// <summary>
    /// Convierte signed short a string hex de 2 caracteres (unsigned).
    /// </summary>
    private static string ToUnsignedHex(short value)
    {
        int unsigned = value < 0 ? value + 256 : value;
        return unsigned.ToString("X2");
    }
}
