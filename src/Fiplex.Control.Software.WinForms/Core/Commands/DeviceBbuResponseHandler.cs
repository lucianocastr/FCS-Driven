using Fiplex.Control.Software.WinForms.Core.Commands.Interfaces;
using Microsoft.Extensions.Logging;

namespace Fiplex.Control.Software.WinForms.Core.Commands;

/// <summary>
/// Response handler for devices with Battery Backup Unit (BBU) support.
/// Implements AnalyzeDeepDischVolt: detects and corrects deep discharge
/// voltage out of range in factory data U1 responses.
///
/// VB6 1.12 parity — GetFromFileData.bas lines 397-401, 495-520:
///   Activation condition:
///     ((tdev="5dm" Or tdev="3dr") And ndev=1 And frversion=0)
///     Or (tdev="2c" And ndev=2)
///     Or (tdev="3c" And ndev=1)
///   Command: U1
///   Fix: overwrites voltage bytes at factory data position 434-437 with 0x27D8 (10.2V)
///
/// Approximation: frversion=0 filter for 5dm/3dr cannot be applied via CanHandle
/// (frVersion is not in the handler interface). DeviceResponseProcessor passes the
/// deviceType via ConfigureDeviceType after handler selection. For frVersion>0 SDRP
/// devices, position 434-437 is not expected to hold battery voltage data, so the
/// [10.1,10.3] range check will exit cleanly without modification in practice.
/// </summary>
public class DeviceBbuResponseHandler : IDeviceResponseHandler
{
    private readonly ILogger<DeviceBbuResponseHandler> _logger;
    private string _factStrFixed = string.Empty;
    private string _activeDeviceType = string.Empty;

    public int Priority => 85;

    public DeviceBbuResponseHandler(ILogger<DeviceBbuResponseHandler> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Called by DeviceResponseProcessor after handler selection to pass the active device type.
    /// Required to correctly apply the 5dm-specific prefix in AnalyzeDeepDischVolt.
    /// </summary>
    public void ConfigureDeviceType(string deviceType)
    {
        _activeDeviceType = deviceType;
    }

    /// <summary>
    /// Activates for device types and versions with BBU:
    ///   2c/2.0, 3c/1.0, 5dm/1.0, 3dr/1.0
    /// </summary>
    public bool CanHandle(string deviceType, double version)
        => (deviceType.Equals("2c",  StringComparison.OrdinalIgnoreCase) && Math.Abs(version - 2.0) < 0.05)
        || (deviceType.Equals("3c",  StringComparison.OrdinalIgnoreCase) && Math.Abs(version - 1.0) < 0.05)
        || (deviceType.Equals("5dm", StringComparison.OrdinalIgnoreCase) && Math.Abs(version - 1.0) < 0.05)
        || (deviceType.Equals("3dr", StringComparison.OrdinalIgnoreCase) && Math.Abs(version - 1.0) < 0.05);

    /// <summary>
    /// Processes U1 responses: applies deep discharge voltage fix when detected.
    /// </summary>
    public string ProcessResponse(string command, string rawResponse)
    {
        if (string.IsNullOrEmpty(rawResponse))
            return rawResponse;

        if (!command.Equals("U1", StringComparison.OrdinalIgnoreCase))
            return rawResponse;

        if (AnalyzeDeepDischVolt(rawResponse))
        {
            _logger.LogWarning(
                "bugDeepDisch detected ({DeviceType}): voltage out of [10.1,10.3]V, applying 10.2V fix",
                _activeDeviceType);
            return _factStrFixed;
        }

        return rawResponse;
    }

    /// <summary>
    /// VB6 1.12 parity: analyzeDeepDischVolt (GetFromFileData.bas lines 495-520).
    /// Returns true when the fix is applied (bugDeepDisch=true in VB6).
    /// Sets _factStrFixed with the corrected factory string.
    /// </summary>
    private bool AnalyzeDeepDischVolt(string response)
    {
        _factStrFixed = string.Empty;

        try
        {
            // VB6: buff = Split(s, vbTab)
            var buff = response.Split('\t');
            if (buff.Length < 2)
                return false;

            var factoryData = buff[1];

            // VB6: If Len(buff(1)) < 482 Then Exit Function
            if (factoryData.Length < 482)
                return false;

            // VB6: volt = AsciiToInt(Mid(buff(1), 435, 4)) / 1000
            // 0-indexed: Substring(434, 4)
            var voltHex = factoryData.Substring(434, 4);
            var voltRaw = Convert.ToInt32(voltHex, 16);
            var volt = voltRaw / 1000.0;

            // VB6: If volt > 10.1 And volt < 10.3 Then Exit Function
            if (volt > 10.1 && volt < 10.3)
                return false;

            // VB6: factStrFixed = Left(buff(1), 434) & "27D8" & Right(buff(1), ...)
            // 0x27D8 = 10200 → 10.2V
            _factStrFixed = factoryData.Substring(0, 434)
                          + "27D8"
                          + factoryData.Substring(438);

            // VB6: If tdev = "5dm" Then prepend "00" or "01" based on commonUl
            if (_activeDeviceType.Equals("5dm", StringComparison.OrdinalIgnoreCase))
            {
                // VB6: commonUl = (AsciiToInt(Mid(buff(1), 3, 2)) And &H80) <> 0
                // 0-indexed: Substring(2, 2)
                var commonUlHex = factoryData.Substring(2, 2);
                var commonUlVal = Convert.ToInt32(commonUlHex, 16);
                var commonUl = (commonUlVal & 0x80) != 0;
                _factStrFixed = (commonUl ? "00" : "01") + _factStrFixed;
            }

            _logger.LogInformation(
                "bugDeepDisch: volt={Volt:F3}V ({VoltHex}) fixed to 10.2V (27D8) for {DeviceType}",
                volt, voltHex, _activeDeviceType);

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in AnalyzeDeepDischVolt");
            return false;
        }
    }

    public void Reset()
    {
        _factStrFixed = string.Empty;
        _activeDeviceType = string.Empty;
    }
}
