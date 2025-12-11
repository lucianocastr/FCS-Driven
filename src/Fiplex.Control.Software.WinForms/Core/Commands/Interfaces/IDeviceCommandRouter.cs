using Fiplex.Control.Software.WinForms.Models;

namespace Fiplex.Control.Software.WinForms.Core.Commands.Interfaces;

/// <summary>
/// Routes HTTP requests to serial commands based on device configuration.
/// </summary>
/// <remarks>
/// <para>
/// The router loads command mappings from settings.cfg and translates HTTP GET/POST requests
/// into serial commands. It handles hex encoding/decoding and maintains a cache of previous responses.
/// </para>
/// <para>
/// HTTP flow: WebView2 → EmbeddedHttpServer → DeviceCommandRouter → SerialCommandPipeline → Device
/// </para>
/// </remarks>
/// <example>
/// Processing an HTTP GET request:
/// <code>
/// router.LoadConfiguration(deviceConfig);
/// await router.ConfigureDeviceAsync("2c", 1.0, ct);
/// 
/// var params = new Dictionary&lt;string, string?&gt; { ["channel"] = "1" };
/// string response = await router.ProcessGetRequestAsync("getStatus", params, ct);
/// </code>
/// </example>
/// <seealso cref="DeviceConfiguration"/>
/// <seealso cref="ISerialCommandPipeline"/>
/// <seealso cref="IEmbeddedHttpServer"/>
public interface IDeviceCommandRouter
{
    /// <summary>
    /// Carga configuración de dispositivo desde settings.cfg.
    /// Inicializa los mapeos de comandos HTTP a serial.
    /// </summary>
    /// <param name="config">Configuración del dispositivo con comandos GET/POST/FILE</param>
    void LoadConfiguration(DeviceConfiguration config);

    /// <summary>
    /// Configura parámetros del dispositivo actual.
    /// ETAPA 7: Integración FactoryParameters
    /// </summary>
    Task ConfigureDeviceAsync(string deviceType, double deviceVersion, CancellationToken ct = default);

    /// <summary>
    /// Establece password para reintentos con INVALID CREDENTIALS.
    /// </summary>
    void SetStoredPassword(string? password);
    
    /// <summary>
    /// Limpia el password almacenado.
    /// </summary>
    void ClearStoredPassword();
    
    /// <summary>
    /// Resetea el estado del router al desconectar.
    /// Limpia cache de comandos, password, y resetea procesadores de respuesta.
    /// </summary>
    void Reset();

    /// <summary>
    /// Procesa petición HTTP GET y retorna respuesta serial.
    /// Busca el comando en cache, construye el comando serial con parámetros URL,
    /// ejecuta en el dispositivo y retorna la respuesta (con encoding hex si aplica).
    /// </summary>
    /// <param name="page">Nombre de la página HTTP (ej: "getVersion", "getStatus")</param>
    /// <param name="queryParams">Parámetros de query string del request HTTP</param>
    /// <param name="ct">Token de cancelación</param>
    /// <returns>Respuesta del dispositivo serial (puede estar decodificada de hex)</returns>
    Task<string> ProcessGetRequestAsync(string page, IDictionary<string, string?> queryParams, CancellationToken ct = default);

    /// <summary>
    /// Procesa petición HTTP POST y retorna respuesta serial.
    /// Busca el comando en cache, construye el comando serial con datos del body,
    /// ejecuta en el dispositivo respetando WaitResponse flag.
    /// </summary>
    /// <param name="page">Nombre de la página HTTP (ej: "setConfig", "updateFirmware")</param>
    /// <param name="body">Cuerpo del request HTTP POST</param>
    /// <param name="ct">Token de cancelación</param>
    /// <returns>Respuesta del dispositivo serial si WaitResponse=true, string vacío si false</returns>
    Task<string> ProcessPostRequestAsync(string page, string body, CancellationToken ct = default);
    
    /// <summary>
    /// Habilita el logging detallado de comandos HTTP GET.
    /// Los logs se guardan en %LocalAppData%/Fiplex.Control.Software/HttpCommandLogs/
    /// </summary>
    void EnableCommandLogging();
    
    /// <summary>
    /// Deshabilita el logging de comandos HTTP GET.
    /// </summary>
    void DisableCommandLogging();
    
    /// <summary>
    /// Indica si el logging de comandos está habilitado.
    /// </summary>
    bool IsCommandLoggingEnabled { get; }
    
    /// <summary>
    /// Obtiene la ruta del archivo de log actual.
    /// </summary>
    /// <returns>Ruta completa al archivo de log, o null si no hay logging activo</returns>
    string? GetCommandLogFile();
}
