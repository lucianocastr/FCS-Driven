namespace Fiplex.Control.Software.WinForms.Core.Serial.Models;

/// <summary>
/// Represents a parsed token from the serial protocol stream.
/// </summary>
/// <param name="Type">The type of token parsed.</param>
/// <param name="Data">The data content of the token, if applicable.</param>
public record ProtocolToken(TokenType Type, string Data = "");
