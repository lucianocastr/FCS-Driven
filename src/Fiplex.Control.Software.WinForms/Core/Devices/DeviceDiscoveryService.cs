using System.IO.Ports;
using System.Runtime.InteropServices;
using System.Text;
using Fiplex.Control.Software.WinForms.Core.Devices.Interfaces;
using Fiplex.Control.Software.WinForms.Core.Serial.Interfaces;
using Fiplex.Control.Software.WinForms.Core.Serial.Models;
using Fiplex.Control.Software.WinForms.Models;
using Microsoft.Extensions.Logging;

namespace Fiplex.Control.Software.WinForms.Core.Devices;

/// <summary>
/// Servicio de descubrimiento de dispositivos Fiplex en puertos COM.
/// 
/// Características implementadas:
/// - Escaneo COM1-COM255 con validación Win32
/// - Comando I1 de identificación
/// - Reintentos hasta 5 veces en caso de NACK
/// - Timeout de 3 segundos por puerto
/// - Validación de respuesta "Fiplex" con longitud >= 15
/// - Resolución de dispositivo desde catálogo
/// </summary>
public class DeviceDiscoveryService : IDeviceDiscoveryService
{
    private readonly ISerialPort _serialPort;
    private readonly ISerialCommandPipeline _pipeline;
    private readonly IDeviceCatalogService _catalog;
    private readonly ILogger<DeviceDiscoveryService> _logger;

    // Constantes de configuración de escaneo
    private const int MinPort = 1;
    private const int MaxPort = 255;
    private const int MaxRetries = 5;
    private const int TimeoutSeconds = 3;
    private const string IdentificationCommand = "I1";
    private const string ExpectedPrefix = "Fiplex";
    private const int MinResponseLength = 15;

    public DeviceDiscoveryService(
        ISerialPort serialPort,
        ISerialCommandPipeline pipeline,
        IDeviceCatalogService catalog,
        ILogger<DeviceDiscoveryService> logger)
    {
        _serialPort = serialPort ?? throw new ArgumentNullException(nameof(serialPort));
        _pipeline = pipeline ?? throw new ArgumentNullException(nameof(pipeline));
        _catalog = catalog ?? throw new ArgumentNullException(nameof(catalog));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<List<DeviceInfo>> ScanPortsAsync(
        DeviceScanMode mode = DeviceScanMode.FullScan,
        IProgress<ScanProgress>? progress = null,
        CancellationToken ct = default)
    {
        var foundDevices = new List<DeviceInfo>();
        var stopOnFirstDevice = mode == DeviceScanMode.QuickScan;

        _logger.LogInformation(
            "Starting device scan from COM{MinPort} to COM{MaxPort} (Mode: {Mode})",
            MinPort, MaxPort, mode);

        // Escanear todos los puertos COM
        for (int portNumber = MinPort; portNumber <= MaxPort; portNumber++)
        {
            ct.ThrowIfCancellationRequested();

            // Reportar progreso
            progress?.Report(new ScanProgress(
                CurrentPort: $"COM{portNumber}",
                Completed: portNumber - MinPort + 1,
                Total: MaxPort - MinPort + 1,
                DevicesFound: foundDevices.Count
            ));

            // Verificar disponibilidad del puerto
            if (!CheckComPort(portNumber))
            {
                _logger.LogTrace("COM{Port} not available at system level", portNumber);
                continue;
            }

            // Verificar si el puerto puede abrirse
            if (!ExistePort(portNumber))
            {
                _logger.LogTrace("COM{Port} cannot be opened (in use)", portNumber);
                continue;
            }

            // Intentar identificar dispositivo
            var device = await TryIdentifyDeviceAsync(portNumber, ct);
            if (device != null)
            {
                foundDevices.Add(device);
                _logger.LogInformation(
                    "Found device: {DeviceName} on COM{Port}",
                    device.NameTypeDevice,
                    device.ComPort);

                // QuickScan: detener al encontrar primer dispositivo
                if (stopOnFirstDevice)
                {
                    _logger.LogDebug("QuickScan mode: stopping after first device found");
                    break;
                }
            }
        }

        _logger.LogInformation("Scan complete: {Count} device(s) found", foundDevices.Count);
        return foundDevices;
    }

    /// <summary>
    /// Verifica disponibilidad de puerto a nivel Win32 usando CreateFile/CloseHandle.
    /// </summary>
    private bool CheckComPort(int portNumber)
    {
        try
        {
            const uint GENERIC_READ = 0x80000000;
            const uint GENERIC_WRITE = 0x40000000;
            const uint OPEN_EXISTING = 3;
            var INVALID_HANDLE_VALUE = new IntPtr(-1);

            var handle = NativeMethods.CreateFile(
                $"\\\\.\\COM{portNumber}",
                GENERIC_READ | GENERIC_WRITE,
                0,
                IntPtr.Zero,
                OPEN_EXISTING,
                0,
                IntPtr.Zero);

            if (handle == INVALID_HANDLE_VALUE)
            {
                return false;
            }

            NativeMethods.CloseHandle(handle);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogTrace(ex, "CheckComPort failed for COM{Port}", portNumber);
            return false;
        }
    }

    /// <summary>
    /// Verifica si el puerto puede abrirse intentándolo con SerialPort.
    /// </summary>
    private bool ExistePort(int portNumber)
    {
        try
        {
            using var port = new SerialPort($"COM{portNumber}");
            port.Open();
            port.Close();
            return true;
        }
        catch
        {
            return false;
        }
    }

    /// <summary>
    /// Intenta identificar dispositivo Fiplex en el puerto.
    /// Envía comando I1 y analiza la respuesta para detectar dispositivos Fiplex.
    /// </summary>
    private async Task<DeviceInfo?> TryIdentifyDeviceAsync(int portNumber, CancellationToken ct)
    {
        var portName = $"COM{portNumber}";

        // Reintentos hasta MaxRetries
        for (int retry = 0; retry < MaxRetries; retry++)
        {
            try
            {
                // Abrir puerto
                var opened = await _serialPort.OpenAsync(portName, baudRate: 9600, ct: ct);
                if (!opened)
                {
                    _logger.LogTrace("Failed to open {Port} on retry {Retry}", portName, retry);
                    return null;
                }

                // Espera de 10ms antes de enviar comando
                await Task.Delay(10, ct);

                // Enviar comando de identificación
                var command = new SerialCommand
                {
                    Payload = IdentificationCommand,
                    ExpectsAck = false,
                    ExpectsData = true,
                    MaxRetries = 1,
                    DataTimeout = TimeSpan.FromSeconds(TimeoutSeconds),
                    CancellationToken = ct
                };

                var result = await _pipeline.EnqueueCommandAsync(command);

                // Cerrar puerto
                await _serialPort.CloseAsync();

                var response = result.Data ?? string.Empty;

                _logger.LogTrace(
                    "{Port} retry {Retry}: response={Response}",
                    portName, retry, response);

                // Reintentar si respuesta es NACK
                if (response.Equals("NACK", StringComparison.OrdinalIgnoreCase))
                {
                    continue; // Reintentar
                }

                // Verificar longitud mínima de respuesta
                if (response.Length >= MinResponseLength)
                {
                    // Verificar si respuesta inicia con "Fiplex"
                    if (response.StartsWith(ExpectedPrefix, StringComparison.OrdinalIgnoreCase))
                    {
                        // Resolver tipo de dispositivo desde catálogo
                        var deviceInfo = _catalog.ResolveDevice(response);
                        if (deviceInfo != null)
                        {
                            return deviceInfo with { ComPort = portNumber };
                        }
                        else
                        {
                            _logger.LogWarning(
                                "Device on {Port} returned valid IDN but not in catalog: {Idn}",
                                portName, response);
                        }
                    }
                }

                // Respuesta no v�lida, no reintentar m�s
                break;
            }
            catch (OperationCanceledException)
            {
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogTrace(ex, "Error identifying device on {Port} retry {Retry}", portName, retry);

                // Asegurar cierre del puerto
                try
                {
                    if (_serialPort.IsOpen)
                    {
                        await _serialPort.CloseAsync();
                    }
                }
                catch { }
            }
        }

        return null;
    }

    /// <summary>
    /// M�todos nativos de Win32 para validaci�n de puertos
    /// </summary>
    private static class NativeMethods
    {
        [DllImport("kernel32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        public static extern IntPtr CreateFile(
            string lpFileName,
            uint dwDesiredAccess,
            uint dwShareMode,
            IntPtr lpSecurityAttributes,
            uint dwCreationDisposition,
            uint dwFlagsAndAttributes,
            IntPtr hTemplateFile);

        [DllImport("kernel32.dll", SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        public static extern bool CloseHandle(IntPtr hObject);
    }
}
