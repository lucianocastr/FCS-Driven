using System.Diagnostics;
using Fiplex.Control.Software.WinForms.Core.Diagnostics;
using Fiplex.Control.Software.WinForms.Core.Serial.Interfaces;
using Microsoft.Extensions.Logging;

namespace Fiplex.Control.Software.WinForms.Core.Serial.Implementation;

/// <summary>
/// Simulated serial port for NoUSB mode.
/// Allows complete testing of the application without physical hardware.
/// </summary>
public sealed class SimulatedSerialPort : ISerialPort
{
    private readonly ILogger<SimulatedSerialPort> _logger;
    private readonly DiscoveryTelemetry _telemetry;
    private bool _isOpen = false;
    private string _portName = string.Empty;
    private byte[] _pendingResponse = Array.Empty<byte>();
    private int _readPosition = 0;
    
    /// <summary>
    /// Simulated responses by command (first 2 characters).
    /// </summary>
    private static readonly Dictionary<string, string> SimulatedResponses = new(StringComparer.OrdinalIgnoreCase)
    {
        // V1 - Version: Typical 2c device response
        ["V1"] = "01061D0200020100",
        
        // N1 - Device ID/Name: Serial number
        ["N1"] = "9012           ",
        
        // S1 - Status: Long hex frame with device status
        ["S1"] = GenerateStatusResponse(),
        
        // C1 - Configuration: Device configuration
        ["C1"] = GenerateConfigResponse(),
        
        // F1 - Factory Parameters
        ["F1"] = GenerateFactoryResponse(),
        
        // E1 - Ethernet Configuration (IP, mask, gateway)
        ["E1"] = "C0A8010AFFFFFF00C0A80101000000000000",
        
        // U1 - User Configuration (used in multipart O1+U1)
        ["U1"] = GenerateUserConfigResponse(),
        
        // O1 - Operating Status (used in multipart O1+U1 for 5dm)
        ["O1"] = GenerateOperatingStatusResponse(),
        
        // T1 - Temperature/Test
        ["T1"] = "2500", // 25.00 grados
        
        // L1 - License Info (for devices with license)
        ["L1"] = "FIPLEX\tTRAINING\t20261231\tUSER",
        
        // M1 - License Options (hardware license options read)
        // 2 bands format: [mask:2][powerDL0:2][powerDL1:2] = 6 hex chars
        // 4 bands format: [mask:2][powerDL0-3:2x4][options:2x2] = 14 hex chars
        // Simulated values: mask=00, powerDL0=0A(10dB), powerDL1=0F(15dB)
        ["M1"] = "000A0F",  // 2-band license options response
        
        // A1 - Spectrum data: 28800 channels × 2 hex chars = 57600 chars at -112 dBm (0x90)
        ["A1"] = GenerateSpectrumResponse(),

        // Write commands return ACK
        ["*0"] = "ACK", // Authentication
        ["M0"] = "ACK", // Write License Options (frmLicenseOptions, frmLicenseMaster)
        ["C0"] = "ACK", // Write Config
        ["F0"] = "ACK", // Write Factory
        ["E0"] = "ACK", // Write Ethernet
        ["T0"] = "ACK", // Test/Calibration
        ["J0"] = "ACK", // Jump/Reboot
        ["N0"] = "ACK", // Set Name
        ["^0"] = "ACK", // Reset
        ["R0"] = "ACK", // Reboot
        ["L0"] = "ACK", // Write License
    };

    public SimulatedSerialPort(ILogger<SimulatedSerialPort> logger, DiscoveryTelemetry telemetry)
    {
        _logger = logger;
        _telemetry = telemetry;
    }

    public bool IsOpen => _isOpen;
    public int BytesToRead => _pendingResponse.Length - _readPosition;

    public void DiscardInBuffer()
    {
        _pendingResponse = Array.Empty<byte>();
        _readPosition = 0;
    }
    
    public event Action<Exception>? ErrorOccurred;

    public Task<bool> OpenAsync(string portName, int baudRate = 9600, CancellationToken ct = default)
    {
        var sw = Stopwatch.StartNew();
        _portName = portName;
        _isOpen = true;
        _logger.LogInformation("[Serial] Open  {Port} OK     duration={Ms}ms", portName, sw.ElapsedMilliseconds);
        _telemetry.IncrementPortOpenSuccess();
        return Task.FromResult(true);
    }

    public Task<int> WriteAsync(ReadOnlyMemory<byte> data, CancellationToken ct = default)
    {
        if (!_isOpen)
            throw new InvalidOperationException("Simulated port not open");

        var command = System.Text.Encoding.ASCII.GetString(data.Span).TrimEnd('\n', '\r');
        _logger.LogDebug("🔧 TX (simulated): {Command}", command);

        // Look for simulated response
        var response = GetSimulatedResponse(command);
        
        // Add LF at the end (Fiplex protocol)
        _pendingResponse = System.Text.Encoding.ASCII.GetBytes(response + "\n");
        _readPosition = 0;
        
        _logger.LogDebug("🔧 Response prepared: {Length} bytes", _pendingResponse.Length);
        
        return Task.FromResult(data.Length);
    }

    public Task<int> ReadAsync(Memory<byte> buffer, CancellationToken ct = default)
    {
        if (!_isOpen)
            throw new InvalidOperationException("Simulated port not open");

        if (_readPosition >= _pendingResponse.Length)
        {
            // No pending data
            return Task.FromResult(0);
        }

        // Simulate small communication delay
        Thread.Sleep(5);

        var bytesToCopy = Math.Min(buffer.Length, _pendingResponse.Length - _readPosition);
        _pendingResponse.AsSpan(_readPosition, bytesToCopy).CopyTo(buffer.Span);
        _readPosition += bytesToCopy;

        _logger.LogDebug("🔧 RX (simulated): {Bytes} bytes read", bytesToCopy);
        
        return Task.FromResult(bytesToCopy);
    }

    public void Close()
    {
        _isOpen = false;
        _pendingResponse = Array.Empty<byte>();
        _readPosition = 0;
        _logger.LogInformation("🔧 SimulatedSerialPort closed");
    }

    public Task CloseAsync()
    {
        var portName = _portName;
        var sw = Stopwatch.StartNew();
        _isOpen = false;
        _pendingResponse = Array.Empty<byte>();
        _readPosition = 0;
        _logger.LogInformation("[Serial] Close {Port} OK     duration={Ms}ms", portName, sw.ElapsedMilliseconds);
        return Task.CompletedTask;
    }

    public void Dispose() => Close();

    /// <summary>
    /// Gets simulated response for a command.
    /// </summary>
    private string GetSimulatedResponse(string command)
    {
        if (string.IsNullOrEmpty(command))
            return "NACK";

        // Extract command prefix (first 2 characters)
        var prefix = command.Length >= 2 ? command.Substring(0, 2).ToUpperInvariant() : command.ToUpperInvariant();
        
        // Special case: authentication *0password
        if (command.StartsWith("*0"))
        {
            _logger.LogInformation("🔧 Simulated authentication accepted");
            return "ACK";
        }

        // Look up in responses dictionary
        if (SimulatedResponses.TryGetValue(prefix, out var response))
        {
            _logger.LogDebug("\ud83d\udd27 Simulated response for {Prefix}: {Length} chars", 
                prefix, response.Length);
            return response;
        }

        // Unrecognized write commands return ACK
        if (prefix.EndsWith("0"))
        {
            _logger.LogWarning("🔧 Unrecognized write command: {Command}, returning ACK", command);
            return "ACK";
        }

        // Unrecognized read commands
        _logger.LogWarning("🔧 Unrecognized command: {Command}, returning empty", command);
        return "";
    }

    #region Simulated Response Generators

    /// <summary>
    /// Generates S1 (Status) response with 40 TAB-separated fields.
    /// </summary>
    private static string GenerateStatusResponse()
    {
        // 40 simulated fields to pass splitwith3tabs:40 validation
        var fields = new string[40];
        for (int i = 0; i < 40; i++)
        {
            fields[i] = i switch
            {
                0 => "00",       // Mode
                1 => "01",       // Channel
                2 => "F82A3C",   // Frequency (hex)
                3 => "25",       // Temperature
                4 => "100",      // Power
                5 => "000",      // Error flags
                6 => "01",       // Status
                7 => "FF",       // Signal level
                8 => "00",       // Alarm
                9 => "02",       // Version
                _ => $"{i:D2}"   // Rest with generic values
            };
        }
        return string.Join("\t", fields);
    }

    /// <summary>
    /// Generates C1 (Configuration) response with 9 fields.
    /// </summary>
    private static string GenerateConfigResponse()
    {
        // 9 configuration fields
        var fields = new[]
        {
            "F82A3C",   // Frequency
            "100",      // Power
            "01",       // Mode
            "00",       // Options
            "FF",       // Gain
            "01",       // Channel
            "00",       // Reserved
            "00",       // Reserved
            "01"        // Enabled
        };
        return string.Join("\t", fields);
    }

    /// <summary>
    /// Generates F1 (Factory Parameters) response: 482-char hex string compatible with
    /// objfactory.js factory.parse() (requires s.length >= 482).
    /// Simulates DAS Master 5DM with:
    ///   - chBandEnabled[0,1] = true, adjBandEnabled[0,1] = true
    ///   - agcModeUSA[0,1]   = true
    ///   - fstart[1] = 200 000 Hz  (0.2 MHz  — DL band-0 start)
    ///   - fstop[1]  = 2 880 100 000 Hz (2880.1 MHz — DL band-0 stop)
    ///   - Band names: "700MHz Band", "800MHz Band"
    /// Layout mirrors the objfactory.js parse() byte-offset map.
    /// </summary>
    private static string GenerateFactoryResponse()
    {
        var sb = new System.Text.StringBuilder(482);

        // ind 0-1   : chBandEnabled[0,1]=true (bits 0,2), adjBandEnabled[0,1]=true (bits 1,3) → 0x0F
        sb.Append("0F");
        // ind 2-3   : agcModeUSA[0]=true (bit4), agcModeUSA[1]=true (bit5) → 0x30
        sb.Append("30");
        // ind 4-59  : DACFTW, DCOFFSET, fdummy, fmodulo, fstep, fmoduloadj, fstepAdj — all zero (56 chars)
        sb.Append('0', 56);

        // ind 60-135: band-0 fields before fstart[] — all zero (76 chars)
        //   levelOffset[0,1]:8  sQOffset[0,1]:8  gainOffset[0,1]:8  powerOffset[0,1]:8
        //   singleBandEnabled+flags:2  padding:2  gainBandCorrection[0]:4
        //   paCurrentMin[0,1]:4  paCurrentMax[0,1]:4  attout[0,1]:4
        //   powerlimit[0,1]:4  gainlimit[0,1]:4  NCO_Rx[0,1]:8  NCO_Tx[0,1]:8  = 76
        sb.Append('0', 76);

        // ind 136-143: fstart[0] = 0 Hz  (UL — unused in default DL simulation)
        sb.Append("00000000");
        // ind 144-151: fstart[1] = 200 000 Hz = 0x00030D40  (DL band-0 start → 0.2 MHz)
        sb.Append("00030D40");
        // ind 152-159: fstop[0]  = 0 Hz  (UL)
        sb.Append("00000000");
        // ind 160-167: fstop[1]  = 2 880 100 000 Hz = 0xABAAD6A0  (DL band-0 stop → 2880.1 MHz)
        sb.Append("ABAAD6A0");
        // ind 168-191: fref[0], fref[1], rfoutSpecOffset[0,1] — zero (24 chars)
        sb.Append('0', 24);

        // ind 192-323: band-1 data — all zero (132 chars)
        sb.Append('0', 132);

        // ind 324-347: agcThresholdUp/Down (16 chars) + previsionThreshold (8 chars) — zero (24 chars)
        sb.Append('0', 24);

        // ind 348-362: band-0 name as raw ASCII, padded to BANDNAMELEN=15
        sb.Append("700MHz Band    ");   // 11 chars + 4 spaces
        // ind 363-377: band-1 name
        sb.Append("800MHz Band    ");   // 11 chars + 4 spaces

        // ind 378-481: calDlPowerDetector, powerBandCorrection, gainBandCorrection,
        //              calPaCurrentDetector, calBoardCurrentDetector, relay fields — zero (104 chars)
        sb.Append('0', 104);

        return sb.ToString(); // 482 chars total
    }

    /// <summary>
    /// Generates A1 (Spectrum) response: 57600-char hex string representing
    /// 28800 channels of spectrum data at a flat -112 dBm level (0x90 per channel).
    /// Compatible with the load_spectrum() check: serverResponse.length >= nchannels * 2.
    /// </summary>
    private static string GenerateSpectrumResponse()
    {
        // 28800 channels × "90" = 57600 chars
        // cSignedByte(0x90=144) = 144-256 = -112 dBm  (visible mid-lower in the inYscale -130..0)
        var sb = new System.Text.StringBuilder(57600);
        for (int i = 0; i < 28800; i++)
            sb.Append("90");
        return sb.ToString();
    }

    /// <summary>
    /// Generates U1 (User Config) response for multipart.
    /// </summary>
    private static string GenerateUserConfigResponse()
    {
        // Hex user configuration response
        return "0000091A0B0C0D0E0F1011121314151617181920212223242526272829303132333435363738394041424344454647484950";
    }

    /// <summary>
    /// Generates O1 (Operating Status) response for 5dm multipart.
    /// </summary>
    private static string GenerateOperatingStatusResponse()
    {
        // Hex operating status response
        return "AA55AA550102030405060708090A0B0C0D0E0F101112131415161718191A1B1C1D1E1F202122232425262728292A2B2C2D";
    }

    #endregion
}
