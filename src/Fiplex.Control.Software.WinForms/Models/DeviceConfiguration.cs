namespace Fiplex.Control.Software.WinForms.Models;

/// <summary>
/// Complete device configuration loaded from settings.cfg.
/// </summary>
/// <remarks>
/// <para>
/// Defines the mapping between HTTP requests and serial commands for each device type.
/// Each device has its own settings.cfg in the htdocs_* folder.
/// </para>
/// <para>
/// File format: METHOD|Page|Command|Encode[|AdditionalParams]
/// </para>
/// </remarks>
/// <example>
/// Settings.cfg content example:
/// <code>
/// GET|getVersion|V1|false
/// GET|getConfig|C1|true
/// POST|setConfig|C2|true|waitresponse
/// </code>
/// </example>
/// <seealso cref="IDeviceCommandRouter"/>
/// <seealso cref="GetCommand"/>
/// <seealso cref="PostCommand"/>
public class DeviceConfiguration
{
    /// <summary>
    /// List of HTTP GET commands mapped to serial commands.
    /// </summary>
    public List<GetCommand> GetCommands { get; set; } = new();

    /// <summary>
    /// List of HTTP POST commands mapped to serial commands.
    /// </summary>
    public List<PostCommand> PostCommands { get; set; } = new();

    /// <summary>
    /// List of commands for file operations (save/load configuration).
    /// </summary>
    public List<FileCommand> FileCommands { get; set; } = new();
}

/// <summary>
/// HTTP GET request to serial command mapping.
/// </summary>
public class GetCommand
{
    /// <summary>
    /// HTTP page name (e.g., "getVersion", "getStatus").
    /// </summary>
    public string Page { get; set; } = string.Empty;

    /// <summary>
    /// Serial command to execute (e.g., "V1", "S1").
    /// </summary>
    public string Command { get; set; } = string.Empty;

    /// <summary>
    /// Indicates whether the response should be encoded/decoded in hexadecimal.
    /// </summary>
    public bool Encode { get; set; }

    /// <summary>
    /// Expected URL parameters that will be concatenated to the command.
    /// </summary>
    public string[] UrlParameters { get; set; } = Array.Empty<string>();

    /// <summary>
    /// Expected response lengths for validation.
    /// </summary>
    public string[] ExpectedLengths { get; set; } = Array.Empty<string>();
}

/// <summary>
/// HTTP POST request to serial command mapping.
/// </summary>
public class PostCommand
{
    /// <summary>
    /// HTTP page name (e.g., "setConfig", "updateFirmware").
    /// </summary>
    public string Page { get; set; } = string.Empty;

    /// <summary>
    /// Serial command to execute with body data.
    /// </summary>
    public string Command { get; set; } = string.Empty;

    /// <summary>
    /// Indicates whether the command/response should be encoded/decoded in hexadecimal.
    /// </summary>
    public bool Encode { get; set; }

    /// <summary>
    /// Indicates whether to wait for a response from the device.
    /// </summary>
    public bool WaitResponse { get; set; }
    
    /// <summary>
    /// Indicates whether the POST body should be decoded from hex before concatenating to the command.
    /// </summary>
    /// <remarks>
    /// Derived from Encode: when Encode=true, the incoming body is also decoded.
    /// </remarks>
    public bool DecodeBody { get; set; }
    
    /// <summary>
    /// Number of initial body characters that are NOT decoded from hex.
    /// </summary>
    /// <remarks>
    /// Example: value 4 means the first 4 characters are kept without decoding.
    /// </remarks>
    public int NoDecodeChars { get; set; } = 0;
}

/// <summary>
/// Command for file operations (save/load configuration and calibration).
/// </summary>
public class FileCommand
{
    /// <summary>
    /// Operation type: SaveCFG, LoadCFG, SaveCAL, LoadCAL.
    /// </summary>
    public string OperationType { get; set; } = string.Empty;

    /// <summary>
    /// List of serial commands to execute in sequence.
    /// </summary>
    public string[] Commands { get; set; } = Array.Empty<string>();

    /// <summary>
    /// Expected response length for validation.
    /// </summary>
    /// <remarks>
    /// Supported formats: "splitwith3tabs:40", "128", "128,256".
    /// </remarks>
    public string LengthValidation { get; set; } = string.Empty;

    /// <summary>
    /// Descriptive message of the operation to display in the interface.
    /// </summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// Additional operation mode.
    /// </summary>
    public string Mode { get; set; } = string.Empty;
}
