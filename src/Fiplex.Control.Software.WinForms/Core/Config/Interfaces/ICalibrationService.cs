namespace Fiplex.Control.Software.WinForms.Core.Config.Interfaces;

/// <summary>
/// Provides methods for saving and loading device calibration data.
/// </summary>
/// <remarks>
/// Calibration data is stored as key-value pairs mapping serial commands to their values.
/// </remarks>
public interface ICalibrationService
{
    /// <summary>
    /// Saves device calibration data to a file by reading current values via serial commands.
    /// </summary>
    /// <param name="filePath">The path where the calibration file will be saved.</param>
    /// <param name="calibrationData">Dictionary mapping command names to their expected values.</param>
    /// <param name="ct">Cancellation token for the operation.</param>
    /// <returns><c>true</c> if all calibration values were successfully read and saved; otherwise, <c>false</c>.</returns>
    Task<bool> SaveCalibrationAsync(
        string filePath, 
        Dictionary<string, string> calibrationData, 
        CancellationToken ct = default);

    /// <summary>
    /// Loads calibration data from a previously saved calibration file.
    /// </summary>
    /// <param name="filePath">The path to the calibration file.</param>
    /// <param name="ct">Cancellation token for the operation.</param>
    /// <returns>Dictionary of command-value pairs read from the file; empty if file not found.</returns>
    Task<Dictionary<string, string>> LoadCalibrationAsync(
        string filePath, 
        CancellationToken ct = default);
}
