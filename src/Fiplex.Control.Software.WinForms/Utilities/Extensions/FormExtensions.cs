namespace Fiplex.Control.Software.WinForms.Utilities.Extensions;

using Fiplex.Control.Software.WinForms.Forms;

/// <summary>
/// Extensions for WinForms forms.
/// </summary>
public static class FormExtensions
{
    /// <summary>
    /// Closes and disposes the form safely.
    /// </summary>
    /// <remarks>
    /// This method is thread-safe and handles cases where the form
    /// was already closed or disposed.
    /// 
    /// For frmMessage, uses CloseProgress() which allows programmatic closing.
    /// </remarks>
    /// <param name="form">The form to close and dispose.</param>
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

            // Special handling for frmMessage which blocks user closing
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
            // Form already disposed - ignore
        }
        catch (InvalidOperationException)
        {
            // Invalid handle - ignore
        }
    }

    /// <summary>
    /// Attempts to close the form without triggering FormClosing event.
    /// Useful for forms that block user closing.
    /// </summary>
    /// <param name="form">The form to force close.</param>
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

            // Use Hide + Dispose instead of Close to avoid FormClosing
            form.Hide();
            form.Dispose();
        }
        catch (ObjectDisposedException)
        {
            // Already disposed
        }
        catch (InvalidOperationException)
        {
            // Invalid handle
        }
    }

    /// <summary>
    /// Shows the form in a thread-safe manner.
    /// </summary>
    /// <param name="form">The form to show.</param>
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
            // Already disposed
        }
        catch (InvalidOperationException)
        {
            // Invalid handle
        }
    }

    /// <summary>
    /// Hides the form in a thread-safe manner.
    /// </summary>
    /// <param name="form">The form to hide.</param>
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
            // Already disposed
        }
        catch (InvalidOperationException)
        {
            // Invalid handle
        }
    }
}
