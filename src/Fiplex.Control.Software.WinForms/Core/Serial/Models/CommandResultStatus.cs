namespace Fiplex.Control.Software.WinForms.Core.Serial.Models;

/// <summary>
/// Status codes for serial command execution results.
/// </summary>
/// <remarks>
/// Used in <see cref="SerialResult"/> to indicate the outcome of a command execution.
/// </remarks>
/// <seealso cref="SerialResult"/>
/// <seealso cref="ISerialCommandPipeline"/>
public enum CommandResultStatus
{
    /// <summary>Comando ejecutado exitosamente</summary>
    Success,
    
    /// <summary>Timeout esperando ACK</summary>
    AckTimeout,
    
    /// <summary>Timeout esperando datos</summary>
    DataTimeout,
    
    /// <summary>Máximo de reintentos excedido</summary>
    MaxRetriesExceeded,
    
    /// <summary>Comando cancelado</summary>
    Cancelled,
    
    /// <summary>Error genérico</summary>
    Error,
    
    /// <summary>Error de autenticación (INVALID CREDENTIALS)</summary>
    AuthenticationFailed,
    
    /// <summary>Validación de respuesta fallida</summary>
    ValidationFailed,
    
    /// <summary>Error de protocolo</summary>
    ProtocolError
}
