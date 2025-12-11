namespace Fiplex.Control.Software.WinForms.Core.Security.Interfaces;

using Fiplex.Control.Software.WinForms.Models;

/// <summary>
/// Validador de tokens offline JWT.
/// </summary>
public interface IOfflineTokenValidator
{
    /// <summary>
    /// Valida un token almacenado en archivo.
    /// </summary>
    /// <param name="filename">Nombre del archivo de token a validar.</param>
    /// <param name="ct">Token de cancelación.</param>
    /// <returns>True si el token es válido, False en caso contrario.</returns>
    Task<bool> ValidateTokenAsync(string filename, CancellationToken ct = default);

    /// <summary>
    /// Valida un token JWT con una clave pública proporcionada.
    /// </summary>
    /// <param name="token">Token JWT a validar.</param>
    /// <param name="publicKey">Clave pública Base64 para validar firma.</param>
    /// <returns>Resultado de validación con claims extraídos.</returns>
    OfflineTokenValidationResult ValidateToken(string token, string publicKey);

    /// <summary>
    /// Valida la firma de un token JWT.
    /// </summary>
    /// <param name="token">Token JWT a validar.</param>
    /// <param name="ct">Token de cancelación.</param>
    /// <returns>True si la firma es válida.</returns>
    Task<bool> ValidateSignatureAsync(string token, CancellationToken ct = default);

    /// <summary>
    /// Verifica si un token ha expirado.
    /// </summary>
    /// <param name="token">Token JWT a verificar.</param>
    /// <returns>True si el token NO ha expirado (aún es válido).</returns>
    bool IsTokenNotExpired(string token);

    /// <summary>
    /// Extrae los claims de un token JWT.
    /// </summary>
    /// <param name="token">Token JWT del cual extraer claims.</param>
    /// <returns>TokenClaims con la información extraída, o null si hay error.</returns>
    TokenClaims? ExtractClaims(string token);
}
