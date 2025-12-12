using System.Net.Http.Headers;
using System.Text.Json;
using Fiplex.Control.Software.WinForms.Core.Security.Interfaces;
using Fiplex.Control.Software.WinForms.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Fiplex.Control.Software.WinForms.Core.Security;

/// <summary>
/// Offline token generator from backend.
/// Makes HTTP calls to obtain tokens from external services.
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
            _logger.LogWarning("OfflineApi endpoint not configured");
            return string.Empty;
        }

        progress?.Report(30);

        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, _endpoints.OfflineApi);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", idToken);

            _logger.LogDebug("Requesting offline token from: {Url}", _endpoints.OfflineApi);
            
            var response = await _httpClient.SendAsync(request, ct);
            
            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync(ct);
                _logger.LogError("Error getting offline token. Status: {Status}, Error: {Error}", 
                    response.StatusCode, errorContent);
                
                if (response.StatusCode == System.Net.HttpStatusCode.InternalServerError)
                {
                    throw new HttpRequestException("Unable to connect to server. Please try again later.");
                }
                
                throw new HttpRequestException($"Server error: {response.StatusCode}");
            }

            var offlineToken = await response.Content.ReadAsStringAsync(ct);
            
            progress?.Report(40);
            
            _logger.LogInformation("Offline token obtained successfully");
            return offlineToken;
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Network error getting offline token");
            throw;
        }
        catch (TaskCanceledException ex) when (ex.CancellationToken == ct)
        {
            _logger.LogWarning("Offline token request cancelled");
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error getting offline token");
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
            _logger.LogWarning("PublicKeyUrl endpoint not configured");
            return string.Empty;
        }

        progress?.Report(65);

        try
        {
            _logger.LogDebug("Requesting public key from: {Url}", _endpoints.PublicKeyUrl);
            
            var publicKeyString = await _httpClient.GetStringAsync(_endpoints.PublicKeyUrl, ct);
            
            progress?.Report(70);
            
            _logger.LogInformation("Public key obtained successfully");
            return publicKeyString;
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Error getting public key");
            throw new HttpRequestException($"Public Key Api Call failed: {ex.Message}", ex);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error getting public key");
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
            _logger.LogWarning("ClssCloudTokenUrl endpoint not configured");
            return new CloudCallTokenResult();
        }

        progress?.Report(80);

        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, _endpoints.ClssCloudTokenUrl);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", refreshToken);

            _logger.LogDebug("Requesting cloud call token from: {Url}", _endpoints.ClssCloudTokenUrl);
            
            var response = await _httpClient.SendAsync(request, ct);
            response.EnsureSuccessStatusCode();
            
            var responseString = await response.Content.ReadAsStringAsync(ct);
            var jsonResult = JsonSerializer.Deserialize<Dictionary<string, string>>(responseString);

            if (jsonResult == null)
            {
                _logger.LogWarning("Empty or invalid cloud call token response");
                return new CloudCallTokenResult();
            }

            var result = new CloudCallTokenResult
            {
                CloudCallAccessToken = jsonResult.GetValueOrDefault("accessToken") ?? string.Empty,
                RefreshToken = jsonResult.GetValueOrDefault("refreshToken") ?? string.Empty
            };

            progress?.Report(85);
            
            _logger.LogInformation("Cloud call token obtained successfully");
            return result;
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Error getting cloud call token");
            return new CloudCallTokenResult();
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "Error deserializing cloud call token response");
            return new CloudCallTokenResult();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error getting cloud call token");
            return new CloudCallTokenResult();
        }
    }

    /// <inheritdoc/>
    public async Task<string> GetValidTokenAsync(CancellationToken ct = default)
    {
        try
        {
            // Load stored refresh token
            var refreshToken = await _tokenManager.LoadOfflineTokenAsync(
                OfflineTokenManager.REFRESH_TOKEN_NAME, ct);

            if (string.IsNullOrEmpty(refreshToken))
            {
                _logger.LogWarning("No stored refresh token to renew");
                return string.Empty;
            }

            // Get new token
            var tokenResult = await GetCloudCallTokenAsync(refreshToken, null, ct);

            if (string.IsNullOrEmpty(tokenResult.CloudCallAccessToken))
            {
                _logger.LogWarning("Could not obtain a valid token");
                return string.Empty;
            }

            // Store updated tokens
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

            _logger.LogInformation("Token renewed and stored successfully");
            return tokenResult.CloudCallAccessToken;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error renewing token");
            return string.Empty;
        }
    }
}
