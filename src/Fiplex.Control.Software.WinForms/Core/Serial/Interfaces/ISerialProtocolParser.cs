using Fiplex.Control.Software.WinForms.Core.Serial.Models;

namespace Fiplex.Control.Software.WinForms.Core.Serial.Interfaces;

/// <summary>
/// Fiplex serial protocol parser.
/// </summary>
public interface ISerialProtocolParser
{
    /// <summary>
    /// Processes incoming data and returns parsed tokens.
    /// </summary>
    IEnumerable<ProtocolToken> ProcessIncomingData(ReadOnlySpan<byte> data);
    
    /// <summary>
    /// Resets the parser state.
    /// </summary>
    void Reset();
    
    /// <summary>
    /// Indicates whether there is partial data in the buffer.
    /// </summary>
    bool HasPartialData();
    
    /// <summary>
    /// Gets partial data if timeout expired.
    /// </summary>
    ProtocolToken? GetPartialDataIfTimeout();
    
    /// <summary>
    /// Indicates whether the parser is waiting for LF (end of frame).
    /// </summary>
    bool IsWaitingLF { get; }
    
    /// <summary>
    /// Current length of the receive buffer.
    /// </summary>
    int BufferLength { get; }
}
