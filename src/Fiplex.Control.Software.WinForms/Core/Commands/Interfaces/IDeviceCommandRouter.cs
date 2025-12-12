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
    /// Loads device configuration from settings.cfg.
    /// Initializes HTTP to serial command mappings.
    /// </summary>
    /// <param name="config">Device configuration with GET/POST/FILE commands</param>
    void LoadConfiguration(DeviceConfiguration config);

    /// <summary>
    /// Configures current device parameters.
    /// STAGE 7: FactoryParameters Integration
    /// </summary>
    Task ConfigureDeviceAsync(string deviceType, double deviceVersion, CancellationToken ct = default);

    /// <summary>
    /// Sets password for retries with INVALID CREDENTIALS.
    /// </summary>
    void SetStoredPassword(string? password);
    
    /// <summary>
    /// Clears the stored password.
    /// </summary>
    void ClearStoredPassword();
    
    /// <summary>
    /// Resets the router state on disconnect.
    /// Clears command cache, password, and resets response processors.
    /// </summary>
    void Reset();

    /// <summary>
    /// Processes HTTP GET request and returns serial response.
    /// Looks up command in cache, builds serial command with URL parameters,
    /// executes on device and returns response (with hex encoding if applicable).
    /// </summary>
    /// <param name="page">HTTP page name (e.g., "getVersion", "getStatus")</param>
    /// <param name="queryParams">Query string parameters from HTTP request</param>
    /// <param name="ct">Cancellation token</param>
    /// <returns>Serial device response (may be hex decoded)</returns>
    Task<string> ProcessGetRequestAsync(string page, IDictionary<string, string?> queryParams, CancellationToken ct = default);

    /// <summary>
    /// Processes HTTP POST request and returns serial response.
    /// Looks up command in cache, builds serial command with body data,
    /// executes on device respecting WaitResponse flag.
    /// </summary>
    /// <param name="page">HTTP page name (e.g., "setConfig", "updateFirmware")</param>
    /// <param name="body">HTTP POST request body</param>
    /// <param name="ct">Cancellation token</param>
    /// <returns>Serial device response if WaitResponse=true, empty string if false</returns>
    Task<string> ProcessPostRequestAsync(string page, string body, CancellationToken ct = default);
    
    /// <summary>
    /// Enables detailed logging of HTTP GET commands.
    /// Logs are saved to %LocalAppData%/Fiplex.Control.Software/HttpCommandLogs/
    /// </summary>
    void EnableCommandLogging();
    
    /// <summary>
    /// Disables HTTP GET command logging.
    /// </summary>
    void DisableCommandLogging();
    
    /// <summary>
    /// Indicates if command logging is enabled.
    /// </summary>
    bool IsCommandLoggingEnabled { get; }
    
    /// <summary>
    /// Gets the path of the current log file.
    /// </summary>
    /// <returns>Full path to log file, or null if no active logging</returns>
    string? GetCommandLogFile();
}
