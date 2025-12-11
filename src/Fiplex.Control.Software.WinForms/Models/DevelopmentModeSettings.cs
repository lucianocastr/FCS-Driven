namespace Fiplex.Control.Software.WinForms.Models;

/// <summary>
/// Configuraci�n de modo desarrollo para testing sin hardware f�sico
/// </summary>
public class DevelopmentModeSettings
{
    /// <summary>
    /// Habilita modo desarrollo sin conexi�n USB/Serial f�sica
    /// Permite ejecutar y probar la aplicaci�n sin dispositivos conectados
    /// </summary>
    public bool NoUSB { get; set; } = false;

    /// <summary>
    /// Modelo de dispositivo a simular (2c1, 3d, 5dm, etc.)
    /// </summary>
    public string SimulatedDevice { get; set; } = "2c1";

    /// <summary>
    /// Puerto COM virtual (no se abre realmente)
    /// </summary>
    public string SimulatedComPort { get; set; } = "COM99";

    /// <summary>
    /// Directorio PathShared simulado (debe existir)
    /// </summary>
    public string SimulatedPathShared { get; set; } = "pages/htdocs_2c1";

    /// <summary>
    /// Habilita logging detallado
    /// </summary>
    public bool EnableLogging { get; set; } = true;
}
