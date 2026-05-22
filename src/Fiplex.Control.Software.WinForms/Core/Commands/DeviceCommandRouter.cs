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
/// Implementation of the HTTP to serial command router.
/// Maintains configuration caches and handles hexadecimal encoding/decoding.
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
    
    // Caches for command mapping
    private readonly Dictionary<string, GetCommand> _getCommandCache = new(StringComparer.OrdinalIgnoreCase);
    private readonly Dictionary<string, PostCommand> _postCommandCache = new(StringComparer.OrdinalIgnoreCase);

    // STAGE 4: Circuit breaker state
    private int _consecutiveFailures = 0;
    private DateTime _lastFailureTime = DateTime.MinValue;
    private readonly object _circuitLock = new();
    
    // STAGE 7: Factory Parameters
    private FactoryParameters? _currentDeviceParams;
    
    // NEW: Password for retries with INVALID CREDENTIALS
    private string? _storedPassword;
    
    // NEW: Cache of last response for previousans/dpreviousans
    // - previousans: returns the last response without modification
    // - dpreviousans: returns the last response decoded from hex
    private string _previousAnswer = string.Empty;
    private string _decodedPreviousAnswer = string.Empty;
    private readonly object _previousAnswerLock = new();

    /// <summary>
    /// Constructor with dependency injection.
    /// STAGE 8: CommandMetrics and DeviceResponseProcessor are optional.
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
        _responseProcessor = responseProcessor; // Optional - for device-specific special cases
        _metrics = metrics; // Optional
        _commandLogger = commandLogger; // Optional - for HTTP command logging
    }
    
    /// <summary>
    /// Enables detailed HTTP GET command logging.
    /// Logs are saved to %LocalAppData%/Fiplex.Control.Software/HttpCommandLogs/
    /// </summary>
    public void EnableCommandLogging()
    {
        _commandLogger?.Enable();
        _logger.LogInformation("HTTP Command logging enabled: {Path}", _commandLogger?.GetCurrentLogFile());
    }
    
    /// <summary>
    /// Disables HTTP GET command logging.
    /// </summary>
    public void DisableCommandLogging()
    {
        _commandLogger?.Disable();
        _logger.LogInformation("HTTP Command logging disabled");
    }
    
    /// <summary>
    /// Indicates whether command logging is enabled.
    /// </summary>
    public bool IsCommandLoggingEnabled => _commandLogger?.IsEnabled ?? false;
    
    /// <summary>
    /// Gets the current log file path.
    /// </summary>
    public string? GetCommandLogFile() => _commandLogger?.GetCurrentLogFile();

    /// <summary>
    /// Sets the password for retries with INVALID CREDENTIALS.
    /// </summary>
    public void SetStoredPassword(string? password)
    {
        _storedPassword = password;
        _logger.LogDebug("Password stored in router for INVALID CREDENTIALS retries");
    }
    
    /// <summary>
    /// Clears the stored password.
    /// </summary>
    public void ClearStoredPassword()
    {
        _storedPassword = null;
    }
    
    /// <summary>
    /// Resets the router state on disconnect.
    /// </summary>
    public void Reset()
    {
        _logger.LogDebug("Resetting DeviceCommandRouter");
        
        // Clear command caches
        _getCommandCache.Clear();
        _postCommandCache.Clear();
        
        // Clear password
        _storedPassword = null;
        
        // Reset device parameters
        _currentDeviceParams = null;
        
        // Reset response processor (SCA, etc.)
        _responseProcessor?.Reset();
        
        // Reset circuit breaker
        _consecutiveFailures = 0;
        
        // Clear previous responses cache
        lock (_previousAnswerLock)
        {
            _previousAnswer = string.Empty;
            _decodedPreviousAnswer = string.Empty;
        }
        
        _logger.LogInformation("DeviceCommandRouter reset");
    }

    /// <inheritdoc/>
    public void LoadConfiguration(DeviceConfiguration config)
    {
        if (config == null)
        {
            throw new ArgumentNullException(nameof(config));
        }

        _logger.LogInformation("Loading device configuration in router");

        // Clear caches
        _getCommandCache.Clear();
        _postCommandCache.Clear();

        // Load GET commands
        foreach (var cmd in config.GetCommands)
        {
            if (!string.IsNullOrEmpty(cmd.Page))
            {
                _getCommandCache[cmd.Page] = cmd;
                var lengths = cmd.ExpectedLengths?.Length > 0 ? string.Join(", ", cmd.ExpectedLengths) : "(empty)";
                _logger.LogDebug("GET command cached: {Page} -> {Command} [ExpectedLengths: {Lengths}]", 
                    cmd.Page, cmd.Command, lengths);
            }
        }

        // Load POST commands
        foreach (var cmd in config.PostCommands)
        {
            if (!string.IsNullOrEmpty(cmd.Page))
            {
                _postCommandCache[cmd.Page] = cmd;
                _logger.LogDebug("POST command cacheado: {Page} -> {Command}", cmd.Page, cmd.Command);
            }
        }

        _logger.LogInformation(
            "Configuration loaded: {GetCount} GET commands, {PostCount} POST commands",
            _getCommandCache.Count,
            _postCommandCache.Count);
    }

    /// <summary>
    /// Configures current device parameters for routing decisions.
    /// STAGE 7: Must be called after LoadConfiguration().
    /// </summary>
    public async Task ConfigureDeviceAsync(string deviceType, double deviceVersion, CancellationToken ct = default)
    {
        _currentDeviceParams = await _factoryParams.GetFactoryParametersAsync(deviceType, deviceVersion, ct);
        
        // Configure response processor for device-specific special cases
        _responseProcessor?.ConfigureForDevice(deviceType, deviceVersion);
        
        _logger.LogInformation("Device configured: {Type} v{Version}", deviceType, deviceVersion);
    }

    /// <summary>
    /// Processes multipart O1+U1 command for 5dm devices.
    /// Concatenates responses with \t\t\t (triple tab) separator.
    /// STAGE 2: Multipart command.
    /// </summary>
    private async Task<string> ProcessMultipartCommandAsync(CancellationToken ct)
    {
        _logger.LogInformation("Processing multipart O1+U1 command");

        try
        {
            string o1Response, u1Response;
            // wsck_DataArrival: U1 → U10002 + U10305 + U10608
            if (Is5dmDevice())
            {
                _logger.LogInformation("5dm device detected - using fragmentation");
                
                // Execute fragmented O1
                o1Response = await ProcessFragmentedCommandAsync("O1", ct);
                if (o1Response.StartsWith("ERROR:"))
                {
                    return o1Response;
                }
                
                // Execute fragmented U1
                u1Response = await ProcessFragmentedCommandAsync("U1", ct);
                if (u1Response.StartsWith("ERROR:"))
                {
                    return u1Response;
                }
            }
            else
            {
                // 1. Execute simple O1 command
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
                    _logger.LogError("O1 command failed: {Status}", o1Result.Status);
                    return $"ERROR: O1 failed - {o1Result.Status}";
                }
                o1Response = o1Result.Data;

                // 2. Execute simple U1 command
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
                    _logger.LogError("U1 command failed: {Status}", u1Result.Status);
                    return $"ERROR: U1 failed - {u1Result.Status}";
                }
                u1Response = u1Result.Data;
            }

            // 3. Concatenate with triple tab
            var combinedResponse = $"{o1Response}\t\t\t{u1Response}";

            _logger.LogInformation("Multipart successful: O1={O1Len} chars, U1={U1Len} chars",
                o1Response.Length, u1Response.Length);

            return combinedResponse;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in multipart command");
            return $"ERROR: {ex.Message}";
        }
    }

    /// <summary>
    /// Determines if the current device requires multipart command.
    /// STAGE 7: Evaluates RequiresMultipartCommand flag from FactoryParameters.
    /// </summary>
    private bool RequiresMultipartCommand()
    {
        return _currentDeviceParams?.RequiresMultipartCommand ?? false;
    }
    
    /// <summary>
    /// Determines if the current device is a 5dm that requires fragmentation.
    /// </summary>
    private bool Is5dmDevice()
    {
        return _currentDeviceParams?.TDev?.Equals("5dm", StringComparison.OrdinalIgnoreCase) ?? false;
    }

    /// <summary>
    /// Processes fragmented command for 5dm devices.
    ///   U1 → U10002 + U10305 + U10608
    ///   O1 → O10002 + O10305 + O10608
    /// </summary>
    /// <param name="baseCommand">Base command (U1, O1).</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>Concatenated response with triple-tab.</returns>
    private async Task<string> ProcessFragmentedCommandAsync(string baseCommand, CancellationToken ct)
    {
        var fragments = new[] { "0002", "0305", "0608" };
        var responses = new List<string>();
        
        _logger.LogInformation("Processing fragmented command {Command} for 5dm", baseCommand);
        
        foreach (var fragment in fragments)
        {
            var fragmentedCmd = $"{baseCommand}{fragment}";
            _logger.LogDebug("Sending fragment: {Command}", fragmentedCmd);
            
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
                _logger.LogError("Fragment {Command} failed: {Status}", fragmentedCmd, result.Status);
                return $"ERROR: Fragment {fragmentedCmd} failed - {result.Status}";
            }
            
            responses.Add(result.Data);
            _logger.LogDebug("Fragment {Command} successful: {Length} chars", fragmentedCmd, result.Data.Length);
        }
        
        // Concatenate with triple-tab
        var combined = string.Join("\t\t\t", responses);
        
        _logger.LogInformation("Fragmented command {Command} completed: {TotalLength} chars total",
            baseCommand, combined.Length);
        
        return combined;
    }

    /// <summary>
    /// Evaluates whether the circuit breaker should block commands.
    /// Exponential backoff: 2^(failures-5) seconds, maximum 30s.
    /// STAGE 4: Saturation protection
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
                    "Circuit breaker active: {Failures} consecutive failures, waiting {BackoffMs}ms",
                    _consecutiveFailures, backoffTime.TotalMilliseconds);
                return true;
            }
            
            return false;
        }
    }

    /// <summary>
    /// Records a command failure, incrementing counter.
    /// STAGE 4: Circuit breaker tracking.
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
    /// Resets the failure counter after a success.
    /// STAGE 4: Circuit breaker recovery
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

        // Normalize page: Ensure it starts with /
        var normalizedPage = page.StartsWith("/") ? page : $"/{page}";
        
        // STAGE 8: Start time measurement
        var stopwatch = Stopwatch.StartNew();
        int retries = 0;
        string status = "success";

        // STAGE 2/7: Detect multipart command for 5dm devices
        if (normalizedPage.Equals("/multipart", StringComparison.OrdinalIgnoreCase) ||
            (normalizedPage.Equals("/status5dm", StringComparison.OrdinalIgnoreCase) && RequiresMultipartCommand()))
        {
            _logger.LogInformation("Multipart command detected, executing O1+U1");
            var multipartResult = await ProcessMultipartCommandAsync(ct);
            
            stopwatch.Stop();
            _metrics?.RecordCommand(normalizedPage, "success", stopwatch.Elapsed.TotalSeconds, 0);
            
            return multipartResult;
        }

        // Look up command in cache
        if (!_getCommandCache.TryGetValue(normalizedPage, out var getCommand))
        {
            _logger.LogWarning("Command not found: {Page}", normalizedPage);
            
            stopwatch.Stop();
            _metrics?.RecordCommand(normalizedPage, "not_found", stopwatch.Elapsed.TotalSeconds, 0);
            
            return "ERROR: Command not found";
        }
        
        // NEW: Handle previousans and dpreviousans commands
        if (getCommand.Command.Equals("previousans", StringComparison.OrdinalIgnoreCase))
        {
            // Return last response without modification
            string cachedResponse;
            lock (_previousAnswerLock)
            {
                cachedResponse = _previousAnswer;
            }
            
            _logger.LogDebug("previousans: Returning cached response ({Length} chars)", cachedResponse.Length);
            
            stopwatch.Stop();
            _metrics?.RecordCommand(normalizedPage, "cached", stopwatch.Elapsed.TotalSeconds, 0);
            
            // Log for comparative analysis
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
            // Return last response decoded from hex
            string cachedResponse;
            lock (_previousAnswerLock)
            {
                cachedResponse = _decodedPreviousAnswer;
            }
            
            _logger.LogDebug("dpreviousans: Returning cached decoded response ({Length} chars)", cachedResponse.Length);
            
            stopwatch.Stop();
            _metrics?.RecordCommand(normalizedPage, "cached", stopwatch.Elapsed.TotalSeconds, 0);
            
            // Log for comparative analysis
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

        _logger.LogDebug("Processing GET command: {Page}", normalizedPage);

        try
        {
            // STAGE 4: Circuit breaker check
            if (ShouldApplyCircuitBreaker())
            {
                stopwatch.Stop();
                _metrics?.RecordCommand(normalizedPage, "circuit_breaker", stopwatch.Elapsed.TotalSeconds, 0);
                
                return "ERROR: Circuit breaker active - too many consecutive failures";
            }

            // 1. Build serial command with interpolated parameters
            var serialCommandPayload = BuildSerialCommand(getCommand.Command, queryParams);
            _logger.LogDebug("HTTP ? Serial: {Page} ? {Command}", normalizedPage, serialCommandPayload);

            // 3. Send command with retry logic (3 intentos)
            string response = string.Empty;
            int maxRetries = 3;
            int attempt = 0;
            string currentPayload = serialCommandPayload;
            
            while (attempt < maxRetries)
            {
                try
                {
                    attempt++;
                    _logger.LogDebug("Attempt {Attempt}/{MaxRetries} sending command", attempt, maxRetries);
                    
                    var command = new SerialCommand
                    {
                        Payload = currentPayload,
                        ExpectsAck = true,
                        ExpectsData = true,
                        AckTimeout = TimeSpan.FromMilliseconds(800),
                        DataTimeout = TimeSpan.FromSeconds(5),
                        MaxRetries = 1,
                        IsSilent = serialCommandPayload.Equals("S1", StringComparison.OrdinalIgnoreCase),
                        CancellationToken = ct
                    };

                    var result = await _serialPipeline.EnqueueCommandAsync(command);
                    
                    if (result.Success)
                    {
                        response = result.Data;
                        
                        // NEW: Handle INVALID CREDENTIALS
                        //                       strans = GetUSBAnswer("*0" & passW & Mid(strCommand, 3))
                        if (response.Contains("INVALID", StringComparison.OrdinalIgnoreCase) && 
                            !string.IsNullOrEmpty(_storedPassword))
                        {
                            _logger.LogWarning("INVALID CREDENTIALS detected, retrying with password");
                            
                            // Build command with *0{password} prefix
                            // Mid(strCommand, 3) = from character 3 = skips the first 2 chars
                            var commandSuffix = serialCommandPayload.Length > 2 
                                ? serialCommandPayload.Substring(2) 
                                : string.Empty;
                            currentPayload = $"*0{_storedPassword}{commandSuffix}";

                            continue; // Retry with the new command
                        }
                        
                        RecordSuccess();
                        status = "success";
                        break;
                    }
                    
                    RecordFailure();
                    status = result.Status.ToString().ToLowerInvariant();
                    _logger.LogWarning("Attempt {Attempt} failed: {Status}", attempt, result.Status);
                }
                catch (TimeoutException) when (attempt < maxRetries)
                {
                    RecordFailure();
                    status = "timeout";
                    _logger.LogWarning("Timeout on attempt {Attempt}, retrying...", attempt);
                    await Task.Delay(200, ct);
                }
            }
            
            retries = attempt - 1;
            
            if (string.IsNullOrEmpty(response) && attempt >= maxRetries)
            {
                _logger.LogError("Command failed after {MaxRetries} attempts", maxRetries);
                
                stopwatch.Stop();
                _metrics?.RecordCommand(normalizedPage, status, stopwatch.Elapsed.TotalSeconds, retries);
                
                return "ERROR: Command timeout after retries";
            }

            // 4. Validate expected length
            if (getCommand.ExpectedLengths?.Length > 0)
            {
                var expectedLength = int.TryParse(getCommand.ExpectedLengths[0], out var len) ? len : 0;
                if (expectedLength > 0 && response.Length != expectedLength)
                {
                    _logger.LogWarning(
                        "Incorrect response length. Expected: {Expected}, Received: {Actual}",
                        expectedLength, response.Length);
                }
            }

            // 4.5 Process response with device-specific handler
            if (_responseProcessor != null && _responseProcessor.HasActiveHandler)
            {
                response = _responseProcessor.ProcessResponse(getCommand.Command, response);
            }

            // 5. Hex-encode response if required (v1.9 semantics: send command as-is, encode response)
            var finalResponse = response;
            if (getCommand.Encode && !string.IsNullOrEmpty(response))
            {
                finalResponse = EncodeToHex(response);
                _logger.LogDebug("Serial ? HTTP: {Response} ? {Encoded} (hex-encoded)", response, finalResponse);
            }

            // 6. Apply splitwith3tabs format if required
            _logger.LogDebug("ExpectedLengths for {Page}: [{Lengths}]", 
                normalizedPage, 
                getCommand.ExpectedLengths?.Length > 0 ? string.Join(", ", getCommand.ExpectedLengths) : "(empty)");
            
            string? formatApplied = null;
            int frameCount = 1;
            
            if (getCommand.ExpectedLengths?.Length > 0 && !string.IsNullOrEmpty(finalResponse))
            {
                var lengthSpec = getCommand.ExpectedLengths[0];
                _logger.LogDebug("LengthSpec: {LengthSpec}", lengthSpec);
                
                if (lengthSpec.StartsWith("splitwith3tabs:", StringComparison.OrdinalIgnoreCase))
                {
                    // Number of remotes hardcoded in base.js: nrOfRemotes = 8
                    const int nrOfRemotes = 8;
                    _logger.LogInformation("Applying splitwith3tabs format for {Page}", normalizedPage);
                    finalResponse = _responseFormatter.FormatResponse(finalResponse, lengthSpec, nrOfRemotes);
                    _logger.LogDebug("splitwith3tabs format applied ({Remotes} remotes)", nrOfRemotes);
                    
                    formatApplied = "splitwith3tabs";
                    frameCount = nrOfRemotes + 1; // master + remotes
                }
            }

            _logger.LogDebug("Serial ? HTTP: {Response}", finalResponse);
            
            // NOTE: _previousAnswer/_decodedPreviousAnswer are intentionally NOT updated here.
            // They are only written by ProcessPostRequestAsync so that dpreviousans/previousans
            // always reflect the result of the last POST serial command, not a regular GET poll.
            
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
            _logger.LogWarning("Command cancelled: {Page}", normalizedPage);
            
            stopwatch.Stop();
            _metrics?.RecordCommand(normalizedPage, "cancelled", stopwatch.Elapsed.TotalSeconds, retries);
            
            // Log for analysis
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
            _logger.LogError(ex, "Error processing GET command: {Page}", normalizedPage);
            
            stopwatch.Stop();
            _metrics?.RecordCommand(normalizedPage, "exception", stopwatch.Elapsed.TotalSeconds, retries);
            
            // Log for analysis
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

        // Build robust lookup candidates (legacy POST keys are often declared without '/')
        var lookupCandidates = new List<string>();
        if (!string.IsNullOrWhiteSpace(page))
        {
            lookupCandidates.Add(page);

            if (page.StartsWith("/"))
            {
                var withoutSlash = page.TrimStart('/');
                if (!string.IsNullOrWhiteSpace(withoutSlash))
                {
                    lookupCandidates.Add(withoutSlash);
                }
            }
            else
            {
                lookupCandidates.Add($"/{page}");
            }
        }

        // Normalized page for logs/metrics (keeps old convention with leading '/')
        var normalizedPage = page.StartsWith("/") ? page : $"/{page}";
        
        // STAGE 8: Start time measurement
        var stopwatch = Stopwatch.StartNew();
        int retries = 0;
        string status = "success";

        // Look up command in cache (try both with and without slash)
        PostCommand? postCommand = null;
        foreach (var candidate in lookupCandidates.Distinct(StringComparer.OrdinalIgnoreCase))
        {
            if (_postCommandCache.TryGetValue(candidate, out var matchedCommand))
            {
                postCommand = matchedCommand;
                normalizedPage = candidate.StartsWith("/") ? candidate : $"/{candidate}";
                break;
            }
        }

        if (postCommand == null)
        {
            // When the key ends with _req (e.g. "fact_req") it is a trigger-only parameter
            // with no direct mapping in settings.cfg.  Resolve it to the corresponding _fw
            // command (e.g. "fact_fw") so the device read command executes and stores its
            // response in _decodedPreviousAnswer, making dpreviousans work correctly.
            if (page.EndsWith("_req", StringComparison.OrdinalIgnoreCase))
            {
                var baseName = page[..^"_req".Length];          // "fact_req" → "fact"
                var fwKey    = baseName + "_fw";                // → "fact_fw"
                if (_postCommandCache.ContainsKey(fwKey))
                {
                    _logger.LogDebug(
                        "_req trigger '{Page}' resolved to '{FwKey}', executing with empty body",
                        page, fwKey);
                    stopwatch.Stop();
                    // Execute the _fw command with an empty body so no extra data is
                    // appended to the serial command (e.g. F1, not F11).
                    return await ProcessPostRequestAsync(fwKey, string.Empty, ct);
                }
            }

            _logger.LogWarning("POST command not found: {Page}. Candidates: {Candidates}", page, string.Join(", ", lookupCandidates));
            
            stopwatch.Stop();
            _metrics?.RecordCommand(normalizedPage, "not_found", stopwatch.Elapsed.TotalSeconds, 0);
            
            return "ERROR: Command not found";
        }

        _logger.LogDebug("Processing POST command: {Page}, Data: {Data}", normalizedPage, body);

        try
        {
            // STAGE 4: Circuit breaker check
            if (ShouldApplyCircuitBreaker())
            {
                stopwatch.Stop();
                _metrics?.RecordCommand(normalizedPage, "circuit_breaker", stopwatch.Elapsed.TotalSeconds, 0);
                
                return "ERROR: Circuit breaker active - too many consecutive failures";
            }

            // NEW: Process body with decoding if required
            var processedBody = body;
            if (postCommand.DecodeBody && !string.IsNullOrEmpty(body))
            {
                processedBody = DecodePostBody(body, postCommand.NoDecodeChars);
                _logger.LogDebug("Decoded body: {Original} → {Decoded}", 
                    body.Length > 50 ? body.Substring(0, 50) + "..." : body,
                    processedBody.Length > 50 ? processedBody.Substring(0, 50) + "..." : processedBody);
            }

            // Build serial command with body data
            var serialCommandPayload = postCommand.Command;
            if (!string.IsNullOrEmpty(processedBody))
            {
                // If the command has a {data} placeholder, replace it
                if (serialCommandPayload.Contains("{data}"))
                {
                    serialCommandPayload = serialCommandPayload.Replace("{data}", processedBody);
                }
                else
                {
                    // If there is no placeholder, concatenate at the end
                    serialCommandPayload = serialCommandPayload + processedBody;
                }
            }

            _logger.LogDebug("HTTP → Serial: {Page} → {Command}", normalizedPage, serialCommandPayload);

            // Retry logic con manejo de INVALID CREDENTIALS
            string response = string.Empty;
            int maxRetries = 3;
            int attempt = 0;
            string currentPayload = serialCommandPayload;
            bool commandSucceeded = false;
            
            while (attempt < maxRetries)
            {
                try
                {
                    attempt++;
                    _logger.LogDebug("Attempt {Attempt}/{MaxRetries} sending POST command", attempt, maxRetries);
                    
                    var command = new SerialCommand
                    {
                        Payload = currentPayload,
                        ExpectsAck = true,
                        ExpectsData = postCommand.WaitResponse,
                        AckTimeout = TimeSpan.FromMilliseconds(3000),
                        DataTimeout = TimeSpan.FromSeconds(10),
                        MaxRetries = 1,
                        CancellationToken = ct
                    };

                    var result = await _serialPipeline.EnqueueCommandAsync(command);
                    
                    if (result.Success)
                    {
                        response = result.Data;
                        
                        // NEW: Handle INVALID CREDENTIALS in POST
                        if (response.Contains("INVALID", StringComparison.OrdinalIgnoreCase) && 
                            !string.IsNullOrEmpty(_storedPassword))
                        {
                            _logger.LogWarning("INVALID CREDENTIALS in POST, retrying with password");
                            
                            var commandSuffix = serialCommandPayload.Length > 2 
                                ? serialCommandPayload.Substring(2) 
                                : string.Empty;
                            currentPayload = $"*0{_storedPassword}{commandSuffix}";

                            continue;
                        }

                        commandSucceeded = true;
                        
                        RecordSuccess();
                        status = "success";
                        break;
                    }
                    
                    RecordFailure();
                    status = result.Status.ToString().ToLowerInvariant();
                    _logger.LogWarning("Attempt {Attempt} POST failed: {Status}", attempt, result.Status);
                }
                catch (TimeoutException) when (attempt < maxRetries)
                {
                    RecordFailure();
                    status = "timeout";
                    _logger.LogWarning("Timeout on POST attempt {Attempt}, retrying...", attempt);
                    await Task.Delay(200, ct);
                }
            }
            
            retries = attempt - 1;

            void UpdatePostCaches(string dataResponse)
            {
                lock (_previousAnswerLock)
                {
                    _previousAnswer = commandSucceeded ? "0" : "1";
                    _decodedPreviousAnswer = dataResponse;
                }
            }
            
            if (attempt >= maxRetries && !postCommand.WaitResponse)
            {
                UpdatePostCaches(response);

                _logger.LogDebug("POST without response wait completed after retries");
                
                stopwatch.Stop();
                _metrics?.RecordCommand(normalizedPage, "success", stopwatch.Elapsed.TotalSeconds, retries);
                
                return "OK";
            }
            
            if (string.IsNullOrEmpty(response) && postCommand.WaitResponse && attempt >= maxRetries)
            {
                _logger.LogError("POST command failed after {MaxRetries} attempts", maxRetries);
                
                stopwatch.Stop();
                _metrics?.RecordCommand(normalizedPage, status, stopwatch.Elapsed.TotalSeconds, retries);
                
                return "ERROR: Command timeout after retries";
            }

            if (!postCommand.WaitResponse)
            {
                UpdatePostCaches(response);

                _logger.LogDebug("POST without response wait: {Page}", normalizedPage);
                
                stopwatch.Stop();
                _metrics?.RecordCommand(normalizedPage, "success", stopwatch.Elapsed.TotalSeconds, retries);
                
                return "OK";
            }

            if (postCommand.Encode && !string.IsNullOrEmpty(response))
            {
                var decoded = DecodeFromHex(response);
                _logger.LogDebug("Serial ? HTTP: {Response} ? {Decoded} (decoded)", response, decoded);
                UpdatePostCaches(decoded);
                
                stopwatch.Stop();
                _metrics?.RecordCommand(normalizedPage, status, stopwatch.Elapsed.TotalSeconds, retries);
                
                return decoded;
            }

            _logger.LogDebug("Serial ? HTTP: {Response}", response);
            UpdatePostCaches(response);
            
            stopwatch.Stop();
            _metrics?.RecordCommand(normalizedPage, status, stopwatch.Elapsed.TotalSeconds, retries);
            
            return response;
        }
        catch (OperationCanceledException)
        {
            _logger.LogWarning("POST command cancelled: {Page}", normalizedPage);
            
            stopwatch.Stop();
            _metrics?.RecordCommand(normalizedPage, "cancelled", stopwatch.Elapsed.TotalSeconds, retries);
            
            throw;
        }
        catch (Exception ex)
        {
            RecordFailure();
            _logger.LogError(ex, "Error processing POST command: {Page}", normalizedPage);
            
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
        
        // Only substitute explicit placeholders like {paramName}
        // DO NOT concatenate parameters without placeholder (like 'co' cache-buster)
        foreach (var kvp in queryParams)
        {
            if (!string.IsNullOrEmpty(kvp.Key) && kvp.Value != null)
            {
                result = result.Replace($"{{{kvp.Key}}}", kvp.Value);
            }
        }
        
        // Note: We no longer automatically concatenate parameters when there are no placeholders.
        // Parameters like 'co' (timestamp/cache-buster) should not be included in the serial command.
        // If a command needs parameters, it must define explicit placeholders in settings.cfg

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
            _logger.LogWarning("Hex string with odd length to decode: {Hex}", hex);
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
            _logger.LogError(ex, "Error decoding hex string: {Hex}", hex);
            return hex;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error decoding hex string: {Hex}", hex);
            return hex;
        }
    }
    
    /// <summary>
    /// Decodes the body of a POST preserving the first N characters without decoding.
    /// 
    /// - Takes a hex string and converts it to ASCII
    /// - Preserves the first 'noDecodeChars' characters as-is
    /// - Example: Decode("C01234ABCD", 2) = "C0" + DecodeHex("1234ABCD")
    /// </summary>
    /// <param name="body">POST body (can be hex or mixed)</param>
    /// <param name="noDecodeChars">Number of initial characters to preserve without decoding</param>
    /// <returns>Body with the hex portion decoded</returns>
    private string DecodePostBody(string body, int noDecodeChars)
    {
        if (string.IsNullOrEmpty(body))
        {
            return string.Empty;
        }
        
        // If noDecodeChars is 0 or greater than the length, decode everything
        if (noDecodeChars <= 0)
        {
            return DecodeFromHex(body);
        }
        
        if (noDecodeChars >= body.Length)
        {
            return body; // Nothing to decode
        }
        
        // Preserve the first N characters and decode the rest
        var preserved = body.Substring(0, noDecodeChars);
        var toDecode = body.Substring(noDecodeChars);
        
        var decoded = DecodeFromHex(toDecode);
        
        return preserved + decoded;
    }
}



