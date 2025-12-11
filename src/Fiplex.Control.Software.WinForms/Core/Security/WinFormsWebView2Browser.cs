using Duende.IdentityModel.OidcClient.Browser;
using Microsoft.Extensions.Logging;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace Fiplex.Control.Software.WinForms.Core.Security;

/// <summary>
/// Browser embebido WebView2 para autenticación OIDC.
/// Implementa IBrowser de Duende.IdentityModel.OidcClient
/// </summary>
public class WinFormsWebView2Browser : IBrowser
{
    private readonly ILogger<WinFormsWebView2Browser>? _logger;
    private readonly Func<Form>? _formFactory;

    public WinFormsWebView2Browser(ILogger<WinFormsWebView2Browser>? logger = null, Func<Form>? formFactory = null)
    {
        _logger = logger;
        _formFactory = formFactory;
    }

    /// <summary>
    /// Invoca el browser para autenticación OIDC.
    /// </summary>
    public async Task<BrowserResult> InvokeAsync(BrowserOptions options, CancellationToken ct = default)
    {
        var tcs = new TaskCompletionSource<BrowserResult>();

        // Crear formulario de autenticación
        var form = _formFactory?.Invoke() ?? CreateDefaultForm();
        var webView = new WebView2
        {
            Dock = DockStyle.Fill
        };

        form.Controls.Add(webView);

        // Registrar cancelación
        ct.Register(() =>
        {
            if (!tcs.Task.IsCompleted)
            {
                tcs.TrySetResult(new BrowserResult
                {
                    ResultType = BrowserResultType.UserCancel,
                    Error = "Operation was cancelled"
                });
                
                if (form.InvokeRequired)
                    form.Invoke(() => form.Close());
                else
                    form.Close();
            }
        });

        // Evento de cierre del formulario
        form.FormClosed += (s, e) =>
        {
            if (!tcs.Task.IsCompleted)
            {
                tcs.TrySetResult(new BrowserResult
                {
                    ResultType = BrowserResultType.UserCancel,
                    Error = "User closed the browser window"
                });
            }
        };

        try
        {
            // Inicializar WebView2
            await webView.EnsureCoreWebView2Async();

            // Configurar WebView2
            webView.CoreWebView2.Settings.AreDefaultContextMenusEnabled = false;
            webView.CoreWebView2.Settings.AreDevToolsEnabled = false;
            webView.CoreWebView2.Settings.IsStatusBarEnabled = false;

            _logger?.LogDebug("WebView2 inicializado. Navegando a: {Url}", 
                options.StartUrl?.Substring(0, Math.Min(100, options.StartUrl?.Length ?? 0)) + "...");

            // Manejar navegación
            webView.CoreWebView2.NavigationStarting += (s, e) =>
            {
                _logger?.LogDebug("Navegando a: {Url}", e.Uri);

                // Detectar redirect URI
                if (e.Uri.StartsWith(options.EndUrl, StringComparison.OrdinalIgnoreCase))
                {
                    _logger?.LogInformation("Redirect URI detectado");
                    
                    e.Cancel = true;
                    
                    tcs.TrySetResult(new BrowserResult
                    {
                        ResultType = BrowserResultType.Success,
                        Response = e.Uri
                    });

                    if (form.InvokeRequired)
                        form.Invoke(() => form.Close());
                    else
                        form.Close();
                }
            };

            // Manejar errores de navegación
            webView.CoreWebView2.NavigationCompleted += (s, e) =>
            {
                if (!e.IsSuccess && e.WebErrorStatus != CoreWebView2WebErrorStatus.OperationCanceled)
                {
                    _logger?.LogWarning("Error de navegación: {Status}", e.WebErrorStatus);
                    
                    // Solo fallar si es un error crítico
                    if (e.WebErrorStatus == CoreWebView2WebErrorStatus.HostNameNotResolved ||
                        e.WebErrorStatus == CoreWebView2WebErrorStatus.ConnectionAborted)
                    {
                        tcs.TrySetResult(new BrowserResult
                        {
                            ResultType = BrowserResultType.HttpError,
                            Error = $"Navigation error: {e.WebErrorStatus}"
                        });
                        
                        if (form.InvokeRequired)
                            form.Invoke(() => form.Close());
                        else
                            form.Close();
                    }
                }
            };

            // Navegar a URL de inicio
            webView.CoreWebView2.Navigate(options.StartUrl);

            // Mostrar formulario
            form.Show();

            // Timeout
            if (options.Timeout > TimeSpan.Zero)
            {
                _ = Task.Delay(options.Timeout, ct).ContinueWith(t =>
                {
                    if (!t.IsCanceled && !tcs.Task.IsCompleted)
                    {
                        _logger?.LogWarning("Browser timeout alcanzado");
                        tcs.TrySetResult(new BrowserResult
                        {
                            ResultType = BrowserResultType.Timeout,
                            Error = "Browser operation timed out"
                        });
                        
                        if (form.InvokeRequired)
                            form.Invoke(() => form.Close());
                        else if (!form.IsDisposed)
                            form.Close();
                    }
                }, TaskScheduler.Default);
            }

            return await tcs.Task;
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, "Error en browser OIDC");
            return new BrowserResult
            {
                ResultType = BrowserResultType.UnknownError,
                Error = ex.Message
            };
        }
        finally
        {
            webView.Dispose();
            if (!form.IsDisposed)
                form.Dispose();
        }
    }

    /// <summary>
    /// Crea el formulario por defecto para autenticación.
    /// </summary>
    private static Form CreateDefaultForm()
    {
        return new Form
        {
            Name = "WebAuthentication",
            Text = "Sign In",
            Width = 600,
            Height = 800,
            StartPosition = FormStartPosition.CenterScreen,
            FormBorderStyle = FormBorderStyle.Sizable,
            MinimizeBox = false,
            MaximizeBox = false,
            ShowIcon = false,
            ShowInTaskbar = true
        };
    }
}
