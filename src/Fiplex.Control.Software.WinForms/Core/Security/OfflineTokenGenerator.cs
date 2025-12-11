using System.Net.Http.Headers;
using System.Text.Json;
using Fiplex.Control.Software.WinForms.Core.Security.Interfaces;
using Fiplex.Control.Software.WinForms.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Fiplex.Control.Software.WinForms.Core.Security;

/// <summary>
/// Generador de tokens offline desde backend.
/// Realiza llamadas HTTP para obtener tokens de servicios externos.
/// </summary>
public class OfflineTokenGenerator : IOfflineTokenGenerator
{
    private readonly HttpClient _httpClient;
    private readonly IOfflineTokenManager _tokenManager;
    private readonly ApiEndpoints _endpoints;
    private readonly ILogger<OfflineTokenGenerator> _logger;

    public OfflineTokenGenerator(
        HttpClient httpClient,
        IOfflineTokenManager tokenManager,
        IOptions<ApiEndpoints> endpoints,
        ILogger<OfflineTokenGenerator> logger)
    {
        _httpClient = httpClient;
        _tokenManager = tokenManager;
        _endpoints = endpoints.Value;
        _logger = logger;
    }

    /// <inheritdoc/>
    public async Task<string> GetOfflineTokenAsync(
        string idToken, 
        IProgress<int>? progress = null, 
        CancellationToken ct = default)
    {
        if (string.IsNullOrEmpty(_endpoints.OfflineApi))
        {
            _logger.LogWarning("OfflineApi endpoint no configurado");
            return string.Empty;
        }

        progress?.Report(30);

        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, _endpoints.OfflineApi);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", idToken);

            _logger.LogDebug("Solicitando offline token desde: {Url}", _endpoints.OfflineApi);
            
            var response = await _httpClient.SendAsync(request, ct);
            
            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync(ct);
                _logger.LogError("Error obteniendo offline token. Status: {Status}, Error: {Error}", 
                    response.StatusCode, errorContent);
                
                if (response.StatusCode == System.Net.HttpStatusCode.InternalServerError)
                {
                    throw new HttpRequestException("Unable to connect to server. Please try again later.");
                }
                
                throw new HttpRequestException($"Error del servidor: {response.StatusCode}");
            }

            var offlineToken = await response.Content.ReadAsStringAsync(ct);
            
            progress?.Report(40);
            
            _logger.LogInformation("Offline token obtenido exitosamente");
            return offlineToken;
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Error de red obteniendo offline token");
            throw;
        }
        catch (TaskCanceledException ex) when (ex.CancellationToken == ct)
        {
            _logger.LogWarning("Solicitud de offline token cancelada");
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error inesperado obteniendo offline token");
            throw new HttpRequestException("Internal server error. Please try again later.", ex);
        }
    }

    /// <inheritdoc/>
    public async Task<string> GetPublicKeyStringAsync(
        IProgress<int>? progress = null, 
        CancellationToken ct = default)
    {
        if (string.IsNullOrEmpty(_endpoints.PublicKeyUrl))
        {
            _logger.LogWarning("PublicKeyUrl endpoint no configurado");
            return string.Empty;
        }

        progress?.Report(65);

        try
        {
            _logger.LogDebug("Solicitando clave pública desde: {Url}", _endpoints.PublicKeyUrl);
            
            var publicKeyString = await _httpClient.GetStringAsync(_endpoints.PublicKeyUrl, ct);
            
            progress?.Report(70);
            
            _logger.LogInformation("Clave pública obtenida exitosamente");
            return publicKeyString;
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Error obteniendo clave pública");
            throw new HttpRequestException($"Public Key Api Call failed: {ex.Message}", ex);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error inesperado obteniendo clave pública");
            throw;
        }
    }

    /// <inheritdoc/>
    public async Task<CloudCallTokenResult> GetCloudCallTokenAsync(
        string refreshToken, 
        IProgress<int>? progress = null, 
        CancellationToken ct = default)
    {
        if (string.IsNullOrEmpty(_endpoints.ClssCloudTokenUrl))
        {
            _logger.LogWarning("ClssCloudTokenUrl endpoint no configurado");
            return new CloudCallTokenResult();
        }

        progress?.Report(80);

        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, _endpoints.ClssCloudTokenUrl);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", refreshToken);

            _logger.LogDebug("Solicitando cloud call token desde: {Url}", _endpoints.ClssCloudTokenUrl);
            
            var response = await _httpClient.SendAsync(request, ct);
            response.EnsureSuccessStatusCode();
            
            var responseString = await response.Content.ReadAsStringAsync(ct);
            var jsonResult = JsonSerializer.Deserialize<Dictionary<string, string>>(responseString);

            if (jsonResult == null)
            {
                _logger.LogWarning("Respuesta de cloud call token vacía o inválida");
                return new CloudCallTokenResult();
            }

            var result = new CloudCallTokenResult
            {
                CloudCallAccessToken = jsonResult.GetValueOrDefault("accessToken") ?? string.Empty,
                RefreshToken = jsonResult.GetValueOrDefault("refreshToken") ?? string.Empty
            };

            progress?.Report(85);
            
            _logger.LogInformation("Cloud call token obtenido exitosamente");
            return result;
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Error obteniendo cloud call token");
            return new CloudCallTokenResult();
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "Error deserializando respuesta de cloud call token");
            return new CloudCallTokenResult();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error inesperado obteniendo cloud call token");
            return new CloudCallTokenResult();
        }
    }

    /// <inheritdoc/>
    public async Task<string> GetValidTokenAsync(CancellationToken ct = default)
    {
        try
        {
            // Cargar refresh token almacenado
            var refreshToken = await _tokenManager.LoadOfflineTokenAsync(
                OfflineTokenManager.REFRESH_TOKEN_NAME, ct);

            if (string.IsNullOrEmpty(refreshToken))
            {
                _logger.LogWarning("No hay refresh token almacenado para renovar");
                return string.Empty;
            }

            // Obtener nuevo token
            var tokenResult = await GetCloudCallTokenAsync(refreshToken, null, ct);

            if (string.IsNullOrEmpty(tokenResult.CloudCallAccessToken))
            {
                _logger.LogWarning("No se pudo obtener un token válido");
                return string.Empty;
            }

            // Almacenar tokens actualizados
            if (!string.IsNullOrEmpty(tokenResult.RefreshToken))
            {
                await _tokenManager.StoreOfflineTokenAsync(
                    tokenResult.RefreshToken, 
                    OfflineTokenManager.REFRESH_TOKEN_NAME, 
                    ct);
            }

            await _tokenManager.StoreOfflineTokenAsync(
                tokenResult.CloudCallAccessToken, 
                OfflineTokenManager.CLOUD_CALL_TOKEN_NAME, 
                ct);

            _logger.LogInformation("Token renovado y almacenado exitosamente");
            return tokenResult.CloudCallAccessToken;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error renovando token");
            return string.Empty;
        }
    }
}
