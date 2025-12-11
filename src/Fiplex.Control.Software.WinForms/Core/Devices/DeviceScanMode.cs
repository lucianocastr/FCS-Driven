namespace Fiplex.Control.Software.WinForms.Core.Devices;

/// <summary>
/// Define el modo de escaneo de dispositivos Fiplex.
/// </summary>
public enum DeviceScanMode
{
    /// <summary>
    /// Escaneo rápido: se detiene al encontrar el primer dispositivo válido.
    /// Ideal para la carga inicial del formulario.
    /// </summary>
    QuickScan,

    /// <summary>
    /// Escaneo completo: recorre todos los puertos COM disponibles.
    /// Usado cuando el usuario solicita identificar todos los dispositivos.
    /// </summary>
    FullScan
}
