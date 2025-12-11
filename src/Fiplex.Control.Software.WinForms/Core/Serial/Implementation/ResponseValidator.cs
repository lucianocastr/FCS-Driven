using Fiplex.Control.Software.WinForms.Core.Serial.Interfaces;
using Microsoft.Extensions.Logging;

namespace Fiplex.Control.Software.WinForms.Core.Serial.Implementation;

/// <summary>
/// Implementación de validación de respuestas serial.
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
    /// Valida si la respuesta cumple con la especificación de longitud.
    /// </summary>
    /// <remarks>
    /// Formatos soportados:
    /// 1. Número exacto: "128" → len(answer) = 128
    /// 2. Lista comas: "128,256,512" → len(answer) IN (128,256,512)
    /// 3. SplitWith3Tabs: "splitwith3tabs:4" → Split(answer, vbTab).Length = 4
    /// 4. Vacío: "" → siempre True (sin validación)
    /// </remarks>
    public bool ValidateLength(string response, string lengthSpec)
    {
        // Sin especificación = sin validación
        if (string.IsNullOrWhiteSpace(lengthSpec))
        {
            _logger.LogDebug("No length validation specified, accepting response");
            return true;
        }

        // Respuesta nula o vacía
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
        
        // Formato: lista de números separados por comas
        return ValidateNumericLengths(response, lengthSpec);
    }

    /// <summary>
    /// Valida formato splitwith3tabs:N
    /// </summary>
    private bool ValidateSplitWith3Tabs(string response, string spec)
    {
        var expectedCountStr = spec.Substring(SplitWith3TabsPrefix.Length);
        
        if (!int.TryParse(expectedCountStr, out var expectedCount))
        {
            _logger.LogWarning("Invalid splitwith3tabs format: {Spec}", spec);
            return false;
        }
        
        // Separar por tab (\t)
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
    /// Valida formato numérico: "128" o "128,256,512"
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
    /// Valida si la respuesta contiene credenciales inválidas.
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
    /// Extrae mensaje de error si la respuesta indica un error.
    /// </summary>
    public string? ExtractErrorMessage(string response)
    {
        if (string.IsNullOrEmpty(response))
            return null;
            
        // Buscar marcadores de error conocidos
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
