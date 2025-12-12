using Fiplex.Control.Software.WinForms.Models;
using Microsoft.Extensions.Logging;

namespace Fiplex.Control.Software.WinForms.Core.Config;

/// <summary>
/// Validates serial command responses against expected formats and lengths.
/// </summary>
/// <remarks>
/// Supports validation expressions like ">=10", "<=50", "==20", or exact numeric lengths.
/// </remarks>
public class CommandValidator
{
    private readonly ILogger<CommandValidator> _logger;

    public CommandValidator(ILogger<CommandValidator> logger) 
        => _logger = logger;

    public bool ValidateResponse(CommandDefinition definition, string response)
    {
        if (string.IsNullOrEmpty(response))
        {
            _logger.LogWarning("Empty response for {Command}", definition.Command);
            return false;
        }

        // Validate length according to LengthValidation
        if (!string.IsNullOrEmpty(definition.LengthValidation))
        {
            if (!ValidateLength(response, definition.LengthValidation))
            {
                _logger.LogWarning(
                    "Length validation failed for {Command}: expected {Validation}, got {Length}",
                    definition.Command,
                    definition.LengthValidation,
                    response.Length);
                return false;
            }
        }

        return true;
    }

    private bool ValidateLength(string response, string validation)
    {
        var length = response.Length;

        if (validation.StartsWith(">="))
        {
            return int.TryParse(validation.Substring(2), out var min) && length >= min;
        }
        else if (validation.StartsWith("<="))
        {
            return int.TryParse(validation.Substring(2), out var max) && length <= max;
        }
        else if (validation.StartsWith("=="))
        {
            return int.TryParse(validation.Substring(2), out var exact) && length == exact;
        }
        else if (int.TryParse(validation, out var exactLen))
        {
            return length == exactLen;
        }

        return true;
    }
}
