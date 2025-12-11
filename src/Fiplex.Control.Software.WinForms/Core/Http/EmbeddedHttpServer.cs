using System.Net;
using System.Text;
using System.Web;
using Fiplex.Control.Software.WinForms.Core.Http.Interfaces;
using Microsoft.Extensions.Logging;

namespace Fiplex.Control.Software.WinForms.Core.Http;

public class EmbeddedHttpServer : IEmbeddedHttpServer
{
    private readonly ILogger<EmbeddedHttpServer> _logger;
    private HttpListener? _listener;
    private Task? _listenerTask;
    private CancellationTokenSource? _cts;
    private string _rootPath = string.Empty;

    private static readonly Dictionary<string, string> MimeTypes = new()
    {
        { ".html", "text/html" },
        { ".htm", "text/html" },
        { ".zhtml", "text/html" },  // Archivo HTML especial de dispositivo Fiplex
        { ".shtml", "text/html" },  // Server-Side Include HTML - procesado dinámicamente
        { ".js", "application/javascript" },
        { ".jsm", "application/javascript" },  // Archivo JS minificado
        { ".css", "text/css" },
        { ".cssm", "text/css" },  // Archivo CSS minificado
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
    /// Evento disparado cuando se carga base.js o base.jsm.
    /// </summary>
    public event EventHandler? BaseJsLoaded;

    public bool IsRunning => _listener?.IsListening ?? false;
    public int? CurrentPort { get; private set; }

    public EmbeddedHttpServer(ILogger<EmbeddedHttpServer> logger) 
        => _logger = logger;

    public async Task StartAsync(int port, string rootPath, CancellationToken ct = default)
    {
        if (_listener != null)
        {
            throw new InvalidOperationException("Server already running");
        }

        // 1. Validar par�metros
        if (port <= 0 || port > 65535)
        {
            throw new ArgumentOutOfRangeException(nameof(port), "Port must be between 1 and 65535");
        }

        if (string.IsNullOrWhiteSpace(rootPath))
        {
            throw new ArgumentNullException(nameof(rootPath));
        }

        _rootPath = rootPath;
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

        // 4. Crear task de escucha as�ncrono
        _cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        _listenerTask = ListenAsync(_cts.Token);

        // 5. Logging de inicio exitoso
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
                // Esperado
            }
        }

        // 4. Dispose recursos
        _cts?.Dispose();
        _cts = null;
        _listener = null;
        _listenerTask = null;
        CurrentPort = null;

        // 5. Logging de detenci�n
        _logger.LogInformation("HTTP server stopped");
    }

    public void Dispose() 
        => StopAsync().GetAwaiter().GetResult();

    private async Task ListenAsync(CancellationToken ct)
    {
        // Bucle con GetContextAsync()
        while (!ct.IsCancellationRequested && _listener != null)
        {
            try
            {
                var context = await _listener.GetContextAsync().WaitAsync(ct);
                
                // Procesar en task separado para no bloquear el loop
                _ = Task.Run(async () =>
                {
                    try
                    {
                        var request = context.Request;
                        var response = context.Response;
                        
                        _logger.LogDebug("HTTP {Method} {Url}", request.HttpMethod, request.Url);
                        
                        // Distinguir rutas de comandos vs archivos estáticos
                        // Soporta /api/*.html y /command/*
                        var path = request.Url?.AbsolutePath ?? "";
                        if (IsCommandRoute(path))
                        {
                            // Disparar evento CommandReceived para comandos
                            await HandleCommandRequestAsync(context, ct);
                        }
                        else
                        {
                            // Llamar ServeStaticFileAsync para archivos
                            await ServeStaticFileAsync(context);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error procesando request");
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
                _logger.LogError(ex, "Error en loop de escucha HTTP");
            }
        }
    }

    /// <summary>
    /// Determina si una ruta HTTP corresponde a un comando de dispositivo.
    /// También reconoce archivos .shtml que requieren procesamiento Server-Side Include.
    /// </summary>
    private static bool IsCommandRoute(string path)
    {
        // Formato C# moderno: /command/{commandName}
        if (path.StartsWith("/command/", StringComparison.OrdinalIgnoreCase))
            return true;
        if (path.StartsWith("/api/", StringComparison.OrdinalIgnoreCase) && 
            path.EndsWith(".html", StringComparison.OrdinalIgnoreCase))
            return true;
        
        // Archivos .shtml: Server-Side Include que requieren comandos seriales
        // Peticiones a /global_conf.shtml ejecutan comando U1
        // settings.cfg define: /global_conf.shtml → U1
        if (path.EndsWith(".shtml", StringComparison.OrdinalIgnoreCase))
            return true;
        
        return false;
    }

    /// <summary>
    /// Extrae el nombre del comando de la ruta HTTP.
    /// Normaliza tanto /command/version como /api/version.html a "version".
    /// Para archivos .shtml, retorna el path completo ya que settings.cfg usa /global_conf.shtml.
    /// </summary>
    private static string ExtractCommandName(string path)
    {
        // Formato C# moderno: /command/{commandName}
        if (path.StartsWith("/command/", StringComparison.OrdinalIgnoreCase))
        {
            return path.Substring("/command/".Length).Trim('/');
        }
        
        // Formato legacy: /api/{action}.html -> extraer {action}
        if (path.StartsWith("/api/", StringComparison.OrdinalIgnoreCase) && 
            path.EndsWith(".html", StringComparison.OrdinalIgnoreCase))
        {
            var withoutPrefix = path.Substring("/api/".Length);
            var withoutSuffix = withoutPrefix.Substring(0, withoutPrefix.Length - ".html".Length);
            return withoutSuffix;
        }
        
        // Archivos .shtml: Retornar path completo con / inicial
        // settings.cfg define comandos como: /global_conf.shtml → U1
        if (path.EndsWith(".shtml", StringComparison.OrdinalIgnoreCase))
        {
            return path.StartsWith("/") ? path : $"/{path}";
        }
        
        // Fallback: usar el path completo normalizado
        return path.Trim('/').Replace("/", "_");
    }

    private async Task HandleCommandRequestAsync(HttpListenerContext context, CancellationToken ct)
    {
        var request = context.Request;
        var response = context.Response;
        
        // Extraer nombre del comando usando método normalizado
        // Soporta tanto /command/version como /api/version.html
        var path = request.Url!.AbsolutePath;
        var commandName = ExtractCommandName(path);
        
        // Parsear parámetros de query string
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
        
        // Para POST requests, leer el body y agregarlo a parámetros
        if (request.HttpMethod.Equals("POST", StringComparison.OrdinalIgnoreCase) && 
            request.HasEntityBody)
        {
            using var reader = new StreamReader(request.InputStream, request.ContentEncoding);
            var body = await reader.ReadToEndAsync();
            if (!string.IsNullOrWhiteSpace(body))
            {
                // Parsear body como form data o JSON
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
                    // Body raw como parámetro "data"
                    parameters["data"] = body;
                }
            }
        }
        
        _logger.LogDebug("Processing command: {Command} (path={Path}, method={Method}) with {ParamCount} parameters", 
            commandName, path, request.HttpMethod, parameters.Count);
        
        // Crear HttpCommandEventArgs con datos
        var eventArgs = new HttpCommandEventArgs(commandName, parameters);
        
        // Disparar evento
        CommandReceived?.Invoke(this, eventArgs);
        
        // Esperar respuesta del handler del evento con timeout
        string responseText;
        try
        {
            responseText = await eventArgs.GetResponseAsync(TimeSpan.FromSeconds(10));
        }
        catch (TimeoutException)
        {
            responseText = "ERROR: Command timeout";
            _logger.LogWarning("Timeout esperando respuesta del comando {Command}", commandName);
        }
        
        // Retornar respuesta al cliente
        // Para archivos .shtml, usar text/html como content-type
        response.ContentType = path.EndsWith(".shtml", StringComparison.OrdinalIgnoreCase) 
            ? "text/html; charset=utf-8" 
            : "text/plain; charset=utf-8";
        response.StatusCode = 200;
        
        // Agregar headers necesarios para AJAX
        response.AddHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        response.AddHeader("Pragma", "no-cache");
        response.AddHeader("Expires", "0");
        
        var buffer = Encoding.UTF8.GetBytes(responseText);
        response.ContentLength64 = buffer.Length;
        await response.OutputStream.WriteAsync(buffer, ct);
        response.Close();
        
        _logger.LogDebug("Respuesta enviada ({Size} bytes, ContentType={ContentType}): {Preview}", 
            buffer.Length, response.ContentType, 
            responseText.Length > 100 ? responseText.Substring(0, 100) + "..." : responseText);
    }

    private async Task ServeStaticFileAsync(HttpListenerContext context)
    {
        var request = context.Request;
        var response = context.Response;
        
        // 1. Obtener ruta del request
        var path = request.Url?.AbsolutePath.TrimStart('/') ?? string.Empty;
        
        // 3. Manejar index.html por defecto para directorios
        if (string.IsNullOrEmpty(path) || path.EndsWith("/"))
        {
            path = Path.Combine(path, "index.html");
        }
        
        // 2. Mapear a archivo en rootPath
        var filePath = Path.Combine(_rootPath, path);
        
        // NUEVO: Fallback a archivos minificados (.jsm, .cssm)
        // Busca .jsm antes de .js
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
                _logger.LogDebug("Usando archivo minificado: {Original} -> {Minified}", path, minifiedPath);
            }
        }
        
        // 5. Retornar 404 si no existe
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
            // 4. Detectar MIME type por extensi�n
            var extension = Path.GetExtension(filePath).ToLowerInvariant();
            response.ContentType = MimeTypes.TryGetValue(extension, out var mimeType) 
                ? mimeType 
                : "application/octet-stream";
            
            // 6. Streaming del archivo con response.OutputStream
            var fileData = await File.ReadAllBytesAsync(filePath);
            response.ContentLength64 = fileData.Length;
            await response.OutputStream.WriteAsync(fileData);
            
            _logger.LogDebug("Served file: {FilePath} ({Size} bytes, {MimeType})", 
                filePath, fileData.Length, response.ContentType);
            
            // NUEVO: Disparar evento cuando se carga base.js o base.jsm
            // CancelCommands(True) al cargar base.js
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
