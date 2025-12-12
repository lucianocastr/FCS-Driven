namespace Fiplex.Control.Software.WinForms.Core.Serial.Models;

/// <summary>
/// Token types recognized in the Fiplex serial protocol.
/// </summary>
/// <remarks>
/// Used by the protocol parser to classify incoming data frames.
/// </remarks>
/// <seealso cref="ProtocolToken"/>
/// <seealso cref="SerialProtocolParser"/>
public enum TokenType
{
    /// <summary>ACK - Command received successfully</summary>
    Ack,
    
    /// <summary>NACK - Command error</summary>
    Nack,
    
    /// <summary>DataFrame - Response with data</summary>
    DataFrame,
    
    /// <summary>Invalid credentials - Authentication required</summary>
    InvalidCredentials,
    
    /// <summary>Timeout - No response from device</summary>
    Timeout,
    
    /// <summary>Checksum or format error</summary>
    ProtocolError,
    
    /// <summary>Partial response - Waiting for more data</summary>
    PartialResponse
}
