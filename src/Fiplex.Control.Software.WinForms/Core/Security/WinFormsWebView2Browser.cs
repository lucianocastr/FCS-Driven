using Duende.IdentityModel.OidcClient.Browser;
using Microsoft.Extensions.Logging;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace Fiplex.Control.Software.WinForms.Core.Security;

/// <summary>
/// Embedded WebView2 browser for OIDC authentication.
/// Implements IBrowser from Duende.IdentityModel.OidcClient
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
    /// Invokes the browser for OIDC authentication.
    /// </summary>
    public async Task<BrowserResult> InvokeAsync(BrowserOptions options, CancellationToken ct = default)
    {
        var tcs = new TaskCompletionSource<BrowserResult>();

        // Create authentication form
        var form = _formFactory?.Invoke() ?? CreateDefaultForm();
        var webView = new WebView2
        {
            Dock = DockStyle.Fill
        };

        form.Controls.Add(webView);

        // Register cancellation
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

        // Form close event
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
            // Initialize WebView2
            await webView.EnsureCoreWebView2Async();

            // Configure WebView2
            webView.CoreWebView2.Settings.AreDefaultContextMenusEnabled = false;
            webView.CoreWebView2.Settings.AreDevToolsEnabled = false;
            webView.CoreWebView2.Settings.IsStatusBarEnabled = false;

            _logger?.LogDebug("WebView2 initialized. Navigating to: {Url}", 
                options.StartUrl?.Substring(0, Math.Min(100, options.StartUrl?.Length ?? 0)) + "...");

            // Handle navigation
            webView.CoreWebView2.NavigationStarting += (s, e) =>
            {
                _logger?.LogDebug("Navigating to: {Url}", e.Uri);

                // Detect redirect URI
                if (e.Uri.StartsWith(options.EndUrl, StringComparison.OrdinalIgnoreCase))
                {
                    _logger?.LogInformation("Redirect URI detected");
                    
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

            // Handle navigation errors
            webView.CoreWebView2.NavigationCompleted += (s, e) =>
            {
                if (!e.IsSuccess && e.WebErrorStatus != CoreWebView2WebErrorStatus.OperationCanceled)
                {
                    _logger?.LogWarning("Navigation error: {Status}", e.WebErrorStatus);
                    
                    // Only fail on critical errors
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

            // Navigate to start URL
            webView.CoreWebView2.Navigate(options.StartUrl);

            // Show form
            form.Show();

            // Timeout
            if (options.Timeout > TimeSpan.Zero)
            {
                _ = Task.Delay(options.Timeout, ct).ContinueWith(t =>
                {
                    if (!t.IsCanceled && !tcs.Task.IsCompleted)
                    {
                        _logger?.LogWarning("Browser timeout reached");
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
            _logger?.LogError(ex, "Error in OIDC browser");
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
    /// Creates the default form for authentication.
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
