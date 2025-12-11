using System.Text;
using Fiplex.Control.Software.WinForms.Core.Serial.Interfaces;
using Fiplex.Control.Software.WinForms.Core.Serial.Models;
using Microsoft.Extensions.Logging;

namespace Fiplex.Control.Software.WinForms.Core.Serial.Implementation;

/// <summary>
/// Parser del protocolo serial Fiplex.
/// </summary>
public class SerialProtocolParser : ISerialProtocolParser
{
    private readonly StringBuilder _buffer = new();
    private readonly ILogger<SerialProtocolParser>? _logger;
    private bool _waitingLF = false;
    private DateTime _lastByteReceived = DateTime.MinValue;
    
    // Constantes de protocolo
    private const string InvalidCredentialsMarker = "INVALID CREDENTIALS";
    private const string AckMarker = "ACK";
    private const string NackMarker = "NACK";
    private const char LF = '\n';
    private const char CR = '\r';
    
    // Timeout para datos parciales (ms)
    private const int PartialDataTimeoutMs = 500;

    public SerialProtocolParser()
    {
    }

    public SerialProtocolParser(ILogger<SerialProtocolParser> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Procesa datos entrantes del puerto serial.
    /// </summary>
    public IEnumerable<ProtocolToken> ProcessIncomingData(ReadOnlySpan<byte> data)
    {
        var tokens = new List<ProtocolToken>();
        _lastByteReceived = DateTime.Now;
        _waitingLF = true;
        
        foreach (byte b in data)
        {
            // LF detectado = fin de trama
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
                // Ignorar CR, solo usamos LF como terminador
            }
            else if (b == '\t')
            {
                // Preservar caracteres TAB (ASCII 9)
                // Los dispositivos Fiplex usan triple-tab como separador de frames
                _buffer.Append('\t');
            }
            else if (b >= 32 && b <= 126)
            {
                // Caracteres imprimibles ASCII estándar
                _buffer.Append((char)b);
            }
            else if (b >= 128)
            {
                // Caracteres extendidos (algunos dispositivos los usan)
                _buffer.Append((char)b);
            }
            // Otros bytes de control (< 32, excepto TAB/CR/LF) se ignoran
        }

        return tokens;
    }

    /// <summary>
    /// Parsea una línea completa y determina el tipo de token.
    /// </summary>
    private ProtocolToken ParseLine(string line)
    {
        // Detectar ACK
        if (line.Equals(AckMarker, StringComparison.OrdinalIgnoreCase))
        {
            return new ProtocolToken(TokenType.Ack);
        }
        
        // Detectar NACK
        if (line.Equals(NackMarker, StringComparison.OrdinalIgnoreCase))
        {
            return new ProtocolToken(TokenType.Nack);
        }
        
        // Detectar INVALID CREDENTIALS
        if (line.Contains(InvalidCredentialsMarker, StringComparison.OrdinalIgnoreCase))
        {
            _logger?.LogWarning("Received INVALID CREDENTIALS response");
            return new ProtocolToken(TokenType.InvalidCredentials, line);
        }
        
        // DataFrame normal
        return new ProtocolToken(TokenType.DataFrame, line);
    }

    /// <summary>
    /// Valida si hay datos parciales pendientes (timeout).
    /// </summary>
    public bool HasPartialData()
    {
        if (_buffer.Length == 0)
            return false;
            
        var elapsed = (DateTime.Now - _lastByteReceived).TotalMilliseconds;
        return elapsed < PartialDataTimeoutMs;
    }

    /// <summary>
    /// Obtiene datos parciales si el timeout expiró.
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
    /// Reinicia el estado del parser.
    /// </summary>
    public void Reset()
    {
        _buffer.Clear();
        _waitingLF = false;
        _logger?.LogDebug("Parser reset");
    }
    
    /// <summary>
    /// Indica si el parser está esperando LF.
    /// </summary>
    public bool IsWaitingLF => _waitingLF;
    
    /// <summary>
    /// Longitud actual del buffer.
    /// </summary>
    public int BufferLength => _buffer.Length;
}
