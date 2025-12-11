using Fiplex.Control.Software.WinForms.Core.Serial.Models;

namespace Fiplex.Control.Software.WinForms.Core.Serial.Interfaces;

/// <summary>
/// Parser del protocolo serial Fiplex.
/// </summary>
public interface ISerialProtocolParser
{
    /// <summary>
    /// Procesa datos entrantes y retorna tokens parseados.
    /// </summary>
    IEnumerable<ProtocolToken> ProcessIncomingData(ReadOnlySpan<byte> data);
    
    /// <summary>
    /// Reinicia el estado del parser.
    /// </summary>
    void Reset();
    
    /// <summary>
    /// Indica si hay datos parciales en el buffer.
    /// </summary>
    bool HasPartialData();
    
    /// <summary>
    /// Obtiene datos parciales si el timeout expiró.
    /// </summary>
    ProtocolToken? GetPartialDataIfTimeout();
    
    /// <summary>
    /// Indica si el parser está esperando LF (fin de trama).
    /// </summary>
    bool IsWaitingLF { get; }
    
    /// <summary>
    /// Longitud actual del buffer de recepción.
    /// </summary>
    int BufferLength { get; }
}
