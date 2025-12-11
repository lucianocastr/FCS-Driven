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
    /// <summary>ACK - Comando recibido correctamente</summary>
    Ack,
    
    /// <summary>NACK - Error en comando</summary>
    Nack,
    
    /// <summary>DataFrame - Respuesta con datos</summary>
    DataFrame,
    
    /// <summary>Error de credenciales - Requiere autenticación</summary>
    InvalidCredentials,
    
    /// <summary>Timeout - Sin respuesta del dispositivo</summary>
    Timeout,
    
    /// <summary>Error de checksum o formato</summary>
    ProtocolError,
    
    /// <summary>Respuesta parcial - Esperando más datos</summary>
    PartialResponse
}
