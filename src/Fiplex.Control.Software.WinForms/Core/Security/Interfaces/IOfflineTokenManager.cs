namespace Fiplex.Control.Software.WinForms.Core.Security.Interfaces;

/// <summary>
/// Gestor de tokens offline para persistencia local.
/// </summary>
public interface IOfflineTokenManager
{
    /// <summary>
    /// Almacena un token en archivo local.
    /// </summary>
    /// <param name="tokenValue">Valor del token a almacenar.</param>
    /// <param name="fileName">Nombre del archivo (ej: "offline.token").</param>
    /// <returns>True si se almacenó correctamente.</returns>
    Task<bool> StoreOfflineTokenAsync(string tokenValue, string fileName, CancellationToken ct = default);

    /// <summary>
    /// Carga un token desde archivo local.
    /// </summary>
    /// <param name="fileName">Nombre del archivo a leer.</param>
    /// <returns>Contenido del token o null si no existe.</returns>
    Task<string?> LoadOfflineTokenAsync(string fileName, CancellationToken ct = default);

    /// <summary>
    /// Verifica si existe un archivo de token.
    /// </summary>
    /// <param name="fileName">Nombre del archivo a verificar.</param>
    /// <returns>True si el archivo existe.</returns>
    bool TokenFileExists(string fileName);

    /// <summary>
    /// Elimina un archivo de token.
    /// </summary>
    /// <param name="fileName">Nombre del archivo a eliminar.</param>
    /// <returns>True si se eliminó correctamente.</returns>
    bool DeleteTokenFile(string fileName);

    /// <summary>
    /// Elimina todos los archivos de tokens.
    /// </summary>
    void ClearAllTokens();
}
