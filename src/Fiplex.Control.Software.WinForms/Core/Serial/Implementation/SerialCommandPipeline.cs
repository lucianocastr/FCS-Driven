using System.Collections.Concurrent;
using System.Diagnostics;
using System.Text;
using Fiplex.Control.Software.WinForms.Core.Serial.Interfaces;
using Fiplex.Control.Software.WinForms.Core.Serial.Models;
using Fiplex.Control.Software.WinForms.Core.Security.Interfaces;
using Microsoft.Extensions.Logging;

namespace Fiplex.Control.Software.WinForms.Core.Serial.Implementation;

/// <summary>
/// Pipeline de comandos serial con procesamiento completo de respuestas.
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
    
    // Contraseña para reintento automático (INVALID CREDENTIALS)
    private string? _storedPassword;
    
    /// <summary>
    /// Indica si el parser está esperando LF (fin de trama).
    /// </summary>
    public bool IsWaitingLF => _parser.IsWaitingLF;
    
    /// <summary>
    /// Indica si el pipeline está esperando respuesta del dispositivo.
    /// </summary>
    public bool IsWaitingAnswer => _waitingAnswer;
    
    /// <summary>
    /// Indica si hay una respuesta pendiente de procesar.
    /// </summary>
    public bool IsPendingAnswer => _pendingAnswer;
    
    /// <summary>
    /// Longitud actual del buffer de recepción.
    /// </summary>
    public int BufferLength => _parser.BufferLength;

    public event Action<Guid, CommandState>? CommandStateChanged;
    public event Action<Guid, SerialResult>? CommandCompleted;
    public event Action<ProtocolToken>? TokenReceived;
    
    /// <summary>
    /// Evento cuando se detecta INVALID CREDENTIALS.
    /// Permite al llamador proporcionar contraseña para reintento.
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
    /// Establece la contraseña para reintentos automáticos con INVALID CREDENTIALS.
    /// </summary>
    public void SetStoredPassword(string password)
    {
        _storedPassword = password;
    }
    
    /// <summary>
    /// Limpia la contraseña almacenada.
    /// </summary>
    public void ClearStoredPassword()
    {
        _storedPassword = null;
    }
    
    /// <summary>
    /// Cancela todos los comandos pendientes en la cola.
    /// Se usa al cargar base.js y durante desconexión.
    /// </summary>
    public void CancelPendingCommands()
    {
        _logger.LogInformation("Cancelando todos los comandos pendientes");
        
        // Vaciar la cola y cancelar cada comando
        var cancelledCount = 0;
        while (_commandQueue.TryDequeue(out var request))
        {
            request.Tcs.TrySetCanceled();
            cancelledCount++;
        }
        
        // Cancelar comando en proceso si existe
        if (_currentCommandContext != null)
        {
            _currentCommandContext.Cts.Cancel();
            cancelledCount++;
        }
        
        // Reset estados
        _waitingAnswer = false;
        _pendingAnswer = false;
        
        _logger.LogInformation("Comandos pendientes cancelados: {Count}", cancelledCount);
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
                        // INVALID CREDENTIALS - Intentar con contraseña
                        var retriedResult = await HandleInvalidCredentialsAsync(ctx, cmd, bytesSent);
                        if (retriedResult != null)
                        {
                            ctx.Request.Tcs.SetResult(retriedResult);
                            return;
                        }
                        continue;
                    }

                    // NUEVO: Si recibimos DataFrame cuando esperábamos ACK, 
                    // el dispositivo respondió directamente sin ACK (comportamiento válido para algunos dispositivos)
                    if (ackResult == TokenType.DataFrame)
                    {
                        _logger.LogDebug("DataFrame recibido directamente sin ACK previo para {CmdId}", cmd.Id);
                        _pendingAnswer = false;
                        
                        // Validar longitud si es necesario
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

                    // VALIDACIÓN DE LONGITUD usando ResponseValidator
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
    /// Maneja respuesta INVALID CREDENTIALS reintentando con contraseña.
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

        // Intentar obtener contraseña
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

        // Construir comando con contraseña: "*0" + password + comando sin prefijo
        var cmdPayload = cmd.Payload;
        var authPayload = cmdPayload.Length >= 2 
            ? $"*0{password}{cmdPayload[2..]}"
            : $"*0{password}{cmdPayload}";

        _logger.LogInformation("Retrying command with authentication: {Original} -> {Auth}", 
            cmdPayload, authPayload.Length > 10 ? authPayload[..10] + "***" : "***");

        // Enviar comando autenticado
        var payload = Encoding.ASCII.GetBytes(authPayload + "\n");
        await _serialPort.WriteAsync(payload, ctx.Cts.Token);

        // Esperar respuesta
        if (cmd.ExpectsData)
        {
            var (dataResult, data) = await WaitForDataWithValidationAsync(cmd.DataTimeout, ctx.Cts.Token);

            if (dataResult == TokenType.DataFrame)
            {
                // Validar respuesta si hay especificación
                if (cmd.ExpectedLengths.Length > 0)
                {
                    var lengthSpec = string.Join(",", cmd.ExpectedLengths);
                    if (!_validator.ValidateLength(data, lengthSpec))
                    {
                        _logger.LogWarning("Auth retry response validation failed");
                        return null; // Continuar con retry normal
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

            // Caso especial: el dispositivo responde solo con ACK y no envía DataFrame.
            // Para comandos de autenticación (como V1 retransmitido con *0{password})
            // esto debe considerarse éxito si no se recibe un error explícito.
            if (dataResult == TokenType.Timeout)
            {
                _logger.LogInformation("Auth retry got ACK without data, treating as success");
                return new SerialResult(cmd.Id, true, CommandResultStatus.Success, string.Empty, null, null);
            }
        }

        return null; // Continuar con retry normal
    }

    /// <summary>
    /// Valida si la longitud de respuesta coincide con alguna longitud esperada.
    /// Soporta:
    /// - Longitud exacta: "128" → response.Length == 128
    /// - Lista de longitudes: "128,256" → response.Length IN (128, 256)
    /// - SplitWith3Tabs: "-40" (negativo) → Split(response, TAB).Length == 40
    /// </summary>
    /// <param name="response">Respuesta del dispositivo</param>
    /// <param name="expectedLengths">Array de longitudes esperadas como strings</param>
    /// <returns>true si la longitud es válida o no hay validación configurada</returns>
    private bool IsValidResponse(string response, string[] expectedLengths)
    {
        if (string.IsNullOrEmpty(response) || expectedLengths.Length == 0)
        {
            return true; // Sin validación si no hay longitudes esperadas
        }

        var responseLength = response.Length;
        
        foreach (var expectedLengthStr in expectedLengths)
        {
            if (int.TryParse(expectedLengthStr, out var expectedLength))
            {
                // Valores negativos = splitwith3tabs
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
    /// Procesa comando multipart concatenando O1 y U1 con separador.
    /// Usado para dispositivos 5dm que retornan respuestas en dos partes.
    /// </summary>
    /// <param name="ct">Token de cancelaci�n</param>
    /// <returns>Resultado con respuesta concatenada O1 + TAB + U1</returns>
    private async Task<SerialResult> ProcessMultipartCommandAsync(CancellationToken ct)
    {
        _logger.LogInformation("Procesando comando multipart O1+U1");

        try
        {
            // Ejecutar O1
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

            _logger.LogDebug("Ejecutando O1 (parte 1/2)");
            var o1Result = await EnqueueCommandAsync(o1Command);

            if (!o1Result.Success)
            {
                _logger.LogError("Comando O1 fall� en multipart: {Status}", o1Result.Status);
                return o1Result;
            }

            // Ejecutar U1
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

            _logger.LogDebug("Ejecutando U1 (parte 2/2)");
            var u1Result = await EnqueueCommandAsync(u1Command);

            if (!u1Result.Success)
            {
                _logger.LogError("Comando U1 fall� en multipart: {Status}", u1Result.Status);
                return u1Result;
            }

            // Concatenar respuestas con separador \t\t\t 
            var combinedResponse = $"{o1Result.Data}\t\t\t{u1Result.Data}";
            
            _logger.LogInformation(
                "Multipart completado exitosamente. O1: {O1Len} chars, U1: {U1Len} chars, Total: {TotalLen} chars",
                o1Result.Data.Length, u1Result.Data.Length, combinedResponse.Length);

            // Retornar resultado combinado
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
            _logger.LogError(ex, "Error procesando comando multipart");
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
    /// Espera un token y retorna su tipo junto con los datos.
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
    /// Espera datos con detección de INVALID CREDENTIALS.
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
                    // Verificar si contiene INVALID CREDENTIALS
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
                    // ACK puede venir antes de datos, no completar aún
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
