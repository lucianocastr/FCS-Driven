using Fiplex.Control.Software.WinForms.Core.Serial.Interfaces;
using Microsoft.Extensions.Logging;

namespace Fiplex.Control.Software.WinForms.Core.Serial.Implementation;

/// <summary>
/// Serial response validation implementation.
/// </summary>
public class ResponseValidator : IResponseValidator
{
    private readonly ILogger<ResponseValidator> _logger;
    
    // Marcadores de error conocidos
    private const string InvalidCredentialsMarker = "INVALID CREDENTIALS";
    private const string ErrorMarker = "ERROR";
    private const string SplitWith3TabsPrefix = "splitwith3tabs:";

    public ResponseValidator(ILogger<ResponseValidator> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Validates if the response meets the length specification.
    /// </summary>
    /// <remarks>
    /// Supported formats:
    /// 1. Exact number: "128" → len(answer) = 128
    /// 2. Comma list: "128,256,512" → len(answer) IN (128,256,512)
    /// 3. SplitWith3Tabs: "splitwith3tabs:4" → Split(answer, vbTab).Length = 4
    /// 4. Empty: "" → always True (no validation)
    /// </remarks>
    public bool ValidateLength(string response, string lengthSpec)
    {
        // No specification = no validation
        if (string.IsNullOrWhiteSpace(lengthSpec))
        {
            _logger.LogDebug("No length validation specified, accepting response");
            return true;
        }

        // Null or empty response
        if (string.IsNullOrEmpty(response))
        {
            _logger.LogWarning("Empty response, validation failed");
            return false;
        }

        var spec = lengthSpec.Trim().ToLowerInvariant();
        
        // Formato: splitwith3tabs:N
        if (spec.StartsWith(SplitWith3TabsPrefix))
        {
            return ValidateSplitWith3Tabs(response, spec);
        }
        
        // Format: comma-separated list of numbers
        return ValidateNumericLengths(response, lengthSpec);
    }

    /// <summary>
    /// Validates splitwith3tabs:N format.
    /// </summary>
    private bool ValidateSplitWith3Tabs(string response, string spec)
    {
        var expectedCountStr = spec.Substring(SplitWith3TabsPrefix.Length);
        
        if (!int.TryParse(expectedCountStr, out var expectedCount))
        {
            _logger.LogWarning("Invalid splitwith3tabs format: {Spec}", spec);
            return false;
        }
        
        // Split by tab (\t)
        var parts = response.Split('\t');
        var actualCount = parts.Length;
        
        var isValid = actualCount == expectedCount;
        
        if (isValid)
        {
            _logger.LogDebug("SplitWith3Tabs validation passed: {Actual} = {Expected} parts", 
                actualCount, expectedCount);
        }
        else
        {
            _logger.LogWarning("SplitWith3Tabs validation failed: {Actual} != {Expected} parts", 
                actualCount, expectedCount);
        }
        
        return isValid;
    }

    /// <summary>
    /// Validates numeric format: "128" or "128,256,512".
    /// </summary>
    private bool ValidateNumericLengths(string response, string lengthSpec)
    {
        var responseLength = response.Length;
        var validLengths = lengthSpec.Split(',', StringSplitOptions.RemoveEmptyEntries);
        
        foreach (var lengthStr in validLengths)
        {
            if (int.TryParse(lengthStr.Trim(), out var expectedLength))
            {
                if (responseLength == expectedLength)
                {
                    _logger.LogDebug("Length validation passed: {Actual} = {Expected} chars", 
                        responseLength, expectedLength);
                    return true;
                }
            }
            else
            {
                _logger.LogWarning("Invalid length format in spec: {Value}", lengthStr);
            }
        }
        
        _logger.LogWarning("Length validation failed: {Actual} chars not in [{Expected}]", 
            responseLength, lengthSpec);
        return false;
    }

    /// <summary>
    /// Validates if the response contains invalid credentials.
    /// </summary>
    public bool ContainsInvalidCredentials(string response)
    {
        if (string.IsNullOrEmpty(response))
            return false;
            
        var contains = response.Contains(InvalidCredentialsMarker, StringComparison.OrdinalIgnoreCase);
        
        if (contains)
        {
            _logger.LogWarning("Response contains INVALID CREDENTIALS");
        }
        
        return contains;
    }

    /// <summary>
    /// Extracts error message if the response indicates an error.
    /// </summary>
    public string? ExtractErrorMessage(string response)
    {
        if (string.IsNullOrEmpty(response))
            return null;
            
        // Search for known error markers
        if (response.Contains(InvalidCredentialsMarker, StringComparison.OrdinalIgnoreCase))
        {
            return "Authentication required - Invalid credentials";
        }
        
        if (response.StartsWith(ErrorMarker, StringComparison.OrdinalIgnoreCase))
        {
            // Formato: "ERROR: mensaje" o similar
            var colonIndex = response.IndexOf(':');
            if (colonIndex > 0 && colonIndex < response.Length - 1)
            {
                return response.Substring(colonIndex + 1).Trim();
            }
            return response;
        }
        
        return null;
    }
}
