namespace Fiplex.Control.Software.WinForms.Utilities.Extensions;

using Fiplex.Control.Software.WinForms.Forms;

/// <summary>
/// Extensiones para formularios WinForms.
/// </summary>
public static class FormExtensions
{
    /// <summary>
    /// Cierra y dispone el formulario de forma segura.
    /// </summary>
    /// <remarks>
    /// Este método es thread-safe y maneja casos donde el formulario
    /// ya fue cerrado o dispuesto.
    /// 
    /// Para frmMessage, usa CloseProgress() que permite el cierre programático.
    /// </remarks>
    /// <param name="form">El formulario a cerrar y disponer.</param>
    public static void TryUnload(this Form? form)
    {
        if (form == null || form.IsDisposed)
            return;

        try
        {
            if (form.InvokeRequired)
            {
                form.Invoke(() => form.TryUnload());
                return;
            }

            // Manejo especial para frmMessage que bloquea cierre de usuario
            if (form is frmMessage messageForm)
            {
                messageForm.CloseProgress();
                return;
            }

            form.Close();
            form.Dispose();
        }
        catch (ObjectDisposedException)
        {
            // Formulario ya dispuesto - ignorar
        }
        catch (InvalidOperationException)
        {
            // Handle no válido - ignorar
        }
    }

    /// <summary>
    /// Intenta cerrar el formulario sin disparar evento FormClosing.
    /// Útil para formularios que bloquean cierre por usuario.
    /// </summary>
    /// <param name="form">El formulario a forzar cierre.</param>
    public static void ForceClose(this Form? form)
    {
        if (form == null || form.IsDisposed)
            return;

        try
        {
            if (form.InvokeRequired)
            {
                form.Invoke(() => form.ForceClose());
                return;
            }

            // Usar Hide + Dispose en lugar de Close para evitar FormClosing
            form.Hide();
            form.Dispose();
        }
        catch (ObjectDisposedException)
        {
            // Ya dispuesto
        }
        catch (InvalidOperationException)
        {
            // Handle no válido
        }
    }

    /// <summary>
    /// Muestra el formulario de forma thread-safe.
    /// </summary>
    /// <param name="form">El formulario a mostrar.</param>
    public static void SafeShow(this Form? form)
    {
        if (form == null || form.IsDisposed)
            return;

        try
        {
            if (form.InvokeRequired)
            {
                form.Invoke(() => form.SafeShow());
                return;
            }

            form.Show();
        }
        catch (ObjectDisposedException)
        {
            // Ya dispuesto
        }
        catch (InvalidOperationException)
        {
            // Handle no válido
        }
    }

    /// <summary>
    /// Oculta el formulario de forma thread-safe.
    /// </summary>
    /// <param name="form">El formulario a ocultar.</param>
    public static void SafeHide(this Form? form)
    {
        if (form == null || form.IsDisposed)
            return;

        try
        {
            if (form.InvokeRequired)
            {
                form.Invoke(() => form.SafeHide());
                return;
            }

            form.Hide();
        }
        catch (ObjectDisposedException)
        {
            // Ya dispuesto
        }
        catch (InvalidOperationException)
        {
            // Handle no válido
        }
    }
}
