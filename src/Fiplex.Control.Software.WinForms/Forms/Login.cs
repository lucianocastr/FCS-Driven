using Fiplex.Control.Software.WinForms.Core.Security;
using Fiplex.Control.Software.WinForms.Core.Security.Interfaces;
using Fiplex.Control.Software.WinForms.Models;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System.ComponentModel;
using System.Diagnostics;

namespace Fiplex.Control.Software.WinForms.Forms;

/// <summary>
/// Login form with OIDC authentication.
/// </summary>
/// <remarks>
/// Manages user authentication via OpenID Connect (OIDC) with Firebase.
/// Validates existing offline tokens on load and allows interactive login via
/// web browser. Displays links to terms/conditions and access requests.
/// </remarks>
public partial class Login : Form
{
    private readonly IOidcAuthService _oidcService;
    private readonly ILicenseValidator _licenseValidator;
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<Login> _logger;
    
    // CancellationTokenSource for async operations
    private CancellationTokenSource? _cts;
    
    // Flag to prevent multiple operations
    private bool _isLoggingIn;

    /// <summary>
    /// Indicates if login was successful.
    /// </summary>
    public bool LoginSuccessful { get; private set; }

    /// <summary>
    /// Token obtained after successful login.
    /// </summary>
    public FireAccessToken? Token => _oidcService.CurrentToken;

    public Login(
        IOidcAuthService oidcService,
        ILicenseValidator licenseValidator,
        IServiceProvider serviceProvider,
        ILogger<Login> logger)
    {
        InitializeComponent();

        _oidcService = oidcService;
        _licenseValidator = licenseValidator;
        _serviceProvider = serviceProvider;
        _logger = logger;

        // Configure default cursor
        Cursor.Current = Cursors.Default;
        Application.UseWaitCursor = false;
    }

    /// <summary>
    /// Form Load event.
    /// </summary>
    /// <remarks>
    /// Validates if a valid offline token exists. If valid, closes the form
    /// with <see cref="DialogResult.OK"/> and redirects to main application.
    /// </remarks>
    protected override async void OnLoad(EventArgs e)
    {
        base.OnLoad(e);
        
        // Initialize CancellationTokenSource
        _cts = new CancellationTokenSource();

        try
        {
            _logger.LogInformation("Starting offline token validation");

            // Check if valid offline token exists
            if (await _oidcService.ValidateOfflineTokenAsync())
            {
                // Verify cancellation before updating state
                if (_cts.Token.IsCancellationRequested || IsDisposed)
                    return;
                    
                _logger.LogInformation("Valid offline token. Redirecting to main application.");
                LoginSuccessful = true;
                DialogResult = DialogResult.OK;
                Close();
                return;
            }

            _logger.LogDebug("No valid offline token. Showing login form.");
        }
        catch (OperationCanceledException)
        {
            _logger.LogDebug("Token validation cancelled");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating offline token");
        }
    }

    /// <summary>
    /// Starts OIDC authentication process when login button is clicked.
    /// </summary>
    private async void BtnLogin_Click(object sender, EventArgs e)
    {
        // Prevent multiple login
        if (_isLoggingIn)
        {
            _logger.LogDebug("Login already in progress, ignoring click");
            return;
        }
        
        // Check that there's no other login window open
        if (Application.OpenForms.Cast<Form>().Any(x => x.Name == "WebAuthentication"))
        {
            _logger.LogWarning("Authentication window already open");
            return;
        }

        _isLoggingIn = true;
        
        try
        {
            // Disable UI during login
            BtnLogin.Enabled = false;

            // Show progress bar
            progLoginInProcess.Visible = true;
            progLoginInProcess.Value = 0;

            // Create progress reporter
            var progress = new Progress<int>(percent =>
            {
                if (!IsDisposed && !progLoginInProcess.IsDisposed)
                {
                    progLoginInProcess.Value = percent;
                }
            });

            _logger.LogInformation("Starting OIDC login process");

            // Execute login
            var result = await _oidcService.LoginAsync(progress);
            
            // Check cancellation
            if (_cts?.Token.IsCancellationRequested == true || IsDisposed)
                return;

            if (result.Success)
            {
                _logger.LogInformation("Login successful for user: {UserName}", result.UserName);

                // Read stored token information
                await _oidcService.ReadTokenInformationAsync();

                LoginSuccessful = true;
                DialogResult = DialogResult.OK;
                Close();
            }
            else
            {
                _logger.LogWarning("Login failed: {Error} (Code: {ErrorCode})",
                    result.ErrorMessage, result.ErrorCode);

                // Show appropriate error message
                ShowLoginError(result);
            }
        }
        catch (OperationCanceledException)
        {
            _logger.LogDebug("Login cancelled by user");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during login");
            HandleLoginException(ex);
        }
        finally
        {
            _isLoggingIn = false;
            
            // Re-enable UI only if form is not disposed
            if (!IsDisposed)
            {
                BtnLogin.Enabled = true;
                progLoginInProcess.Visible = false;
            }
        }
    }

    /// <summary>
    /// Shows login error message based on error code.
    /// </summary>
    /// <param name="result">Login attempt result with error information.</param>
    private void ShowLoginError(OidcLoginResult result)
    {
        var message = result.ErrorCode switch
        {
            OidcLoginErrorCode.UserCancelled =>
                "Login Error: User has cancelled login",

            OidcLoginErrorCode.TokenExpired =>
                "Please check your system time and date and make sure they are not set ahead or behind of actual time and date.\nMake sure you correct the System Date and Time before you attempt to login.",

            OidcLoginErrorCode.NoInternet =>
                "Login Error: Please make sure you connect to internet when you are attempting to login.",

            OidcLoginErrorCode.ConfigurationError =>
                $"Login Error: OIDC configuration is invalid.\n\n{result.ErrorMessage ?? "Check appsettings.json OidcSettings section."}",

            _ => result.ErrorMessage ?? "Login Error: Unknown error occurred."
        };

        MessageBox.Show(message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
    }

    /// <summary>
    /// Handles login exceptions showing appropriate messages.
    /// </summary>
    /// <param name="ex">Exception caught during login process.</param>
    /// <remarks>
    /// HResult -2146233079 indicates internet connection error.
    /// Other unexpected errors may result in application closure.
    /// </remarks>
    private void HandleLoginException(Exception ex)
    {
        var message = ex.HResult switch
        {
            // HResult -2146233079 = Connection error
            -2146233079 =>
                "Login Error: Please make sure you connect to internet when you are attempting to login.",

            _ =>
                "Login Error: Unexpected error occurred. Tools is going to exit."
        };

        MessageBox.Show(message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);

        // If unexpected error, close application
        if (ex.HResult != -2146233079)
        {
            _logger.LogCritical(ex, "Critical error in login. Closing application.");
            // Uncomment if you want to close app on critical error
            // Application.Exit();
        }
    }

    /// <summary>
    /// Opens the license terms and conditions form.
    /// </summary>
    /// <remarks>
    /// If user cancels the license form, the application closes.
    /// </remarks>
    private void LinkLabelTermsConditions_LinkClicked(object sender, LinkLabelLinkClickedEventArgs e)
    {
        var privilegedUserService = _serviceProvider.GetRequiredService<IPrivilegedUserService>();
        var tokenValidator = _serviceProvider.GetRequiredService<IOfflineTokenValidator>();
        var logger = _serviceProvider.GetRequiredService<ILogger<frmInitLicense>>();

        using var licenseForm = new frmInitLicense(
            privilegedUserService,
            tokenValidator,
            _serviceProvider,
            logger
        );
        
        var result = licenseForm.ShowDialog(this);
        
        if (result == DialogResult.Cancel)
        {
            _logger.LogInformation("User cancelled license form. Closing application.");
            Close();
            Application.Exit();
        }
    }


    /// <summary>
    /// Opens the access request page in browser.
    /// </summary>
    /// <remarks>
    /// Opens https://fire.honeywell.com/#/signup in default browser.
    /// </remarks>
    private void linkLabelRequestAccess_LinkClicked(object sender, LinkLabelLinkClickedEventArgs e)
    {
        try
        {
            _logger.LogDebug("User requested access");

            // Open registration URL in default browser
            var psi = new ProcessStartInfo
            {
                FileName = "https://fire.honeywell.com/#/signup",
                UseShellExecute = true
            };
            Process.Start(psi);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error opening registration URL");
            MessageBox.Show("Could not open the registration page. Please visit https://fire.honeywell.com/#/signup manually.",
                "Error", MessageBoxButtons.OK, MessageBoxIcon.Warning);
        }
    }

    /// <summary>
    /// Form FormClosing event.
    /// Cancels pending operations before closing.
    /// </summary>
    protected override void OnFormClosing(FormClosingEventArgs e)
    {
        CancelPendingOperations();
        base.OnFormClosing(e);
    }

    /// <summary>
    /// Cancels any pending async operation.
    /// </summary>
    private void CancelPendingOperations()
    {
        try
        {
            if (_cts != null && !_cts.IsCancellationRequested)
            {
                _cts.Cancel();
            }
        }
        catch (ObjectDisposedException)
        {
            // CTS was already disposed, ignore
        }
    }

    /// <summary>
    /// Form Dispose - releases CancellationTokenSource.
    /// </summary>
    protected override void Dispose(bool disposing)
    {
        if (disposing)
        {
            CancelPendingOperations();
            _cts?.Dispose();
            _cts = null;
            
            components?.Dispose();
        }
        base.Dispose(disposing);
    }
}
