using System.Text;
using System.Diagnostics;
using Microsoft.Extensions.Logging;
using Fiplex.Control.Software.WinForms.Core.Commands.Interfaces;
using Fiplex.Control.Software.WinForms.Core.Serial.Interfaces;
using Fiplex.Control.Software.WinForms.Core.Serial.Models;
using Fiplex.Control.Software.WinForms.Models;
using Fiplex.Control.Software.WinForms.Core.Config;
using Fiplex.Control.Software.WinForms.Core.Metrics;
using Fiplex.Control.Software.WinForms.Core.Http;

namespace Fiplex.Control.Software.WinForms.Core.Commands;

/// <summary>
/// Implementación del enrutador de comandos HTTP a serial.
/// Mantiene caches de configuración y maneja encoding/decoding hexadecimal.
/// </summary>
public class DeviceCommandRouter : IDeviceCommandRouter
{
    private readonly ISerialCommandPipeline _serialPipeline;
    private readonly ILogger<DeviceCommandRouter> _logger;
    private readonly FactoryParametersService _factoryParams;
    private readonly DeviceResponseProcessor? _responseProcessor;
    private readonly CommandMetrics? _metrics;
    private readonly ResponseFormatter _responseFormatter;
    private readonly HttpCommandLogger? _commandLogger;
    
    // Caches para mapeo de comandos
    private readonly Dictionary<string, GetCommand> _getCommandCache = new(StringComparer.OrdinalIgnoreCase);
    private readonly Dictionary<string, PostCommand> _postCommandCache = new(StringComparer.OrdinalIgnoreCase);

    // ETAPA 4: Circuit breaker state
    private int _consecutiveFailures = 0;
    private DateTime _lastFailureTime = DateTime.MinValue;
    private readonly object _circuitLock = new();
    
    // ETAPA 7: Factory Parameters
    private FactoryParameters? _currentDeviceParams;
    
    // NUEVO: Password para reintentos con INVALID CREDENTIALS
    private string? _storedPassword;
    
    // NUEVO: Cache de última respuesta para previousans/dpreviousans
    // - previousans: retorna la última respuesta sin modificar
    // - dpreviousans: retorna la última respuesta decodificada de hex
    private string _previousAnswer = string.Empty;
    private string _decodedPreviousAnswer = string.Empty;
    private readonly object _previousAnswerLock = new();

    /// <summary>
    /// Constructor con inyección de dependencias
    /// ETAPA 8: CommandMetrics y DeviceResponseProcessor opcionales
    /// </summary>
    public DeviceCommandRouter(
        ISerialCommandPipeline serialPipeline,
        ILogger<DeviceCommandRouter> logger,
        FactoryParametersService factoryParams,
        ResponseFormatter responseFormatter,
        DeviceResponseProcessor? responseProcessor = null,
        CommandMetrics? metrics = null,
        HttpCommandLogger? commandLogger = null)
    {
        _serialPipeline = serialPipeline ?? throw new ArgumentNullException(nameof(serialPipeline));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _factoryParams = factoryParams ?? throw new ArgumentNullException(nameof(factoryParams));
        _responseFormatter = responseFormatter ?? throw new ArgumentNullException(nameof(responseFormatter));
        _responseProcessor = responseProcessor; // Opcional - para casos especiales por dispositivo
        _metrics = metrics; // Opcional
        _commandLogger = commandLogger; // Opcional - para logging de comandos HTTP
    }
    
    /// <summary>
    /// Habilita el logging detallado de comandos HTTP GET.
    /// Los logs se guardan en %LocalAppData%/Fiplex.Control.Software/HttpCommandLogs/
    /// </summary>
    public void EnableCommandLogging()
    {
        _commandLogger?.Enable();
        _logger.LogInformation("HTTP Command logging enabled: {Path}", _commandLogger?.GetCurrentLogFile());
    }
    
    /// <summary>
    /// Deshabilita el logging de comandos HTTP GET.
    /// </summary>
    public void DisableCommandLogging()
    {
        _commandLogger?.Disable();
        _logger.LogInformation("HTTP Command logging disabled");
    }
    
    /// <summary>
    /// Indica si el logging de comandos está habilitado.
    /// </summary>
    public bool IsCommandLoggingEnabled => _commandLogger?.IsEnabled ?? false;
    
    /// <summary>
    /// Obtiene la ruta del archivo de log actual.
    /// </summary>
    public string? GetCommandLogFile() => _commandLogger?.GetCurrentLogFile();

    /// <summary>
    /// Establece el password para reintentos con INVALID CREDENTIALS.
    /// </summary>
    public void SetStoredPassword(string? password)
    {
        _storedPassword = password;
        _logger.LogDebug("Password almacenado en router para reintentos INVALID CREDENTIALS");
    }
    
    /// <summary>
    /// Limpia el password almacenado.
    /// </summary>
    public void ClearStoredPassword()
    {
        _storedPassword = null;
    }
    
    /// <summary>
    /// Resetea el estado del router al desconectar.
    /// </summary>
    public void Reset()
    {
        _logger.LogDebug("Reseteando DeviceCommandRouter");
        
        // Limpiar caches de comandos
        _getCommandCache.Clear();
        _postCommandCache.Clear();
        
        // Limpiar password
        _storedPassword = null;
        
        // Resetear parámetros de dispositivo
        _currentDeviceParams = null;
        
        // Resetear procesador de respuestas (SCA, etc.)
        _responseProcessor?.Reset();
        
        // Resetear circuit breaker
        _consecutiveFailures = 0;
        
        // Limpiar cache de respuestas anteriores
        lock (_previousAnswerLock)
        {
            _previousAnswer = string.Empty;
            _decodedPreviousAnswer = string.Empty;
        }
        
        _logger.LogInformation("DeviceCommandRouter reseteado");
    }

    /// <inheritdoc/>
    public void LoadConfiguration(DeviceConfiguration config)
    {
        if (config == null)
        {
            throw new ArgumentNullException(nameof(config));
        }

        _logger.LogInformation("Cargando configuraci�n de dispositivo en router");

        // Limpiar caches
        _getCommandCache.Clear();
        _postCommandCache.Clear();

        // Cargar comandos GET
        foreach (var cmd in config.GetCommands)
        {
            if (!string.IsNullOrEmpty(cmd.Page))
            {
                _getCommandCache[cmd.Page] = cmd;
                var lengths = cmd.ExpectedLengths?.Length > 0 ? string.Join(", ", cmd.ExpectedLengths) : "(vacío)";
                _logger.LogDebug("GET command cacheado: {Page} -> {Command} [ExpectedLengths: {Lengths}]", 
                    cmd.Page, cmd.Command, lengths);
            }
        }

        // Cargar comandos POST
        foreach (var cmd in config.PostCommands)
        {
            if (!string.IsNullOrEmpty(cmd.Page))
            {
                _postCommandCache[cmd.Page] = cmd;
                _logger.LogDebug("POST command cacheado: {Page} -> {Command}", cmd.Page, cmd.Command);
            }
        }

        _logger.LogInformation(
            "Configuraci�n cargada: {GetCount} GET commands, {PostCount} POST commands",
            _getCommandCache.Count,
            _postCommandCache.Count);
    }

    /// <summary>
    /// Configura parámetros del dispositivo actual para decisiones de enrutamiento.
    /// ETAPA 7: Debe llamarse después de LoadConfiguration()
    /// </summary>
    public async Task ConfigureDeviceAsync(string deviceType, double deviceVersion, CancellationToken ct = default)
    {
        _currentDeviceParams = await _factoryParams.GetFactoryParametersAsync(deviceType, deviceVersion, ct);
        
        // Configurar procesador de respuestas para casos especiales por dispositivo
        _responseProcessor?.ConfigureForDevice(deviceType, deviceVersion);
        
        _logger.LogInformation("Device configured: {Type} v{Version}", deviceType, deviceVersion);
    }

    /// <summary>
    /// Procesa comando multipart O1+U1 para dispositivos 5dm.
    /// Concatena respuestas con separador \t\t\t (triple tab).
    /// ETAPA 2: Comando multipart
    /// </summary>
    private async Task<string> ProcessMultipartCommandAsync(CancellationToken ct)
    {
        _logger.LogInformation("Procesando comando multipart O1+U1");

        try
        {
            string o1Response, u1Response;
            // wsck_DataArrival: U1 → U10002 + U10305 + U10608
            if (Is5dmDevice())
            {
                _logger.LogInformation("Dispositivo 5dm detectado - usando fragmentación");
                
                // Ejecutar O1 fragmentado
                o1Response = await ProcessFragmentedCommandAsync("O1", ct);
                if (o1Response.StartsWith("ERROR:"))
                {
                    return o1Response;
                }
                
                // Ejecutar U1 fragmentado
                u1Response = await ProcessFragmentedCommandAsync("U1", ct);
                if (u1Response.StartsWith("ERROR:"))
                {
                    return u1Response;
                }
            }
            else
            {
                // 1. Ejecutar comando O1 simple
                var o1Command = new SerialCommand
                {
                    Payload = "O1",
                    ExpectsAck = true,
                    ExpectsData = true,
                    AckTimeout = TimeSpan.FromMilliseconds(800),
                    DataTimeout = TimeSpan.FromSeconds(3),
                    MaxRetries = 1,
                    CancellationToken = ct
                };

                var o1Result = await _serialPipeline.EnqueueCommandAsync(o1Command);
                if (!o1Result.Success)
                {
                    _logger.LogError("Comando O1 falló: {Status}", o1Result.Status);
                    return $"ERROR: O1 failed - {o1Result.Status}";
                }
                o1Response = o1Result.Data;

                // 2. Ejecutar comando U1 simple
                var u1Command = new SerialCommand
                {
                    Payload = "U1",
                    ExpectsAck = true,
                    ExpectsData = true,
                    AckTimeout = TimeSpan.FromMilliseconds(800),
                    DataTimeout = TimeSpan.FromSeconds(3),
                    MaxRetries = 1,
                    CancellationToken = ct
                };

                var u1Result = await _serialPipeline.EnqueueCommandAsync(u1Command);
                if (!u1Result.Success)
                {
                    _logger.LogError("Comando U1 falló: {Status}", u1Result.Status);
                    return $"ERROR: U1 failed - {u1Result.Status}";
                }
                u1Response = u1Result.Data;
            }

            // 3. Concatenar con triple tab
            var combinedResponse = $"{o1Response}\t\t\t{u1Response}";

            _logger.LogInformation("Multipart exitoso: O1={O1Len} chars, U1={U1Len} chars",
                o1Response.Length, u1Response.Length);

            return combinedResponse;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en comando multipart");
            return $"ERROR: {ex.Message}";
        }
    }

    /// <summary>
    /// Determina si el dispositivo actual requiere comando multipart.
    /// ETAPA 7: Evalúa flag RequiresMultipartCommand de FactoryParameters
    /// </summary>
    private bool RequiresMultipartCommand()
    {
        return _currentDeviceParams?.RequiresMultipartCommand ?? false;
    }
    
    /// <summary>
    /// Determina si el dispositivo actual es un 5dm que requiere fragmentación.
    /// </summary>
    private bool Is5dmDevice()
    {
        return _currentDeviceParams?.TDev?.Equals("5dm", StringComparison.OrdinalIgnoreCase) ?? false;
    }

    /// <summary>
    /// Procesa comando fragmentado para dispositivos 5dm.
    ///   U1 → U10002 + U10305 + U10608
    ///   O1 → O10002 + O10305 + O10608
    /// </summary>
    /// <param name="baseCommand">Comando base (U1, O1)</param>
    /// <param name="ct">Token de cancelación</param>
    /// <returns>Respuesta concatenada con triple-tab</returns>
    private async Task<string> ProcessFragmentedCommandAsync(string baseCommand, CancellationToken ct)
    {
        var fragments = new[] { "0002", "0305", "0608" };
        var responses = new List<string>();
        
        _logger.LogInformation("Procesando comando fragmentado {Command} para 5dm", baseCommand);
        
        foreach (var fragment in fragments)
        {
            var fragmentedCmd = $"{baseCommand}{fragment}";
            _logger.LogDebug("Enviando fragmento: {Command}", fragmentedCmd);
            
            var command = new SerialCommand
            {
                Payload = fragmentedCmd,
                ExpectsAck = true,
                ExpectsData = true,
                AckTimeout = TimeSpan.FromMilliseconds(800),
                DataTimeout = TimeSpan.FromSeconds(3),
                MaxRetries = 2,
                CancellationToken = ct
            };
            
            var result = await _serialPipeline.EnqueueCommandAsync(command);
            
            if (!result.Success)
            {
                _logger.LogError("Fragmento {Command} falló: {Status}", fragmentedCmd, result.Status);
                return $"ERROR: Fragment {fragmentedCmd} failed - {result.Status}";
            }
            
            responses.Add(result.Data);
            _logger.LogDebug("Fragmento {Command} exitoso: {Length} chars", fragmentedCmd, result.Data.Length);
        }
        
        // Concatenar con triple-tab 
        var combined = string.Join("\t\t\t", responses);
        
        _logger.LogInformation("Comando fragmentado {Command} completado: {TotalLength} chars total",
            baseCommand, combined.Length);
        
        return combined;
    }

    /// <summary>
    /// Evalúa si el circuit breaker debe bloquear comandos.
    /// Backoff exponencial: 2^(failures-5) segundos, m�ximo 30s.
    /// ETAPA 4: Protecci�n contra saturaci�n
    /// </summary>
    private bool ShouldApplyCircuitBreaker()
    {
        lock (_circuitLock)
        {
            if (_consecutiveFailures < 5) return false;
            
            var timeSinceLastFailure = DateTime.UtcNow - _lastFailureTime;
            var backoffTime = TimeSpan.FromMilliseconds(
                Math.Min(1000 * Math.Pow(2, _consecutiveFailures - 5), 30000));
            
            if (timeSinceLastFailure < backoffTime)
            {
                _logger.LogWarning(
                    "Circuit breaker activo: {Failures} fallos consecutivos, esperando {BackoffMs}ms",
                    _consecutiveFailures, backoffTime.TotalMilliseconds);
                return true;
            }
            
            return false;
        }
    }

    /// <summary>
    /// Registra un fallo de comando, incrementando contador.
    /// ETAPA 4: Circuit breaker tracking
    /// </summary>
    private void RecordFailure()
    {
        lock (_circuitLock)
        {
            _consecutiveFailures++;
            _lastFailureTime = DateTime.UtcNow;
            
            if (_consecutiveFailures >= 5)
            {
                _logger.LogWarning("Circuit breaker: {Failures} consecutive failures", _consecutiveFailures);
            }
        }
    }

    /// <summary>
    /// Resetea el contador de fallos tras un �xito.
    /// ETAPA 4: Circuit breaker recovery
    /// </summary>
    private void RecordSuccess()
    {
        lock (_circuitLock)
        {
            if (_consecutiveFailures > 0)
            {
                _logger.LogInformation("Circuit breaker reset after {Failures} failures", _consecutiveFailures);
                _consecutiveFailures = 0;
            }
        }
    }

    /// <inheritdoc/>
    public async Task<string> ProcessGetRequestAsync(
        string page, 
        IDictionary<string, string?> queryParams, 
        CancellationToken ct = default)
    {
        if (string.IsNullOrEmpty(page))
        {
            _logger.LogWarning("ProcessGetRequestAsync llamado con page vac�o");
            return "ERROR: Command name is empty";
        }

        // Normalizar page: Asegurar que empiece con /
        var normalizedPage = page.StartsWith("/") ? page : $"/{page}";
        
        // ETAPA 8: Iniciar medici�n de tiempo
        var stopwatch = Stopwatch.StartNew();
        int retries = 0;
        string status = "success";

        // ETAPA 2/7: Detectar comando multipart para dispositivos 5dm
        if (normalizedPage.Equals("/multipart", StringComparison.OrdinalIgnoreCase) ||
            (normalizedPage.Equals("/status5dm", StringComparison.OrdinalIgnoreCase) && RequiresMultipartCommand()))
        {
            _logger.LogInformation("Detectado comando multipart, ejecutando O1+U1");
            var multipartResult = await ProcessMultipartCommandAsync(ct);
            
            stopwatch.Stop();
            _metrics?.RecordCommand(normalizedPage, "success", stopwatch.Elapsed.TotalSeconds, 0);
            
            return multipartResult;
        }

        // Buscar comando en cache
        if (!_getCommandCache.TryGetValue(normalizedPage, out var getCommand))
        {
            _logger.LogWarning("Comando no encontrado: {Page}", normalizedPage);
            
            stopwatch.Stop();
            _metrics?.RecordCommand(normalizedPage, "not_found", stopwatch.Elapsed.TotalSeconds, 0);
            
            return "ERROR: Command not found";
        }
        
        // NUEVO: Manejar comandos previousans y dpreviousans
        if (getCommand.Command.Equals("previousans", StringComparison.OrdinalIgnoreCase))
        {
            // Retornar última respuesta sin modificar
            string cachedResponse;
            lock (_previousAnswerLock)
            {
                cachedResponse = _previousAnswer;
            }
            
            _logger.LogDebug("previousans: Retornando respuesta cacheada ({Length} chars)", cachedResponse.Length);
            
            stopwatch.Stop();
            _metrics?.RecordCommand(normalizedPage, "cached", stopwatch.Elapsed.TotalSeconds, 0);
            
            // Log para análisis comparativo
            _commandLogger?.LogCommand(new CommandLogEntry
            {
                Page = normalizedPage,
                SerialCommand = "previousans",
                QueryParams = queryParams,
                RequiresEncoding = false,
                ExpectedLengths = getCommand.ExpectedLengths,
                PayloadSent = "(cached)",
                RawResponse = cachedResponse,
                ElapsedMs = stopwatch.Elapsed.TotalMilliseconds,
                Retries = 0,
                Status = "cached",
                FinalResponse = cachedResponse,
                WasCached = true
            });
            
            return cachedResponse;
        }
        
        if (getCommand.Command.Equals("dpreviousans", StringComparison.OrdinalIgnoreCase))
        {
            // Retornar última respuesta decodificada de hex
            string cachedResponse;
            lock (_previousAnswerLock)
            {
                cachedResponse = _decodedPreviousAnswer;
            }
            
            _logger.LogDebug("dpreviousans: Retornando respuesta decodificada cacheada ({Length} chars)", cachedResponse.Length);
            
            stopwatch.Stop();
            _metrics?.RecordCommand(normalizedPage, "cached", stopwatch.Elapsed.TotalSeconds, 0);
            
            // Log para análisis comparativo
            _commandLogger?.LogCommand(new CommandLogEntry
            {
                Page = normalizedPage,
                SerialCommand = "dpreviousans",
                QueryParams = queryParams,
                RequiresEncoding = false,
                ExpectedLengths = getCommand.ExpectedLengths,
                PayloadSent = "(cached)",
                RawResponse = cachedResponse,
                ElapsedMs = stopwatch.Elapsed.TotalMilliseconds,
                Retries = 0,
                Status = "cached",
                FinalResponse = cachedResponse,
                WasCached = true
            });
            
            return cachedResponse;
        }

        _logger.LogDebug("Procesando comando GET: {Page}", normalizedPage);

        try
        {
            // ETAPA 4: Circuit breaker check
            if (ShouldApplyCircuitBreaker())
            {
                stopwatch.Stop();
                _metrics?.RecordCommand(normalizedPage, "circuit_breaker", stopwatch.Elapsed.TotalSeconds, 0);
                
                return "ERROR: Circuit breaker active - too many consecutive failures";
            }

            // 1. Construir comando serial con par�metros interpolados
            var serialCommandPayload = BuildSerialCommand(getCommand.Command, queryParams);
            _logger.LogDebug("HTTP ? Serial: {Page} ? {Command}", normalizedPage, serialCommandPayload);

            // 2. Aplicar encoding hex si es requerido
            if (getCommand.Encode)
            {
                serialCommandPayload = EncodeToHex(serialCommandPayload);
                _logger.LogDebug("Comando codificado a hex: {Command}", serialCommandPayload);
            }

            // 3. Enviar comando con retry logic (3 intentos)
            string response = string.Empty;
            int maxRetries = 3;
            int attempt = 0;
            string currentPayload = serialCommandPayload;
            
            while (attempt < maxRetries)
            {
                try
                {
                    attempt++;
                    _logger.LogDebug("Intento {Attempt}/{MaxRetries} enviando comando", attempt, maxRetries);
                    
                    var command = new SerialCommand
                    {
                        Payload = currentPayload,
                        ExpectsAck = true,
                        ExpectsData = true,
                        AckTimeout = TimeSpan.FromMilliseconds(800),
                        DataTimeout = TimeSpan.FromSeconds(5),
                        MaxRetries = 1,
                        CancellationToken = ct
                    };

                    var result = await _serialPipeline.EnqueueCommandAsync(command);
                    
                    if (result.Success)
                    {
                        response = result.Data;
                        
                        // NUEVO: Manejo de INVALID CREDENTIALS
                        //                       strans = GetUSBAnswer("*0" & passW & Mid(strCommand, 3))
                        if (response.Contains("INVALID", StringComparison.OrdinalIgnoreCase) && 
                            !string.IsNullOrEmpty(_storedPassword))
                        {
                            _logger.LogWarning("INVALID CREDENTIALS detectado, reintentando con password");
                            
                            // Construir comando con prefijo *0{password}
                            // Mid(strCommand, 3) = desde carácter 3 = skipea los 2 primeros chars
                            var commandSuffix = serialCommandPayload.Length > 2 
                                ? serialCommandPayload.Substring(2) 
                                : string.Empty;
                            currentPayload = $"*0{_storedPassword}{commandSuffix}";
                            
                            if (getCommand.Encode)
                            {
                                currentPayload = EncodeToHex(currentPayload);
                            }
                            
                            continue; // Reintentar con el nuevo comando
                        }
                        
                        RecordSuccess();
                        status = "success";
                        break;
                    }
                    
                    RecordFailure();
                    status = result.Status.ToString().ToLowerInvariant();
                    _logger.LogWarning("Intento {Attempt} falló: {Status}", attempt, result.Status);
                }
                catch (TimeoutException) when (attempt < maxRetries)
                {
                    RecordFailure();
                    status = "timeout";
                    _logger.LogWarning("Timeout en intento {Attempt}, reintentando...", attempt);
                    await Task.Delay(200, ct);
                }
            }
            
            retries = attempt - 1;
            
            if (string.IsNullOrEmpty(response) && attempt >= maxRetries)
            {
                _logger.LogError("Comando fall� despu�s de {MaxRetries} intentos", maxRetries);
                
                stopwatch.Stop();
                _metrics?.RecordCommand(normalizedPage, status, stopwatch.Elapsed.TotalSeconds, retries);
                
                return "ERROR: Command timeout after retries";
            }

            // 4. Validar longitud esperada
            if (getCommand.ExpectedLengths?.Length > 0)
            {
                var expectedLength = int.TryParse(getCommand.ExpectedLengths[0], out var len) ? len : 0;
                if (expectedLength > 0 && response.Length != expectedLength)
                {
                    _logger.LogWarning(
                        "Longitud de respuesta incorrecta. Esperado: {Expected}, Recibido: {Actual}",
                        expectedLength, response.Length);
                }
            }

            // 4.5 Procesar respuesta con handler específico del dispositivo
            if (_responseProcessor != null && _responseProcessor.HasActiveHandler)
            {
                response = _responseProcessor.ProcessResponse(getCommand.Command, response);
            }

            // 5. Decodificar respuesta si es necesario
            var finalResponse = response;
            if (getCommand.Encode && !string.IsNullOrEmpty(response))
            {
                finalResponse = DecodeFromHex(response);
                _logger.LogDebug("Serial ? HTTP: {Response} ? {Decoded} (decoded)", response, finalResponse);
            }

            // 6. Aplicar formato splitwith3tabs si es requerido
            _logger.LogDebug("ExpectedLengths para {Page}: [{Lengths}]", 
                normalizedPage, 
                getCommand.ExpectedLengths?.Length > 0 ? string.Join(", ", getCommand.ExpectedLengths) : "(vacío)");
            
            string? formatApplied = null;
            int frameCount = 1;
            
            if (getCommand.ExpectedLengths?.Length > 0 && !string.IsNullOrEmpty(finalResponse))
            {
                var lengthSpec = getCommand.ExpectedLengths[0];
                _logger.LogDebug("LengthSpec: {LengthSpec}", lengthSpec);
                
                if (lengthSpec.StartsWith("splitwith3tabs:", StringComparison.OrdinalIgnoreCase))
                {
                    // Número de remotes hardcodeado en base.js: nrOfRemotes = 8
                    const int nrOfRemotes = 8;
                    _logger.LogInformation("Aplicando formato splitwith3tabs para {Page}", normalizedPage);
                    finalResponse = _responseFormatter.FormatResponse(finalResponse, lengthSpec, nrOfRemotes);
                    _logger.LogDebug("Formato splitwith3tabs aplicado ({Remotes} remotes)", nrOfRemotes);
                    
                    formatApplied = "splitwith3tabs";
                    frameCount = nrOfRemotes + 1; // master + remotes
                }
            }

            _logger.LogDebug("Serial ? HTTP: {Response}", finalResponse);
            
            // 7. Almacenar respuesta para previousans/dpreviousans
            lock (_previousAnswerLock)
            {
                _previousAnswer = response;  // Respuesta raw (sin decodificar)
                _decodedPreviousAnswer = finalResponse;  // Respuesta procesada/formateada
            }
            _logger.LogDebug("Respuesta almacenada para previousans ({RawLen} chars) y dpreviousans ({DecodedLen} chars)", 
                response.Length, finalResponse.Length);
            
            stopwatch.Stop();
            _metrics?.RecordCommand(normalizedPage, status, stopwatch.Elapsed.TotalSeconds, retries);
            _commandLogger?.LogCommand(new CommandLogEntry
            {
                Page = normalizedPage,
                SerialCommand = getCommand.Command,
                QueryParams = queryParams,
                RequiresEncoding = getCommand.Encode,
                ExpectedLengths = getCommand.ExpectedLengths,
                PayloadSent = serialCommandPayload,
                RawResponse = response,
                ElapsedMs = stopwatch.Elapsed.TotalMilliseconds,
                Retries = retries,
                Status = status,
                FormatApplied = formatApplied,
                FrameCount = frameCount,
                FinalResponse = finalResponse,
                WasCached = false
            });
            
            return finalResponse;
        }
        catch (OperationCanceledException)
        {
            _logger.LogWarning("Comando cancelado: {Page}", normalizedPage);
            
            stopwatch.Stop();
            _metrics?.RecordCommand(normalizedPage, "cancelled", stopwatch.Elapsed.TotalSeconds, retries);
            
            // Log para análisis
            _commandLogger?.LogCommand(new CommandLogEntry
            {
                Page = normalizedPage,
                SerialCommand = getCommand?.Command ?? "unknown",
                QueryParams = queryParams,
                RequiresEncoding = getCommand?.Encode ?? false,
                ExpectedLengths = getCommand?.ExpectedLengths,
                PayloadSent = "(cancelled)",
                ElapsedMs = stopwatch.Elapsed.TotalMilliseconds,
                Retries = retries,
                Status = "cancelled",
                ErrorMessage = "Operation was cancelled"
            });
            
            throw;
        }
        catch (Exception ex)
        {
            RecordFailure();
            _logger.LogError(ex, "Error procesando comando GET: {Page}", normalizedPage);
            
            stopwatch.Stop();
            _metrics?.RecordCommand(normalizedPage, "exception", stopwatch.Elapsed.TotalSeconds, retries);
            
            // Log para análisis
            _commandLogger?.LogCommand(new CommandLogEntry
            {
                Page = normalizedPage,
                SerialCommand = getCommand?.Command ?? "unknown",
                QueryParams = queryParams,
                RequiresEncoding = getCommand?.Encode ?? false,
                ExpectedLengths = getCommand?.ExpectedLengths,
                PayloadSent = "(error)",
                ElapsedMs = stopwatch.Elapsed.TotalMilliseconds,
                Retries = retries,
                Status = "exception",
                ErrorMessage = ex.Message,
                FinalResponse = $"ERROR: {ex.Message}"
            });
            
            return $"ERROR: {ex.Message}";
        }
    }

    /// <inheritdoc/>
    public async Task<string> ProcessPostRequestAsync(
        string page, 
        string body, 
        CancellationToken ct = default)
    {
        if (string.IsNullOrEmpty(page))
        {
            _logger.LogWarning("ProcessPostRequestAsync llamado con page vac�o");
            return "ERROR: Command name is empty";
        }

        // Normalizar page
        var normalizedPage = page.StartsWith("/") ? page : $"/{page}";
        
        // ETAPA 8: Iniciar medici�n de tiempo
        var stopwatch = Stopwatch.StartNew();
        int retries = 0;
        string status = "success";

        // Buscar comando en cache
        if (!_postCommandCache.TryGetValue(normalizedPage, out var postCommand))
        {
            _logger.LogWarning("Comando POST no encontrado: {Page}", normalizedPage);
            
            stopwatch.Stop();
            _metrics?.RecordCommand(normalizedPage, "not_found", stopwatch.Elapsed.TotalSeconds, 0);
            
            return "ERROR: Command not found";
        }

        _logger.LogDebug("Procesando comando POST: {Page}, Data: {Data}", normalizedPage, body);

        try
        {
            // ETAPA 4: Circuit breaker check
            if (ShouldApplyCircuitBreaker())
            {
                stopwatch.Stop();
                _metrics?.RecordCommand(normalizedPage, "circuit_breaker", stopwatch.Elapsed.TotalSeconds, 0);
                
                return "ERROR: Circuit breaker active - too many consecutive failures";
            }

            // NUEVO: Procesar body con decodificación si es requerido
            var processedBody = body;
            if (postCommand.DecodeBody && !string.IsNullOrEmpty(body))
            {
                processedBody = DecodePostBody(body, postCommand.NoDecodeChars);
                _logger.LogDebug("Body decodificado: {Original} → {Decoded}", 
                    body.Length > 50 ? body.Substring(0, 50) + "..." : body,
                    processedBody.Length > 50 ? processedBody.Substring(0, 50) + "..." : processedBody);
            }

            // Construir comando serial con datos del body
            var serialCommandPayload = postCommand.Command;
            if (!string.IsNullOrEmpty(processedBody))
            {
                // Si el comando tiene placeholder {data}, reemplazar
                if (serialCommandPayload.Contains("{data}"))
                {
                    serialCommandPayload = serialCommandPayload.Replace("{data}", processedBody);
                }
                else
                {
                    // Si no hay placeholder, concatenar al final 
                    serialCommandPayload = serialCommandPayload + processedBody;
                }
            }

            _logger.LogDebug("HTTP → Serial: {Page} → {Command}", normalizedPage, serialCommandPayload);

            // Aplicar encoding hex al comando completo si es requerido
            if (postCommand.Encode)
            {
                serialCommandPayload = EncodeToHex(serialCommandPayload);
                _logger.LogDebug("Comando POST codificado a hex: {Command}", serialCommandPayload);
            }

            // Retry logic con manejo de INVALID CREDENTIALS
            string response = string.Empty;
            int maxRetries = 3;
            int attempt = 0;
            string currentPayload = serialCommandPayload;
            
            while (attempt < maxRetries)
            {
                try
                {
                    attempt++;
                    _logger.LogDebug("Intento {Attempt}/{MaxRetries} enviando comando POST", attempt, maxRetries);
                    
                    var command = new SerialCommand
                    {
                        Payload = currentPayload,
                        ExpectsAck = true,
                        ExpectsData = postCommand.WaitResponse,
                        AckTimeout = TimeSpan.FromMilliseconds(800),
                        DataTimeout = TimeSpan.FromSeconds(10),
                        MaxRetries = 1,
                        CancellationToken = ct
                    };

                    var result = await _serialPipeline.EnqueueCommandAsync(command);
                    
                    if (result.Success)
                    {
                        response = result.Data;
                        
                        // NUEVO: Manejo de INVALID CREDENTIALS en POST
                        if (response.Contains("INVALID", StringComparison.OrdinalIgnoreCase) && 
                            !string.IsNullOrEmpty(_storedPassword))
                        {
                            _logger.LogWarning("INVALID CREDENTIALS en POST, reintentando con password");
                            
                            var commandSuffix = serialCommandPayload.Length > 2 
                                ? serialCommandPayload.Substring(2) 
                                : string.Empty;
                            currentPayload = $"*0{_storedPassword}{commandSuffix}";
                            
                            if (postCommand.Encode)
                            {
                                currentPayload = EncodeToHex(currentPayload);
                            }
                            
                            continue;
                        }
                        
                        RecordSuccess();
                        status = "success";
                        break;
                    }
                    
                    RecordFailure();
                    status = result.Status.ToString().ToLowerInvariant();
                    _logger.LogWarning("Intento {Attempt} POST falló: {Status}", attempt, result.Status);
                }
                catch (TimeoutException) when (attempt < maxRetries)
                {
                    RecordFailure();
                    status = "timeout";
                    _logger.LogWarning("Timeout en intento POST {Attempt}, reintentando...", attempt);
                    await Task.Delay(200, ct);
                }
            }
            
            retries = attempt - 1;
            
            if (attempt >= maxRetries && !postCommand.WaitResponse)
            {
                _logger.LogDebug("POST sin espera de respuesta completado después de reintentos");
                
                stopwatch.Stop();
                _metrics?.RecordCommand(normalizedPage, "success", stopwatch.Elapsed.TotalSeconds, retries);
                
                return "OK";
            }
            
            if (string.IsNullOrEmpty(response) && postCommand.WaitResponse && attempt >= maxRetries)
            {
                _logger.LogError("Comando POST fall� despu�s de {MaxRetries} intentos", maxRetries);
                
                stopwatch.Stop();
                _metrics?.RecordCommand(normalizedPage, status, stopwatch.Elapsed.TotalSeconds, retries);
                
                return "ERROR: Command timeout after retries";
            }

            if (!postCommand.WaitResponse)
            {
                _logger.LogDebug("POST sin espera de respuesta: {Page}", normalizedPage);
                
                stopwatch.Stop();
                _metrics?.RecordCommand(normalizedPage, "success", stopwatch.Elapsed.TotalSeconds, retries);
                
                return "OK";
            }

            if (postCommand.Encode && !string.IsNullOrEmpty(response))
            {
                var decoded = DecodeFromHex(response);
                _logger.LogDebug("Serial ? HTTP: {Response} ? {Decoded} (decoded)", response, decoded);
                
                stopwatch.Stop();
                _metrics?.RecordCommand(normalizedPage, status, stopwatch.Elapsed.TotalSeconds, retries);
                
                return decoded;
            }

            _logger.LogDebug("Serial ? HTTP: {Response}", response);
            
            stopwatch.Stop();
            _metrics?.RecordCommand(normalizedPage, status, stopwatch.Elapsed.TotalSeconds, retries);
            
            return response;
        }
        catch (OperationCanceledException)
        {
            _logger.LogWarning("Comando POST cancelado: {Page}", normalizedPage);
            
            stopwatch.Stop();
            _metrics?.RecordCommand(normalizedPage, "cancelled", stopwatch.Elapsed.TotalSeconds, retries);
            
            throw;
        }
        catch (Exception ex)
        {
            RecordFailure();
            _logger.LogError(ex, "Error procesando comando POST: {Page}", normalizedPage);
            
            stopwatch.Stop();
            _metrics?.RecordCommand(normalizedPage, "exception", stopwatch.Elapsed.TotalSeconds, retries);
            
            return $"ERROR: {ex.Message}";
        }
    }

    private string BuildSerialCommand(string baseCommand, IDictionary<string, string?> queryParams)
    {
        if (queryParams == null || queryParams.Count == 0)
        {
            return baseCommand;
        }

        var result = baseCommand;
        
        // Solo sustituir placeholders explícitos como {paramName}
        // NO concatenar parámetros que no tienen placeholder (como 'co' cache-buster)
        foreach (var kvp in queryParams)
        {
            if (!string.IsNullOrEmpty(kvp.Key) && kvp.Value != null)
            {
                result = result.Replace($"{{{kvp.Key}}}", kvp.Value);
            }
        }
        
        // Nota: Ya no concatenamos parámetros automáticamente cuando no hay placeholders.
        // Parámetros como 'co' (timestamp/cache-buster) no deben incluirse en el comando serial.
        // Si un comando necesita parámetros, debe definir placeholders explícitos en settings.cfg

        return result;
    }

    private string EncodeToHex(string input)
    {
        if (string.IsNullOrEmpty(input))
        {
            return string.Empty;
        }

        var bytes = Encoding.ASCII.GetBytes(input);
        var sb = new StringBuilder(bytes.Length * 2);

        foreach (var b in bytes)
        {
            sb.AppendFormat("{0:X2}", b);
        }

        return sb.ToString();
    }

    private string DecodeFromHex(string hex)
    {
        if (string.IsNullOrEmpty(hex))
        {
            return string.Empty;
        }

        if (hex.Length % 2 != 0)
        {
            _logger.LogWarning("Hex string con longitud impar para decodificar: {Hex}", hex);
            return hex;
        }

        try
        {
            var bytes = new byte[hex.Length / 2];
            for (int i = 0; i < bytes.Length; i++)
            {
                bytes[i] = Convert.ToByte(hex.Substring(i * 2, 2), 16);
            }

            return Encoding.ASCII.GetString(bytes);
        }
        catch (FormatException ex)
        {
            _logger.LogError(ex, "Error decodificando hex string: {Hex}", hex);
            return hex;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error inesperado decodificando hex string: {Hex}", hex);
            return hex;
        }
    }
    
    /// <summary>
    /// Decodifica el body de un POST preservando los primeros N caracteres sin decodificar.
    /// 
    /// - Toma una cadena hex y la convierte a ASCII
    /// - Preserva los primeros 'noDecodeChars' caracteres tal cual
    /// - Ejemplo: Decode("C01234ABCD", 2) = "C0" + DecodeHex("1234ABCD")
    /// </summary>
    /// <param name="body">Body del POST (puede ser hex o mixto)</param>
    /// <param name="noDecodeChars">Número de caracteres iniciales a preservar sin decodificar</param>
    /// <returns>Body con la parte hex decodificada</returns>
    private string DecodePostBody(string body, int noDecodeChars)
    {
        if (string.IsNullOrEmpty(body))
        {
            return string.Empty;
        }
        
        // Si noDecodeChars es 0 o mayor que la longitud, decodificar todo
        if (noDecodeChars <= 0)
        {
            return DecodeFromHex(body);
        }
        
        if (noDecodeChars >= body.Length)
        {
            return body; // No hay nada que decodificar
        }
        
        // Preservar los primeros N caracteres y decodificar el resto
        var preserved = body.Substring(0, noDecodeChars);
        var toDecode = body.Substring(noDecodeChars);
        
        var decoded = DecodeFromHex(toDecode);
        
        return preserved + decoded;
    }
}
