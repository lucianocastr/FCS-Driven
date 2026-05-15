using System.Net;
using System.Text;
using System.Web;
using Fiplex.Control.Software.WinForms.Core.Http.Interfaces;
using Microsoft.Extensions.Logging;

namespace Fiplex.Control.Software.WinForms.Core.Http;

public class EmbeddedHttpServer : IEmbeddedHttpServer
{
    private const string TokenHeaderName = "X-Fiplex-Token";

    private readonly ILogger<EmbeddedHttpServer> _logger;
    private HttpListener? _listener;
    private Task? _listenerTask;
    private CancellationTokenSource? _cts;
    private string _rootPath = string.Empty;
    private string _sessionToken = string.Empty;

    private static readonly Dictionary<string, string> MimeTypes = new()
    {
        { ".html", "text/html" },
        { ".htm", "text/html" },
        { ".zhtml", "text/html" },  // Special Fiplex device HTML file
        { ".shtml", "text/html" },  // Server-Side Include HTML - dynamically processed
        { ".js", "application/javascript" },
        { ".jsm", "application/javascript" },  // Minified JS file
        { ".css", "text/css" },
        { ".cssm", "text/css" },  // Minified CSS file
        { ".json", "application/json" },
        { ".png", "image/png" },
        { ".jpg", "image/jpeg" },
        { ".jpeg", "image/jpeg" },
        { ".gif", "image/gif" },
        { ".svg", "image/svg+xml" },
        { ".ico", "image/x-icon" },
        { ".txt", "text/plain" },
        { ".xml", "application/xml" },
        { ".zip", "application/zip" },
        { ".mp3", "audio/mpeg" },
        { ".m3u", "audio/x-mpegurl" },
        { ".pls", "audio/x-mpegurl" },
        { ".xpl", "audio/x-mpegurl" }
    };

    public event EventHandler<HttpCommandEventArgs>? CommandReceived;
    
    /// <summary>
    /// Event fired when base.js or base.jsm is loaded.
    /// </summary>
    public event EventHandler? BaseJsLoaded;

    public bool IsRunning => _listener?.IsListening ?? false;
    public int? CurrentPort { get; private set; }

    public EmbeddedHttpServer(ILogger<EmbeddedHttpServer> logger) 
        => _logger = logger;

    public async Task StartAsync(int port, string rootPath, string sessionToken, CancellationToken ct = default)
    {
        if (_listener != null)
        {
            throw new InvalidOperationException("Server already running");
        }

        // 1. Validate parameters
        if (port <= 0 || port > 65535)
        {
            throw new ArgumentOutOfRangeException(nameof(port), "Port must be between 1 and 65535");
        }

        if (string.IsNullOrWhiteSpace(rootPath))
        {
            throw new ArgumentNullException(nameof(rootPath));
        }

        if (string.IsNullOrWhiteSpace(sessionToken))
        {
            throw new ArgumentNullException(nameof(sessionToken));
        }

        _rootPath = rootPath;
        _sessionToken = sessionToken;
        CurrentPort = port;

        // 2. Crear HttpListener con prefijo http://localhost:{port}/
        _listener = new HttpListener();
        _listener.Prefixes.Add($"http://localhost:{port}/");
        _listener.Prefixes.Add($"http://127.0.0.1:{port}/");
        
        // 3. Iniciar listener
        try
        {
            _listener.Start();
            _logger.LogInformation("HTTP server starting on port {Port} serving {Root}", port, rootPath);
        }
        catch (HttpListenerException ex)
        {
            _logger.LogError(ex, "Failed to start HTTP server on port {Port}", port);
            CurrentPort = null;
            throw;
        }

        // 4. Create async listener task
        _cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        _listenerTask = ListenAsync(_cts.Token);

        // 5. Log successful startup
        _logger.LogInformation("HTTP server started successfully on port {Port}", port);
        await Task.CompletedTask;
    }

    public async Task StopAsync()
    {
        _logger.LogInformation("Stopping HTTP server...");

        // 1. Cancelar CTS
        if (_cts != null)
        {
            _cts.Cancel();
        }

        // 2. Detener listener
        if (_listener != null)
        {
            _listener.Stop();
            _listener.Close();
        }

        // 3. Await task de escucha
        if (_listenerTask != null)
        {
            try
            {
                await _listenerTask;
            }
            catch (OperationCanceledException)
            {
                // Expected
            }
        }

        // 4. Dispose recursos
        _cts?.Dispose();
        _cts = null;
        _listener = null;
        _listenerTask = null;
        CurrentPort = null;
        _sessionToken = string.Empty;

        // 5. Shutdown logging
        _logger.LogInformation("HTTP server stopped");
    }

    public void Dispose() 
        => StopAsync().GetAwaiter().GetResult();

    private async Task ListenAsync(CancellationToken ct)
    {
        // Loop with GetContextAsync()
        while (!ct.IsCancellationRequested && _listener != null)
        {
            try
            {
                var context = await _listener.GetContextAsync().WaitAsync(ct);
                
                // Process in separate task to avoid blocking the loop
                _ = Task.Run(async () =>
                {
                    try
                    {
                        var request = context.Request;
                        var response = context.Response;

                        _logger.LogDebug("HTTP {Method} {Url}", request.HttpMethod, request.Url);

                        // Validate session token before processing any request
                        var requestToken = request.Headers[TokenHeaderName];
                        if (!string.Equals(requestToken, _sessionToken, StringComparison.Ordinal))
                        {
                            _logger.LogWarning("Rejected unauthorized request: {Method} {Url}",
                                request.HttpMethod, request.Url);
                            response.StatusCode = 403;
                            var forbidden = Encoding.UTF8.GetBytes("403 Forbidden");
                            response.ContentLength64 = forbidden.Length;
                            await response.OutputStream.WriteAsync(forbidden);
                            response.Close();
                            return;
                        }

                        // Distinguish command routes vs static files
                        // Supports /api/*.html and /command/*
                        var path = request.Url?.AbsolutePath ?? "";
                        if (IsLegacyPostbackRoute(request))
                        {
                            await HandleLegacyPostbackAsync(context, ct);
                        }
                        else if (IsCommandRoute(path))
                        {
                            // Fire CommandReceived event for commands
                            await HandleCommandRequestAsync(context, ct);
                        }
                        else
                        {
                            // Call ServeStaticFileAsync for files
                            await ServeStaticFileAsync(context);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error processing request");
                        try
                        {
                            context.Response.StatusCode = 500;
                            context.Response.Close();
                        }
                        catch { }
                    }
                }, ct);
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (HttpListenerException) when (ct.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in HTTP listen loop");
            }
        }
    }

    /// <summary>
    /// Determines if an HTTP route corresponds to a device command.
    /// Also recognizes .shtml files that require Server-Side Include processing.
    /// </summary>
    private static bool IsCommandRoute(string path)
    {
        // Formato C# moderno: /command/{commandName}
        if (path.StartsWith("/command/", StringComparison.OrdinalIgnoreCase))
            return true;
        if (path.StartsWith("/api/", StringComparison.OrdinalIgnoreCase) && 
            path.EndsWith(".html", StringComparison.OrdinalIgnoreCase))
            return true;
        
        // .shtml files: Server-Side Include that require serial commands
        // Requests to /global_conf.shtml execute U1 command
        // settings.cfg defines: /global_conf.shtml → U1
        if (path.EndsWith(".shtml", StringComparison.OrdinalIgnoreCase))
            return true;
        
        return false;
    }

    private static bool IsLegacyPostbackRoute(HttpListenerRequest request)
    {
        if (!request.HttpMethod.Equals("POST", StringComparison.OrdinalIgnoreCase))
            return false;
        if (!request.HasEntityBody)
            return false;

        var path = request.Url?.AbsolutePath ?? string.Empty;

        // Exclude modern command routes — those go through HandleCommandRequestAsync
        if (path.StartsWith("/command/", StringComparison.OrdinalIgnoreCase))
            return false;
        if (path.StartsWith("/api/", StringComparison.OrdinalIgnoreCase))
            return false;

        // Any other POST with a body is a legacy device postback.
        // VB 1.9 processed ctl_conf_str (and any other command key) regardless of URL —
        // both /start.zhtml and home.html POSTs carry device commands in the body.
        return true;
    }

    private static string? SelectLegacyPostCommandKey(Dictionary<string, string?> parameters)
    {
        string? reqFallback = null;
        foreach (var kvp in parameters)
        {
            if (string.IsNullOrWhiteSpace(kvp.Key))
                continue;

            if (kvp.Key.EndsWith("_req", StringComparison.OrdinalIgnoreCase))
            {
                // Keep the first _req key as fallback in case no other key is found
                reqFallback ??= kvp.Key;
                continue;
            }

            return kvp.Key;
        }

        // When the body contains only _req trigger parameters (e.g. fact_req=1),
        // return the trigger key so the router can resolve the backing command.
        return reqFallback;
    }

    /// <summary>
    /// Extracts the command name from the HTTP route.
    /// Normalizes both /command/version and /api/version.html to "version".
    /// For .shtml files, returns the full path since settings.cfg uses /global_conf.shtml.
    /// </summary>
    private static string ExtractCommandName(string path)
    {
        // Formato C# moderno: /command/{commandName}
        if (path.StartsWith("/command/", StringComparison.OrdinalIgnoreCase))
        {
            return path.Substring("/command/".Length).Trim('/');
        }
        
        // Legacy format: /api/{action}.html -> extract {action}
        if (path.StartsWith("/api/", StringComparison.OrdinalIgnoreCase) && 
            path.EndsWith(".html", StringComparison.OrdinalIgnoreCase))
        {
            var withoutPrefix = path.Substring("/api/".Length);
            var withoutSuffix = withoutPrefix.Substring(0, withoutPrefix.Length - ".html".Length);
            return withoutSuffix;
        }
        
        // .shtml files: Return full path with leading /
        // settings.cfg defines commands as: /global_conf.shtml → U1
        if (path.EndsWith(".shtml", StringComparison.OrdinalIgnoreCase))
        {
            return path.StartsWith("/") ? path : $"/{path}";
        }
        
        // Fallback: use the full normalized path
        return path.Trim('/').Replace("/", "_");
    }

    private async Task HandleCommandRequestAsync(HttpListenerContext context, CancellationToken ct)
    {
        var request = context.Request;
        var response = context.Response;
        
        // Extract command name using normalized method
        // Supports both /command/version and /api/version.html
        var path = request.Url!.AbsolutePath;
        var commandName = ExtractCommandName(path);
        
        // Parse query string parameters
        var parameters = new Dictionary<string, string?>();
        if (!string.IsNullOrEmpty(request.Url.Query))
        {
            var query = HttpUtility.ParseQueryString(request.Url.Query);
            foreach (string? key in query.Keys)
            {
                if (key != null)
                    parameters[key] = query[key];
            }
        }
        
        // For POST requests, read the body and add it to parameters
        if (request.HttpMethod.Equals("POST", StringComparison.OrdinalIgnoreCase) && 
            request.HasEntityBody)
        {
            using var reader = new StreamReader(request.InputStream, request.ContentEncoding);
            var body = await reader.ReadToEndAsync();
            if (!string.IsNullOrWhiteSpace(body))
            {
                // Parse body as form data or JSON
                if (request.ContentType?.Contains("application/x-www-form-urlencoded") == true)
                {
                    var formData = HttpUtility.ParseQueryString(body);
                    foreach (string? key in formData.Keys)
                    {
                        if (key != null)
                            parameters[key] = formData[key];
                    }
                }
                else
                {
                    // Raw body as "data" parameter
                    parameters["data"] = body;
                }
            }
        }
        
        _logger.LogDebug("Processing command: {Command} (path={Path}, method={Method}) with {ParamCount} parameters", 
            commandName, path, request.HttpMethod, parameters.Count);
        
        // Create HttpCommandEventArgs with data
        var eventArgs = new HttpCommandEventArgs(commandName, parameters, request.HttpMethod, path);
        
        // Fire event
        CommandReceived?.Invoke(this, eventArgs);
        
        // Wait for response from event handler with timeout
        string responseText;
        try
        {
            responseText = await eventArgs.GetResponseAsync(TimeSpan.FromSeconds(10));
        }
        catch (TimeoutException)
        {
            responseText = "ERROR: Command timeout";
            _logger.LogWarning("Timeout waiting for command response {Command}", commandName);
        }
        
        // Return response to client
        // For .shtml files, use text/html as content-type
        response.ContentType = path.EndsWith(".shtml", StringComparison.OrdinalIgnoreCase) 
            ? "text/html; charset=utf-8" 
            : "text/plain; charset=utf-8";
        response.StatusCode = 200;
        
        // Add required headers for AJAX
        response.AddHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        response.AddHeader("Pragma", "no-cache");
        response.AddHeader("Expires", "0");
        
        var buffer = Encoding.UTF8.GetBytes(responseText);
        response.ContentLength64 = buffer.Length;
        await response.OutputStream.WriteAsync(buffer, ct);
        response.Close();
        
        _logger.LogDebug("Response sent ({Size} bytes, ContentType={ContentType}): {Preview}", 
            buffer.Length, response.ContentType, 
            responseText.Length > 100 ? responseText.Substring(0, 100) + "..." : responseText);
    }

    private async Task HandleLegacyPostbackAsync(HttpListenerContext context, CancellationToken ct)
    {
        var request = context.Request;
        var path = request.Url?.AbsolutePath ?? string.Empty;
        var parameters = new Dictionary<string, string?>();

        using (var reader = new StreamReader(request.InputStream, request.ContentEncoding))
        {
            var body = await reader.ReadToEndAsync();
            if (!string.IsNullOrWhiteSpace(body))
            {
                // Parse as query string regardless of Content-Type.
                // Legacy device pages use xhr.send("key=value") without setting Content-Type,
                // so the body arrives as text/plain but is still form-encoded (key=value&key2=value2).
                var formData = HttpUtility.ParseQueryString(body);
                foreach (string? key in formData.Keys)
                {
                    if (key != null)
                        parameters[key] = formData[key];
                }
            }
        }

        var commandKey = SelectLegacyPostCommandKey(parameters);
        if (!string.IsNullOrWhiteSpace(commandKey))
        {
            _logger.LogDebug("Processing legacy POST back {Path} using command key {CommandKey}", path, commandKey);

            var eventArgs = new HttpCommandEventArgs(
                commandKey,
                parameters,
                request.HttpMethod,
                path,
                parameters.TryGetValue(commandKey, out var commandValue) ? commandValue : string.Empty);

            CommandReceived?.Invoke(this, eventArgs);

            try
            {
                await eventArgs.GetResponseAsync(TimeSpan.FromSeconds(10));
            }
            catch (TimeoutException)
            {
                _logger.LogWarning("Timeout waiting for legacy POST response {CommandKey}", commandKey);
            }
        }
        else
        {
            _logger.LogDebug("Legacy POST back {Path} has no mapped command key, serving static file only", path);
        }

        await ServeStaticFileAsync(context);
    }

    private async Task ServeStaticFileAsync(HttpListenerContext context)
    {
        var request = context.Request;
        var response = context.Response;
        
        // 1. Get request path
        var path = request.Url?.AbsolutePath.TrimStart('/') ?? string.Empty;
        
        // 3. Handle default index.html for directories
        if (string.IsNullOrEmpty(path) || path.EndsWith("/"))
        {
            path = Path.Combine(path, "index.html");
        }
        
        // 2. Map to file in rootPath
        var filePath = Path.Combine(_rootPath, path);
        
        // NEW: Fallback to minified files (.jsm, .cssm)
        // Search for .jsm before .js
        if (!File.Exists(filePath))
        {
            var extension = Path.GetExtension(filePath).ToLowerInvariant();
            string? minifiedPath = extension switch
            {
                ".js" => Path.ChangeExtension(filePath, ".jsm"),
                ".css" => Path.ChangeExtension(filePath, ".cssm"),
                _ => null
            };
            
            if (minifiedPath != null && File.Exists(minifiedPath))
            {
                filePath = minifiedPath;
                _logger.LogDebug("Using minified file: {Original} -> {Minified}", path, minifiedPath);
            }
        }
        
        // 5. Return 404 if not found
        if (!File.Exists(filePath))
        {
            _logger.LogWarning("File not found: {FilePath}", filePath);
            response.StatusCode = 404;
            var notFoundData = Encoding.UTF8.GetBytes("404 Not Found");
            response.ContentLength64 = notFoundData.Length;
            await response.OutputStream.WriteAsync(notFoundData);
            response.Close();
            return;
        }

        try
        {
            // 4. Detect MIME type by extension
            var extension = Path.GetExtension(filePath).ToLowerInvariant();
            response.ContentType = MimeTypes.TryGetValue(extension, out var mimeType) 
                ? mimeType 
                : "application/octet-stream";
            
            // 6. Stream the file with response.OutputStream
            var fileData = await File.ReadAllBytesAsync(filePath);
            response.ContentLength64 = fileData.Length;
            await response.OutputStream.WriteAsync(fileData);
            
            _logger.LogDebug("Served file: {FilePath} ({Size} bytes, {MimeType})", 
                filePath, fileData.Length, response.ContentType);
            
            // NEW: Fire event when base.js or base.jsm is loaded
            // CancelCommands(True) when loading base.js
            var fileName = Path.GetFileName(filePath).ToLowerInvariant();
            if (fileName == "base.js" || fileName == "base.jsm")
            {
                _logger.LogDebug("base.js loaded - firing BaseJsLoaded event");
                BaseJsLoaded?.Invoke(this, EventArgs.Empty);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error serving file {Path}", filePath);
            response.StatusCode = 500;
        }
        finally
        {
            response.Close();
        }
    }
}

