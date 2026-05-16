namespace Fiplex.Control.Software.WinForms.Core.Serial.Interfaces;

/// <summary>
/// Abstraction for serial port communication with Fiplex devices.
/// </summary>
/// <remarks>
/// Provides async methods for opening, reading, and writing to serial ports.
/// Implementations include <c>SerialPortAdapter</c> for real hardware and <c>SimulatedSerialPort</c> for testing.
/// </remarks>
public interface ISerialPort : IDisposable
{
    /// <summary>
    /// Gets a value indicating whether the serial port is currently open.
    /// </summary>
    bool IsOpen { get; }

    /// <summary>
    /// Gets the number of bytes available to read from the receive buffer.
    /// </summary>
    int BytesToRead { get; }

    /// <summary>
    /// Opens the serial port with the specified settings.
    /// </summary>
    /// <param name="portName">The name of the serial port (e.g., "COM3").</param>
    /// <param name="baudRate">The baud rate (default: 9600).</param>
    /// <param name="ct">Cancellation token for the operation.</param>
    /// <returns><c>true</c> if the port was successfully opened; otherwise, <c>false</c>.</returns>
    Task<bool> OpenAsync(string portName, int baudRate = 9600, CancellationToken ct = default);

    /// <summary>
    /// Closes the serial port and releases resources.
    /// </summary>
    Task CloseAsync();

    /// <summary>
    /// Writes data to the serial port asynchronously.
    /// </summary>
    /// <param name="data">The data buffer to write.</param>
    /// <param name="ct">Cancellation token for the operation.</param>
    /// <returns>The number of bytes written.</returns>
    Task<int> WriteAsync(ReadOnlyMemory<byte> data, CancellationToken ct = default);

    /// <summary>
    /// Reads data from the serial port asynchronously.
    /// </summary>
    /// <param name="buffer">The buffer to read data into.</param>
    /// <param name="ct">Cancellation token for the operation.</param>
    /// <returns>The number of bytes read.</returns>
    Task<int> ReadAsync(Memory<byte> buffer, CancellationToken ct = default);

    /// <summary>
    /// Discards data in the receive buffer, resetting it to empty.
    /// Mirrors VB 1.9 FlushRS232() — called before each production command.
    /// </summary>
    void DiscardInBuffer();

    /// <summary>
    /// Event raised when a serial port error occurs.
    /// </summary>
    event Action<Exception>? ErrorOccurred;
}
