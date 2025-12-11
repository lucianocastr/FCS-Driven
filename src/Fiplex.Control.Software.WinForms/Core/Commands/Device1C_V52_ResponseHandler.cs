using Fiplex.Control.Software.WinForms.Core.Commands.Interfaces;
using Microsoft.Extensions.Logging;

namespace Fiplex.Control.Software.WinForms.Core.Commands;

/// <summary>
/// Handler de respuestas para dispositivos 1C versión 5.2.
/// Implementa workaround para bug bugSFco700 en factory params.
/// 
///   If frmMain.tdev = "1c" And frmMain.ndev = 5.2 Then
///       If command_Renamed = "F1" Then
///           bugSFco700 = analyzeFactoryBDASFco(pendingCommand(idReq).receiveCommand)
///       End If
///   End If
/// </summary>
public class Device1C_V52_ResponseHandler : IDeviceResponseHandler
{
    private readonly ILogger<Device1C_V52_ResponseHandler> _logger;
    
    // Flag de workaround para bug en parámetros factory
    private bool _bugSFco700 = false;
    
    // Parámetros factory corregidos
    private string _factStrFixed = string.Empty;
    
    public int Priority => 90; // Alta prioridad

    public Device1C_V52_ResponseHandler(ILogger<Device1C_V52_ResponseHandler> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Aplica a dispositivos 1c versión 5.2 exactamente.
    /// </summary>
    public bool CanHandle(string deviceType, double version)
        => deviceType.Equals("1c", StringComparison.OrdinalIgnoreCase) 
           && Math.Abs(version - 5.2) < 0.05;

    /// <summary>
    /// Procesa respuestas F1 con workaround para bugSFco700.
    /// </summary>
    public string ProcessResponse(string command, string rawResponse)
    {
        if (string.IsNullOrEmpty(rawResponse))
            return rawResponse;

        // Comando F1: Factory Parameters con workaround
        if (command.Equals("F1", StringComparison.OrdinalIgnoreCase))
        {
            _bugSFco700 = AnalyzeFactoryBDASFco(rawResponse);
            
            if (_bugSFco700)
            {
                _logger.LogWarning("Bug SFco700 detectado en respuesta F1, aplicando corrección");
                return _factStrFixed;
            }
        }

        // Resetear flag después de uso
        _bugSFco700 = false;
        return rawResponse;
    }

    /// <summary>
    /// Analiza respuesta F1 para detectar bug SFco700.
    /// 
    /// El bug afecta ciertos bytes de los parámetros factory en firmware
    /// versión 5.2 de dispositivos 1c con serial que comienza con ciertos caracteres.
    /// </summary>
    private bool AnalyzeFactoryBDASFco(string response)
    {
        if (string.IsNullOrEmpty(response) || response.Length < 50)
            return false;

        try
        {
            // en los bytes de calibración BDA (Bandpass Digital Attenuator)
            
            // Posiciones críticas donde el bug manifiesta valores incorrectos
            // Bytes 20-23: BDA low channel
            // Bytes 24-27: BDA high channel
            
            if (response.Length >= 28)
            {
                var bdaLow = response.Substring(20, 4);
                var bdaHigh = response.Substring(24, 4);
                
                // El bug produce valores 0x0000 o 0xFFFF en calibración
                if (bdaLow == "0000" || bdaLow == "FFFF" || 
                    bdaHigh == "0000" || bdaHigh == "FFFF")
                {
                    // Construir respuesta corregida con valores default conocidos
                    _factStrFixed = BuildFixedFactoryResponse(response);
                    _logger.LogInformation(
                        "Bug SFco700: BDA valores inválidos detectados (low={BdaLow}, high={BdaHigh})",
                        bdaLow, bdaHigh);
                    return true;
                }
            }
            
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error analizando factory BDA SFco700");
            return false;
        }
    }

    /// <summary>
    /// Construye respuesta factory corregida con valores default.
    /// </summary>
    private string BuildFixedFactoryResponse(string originalResponse)
    {
        if (originalResponse.Length < 50)
            return originalResponse;

        try
        {
            var builder = new char[originalResponse.Length];
            originalResponse.CopyTo(0, builder, 0, originalResponse.Length);
            
            // Reemplazar valores BDA con defaults conocidos para 1c5.2
            const string defaultBdaLow = "3F70";  // 0.94 en formato IEEE754 16-bit
            const string defaultBdaHigh = "3F80"; // 1.00 en formato IEEE754 16-bit
            
            // Posición 20-23: BDA low
            for (int i = 0; i < 4 && i + 20 < builder.Length; i++)
                builder[20 + i] = defaultBdaLow[i];
            
            // Posición 24-27: BDA high
            for (int i = 0; i < 4 && i + 24 < builder.Length; i++)
                builder[24 + i] = defaultBdaHigh[i];
            
            return new string(builder);
        }
        catch
        {
            return originalResponse;
        }
    }

    /// <summary>
    /// Resetea el estado del handler.
    /// </summary>
    public void Reset()
    {
        _bugSFco700 = false;
        _factStrFixed = string.Empty;
    }
}
