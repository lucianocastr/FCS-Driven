// ==========================================================================
// Fiplex Control Software - Production Configuration Models
// ==========================================================================

namespace Fiplex.Control.Software.WinForms.Models;

/// <summary>
/// Representa un conjunto de comandos de configuración para tests de producción.
/// </summary>
/// <remarks>
/// Utilizado para enviar secuencias de comandos de configuración al dispositivo
/// durante los procesos de prueba en línea de producción.
/// </remarks>
public class ProductionConfigData
{
    /// <summary>
    /// Lista de comandos a enviar al dispositivo.
    /// </summary>
    public List<ProductionCommand> Commands { get; } = new();

    /// <summary>
    /// Descripción del tipo de configuración.
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Tipo de dispositivo para el que aplica esta configuración.
    /// </summary>
    public string DeviceType { get; set; } = string.Empty;

    /// <summary>
    /// Versión del dispositivo.
    /// </summary>
    public double DeviceVersion { get; set; }
}

/// <summary>
/// Representa un comando individual de configuración de producción.
/// </summary>
public class ProductionCommand
{
    /// <summary>
    /// Payload del comando a enviar (string hexadecimal o texto).
    /// </summary>
    public string Payload { get; set; } = string.Empty;

    /// <summary>
    /// Descripción del comando para logging y debugging.
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Indica si el comando espera respuesta ACK del dispositivo.
    /// </summary>
    public bool ExpectsAck { get; set; } = true;

    /// <summary>
    /// Timeout en segundos para la respuesta.
    /// </summary>
    public int TimeoutSeconds { get; set; } = 10;

    /// <summary>
    /// Prefijo del comando (para logging).
    /// Por ejemplo: "C", "J", "O", "T", "!".
    /// </summary>
    public string CommandPrefix => Payload.Length > 0 ? Payload[0].ToString() : string.Empty;
}

/// <summary>
/// Define los modos de configuración para tests de 2 canales.
/// </summary>
public enum TwoChannelMode
{
    /// <summary>
    /// Configura el canal al inicio de la banda de frecuencia.
    /// </summary>
    BandStart = 0,

    /// <summary>
    /// Configura el canal en el centro de la banda de frecuencia.
    /// </summary>
    BandCenter = 1,

    /// <summary>
    /// Configura el canal al final de la banda de frecuencia.
    /// </summary>
    BandStop = 2
}

/// <summary>
/// Define el número de canales para tests de producción.
/// </summary>
public enum ProductionChannels
{
    /// <summary>
    /// Configuración para filtro FirstNet (exclusivo para dispositivos 1c v5).
    /// </summary>
    FirstNet = 0,

    /// <summary>
    /// Configuración de 1 canal.
    /// </summary>
    OneChannel = 1,

    /// <summary>
    /// Configuración de 2 canales.
    /// </summary>
    TwoChannels = 2,

    /// <summary>
    /// Configuración de 6 canales.
    /// </summary>
    SixChannels = 6
}
