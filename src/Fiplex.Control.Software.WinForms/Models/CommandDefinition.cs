namespace Fiplex.Control.Software.WinForms.Models;

/// <summary>
/// Command definition parsed from settings.cfg.
/// </summary>
/// <remarks>
/// Represents an HTTP to Serial mapping with validation metadata.
/// </remarks>
/// <param name="Page">HTTP page name.</param>
/// <param name="Command">Serial command to execute.</param>
/// <param name="RequiresEncoding">Indicates if hexadecimal encoding is required.</param>
/// <param name="LengthValidation">Length validation string.</param>
/// <param name="Message">Descriptive message for the command.</param>
public record CommandDefinition(
    string Page,
    string Command,
    bool RequiresEncoding,
    string LengthValidation,
    string Message
)
{
    /// <summary>
    /// HTTP method (GET, POST, FILE) inferred from context.
    /// </summary>
    public string HttpMethod { get; init; } = "GET";
    
    /// <summary>
    /// Expected response length (parsed from LengthValidation).
    /// </summary>
    /// <remarks>
    /// -1 indicates variable length. Negative values indicate splitwith3tabs format.
    /// </remarks>
    public int ExpectedLength { get; init; } = -1;
    
    /// <summary>
    /// Indicates if the response uses hexadecimal encoding.
    /// </summary>
    public bool HexEncoding { get; init; } = false;
    
    /// <summary>
    /// For POST commands: indicates whether to wait for device response.
    /// </summary>
    public bool WaitResponse { get; init; } = true;
    
    /// <summary>
    /// Number of initial characters that should not be hex-encoded.
    /// </summary>
    public string NoEncodeParams { get; init; } = string.Empty;
    
    /// <summary>
    /// Expected URL parameters separated by comma.
    /// </summary>
    public string UrlParameters { get; init; } = string.Empty;
    
    /// <summary>
    /// File mode for FILE commands (SaveCFG, LoadCFG, etc.)
    /// </summary>
    public string FileMode { get; init; } = string.Empty;
}
