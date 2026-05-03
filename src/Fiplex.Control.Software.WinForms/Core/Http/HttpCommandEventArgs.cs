using System.Collections.Specialized;
using System.Threading.Tasks;

namespace Fiplex.Control.Software.WinForms.Core.Http;

/// <summary>
/// Event arguments for HTTP command requests from the embedded web server.
/// </summary>
/// <remarks>
/// This event is raised when WebView2 makes an HTTP request that maps to a device command.
/// Handlers should call <see cref="SetResponse"/> to provide the command response.
/// </remarks>
public class HttpCommandEventArgs : EventArgs
{
    /// <summary>Gets the name of the command being requested.</summary>
    public string CommandName { get; }

    /// <summary>Gets the HTTP method associated with the request.</summary>
    public string HttpMethod { get; }

    /// <summary>Gets the original request path.</summary>
    public string RequestPath { get; }

    /// <summary>Gets the selected POST value for legacy form submissions.</summary>
    public string CommandValue { get; }

    /// <summary>Gets the dictionary of parameters passed with the command.</summary>
    public Dictionary<string, string?> Parameters { get; }

    /// <summary>Gets the response string after it has been set.</summary>
    public string Response { get; private set; } = string.Empty;

    /// <summary>Gets a value indicating whether a response has been set.</summary>
    public bool IsResponseSet { get; private set; }

    private readonly TaskCompletionSource<string> _responseTcs = new();

    /// <summary>
    /// Initializes a new instance of the <see cref="HttpCommandEventArgs"/> class.
    /// </summary>
    /// <param name="commandName">The name of the command.</param>
    /// <param name="parameters">The command parameters.</param>
    /// <param name="httpMethod">The HTTP method.</param>
    /// <param name="requestPath">The original request path.</param>
    /// <param name="commandValue">The selected POST value for legacy form submissions.</param>
    public HttpCommandEventArgs(
        string commandName,
        Dictionary<string, string?> parameters,
        string httpMethod = "GET",
        string requestPath = "",
        string? commandValue = null)
    {
        CommandName = commandName;
        Parameters = parameters;
        HttpMethod = httpMethod;
        RequestPath = requestPath;
        CommandValue = commandValue ?? string.Empty;
    }

    /// <summary>
    /// Sets the response for the HTTP command.
    /// </summary>
    /// <param name="response">The response string to return to the HTTP client.</param>
    public void SetResponse(string response)
    {
        Response = response;
        IsResponseSet = true;
        _responseTcs.TrySetResult(response);
    }

    /// <summary>
    /// Waits asynchronously for the response to be set.
    /// </summary>
    /// <param name="timeout">Maximum time to wait for the response.</param>
    /// <returns>The response string.</returns>
    /// <exception cref="TimeoutException">Thrown when the timeout expires before a response is set.</exception>
    public Task<string> GetResponseAsync(TimeSpan timeout)
    {
        using var cts = new CancellationTokenSource(timeout);
        return _responseTcs.Task.WaitAsync(cts.Token);
    }
}
