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
    /// Lista de comandos GET HTTP mapeados a comandos seriales.
    /// </summary>
    public List<GetCommand> GetCommands { get; set; } = new();

    /// <summary>
    /// Lista de comandos POST HTTP mapeados a comandos seriales.
    /// </summary>
    public List<PostCommand> PostCommands { get; set; } = new();

    /// <summary>
    /// Lista de comandos para operaciones de archivo (guardar/cargar configuración).
    /// </summary>
    public List<FileCommand> FileCommands { get; set; } = new();
}

/// <summary>
/// Mapeo de petición HTTP GET a comando serial.
/// </summary>
public class GetCommand
{
    /// <summary>
    /// Nombre de la página HTTP (ej: "getVersion", "getStatus").
    /// </summary>
    public string Page { get; set; } = string.Empty;

    /// <summary>
    /// Comando serial a ejecutar (ej: "V1", "S1").
    /// </summary>
    public string Command { get; set; } = string.Empty;

    /// <summary>
    /// Indica si la respuesta debe codificarse/decodificarse en hexadecimal.
    /// </summary>
    public bool Encode { get; set; }

    /// <summary>
    /// Parámetros URL esperados que se concatenarán al comando.
    /// </summary>
    public string[] UrlParameters { get; set; } = Array.Empty<string>();

    /// <summary>
    /// Longitudes esperadas de respuesta para validación.
    /// </summary>
    public string[] ExpectedLengths { get; set; } = Array.Empty<string>();
}

/// <summary>
/// Mapeo de petición HTTP POST a comando serial.
/// </summary>
public class PostCommand
{
    /// <summary>
    /// Nombre de la página HTTP (ej: "setConfig", "updateFirmware").
    /// </summary>
    public string Page { get; set; } = string.Empty;

    /// <summary>
    /// Comando serial a ejecutar con datos del body.
    /// </summary>
    public string Command { get; set; } = string.Empty;

    /// <summary>
    /// Indica si el comando/respuesta debe codificarse/decodificarse en hexadecimal.
    /// </summary>
    public bool Encode { get; set; }

    /// <summary>
    /// Indica si se debe esperar respuesta del dispositivo.
    /// </summary>
    public bool WaitResponse { get; set; }
    
    /// <summary>
    /// Indica si el body del POST debe decodificarse de hex antes de concatenar al comando.
    /// </summary>
    /// <remarks>
    /// Se deriva de Encode: cuando Encode=true, también se decodifica el body entrante.
    /// </remarks>
    public bool DecodeBody { get; set; }
    
    /// <summary>
    /// Número de caracteres iniciales del body que NO se decodifican de hex.
    /// </summary>
    /// <remarks>
    /// Ejemplo: valor 4 significa que los primeros 4 caracteres se mantienen sin decodificar.
    /// </remarks>
    public int NoDecodeChars { get; set; } = 0;
}

/// <summary>
/// Comando para operaciones de archivo (guardar/cargar configuración y calibración).
/// </summary>
public class FileCommand
{
    /// <summary>
    /// Tipo de operación: SaveCFG, LoadCFG, SaveCAL, LoadCAL.
    /// </summary>
    public string OperationType { get; set; } = string.Empty;

    /// <summary>
    /// Lista de comandos seriales a ejecutar en secuencia.
    /// </summary>
    public string[] Commands { get; set; } = Array.Empty<string>();

    /// <summary>
    /// Longitud esperada de respuesta para validación.
    /// </summary>
    /// <remarks>
    /// Formatos soportados: "splitwith3tabs:40", "128", "128,256".
    /// </remarks>
    public string LengthValidation { get; set; } = string.Empty;

    /// <summary>
    /// Mensaje descriptivo de la operación a mostrar en la interfaz.
    /// </summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// Modo adicional de operación.
    /// </summary>
    public string Mode { get; set; } = string.Empty;
}
