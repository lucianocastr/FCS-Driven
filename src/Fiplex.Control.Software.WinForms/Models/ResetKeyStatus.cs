namespace Fiplex.Control.Software.WinForms.Models;

/// <summary>
/// Result of a password reset protocol exchange with the device.
/// Parsed from the tab-separated response: {24-char key}\t{16-char hex status}.
/// VB6 1.12 equivalent: resetPassStatusData struct in frmResetPass.frm.
/// </summary>
public record ResetKeyStatus
{
    public bool ValidData { get; init; }
    public string Key { get; init; } = string.Empty;
    public bool AckReceived { get; init; }
    public bool Waiting { get; init; }
    public long RemainingSeconds { get; init; }
    public int RemainingAttempts { get; init; }
    public int ThrottlingSeconds { get; init; }
    public int ResultCode { get; init; }

    public bool ThrottlingPassRequest => ResultCode == 1;
    public bool PassNotMatch => ResultCode == 2;
    public bool Throttling3Seconds => ResultCode == 3;
    public bool Throttling30Seconds => ResultCode == 4;
    public bool PassNotMatchExhaustedAttempts => ResultCode == 5;
    public bool ExhaustedAttempts => ResultCode == 6;
}
