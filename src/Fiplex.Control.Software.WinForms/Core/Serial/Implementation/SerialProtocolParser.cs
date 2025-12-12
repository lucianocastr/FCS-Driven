using System.Text;
using Fiplex.Control.Software.WinForms.Core.Serial.Interfaces;
using Fiplex.Control.Software.WinForms.Core.Serial.Models;
using Microsoft.Extensions.Logging;

namespace Fiplex.Control.Software.WinForms.Core.Serial.Implementation;

/// <summary>
/// Fiplex serial protocol parser.
/// </summary>
public class SerialProtocolParser : ISerialProtocolParser
{
    private readonly StringBuilder _buffer = new();
    private readonly ILogger<SerialProtocolParser>? _logger;
    private bool _waitingLF = false;
    private DateTime _lastByteReceived = DateTime.MinValue;
    
    // Protocol constants
    private const string InvalidCredentialsMarker = "INVALID CREDENTIALS";
    private const string AckMarker = "ACK";
    private const string NackMarker = "NACK";
    private const char LF = '\n';
    private const char CR = '\r';
    
    // Timeout for partial data (ms)
    private const int PartialDataTimeoutMs = 500;

    public SerialProtocolParser()
    {
    }

    public SerialProtocolParser(ILogger<SerialProtocolParser> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Processes incoming data from the serial port.
    /// </summary>
    public IEnumerable<ProtocolToken> ProcessIncomingData(ReadOnlySpan<byte> data)
    {
        var tokens = new List<ProtocolToken>();
        _lastByteReceived = DateTime.Now;
        _waitingLF = true;
        
        foreach (byte b in data)
        {
            // LF detected = end of frame
            if (b == LF)
            {
                var line = _buffer.ToString().TrimEnd(CR);
                _buffer.Clear();
                _waitingLF = false;

                if (!string.IsNullOrEmpty(line))
                {
                    var token = ParseLine(line);
                    tokens.Add(token);
                    
                    _logger?.LogDebug("RX Token: {Type} Data: {Data}", token.Type, 
                        token.Data.Length > 100 ? token.Data[..100] + "..." : token.Data);
                }
            }
            else if (b == CR)
            {
                // Ignore CR, only use LF as terminator
            }
            else if (b == '\t')
            {
                // Preserve TAB characters (ASCII 9)
                // Fiplex devices use triple-tab as frame separator
                _buffer.Append('\t');
            }
            else if (b >= 32 && b <= 126)
            {
                // Standard printable ASCII characters
                _buffer.Append((char)b);
            }
            else if (b >= 128)
            {
                // Extended characters (some devices use them)
                _buffer.Append((char)b);
            }
            // Other control bytes (< 32, except TAB/CR/LF) are ignored
        }

        return tokens;
    }

    /// <summary>
    /// Parses a complete line and determines the token type.
    /// </summary>
    private ProtocolToken ParseLine(string line)
    {
        // Detect ACK
        if (line.Equals(AckMarker, StringComparison.OrdinalIgnoreCase))
        {
            return new ProtocolToken(TokenType.Ack);
        }
        
        // Detect NACK
        if (line.Equals(NackMarker, StringComparison.OrdinalIgnoreCase))
        {
            return new ProtocolToken(TokenType.Nack);
        }
        
        // Detect INVALID CREDENTIALS
        if (line.Contains(InvalidCredentialsMarker, StringComparison.OrdinalIgnoreCase))
        {
            _logger?.LogWarning("Received INVALID CREDENTIALS response");
            return new ProtocolToken(TokenType.InvalidCredentials, line);
        }
        
        // Normal DataFrame
        return new ProtocolToken(TokenType.DataFrame, line);
    }

    /// <summary>
    /// Validates if there is pending partial data (timeout).
    /// </summary>
    public bool HasPartialData()
    {
        if (_buffer.Length == 0)
            return false;
            
        var elapsed = (DateTime.Now - _lastByteReceived).TotalMilliseconds;
        return elapsed < PartialDataTimeoutMs;
    }

    /// <summary>
    /// Gets partial data if timeout expired.
    /// </summary>
    public ProtocolToken? GetPartialDataIfTimeout()
    {
        if (_buffer.Length == 0)
            return null;
            
        var elapsed = (DateTime.Now - _lastByteReceived).TotalMilliseconds;
        if (elapsed >= PartialDataTimeoutMs)
        {
            var data = _buffer.ToString();
            _buffer.Clear();
            _waitingLF = false;
            
            _logger?.LogWarning("Partial data timeout after {Ms}ms: {Data}", elapsed, 
                data.Length > 50 ? data[..50] + "..." : data);
            
            return new ProtocolToken(TokenType.PartialResponse, data);
        }
        
        return null;
    }

    /// <summary>
    /// Resets the parser state.
    /// </summary>
    public void Reset()
    {
        _buffer.Clear();
        _waitingLF = false;
        _logger?.LogDebug("Parser reset");
    }
    
    /// <summary>
    /// Indicates if the parser is waiting for LF.
    /// </summary>
    public bool IsWaitingLF => _waitingLF;
    
    /// <summary>
    /// Current buffer length.
    /// </summary>
    public int BufferLength => _buffer.Length;
}
