using Fiplex.Control.Software.WinForms.Core.Serial.Interfaces;
using Microsoft.Extensions.Logging;

namespace Fiplex.Control.Software.WinForms.Core.Serial.Implementation;

/// <summary>
/// Puerto serial simulado para modo NoUSB.
/// Permite testing completo de la aplicación sin hardware físico.
/// </summary>
public sealed class SimulatedSerialPort : ISerialPort
{
    private readonly ILogger<SimulatedSerialPort> _logger;
    private bool _isOpen = false;
    private string _portName = string.Empty;
    private byte[] _pendingResponse = Array.Empty<byte>();
    private int _readPosition = 0;
    
    /// <summary>
    /// Respuestas simuladas por comando (primeros 2 caracteres).
    /// </summary>
    private static readonly Dictionary<string, string> SimulatedResponses = new(StringComparer.OrdinalIgnoreCase)
    {
        // V1 - Version: Respuesta típica de dispositivo 2c
        ["V1"] = "01061D0200020100",
        
        // N1 - Device ID/Name: Número de serie
        ["N1"] = "9012           ",
        
        // S1 - Status: Trama hex larga con estado del dispositivo
        ["S1"] = GenerateStatusResponse(),
        
        // C1 - Configuration: Configuración del dispositivo
        ["C1"] = GenerateConfigResponse(),
        
        // F1 - Factory Parameters
        ["F1"] = GenerateFactoryResponse(),
        
        // E1 - Ethernet Configuration (IP, máscara, gateway)
        ["E1"] = "C0A8010AFFFFFF00C0A80101000000000000",
        
        // U1 - User Configuration (usado en multipart O1+U1)
        ["U1"] = GenerateUserConfigResponse(),
        
        // O1 - Operating Status (usado en multipart O1+U1 para 5dm)
        ["O1"] = GenerateOperatingStatusResponse(),
        
        // T1 - Temperature/Test
        ["T1"] = "2500", // 25.00 grados
        
        // L1 - License Info (para dispositivos con licencia)
        ["L1"] = "FIPLEX\tTRAINING\t20261231\tUSER",
        
        // M1 - License Options (lectura de opciones de licencia hardware)
        // Formato 2 bandas: [mask:2][powerDL0:2][powerDL1:2] = 6 hex chars
        // Formato 4 bandas: [mask:2][powerDL0-3:2x4][options:2x2] = 14 hex chars
        // Valores simulados: mask=00, powerDL0=0A(10dB), powerDL1=0F(15dB)
        ["M1"] = "000A0F",  // 2-band license options response
        
        // Comandos de escritura retornan ACK
        ["*0"] = "ACK", // Autenticación
        ["M0"] = "ACK", // Write License Options (frmLicenseOptions, frmLicenseMaster)
        ["C0"] = "ACK", // Write Config
        ["F0"] = "ACK", // Write Factory
        ["E0"] = "ACK", // Write Ethernet
        ["T0"] = "ACK", // Test/Calibration
        ["J0"] = "ACK", // Jump/Reboot
        ["N0"] = "ACK", // Set Name
        ["^0"] = "ACK", // Reset
        ["R0"] = "ACK", // Reboot
        ["L0"] = "ACK", // Write License
    };

    public SimulatedSerialPort(ILogger<SimulatedSerialPort> logger)
    {
        _logger = logger;
    }

    public bool IsOpen => _isOpen;
    public int BytesToRead => _pendingResponse.Length - _readPosition;
    
    public event Action<Exception>? ErrorOccurred;

    public Task<bool> OpenAsync(string portName, int baudRate = 9600, CancellationToken ct = default)
    {
        _portName = portName;
        _isOpen = true;
        _logger.LogInformation("🔧 SimulatedSerialPort abierto: {Port} (simulado)", portName);
        return Task.FromResult(true);
    }

    public Task<int> WriteAsync(ReadOnlyMemory<byte> data, CancellationToken ct = default)
    {
        if (!_isOpen)
            throw new InvalidOperationException("Simulated port not open");

        var command = System.Text.Encoding.ASCII.GetString(data.Span).TrimEnd('\n', '\r');
        _logger.LogDebug("🔧 TX (simulado): {Command}", command);

        // Buscar respuesta simulada
        var response = GetSimulatedResponse(command);
        
        // Agregar LF al final (protocolo Fiplex)
        _pendingResponse = System.Text.Encoding.ASCII.GetBytes(response + "\n");
        _readPosition = 0;
        
        _logger.LogDebug("🔧 Respuesta preparada: {Length} bytes", _pendingResponse.Length);
        
        return Task.FromResult(data.Length);
    }

    public Task<int> ReadAsync(Memory<byte> buffer, CancellationToken ct = default)
    {
        if (!_isOpen)
            throw new InvalidOperationException("Simulated port not open");

        if (_readPosition >= _pendingResponse.Length)
        {
            // No hay datos pendientes
            return Task.FromResult(0);
        }

        // Simular pequeño delay de comunicación
        Thread.Sleep(5);

        var bytesToCopy = Math.Min(buffer.Length, _pendingResponse.Length - _readPosition);
        _pendingResponse.AsSpan(_readPosition, bytesToCopy).CopyTo(buffer.Span);
        _readPosition += bytesToCopy;

        _logger.LogDebug("🔧 RX (simulado): {Bytes} bytes leídos", bytesToCopy);
        
        return Task.FromResult(bytesToCopy);
    }

    public void Close()
    {
        _isOpen = false;
        _pendingResponse = Array.Empty<byte>();
        _readPosition = 0;
        _logger.LogInformation("🔧 SimulatedSerialPort cerrado");
    }

    public Task CloseAsync()
    {
        Close();
        return Task.CompletedTask;
    }

    public void Dispose() => Close();

    /// <summary>
    /// Obtiene respuesta simulada para un comando.
    /// </summary>
    private string GetSimulatedResponse(string command)
    {
        if (string.IsNullOrEmpty(command))
            return "NACK";

        // Extraer prefijo del comando (primeros 2 caracteres)
        var prefix = command.Length >= 2 ? command.Substring(0, 2).ToUpperInvariant() : command.ToUpperInvariant();
        
        // Caso especial: autenticación *0password
        if (command.StartsWith("*0"))
        {
            _logger.LogInformation("🔧 Autenticación simulada aceptada");
            return "ACK";
        }

        // Buscar en diccionario de respuestas
        if (SimulatedResponses.TryGetValue(prefix, out var response))
        {
            _logger.LogDebug("🔧 Respuesta simulada para {Prefix}: {Length} chars", 
                prefix, response.Length);
            return response;
        }

        // Comandos de escritura no reconocidos retornan ACK
        if (prefix.EndsWith("0"))
        {
            _logger.LogWarning("🔧 Comando de escritura no reconocido: {Command}, retornando ACK", command);
            return "ACK";
        }

        // Comandos de lectura no reconocidos
        _logger.LogWarning("🔧 Comando no reconocido: {Command}, retornando vacío", command);
        return "";
    }

    #region Generadores de Respuestas Simuladas

    /// <summary>
    /// Genera respuesta S1 (Status) con 40 campos separados por TAB.
    /// </summary>
    private static string GenerateStatusResponse()
    {
        // 40 campos simulados para pasar validación splitwith3tabs:40
        var fields = new string[40];
        for (int i = 0; i < 40; i++)
        {
            fields[i] = i switch
            {
                0 => "00",       // Mode
                1 => "01",       // Channel
                2 => "F82A3C",   // Frequency (hex)
                3 => "25",       // Temperature
                4 => "100",      // Power
                5 => "000",      // Error flags
                6 => "01",       // Status
                7 => "FF",       // Signal level
                8 => "00",       // Alarm
                9 => "02",       // Version
                _ => $"{i:D2}"   // Resto con valores genéricos
            };
        }
        return string.Join("\t", fields);
    }

    /// <summary>
    /// Genera respuesta C1 (Configuration) con 9 campos.
    /// </summary>
    private static string GenerateConfigResponse()
    {
        // 9 campos de configuración
        var fields = new[]
        {
            "F82A3C",   // Frequency
            "100",      // Power
            "01",       // Mode
            "00",       // Options
            "FF",       // Gain
            "01",       // Channel
            "00",       // Reserved
            "00",       // Reserved
            "01"        // Enabled
        };
        return string.Join("\t", fields);
    }

    /// <summary>
    /// Genera respuesta F1 (Factory Parameters) con 6 campos.
    /// </summary>
    private static string GenerateFactoryResponse()
    {
        // 6 campos de factory
        var fields = new[]
        {
            "3F7000",   // Cal value 1
            "3F8000",   // Cal value 2
            "00",       // Factory mode
            "01",       // Production flag
            "FIPLEX",   // Manufacturer
            "2025"      // Year
        };
        return string.Join("\t", fields);
    }

    /// <summary>
    /// Genera respuesta U1 (User Config) para multipart.
    /// </summary>
    private static string GenerateUserConfigResponse()
    {
        // Respuesta hex de configuración de usuario
        return "0000091A0B0C0D0E0F1011121314151617181920212223242526272829303132333435363738394041424344454647484950";
    }

    /// <summary>
    /// Genera respuesta O1 (Operating Status) para multipart 5dm.
    /// </summary>
    private static string GenerateOperatingStatusResponse()
    {
        // Respuesta hex de estado operativo
        return "AA55AA550102030405060708090A0B0C0D0E0F101112131415161718191A1B1C1D1E1F202122232425262728292A2B2C2D";
    }

    #endregion
}
