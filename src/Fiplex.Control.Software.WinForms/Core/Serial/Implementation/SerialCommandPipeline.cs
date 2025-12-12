using System.Collections.Concurrent;
using System.Diagnostics;
using System.Text;
using Fiplex.Control.Software.WinForms.Core.Serial.Interfaces;
using Fiplex.Control.Software.WinForms.Core.Serial.Models;
using Fiplex.Control.Software.WinForms.Core.Security.Interfaces;
using Microsoft.Extensions.Logging;

namespace Fiplex.Control.Software.WinForms.Core.Serial.Implementation;

/// <summary>
/// Serial command pipeline with complete response processing.
/// </summary>
public sealed class SerialCommandPipeline : ISerialCommandPipeline
{
    private readonly ISerialPort _serialPort;
    private readonly ISerialProtocolParser _parser;
    private readonly IResponseValidator _validator;
    private readonly ILogger<SerialCommandPipeline> _logger;
    private readonly ConcurrentQueue<CommandRequest> _commandQueue = new();
    
    private CancellationTokenSource? _pipelineCts;
    private Task? _processingTask;
    private Task? _readTask;
    private CommandContext? _currentCommandContext;
    private volatile bool _waitingAnswer = false;
    private volatile bool _pendingAnswer = false;
    
    // Password for automatic retry (INVALID CREDENTIALS)
    private string? _storedPassword;
    
    /// <summary>
    /// Indicates if the parser is waiting for LF (end of frame).
    /// </summary>
    public bool IsWaitingLF => _parser.IsWaitingLF;
    
    /// <summary>
    /// Indicates if the pipeline is waiting for a device response.
    /// </summary>
    public bool IsWaitingAnswer => _waitingAnswer;
    
    /// <summary>
    /// Indicates if there is a pending response to process.
    /// </summary>
    public bool IsPendingAnswer => _pendingAnswer;
    
    /// <summary>
    /// Current receive buffer length.
    /// </summary>
    public int BufferLength => _parser.BufferLength;

    public event Action<Guid, CommandState>? CommandStateChanged;
    public event Action<Guid, SerialResult>? CommandCompleted;
    public event Action<ProtocolToken>? TokenReceived;
    
    /// <summary>
    /// Event when INVALID CREDENTIALS is detected.
    /// Allows the caller to provide password for retry.
    /// </summary>
    public event Func<Task<string?>>? CredentialsRequired;

    private record CommandRequest(SerialCommand Command, TaskCompletionSource<SerialResult> Tcs);

    private class CommandContext
    {
        public CommandRequest Request { get; }
        public int RetryCount { get; set; }
        public int CredentialRetryCount { get; set; }
        public Stopwatch RoundTripTimer { get; } = new();
        public Stopwatch AckTimer { get; } = new();
        public CancellationTokenSource Cts { get; }
        public string? LastResponse { get; set; }

        public CommandContext(CommandRequest request, CancellationToken pipelineToken)
        {
            Request = request;
            Cts = CancellationTokenSource.CreateLinkedTokenSource(
                request.Command.CancellationToken, pipelineToken);
        }

        public void Dispose() => Cts.Dispose();
    }

    public SerialCommandPipeline(
        ISerialPort serialPort,
        ISerialProtocolParser parser,
        IResponseValidator validator,
        ILogger<SerialCommandPipeline> logger)
    {
        _serialPort = serialPort;
        _parser = parser;
        _validator = validator;
        _logger = logger;
    }
    
    /// <summary>
    /// Sets the password for automatic retries with INVALID CREDENTIALS.
    /// </summary>
    public void SetStoredPassword(string password)
    {
        _storedPassword = password;
    }
    
    /// <summary>
    /// Clears the stored password.
    /// </summary>
    public void ClearStoredPassword()
    {
        _storedPassword = null;
    }
    
    /// <summary>
    /// Cancels all pending commands in the queue.
    /// Used when loading base.js and during disconnection.
    /// </summary>
    public void CancelPendingCommands()
    {
        _logger.LogInformation("Cancelling all pending commands");
        
        // Empty queue and cancel each command
        var cancelledCount = 0;
        while (_commandQueue.TryDequeue(out var request))
        {
            request.Tcs.TrySetCanceled();
            cancelledCount++;
        }
        
        // Cancel in-progress command if exists
        if (_currentCommandContext != null)
        {
            _currentCommandContext.Cts.Cancel();
            cancelledCount++;
        }
        
        // Reset states
        _waitingAnswer = false;
        _pendingAnswer = false;
        
        _logger.LogInformation("Pending commands cancelled: {Count}", cancelledCount);
    }

    public Task<SerialResult> EnqueueCommandAsync(SerialCommand command)
    {
        if (_pipelineCts?.IsCancellationRequested != false)
            throw new InvalidOperationException("Pipeline not running");

        var tcs = new TaskCompletionSource<SerialResult>(TaskCreationOptions.RunContinuationsAsynchronously);
        _commandQueue.Enqueue(new CommandRequest(command, tcs));
        return tcs.Task;
    }

    public Task StartAsync(CancellationToken ct = default)
    {
        _pipelineCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        _processingTask = Task.Run(() => ProcessQueueAsync(_pipelineCts.Token), _pipelineCts.Token);
        _readTask = Task.Run(() => ReadPortAsync(_pipelineCts.Token), _pipelineCts.Token);
        _logger.LogInformation("Pipeline started");
        return Task.CompletedTask;
    }

    public async Task StopAsync()
    {
        if (_pipelineCts == null) return;
        
        _pipelineCts.Cancel();
        try
        {
            await Task.WhenAll(_processingTask ?? Task.CompletedTask, _readTask ?? Task.CompletedTask);
        }
        catch (OperationCanceledException) { }
        
        _pipelineCts.Dispose();
        _pipelineCts = null;
        _logger.LogInformation("Pipeline stopped");
    }

    private async Task ProcessQueueAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            if (_currentCommandContext == null && _commandQueue.TryDequeue(out var request))
            {
                _currentCommandContext = new CommandContext(request, ct);
                try
                {
                    await ExecuteCommandAsync(_currentCommandContext);
                }
                finally
                {
                    _currentCommandContext.Dispose();
                    _currentCommandContext = null;
                }
            }
            else
            {
                await Task.Delay(20, ct);
            }
        }
    }

    private async Task ReadPortAsync(CancellationToken ct)
    {
        var buffer = new byte[1024];
        while (!ct.IsCancellationRequested)
        {
            try
            {
                if (_serialPort.IsOpen && _serialPort.BytesToRead > 0)
                {
                    var bytesRead = await _serialPort.ReadAsync(buffer, ct);
                    if (bytesRead > 0)
                    {
                        foreach (var token in _parser.ProcessIncomingData(buffer.AsSpan(0, bytesRead)))
                        {
                            TokenReceived?.Invoke(token);
                        }
                    }
                }
                else
                {
                    await Task.Delay(10, ct);
                }
            }
            catch (OperationCanceledException) { break; }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Read error");
                await Task.Delay(100, ct);
            }
        }
    }

    private async Task ExecuteCommandAsync(CommandContext ctx)
    {
        var cmd = ctx.Request.Command;
        ctx.RoundTripTimer.Start();
        _waitingAnswer = true;

        for (ctx.RetryCount = 0; ctx.RetryCount <= cmd.MaxRetries; ctx.RetryCount++)
        {
            if (ctx.Cts.IsCancellationRequested)
            {
                CompleteCommand(ctx, CommandResultStatus.Cancelled);
                return;
            }

            try
            {
                // TX
                UpdateState(cmd.Id, CommandState.Sending);
                var payload = Encoding.ASCII.GetBytes(cmd.Payload + "\n");
                var bytesSent = await _serialPort.WriteAsync(payload, ctx.Cts.Token);
                _logger.LogDebug("TX: {Payload}", cmd.Payload);
                _pendingAnswer = true;
                
                // Wait ACK
                if (cmd.ExpectsAck)
                {
                    UpdateState(cmd.Id, CommandState.AwaitingAck);
                    ctx.AckTimer.Restart();
                    var (ackResult, ackData) = await WaitForTokenWithTypeAsync(cmd.AckTimeout, ctx.Cts.Token);
                    ctx.AckTimer.Stop();

                    if (ackResult == TokenType.InvalidCredentials)
                    {
                        // INVALID CREDENTIALS - Try with password
                        var retriedResult = await HandleInvalidCredentialsAsync(ctx, cmd, bytesSent);
                        if (retriedResult != null)
                        {
                            ctx.Request.Tcs.SetResult(retriedResult);
                            return;
                        }
                        continue;
                    }

                    // NEW: If we receive DataFrame when expecting ACK, 
                    // the device responded directly without ACK (valid behavior for some devices)
                    if (ackResult == TokenType.DataFrame)
                    {
                        _logger.LogDebug("DataFrame received directly without previous ACK for {CmdId}", cmd.Id);
                        _pendingAnswer = false;
                        
                        // Validate length if necessary
                        if (cmd.ExpectedLengths.Length > 0)
                        {
                            var lengthSpec = string.Join(",", cmd.ExpectedLengths);
                            if (!_validator.ValidateLength(ackData, lengthSpec))
                            {
                                _logger.LogWarning(
                                    "Response validation failed {CmdId} retry {Retry}/{Max}. Spec: [{Spec}], Got: {Actual} chars",
                                    cmd.Id, ctx.RetryCount, cmd.MaxRetries, lengthSpec, ackData.Length);
                                continue;
                            }
                        }
                        
                        _logger.LogDebug("RX (direct DataFrame): {Data}", ackData.Length > 100 ? ackData[..100] + "..." : ackData);
                        CompleteCommand(ctx, CommandResultStatus.Success, ackData, bytesSent);
                        return;
                    }

                    if (ackResult != TokenType.Ack)
                    {
                        _logger.LogWarning("ACK timeout {CmdId} retry {Retry}/{Max}", 
                            cmd.Id, ctx.RetryCount, cmd.MaxRetries);
                        continue;
                    }
                }

                // Wait Data
                if (cmd.ExpectsData)
                {
                    UpdateState(cmd.Id, CommandState.AwaitingData);
                    var (dataResult, data) = await WaitForDataWithValidationAsync(cmd.DataTimeout, ctx.Cts.Token);
                    _pendingAnswer = false;

                    if (dataResult == TokenType.Timeout)
                    {
                        _logger.LogWarning("Data timeout {CmdId} retry {Retry}/{Max}", 
                            cmd.Id, ctx.RetryCount, cmd.MaxRetries);
                        continue;
                    }

                    if (dataResult == TokenType.InvalidCredentials)
                    {
                        var retriedResult = await HandleInvalidCredentialsAsync(ctx, cmd, bytesSent);
                        if (retriedResult != null)
                        {
                            ctx.Request.Tcs.SetResult(retriedResult);
                            return;
                        }
                        continue;
                    }

                    ctx.LastResponse = data;

                    // LENGTH VALIDATION using ResponseValidator
                    if (cmd.ExpectedLengths.Length > 0)
                    {
                        var lengthSpec = string.Join(",", cmd.ExpectedLengths);
                        if (!_validator.ValidateLength(data, lengthSpec))
                        {
                            _logger.LogWarning(
                                "Response validation failed {CmdId} retry {Retry}/{Max}. Spec: [{Spec}], Got: {Actual} chars",
                                cmd.Id, ctx.RetryCount, cmd.MaxRetries, lengthSpec, data.Length);
                            continue;
                        }
                    }

                    _logger.LogDebug("RX: {Data}", data.Length > 100 ? data[..100] + "..." : data);
                    CompleteCommand(ctx, CommandResultStatus.Success, data, bytesSent);
                    return;
                }

                _pendingAnswer = false;
                CompleteCommand(ctx, CommandResultStatus.Success, bytesSent: bytesSent);
                return;
            }
            catch (OperationCanceledException)
            {
                CompleteCommand(ctx, CommandResultStatus.Cancelled);
                return;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Command error {CmdId} retry {Retry}/{Max}", 
                    cmd.Id, ctx.RetryCount, cmd.MaxRetries);
            }
        }

        _waitingAnswer = false;
        _pendingAnswer = false;
        CompleteCommand(ctx, CommandResultStatus.MaxRetriesExceeded);
    }

    /// <summary>
    /// Handles INVALID CREDENTIALS response by retrying with password.
    /// </summary>
    private async Task<SerialResult?> HandleInvalidCredentialsAsync(CommandContext ctx, SerialCommand cmd, int bytesSent)
    {
        if (ctx.CredentialRetryCount >= 1)
        {
            _logger.LogError("INVALID CREDENTIALS retry already attempted, failing");
            return new SerialResult(cmd.Id, false, CommandResultStatus.AuthenticationFailed, 
                ctx.LastResponse ?? "INVALID CREDENTIALS", null, null);
        }

        ctx.CredentialRetryCount++;

        // Try to get password
        var password = _storedPassword;
        
        if (string.IsNullOrEmpty(password) && CredentialsRequired != null)
        {
            _logger.LogInformation("Requesting credentials from handler");
            password = await CredentialsRequired.Invoke();
        }

        if (string.IsNullOrEmpty(password))
        {
            _logger.LogWarning("No password available for INVALID CREDENTIALS retry");
            return new SerialResult(cmd.Id, false, CommandResultStatus.AuthenticationFailed, 
                "INVALID CREDENTIALS - No password provided", null, null);
        }

        // Build command with password: "*0" + password + command without prefix
        var cmdPayload = cmd.Payload;
        var authPayload = cmdPayload.Length >= 2 
            ? $"*0{password}{cmdPayload[2..]}"
            : $"*0{password}{cmdPayload}";

        _logger.LogInformation("Retrying command with authentication: {Original} -> {Auth}", 
            cmdPayload, authPayload.Length > 10 ? authPayload[..10] + "***" : "***");

        // Send authenticated command
        var payload = Encoding.ASCII.GetBytes(authPayload + "\n");
        await _serialPort.WriteAsync(payload, ctx.Cts.Token);

        // Wait for response
        if (cmd.ExpectsData)
        {
            var (dataResult, data) = await WaitForDataWithValidationAsync(cmd.DataTimeout, ctx.Cts.Token);

            if (dataResult == TokenType.DataFrame)
            {
                // Validate response if there is specification
                if (cmd.ExpectedLengths.Length > 0)
                {
                    var lengthSpec = string.Join(",", cmd.ExpectedLengths);
                    if (!_validator.ValidateLength(data, lengthSpec))
                    {
                        _logger.LogWarning("Auth retry response validation failed");
                        return null; // Continue with normal retry
                    }
                }

                _logger.LogInformation("Authentication retry successful (data frame)");
                return new SerialResult(cmd.Id, true, CommandResultStatus.Success, data, null, null);
            }

            if (dataResult == TokenType.InvalidCredentials)
            {
                _logger.LogError("Authentication failed even with password");
                return new SerialResult(cmd.Id, false, CommandResultStatus.AuthenticationFailed, 
                    data, null, null);
            }

            // Special case: the device responds only with ACK and doesn't send DataFrame.
            // For authentication commands (like V1 retransmitted with *0{password})
            // this should be considered success if no explicit error is received.
            if (dataResult == TokenType.Timeout)
            {
                _logger.LogInformation("Auth retry got ACK without data, treating as success");
                return new SerialResult(cmd.Id, true, CommandResultStatus.Success, string.Empty, null, null);
            }
        }

        return null; // Continue with normal retry
    }

    /// <summary>
    /// Validates if the response length matches any expected length.
    /// Supports:
    /// - Exact length: "128" → response.Length == 128
    /// - Length list: "128,256" → response.Length IN (128, 256)
    /// - SplitWith3Tabs: "-40" (negative) → Split(response, TAB).Length == 40
    /// </summary>
    /// <param name="response">Device response</param>
    /// <param name="expectedLengths">Array of expected lengths as strings</param>
    /// <returns>true if length is valid or no validation configured</returns>
    private bool IsValidResponse(string response, string[] expectedLengths)
    {
        if (string.IsNullOrEmpty(response) || expectedLengths.Length == 0)
        {
            return true; // No validation if no expected lengths
        }

        var responseLength = response.Length;
        
        foreach (var expectedLengthStr in expectedLengths)
        {
            if (int.TryParse(expectedLengthStr, out var expectedLength))
            {
                // Negative values = splitwith3tabs
                if (expectedLength < 0)
                {
                    var tabCount = Math.Abs(expectedLength);
                    var actualTabs = response.Split('\t').Length;
                    if (actualTabs == tabCount)
                    {
                        _logger.LogDebug("Response splitwith3tabs validated: {TabCount} tabs", actualTabs);
                        return true;
                    }
                }
                else if (responseLength == expectedLength)
                {
                    _logger.LogDebug("Response length validated: {Length} chars", responseLength);
                    return true;
                }
            }
            else
            {
                _logger.LogWarning("Invalid expected length format: {Value}", expectedLengthStr);
            }
        }

        return false;
    }

    /// <summary>
    /// Processes multipart command concatenating O1 and U1 with separator.
    /// Used for 5dm devices that return responses in two parts.
    /// </summary>
    /// <param name="ct">Cancellation token</param>
    /// <returns>Result with concatenated response O1 + TAB + U1</returns>
    private async Task<SerialResult> ProcessMultipartCommandAsync(CancellationToken ct)
    {
        _logger.LogInformation("Processing multipart command O1+U1");

        try
        {
            // Execute O1
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

            _logger.LogDebug("Executing O1 (part 1/2)");
            var o1Result = await EnqueueCommandAsync(o1Command);

            if (!o1Result.Success)
            {
                _logger.LogError("O1 command failed in multipart: {Status}", o1Result.Status);
                return o1Result;
            }

            // Execute U1
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

            _logger.LogDebug("Executing U1 (part 2/2)");
            var u1Result = await EnqueueCommandAsync(u1Command);

            if (!u1Result.Success)
            {
                _logger.LogError("U1 command failed in multipart: {Status}", u1Result.Status);
                return u1Result;
            }

            // Concatenate responses with \t\t\t separator 
            var combinedResponse = $"{o1Result.Data}\t\t\t{u1Result.Data}";
            
            _logger.LogInformation(
                "Multipart completed successfully. O1: {O1Len} chars, U1: {U1Len} chars, Total: {TotalLen} chars",
                o1Result.Data.Length, u1Result.Data.Length, combinedResponse.Length);

            // Return combined result
            return new SerialResult(
                Guid.NewGuid(),
                true,
                CommandResultStatus.Success,
                combinedResponse,
                null,
                null
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing multipart command");
            return new SerialResult(
                Guid.NewGuid(),
                false,
                CommandResultStatus.Error,
                string.Empty,
                ex,
                null
            );
        }
    }

    private async Task<bool> WaitForTokenAsync(TokenType type, TimeSpan timeout, CancellationToken ct)
    {
        var tcs = new TaskCompletionSource<bool>();
        using var timeoutCts = new CancellationTokenSource(timeout);
        using var combinedCts = CancellationTokenSource.CreateLinkedTokenSource(ct, timeoutCts.Token);

        void Handler(ProtocolToken token)
        {
            if (token.Type == type) 
                tcs.TrySetResult(true);
            else if (token.Type == TokenType.Nack) 
                tcs.TrySetResult(false);
        }

        TokenReceived += Handler;
        combinedCts.Token.Register(() => tcs.TrySetResult(false));

        try 
        { 
            return await tcs.Task; 
        }
        finally 
        { 
            TokenReceived -= Handler; 
        }
    }

    private async Task<(bool, string)> WaitForDataAsync(TimeSpan timeout, CancellationToken ct)
    {
        var tcs = new TaskCompletionSource<(bool, string)>();
        using var timeoutCts = new CancellationTokenSource(timeout);
        using var combinedCts = CancellationTokenSource.CreateLinkedTokenSource(ct, timeoutCts.Token);

        void Handler(ProtocolToken token)
        {
            if (token.Type == TokenType.DataFrame)
                tcs.TrySetResult((true, token.Data));
        }

        TokenReceived += Handler;
        combinedCts.Token.Register(() => tcs.TrySetResult((false, string.Empty)));

        try 
        { 
            return await tcs.Task; 
        }
        finally 
        { 
            TokenReceived -= Handler; 
        }
    }

    /// <summary>
    /// Waits for a token and returns its type along with the data.
    /// Mejorado para detectar INVALID CREDENTIALS.
    /// </summary>
    private async Task<(TokenType, string)> WaitForTokenWithTypeAsync(TimeSpan timeout, CancellationToken ct)
    {
        var tcs = new TaskCompletionSource<(TokenType, string)>();
        using var timeoutCts = new CancellationTokenSource(timeout);
        using var combinedCts = CancellationTokenSource.CreateLinkedTokenSource(ct, timeoutCts.Token);

        void Handler(ProtocolToken token)
        {
            tcs.TrySetResult((token.Type, token.Data));
        }

        TokenReceived += Handler;
        combinedCts.Token.Register(() => tcs.TrySetResult((TokenType.Timeout, string.Empty)));

        try 
        { 
            return await tcs.Task; 
        }
        finally 
        { 
            TokenReceived -= Handler; 
        }
    }

    /// <summary>
    /// Waits for data with INVALID CREDENTIALS detection.
    /// </summary>
    private async Task<(TokenType, string)> WaitForDataWithValidationAsync(TimeSpan timeout, CancellationToken ct)
    {
        var tcs = new TaskCompletionSource<(TokenType, string)>();
        using var timeoutCts = new CancellationTokenSource(timeout);
        using var combinedCts = CancellationTokenSource.CreateLinkedTokenSource(ct, timeoutCts.Token);

        void Handler(ProtocolToken token)
        {
            switch (token.Type)
            {
                case TokenType.DataFrame:
                    // Verify if contains INVALID CREDENTIALS
                    if (_validator.ContainsInvalidCredentials(token.Data))
                    {
                        tcs.TrySetResult((TokenType.InvalidCredentials, token.Data));
                    }
                    else
                    {
                        tcs.TrySetResult((TokenType.DataFrame, token.Data));
                    }
                    break;
                    
                case TokenType.InvalidCredentials:
                    tcs.TrySetResult((TokenType.InvalidCredentials, token.Data));
                    break;
                    
                case TokenType.Ack:
                    // ACK may come before data, don't complete yet
                    break;
                    
                case TokenType.Nack:
                    tcs.TrySetResult((TokenType.Nack, token.Data));
                    break;
                    
                default:
                    tcs.TrySetResult((token.Type, token.Data));
                    break;
            }
        }

        TokenReceived += Handler;
        combinedCts.Token.Register(() => tcs.TrySetResult((TokenType.Timeout, string.Empty)));

        try 
        { 
            return await tcs.Task; 
        }
        finally 
        { 
            TokenReceived -= Handler; 
        }
    }

    private void UpdateState(Guid id, CommandState state) =>
        CommandStateChanged?.Invoke(id, state);

    private void CompleteCommand(
        CommandContext ctx,
        CommandResultStatus status,
        string data = "",
        int bytesSent = 0,
        Exception? error = null)
    {
        ctx.RoundTripTimer.Stop();
        var cmd = ctx.Request.Command;

        var metrics = new SerialMetrics(
            bytesSent,
            Encoding.ASCII.GetByteCount(data),
            ctx.AckTimer.Elapsed.TotalMilliseconds > 0 ? ctx.AckTimer.Elapsed : null,
            ctx.RoundTripTimer.Elapsed,
            ctx.RetryCount
        );

        var result = new SerialResult(cmd.Id, status == CommandResultStatus.Success, status, data, error, metrics);
        ctx.Request.Tcs.SetResult(result);
        CommandCompleted?.Invoke(cmd.Id, result);
        UpdateState(cmd.Id, result.Success ? CommandState.Completed : CommandState.Failed);

        _logger.LogInformation(
            "Command {Id} {Status} RTT={Rtt}ms Retries={Retries}",
            cmd.Id, status, metrics.TotalRoundTripTime.TotalMilliseconds, ctx.RetryCount);
    }

    public void Dispose() => StopAsync().GetAwaiter().GetResult();
}

