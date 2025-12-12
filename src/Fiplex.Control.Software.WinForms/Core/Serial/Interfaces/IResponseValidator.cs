namespace Fiplex.Control.Software.WinForms.Core.Serial.Interfaces;

/// <summary>
/// Service for serial response validation.
/// </summary>
public interface IResponseValidator
{
    /// <summary>
    /// Validates whether the response meets the length specification.
    /// </summary>
    /// <param name="response">Device response</param>
    /// <param name="lengthSpec">Length specification (e.g.: "128", "128,256", "splitwith3tabs:40")</param>
    /// <returns>True if the response is valid</returns>
    bool ValidateLength(string response, string lengthSpec);
    
    /// <summary>
    /// Validates whether the response contains invalid credentials.
    /// </summary>
    bool ContainsInvalidCredentials(string response);
    
    /// <summary>
    /// Extracts error message if the response indicates an error.
    /// </summary>
    string? ExtractErrorMessage(string response);
}
