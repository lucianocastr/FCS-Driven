namespace Fiplex.Control.Software.WinForms.Core.Security.Interfaces;

/// <summary>
/// Generador de tokens offline desde backend.
/// </summary>
public interface IOfflineTokenGenerator
{
    /// <summary>
    /// Obtiene un token offline desde el backend.
    /// </summary>
    /// <param name="idToken">Token de identidad para autorización Bearer.</param>
    /// <param name="progress">Reporte de progreso (0-100).</param>
    /// <param name="ct">Token de cancelación.</param>
    /// <returns>Token offline como string.</returns>
    Task<string> GetOfflineTokenAsync(string idToken, IProgress<int>? progress = null, CancellationToken ct = default);

    /// <summary>
    /// Obtiene la clave pública desde el backend.
    /// </summary>
    /// <param name="progress">Reporte de progreso (0-100).</param>
    /// <param name="ct">Token de cancelación.</param>
    /// <returns>Clave pública como string Base64.</returns>
    Task<string> GetPublicKeyStringAsync(IProgress<int>? progress = null, CancellationToken ct = default);

    /// <summary>
    /// Obtiene tokens para llamadas cloud desde el backend.
    /// </summary>
    /// <param name="refreshToken">Token de refresco para autorización Bearer.</param>
    /// <param name="progress">Reporte de progreso (0-100).</param>
    /// <param name="ct">Token de cancelación.</param>
    /// <returns>Par de tokens: cloudCallAccessToken y refreshToken actualizado.</returns>
    Task<CloudCallTokenResult> GetCloudCallTokenAsync(string refreshToken, IProgress<int>? progress = null, CancellationToken ct = default);

    /// <summary>
    /// Obtiene un token válido renovando el actual.
    /// </summary>
    /// <param name="ct">Token de cancelación.</param>
    /// <returns>Access token renovado.</returns>
    Task<string> GetValidTokenAsync(CancellationToken ct = default);
}

/// <summary>
/// Resultado de obtención de token para llamadas cloud.
/// </summary>
public class CloudCallTokenResult
{
    /// <summary>
    /// Token de acceso para llamadas cloud.
    /// </summary>
    public string CloudCallAccessToken { get; set; } = string.Empty;

    /// <summary>
    /// Token de refresco actualizado.
    /// </summary>
    public string RefreshToken { get; set; } = string.Empty;
}
