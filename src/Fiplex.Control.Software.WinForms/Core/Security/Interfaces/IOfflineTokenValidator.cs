namespace Fiplex.Control.Software.WinForms.Core.Security.Interfaces;

using Fiplex.Control.Software.WinForms.Models;

/// <summary>
/// Offline JWT token validator.
/// </summary>
public interface IOfflineTokenValidator
{
    /// <summary>
    /// Validates a token stored in a file.
    /// </summary>
    /// <param name="filename">Name of the token file to validate.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>True if the token is valid, False otherwise.</returns>
    Task<bool> ValidateTokenAsync(string filename, CancellationToken ct = default);

    /// <summary>
    /// Validates a JWT token with a provided public key.
    /// </summary>
    /// <param name="token">JWT token to validate.</param>
    /// <param name="publicKey">Base64 public key for signature validation.</param>
    /// <returns>Validation result with extracted claims.</returns>
    OfflineTokenValidationResult ValidateToken(string token, string publicKey);

    /// <summary>
    /// Validates the signature of a JWT token.
    /// </summary>
    /// <param name="token">JWT token to validate.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>True if the signature is valid.</returns>
    Task<bool> ValidateSignatureAsync(string token, CancellationToken ct = default);

    /// <summary>
    /// Checks if a token has expired.
    /// </summary>
    /// <param name="token">JWT token to verify.</param>
    /// <returns>True if the token has NOT expired (still valid).</returns>
    bool IsTokenNotExpired(string token);

    /// <summary>
    /// Extracts claims from a JWT token.
    /// </summary>
    /// <param name="token">JWT token to extract claims from.</param>
    /// <returns>TokenClaims with extracted information, or null if error.</returns>
    TokenClaims? ExtractClaims(string token);
}
