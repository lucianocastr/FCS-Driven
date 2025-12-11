namespace Fiplex.Control.Software.WinForms.Core.Http.Interfaces;

/// <summary>
/// Embedded HTTP server that serves device UI files and routes commands to the serial pipeline.
/// </summary>
/// <remarks>
/// <para>
/// The server serves static files from the device's htdocs folder and intercepts requests
/// with special extensions (.zhtml, .shtml, .jsm) to route them as device commands.
/// </para>
/// <para>
/// Port selection: Tries ports 8080-8090 until one is available.
/// </para>
/// </remarks>
/// <example>
/// Starting the server:
/// <code>
/// await httpServer.StartAsync(8080, @"C:\pages\htdocs_2c1", ct);
/// httpServer.CommandReceived += async (s, e) =>
/// {
///     var response = await router.ProcessGetRequestAsync(e.CommandName, e.Parameters, ct);
///     e.SetResponse(response);
/// };
/// </code>
/// </example>
/// <seealso cref="HttpCommandEventArgs"/>
/// <seealso cref="IDeviceCommandRouter"/>
public interface IEmbeddedHttpServer : IDisposable
{
    /// <summary>
    /// Starts the HTTP server on the specified port serving files from documentRoot.
    /// </summary>
    /// <param name="port">The port number to listen on (typically 8080-8090).</param>
    /// <param name="documentRoot">The root folder containing device UI files (htdocs_*).</param>
    /// <param name="ct">Cancellation token.</param>
    Task StartAsync(int port, string documentRoot, CancellationToken ct = default);

    /// <summary>
    /// Stops the HTTP server and releases the port.
    /// </summary>
    Task StopAsync();

    /// <summary>
    /// Raised when an HTTP request maps to a device command.
    /// </summary>
    /// <remarks>
    /// Handlers must call <see cref="HttpCommandEventArgs.SetResponse"/> to provide the response.
    /// </remarks>
    /// <seealso cref="HttpCommandEventArgs"/>
    event EventHandler<HttpCommandEventArgs>? CommandReceived;

    /// <summary>
    /// Raised when base.js or base.jsm is loaded by WebView2.
    /// </summary>
    /// <remarks>
    /// This event signals that the UI has fully loaded and pending commands should be cleared.
    /// </remarks>
    event EventHandler? BaseJsLoaded;

    /// <summary>
    /// Gets a value indicating whether the server is currently running.
    /// </summary>
    bool IsRunning { get; }

    /// <summary>
    /// Gets the current port number, or null if the server is not running.
    /// </summary>
    int? CurrentPort { get; }
}
