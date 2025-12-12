using System.Diagnostics;
using Fiplex.Control.Software.WinForms.Core.Security;
using Fiplex.Control.Software.WinForms.Core.Security.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Fiplex.Control.Software.WinForms.Forms;

/// <summary>
/// License terms and conditions form.
/// </summary>
/// <remarks>
/// Functionality:
/// - Displays IFC 510.5.3 terms for ERCES/BDA
/// - Validates privileged users (calibration stations)
/// - Controls terms acceptance/rejection flow
/// - Opens link to official IFC codes
/// </remarks>
public partial class frmInitLicense : Form
{
    #region Private fields
    
    private readonly IPrivilegedUserService _privilegedUserService;
    private readonly IOfflineTokenValidator _tokenValidator;
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<frmInitLicense> _logger;

    /// <summary>
    /// CancellationTokenSource for asynchronous operations.
    /// </summary>
    private CancellationTokenSource? _cts;

    /// <summary>
    /// Indicates if the current user is privileged.
    /// </summary>
    private bool _isPrivilegedUser;

    /// <summary>
    /// Indicates if initial validation has completed.
    /// Prevents race conditions between OnLoad and OnActivated.
    /// </summary>
    private bool _validationCompleted;

    /// <summary>
    /// Indicates if the form has already processed automatic navigation.
    /// Prevents multiple calls from OnActivated.
    /// </summary>
    private bool _autoNavigationProcessed;

    #endregion

    #region Public properties

    /// <summary>
    /// Form result for flow control.
    /// </summary>
    public bool AcceptedTerms { get; private set; }

    /// <summary>
    /// Indicates whether to navigate directly to frmMain (privileged user or valid token).
    /// </summary>
    public bool ShouldNavigateToMain { get; private set; }

    /// <summary>
    /// Password of the privileged user (if applicable).
    /// </summary>
    public string? PrivilegedPassword { get; private set; }

    #endregion

    #region Constants

    /// <summary>
    /// URL of IFC codes for ERCES/BDA.
    /// </summary>
    private const string IFC_CODES_URL = 
        "https://codes.iccsafe.org/content/IFC2021P2/chapter-5-fire-service-features#IFC2021P2_Pt03_Ch05_Sec510.5.3";

    #endregion

    #region Constructor

    /// <summary>
    /// Constructor with dependency injection.
    /// </summary>
    /// <exception cref="ArgumentNullException">If any dependency is null.</exception>
    public frmInitLicense(
        IPrivilegedUserService privilegedUserService,
        IOfflineTokenValidator tokenValidator,
        IServiceProvider serviceProvider,
        ILogger<frmInitLicense> logger)
    {
        InitializeComponent();

        _privilegedUserService = privilegedUserService ?? throw new ArgumentNullException(nameof(privilegedUserService));
        _tokenValidator = tokenValidator ?? throw new ArgumentNullException(nameof(tokenValidator));
        _serviceProvider = serviceProvider ?? throw new ArgumentNullException(nameof(serviceProvider));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));

        ConfigureUIBehavior();
    }

    #endregion

    #region UI Configuration

    /// <summary>
    /// Configures UI behaviors at runtime (dynamic text, tooltips).
    /// Note: Fiplex visual styles are applied in Designer.cs at design time.
    /// </summary>
    private void ConfigureUIBehavior()
    {
        // Configure IFC terms text
        linkTerms.Text = GetTermsText();
        
        // Configure link area for "IFC 510.5.3"
        var linkStart = linkTerms.Text.IndexOf("IFC 510.5.3", StringComparison.OrdinalIgnoreCase);
        if (linkStart >= 0)
        {
            linkTerms.LinkArea = new LinkArea(linkStart, 11); // "IFC 510.5.3" = 11 chars
        }

        // Configure tooltips
        toolTip1.SetToolTip(linkTerms, "Click to open IFC codes website");
        toolTip1.SetToolTip(btnAccept, "Accept terms and continue");
        toolTip1.SetToolTip(btnDecline, "Decline terms and exit application");
    }

    /// <summary>
    /// Gets the IFC terms and conditions text.
    /// </summary>
    private static string GetTermsText()
    {
        return """
            USER REPRESENTS THAT HE/SHE HAS THE MINIMUM QUALIFICATIONS LISTED BELOW, 
            WHICH ARE REQUIRED BY CODE (IFC 510.5.3) FOR DESIGN AND INSTALLATION OF 
            EMERGENCY RESPONDER COMMUNICATION ENHANCEMENT SYSTEMS ("ERCES") OR 
            BI-DIRECTIONAL AMPLIFICATION ("BDA") SYSTEMS:

                1.  Valid FCC-issued General Radio Operator's License ("GROL"), and
                2.  Certification of in-building ERCES/BDA training from Fiplex by Honeywell 
                    or another approved organization or school.

            By clicking Accept, you confirm that you meet these qualifications.
            """;
    }

    #endregion

    #region Form Events

    /// <summary>
    /// Form Load event.
    /// Validates if the current user is privileged (calibration station).
    /// </summary>
    protected override async void OnLoad(EventArgs e)
    {
        base.OnLoad(e);

        // Initialize CancellationTokenSource
        _cts = new CancellationTokenSource();

        try
        {
            _logger.LogInformation("frmInitLicense: Starting privileged user validation");

            var (isValid, password) = await _privilegedUserService.ValidatePrivilegedUserAsync();
            
            // Verify cancellation before updating state
            if (_cts.Token.IsCancellationRequested || IsDisposed)
                return;

            _isPrivilegedUser = isValid;
            PrivilegedPassword = password;

            if (_isPrivilegedUser)
            {
                _logger.LogInformation("Privileged user detected. Password available: {HasPassword}", 
                    !string.IsNullOrEmpty(password));
            }
            else
            {
                _logger.LogDebug("Standard user - showing terms");
            }
        }
        catch (OperationCanceledException)
        {
            _logger.LogDebug("User validation cancelled");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating privileged user");
            _isPrivilegedUser = false;
        }
        finally
        {
            _validationCompleted = true;
        }
    }

    /// <summary>
    /// Form Activated event.
    /// If the user is privileged, hides the form and navigates directly.
    /// </summary>
    protected override void OnActivated(EventArgs e)
    {
        base.OnActivated(e);

        // Avoid multiple processing or before validation completes
        if (_autoNavigationProcessed || !_validationCompleted)
            return;

        if (_isPrivilegedUser)
        {
            _autoNavigationProcessed = true;
            
            _logger.LogInformation("Privileged user - direct navigation to main application");
            
            this.Visible = false;
            ShouldNavigateToMain = true;
            AcceptedTerms = true;
            DialogResult = DialogResult.OK;
            Close();
        }
    }

    /// <summary>
    /// Accept button click.
    /// Validates offline token and determines next form.
    /// </summary>
    private async void btnAccept_Click(object sender, EventArgs e)
    {
        try
        {
            btnAccept.Enabled = false;
            btnDecline.Enabled = false;
            Cursor = Cursors.WaitCursor;

            _logger.LogInformation("User accepted terms - validating offline token");

            var isValidToken = await _tokenValidator.ValidateTokenAsync(
                OfflineTokenManager.OFFLINE_TOKEN_NAME);

            AcceptedTerms = true;
            ShouldNavigateToMain = isValidToken;

            if (isValidToken)
            {
                _logger.LogInformation("Valid offline token - navigating to frmMain");
            }
            else
            {
                _logger.LogInformation("Invalid/missing offline token - navigating to Login");
            }

            DialogResult = DialogResult.OK;
            Close();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing terms acceptance");
            MessageBox.Show(
                "An error occurred while processing your request. Please try again.",
                "Error",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error);
        }
        finally
        {
            btnAccept.Enabled = true;
            btnDecline.Enabled = true;
            Cursor = Cursors.Default;
        }
    }

    /// <summary>
    /// Decline button click.
    /// Closes the application.
    /// </summary>
    private void btnDecline_Click(object sender, EventArgs e)
    {
        _logger.LogInformation("User rejected terms - closing application");

        AcceptedTerms = false;
        ShouldNavigateToMain = false;
        DialogResult = DialogResult.Cancel;
        Close();
    }

    /// <summary>
    /// Terms link click.
    /// Opens IFC codes URL in browser.
    /// </summary>
    private void linkTerms_LinkClicked(object sender, LinkLabelLinkClickedEventArgs e)
    {
        try
        {
            _logger.LogDebug("Opening IFC codes link: {Url}", IFC_CODES_URL);

            Process.Start(new ProcessStartInfo
            {
                FileName = IFC_CODES_URL,
                UseShellExecute = true
            });
        }
        catch (Exception ex) when (ex is System.ComponentModel.Win32Exception win32Ex && win32Ex.NativeErrorCode == 384)
        {
            _logger.LogDebug("Error 384 ignored when opening URL");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error opening IFC URL");
            MessageBox.Show(
                $"Could not open the link. Please visit:\n{IFC_CODES_URL}",
                "Error",
                MessageBoxButtons.OK,
                MessageBoxIcon.Warning);
        }
    }

    /// <summary>
    /// Form FormClosing event.
    /// If closed for unknown reason (0), terminates the app.
    /// </summary>
    protected override void OnFormClosing(FormClosingEventArgs e)
    {
        // Cancel pending operations before closing
        CancelPendingOperations();

        base.OnFormClosing(e);

        if (e.CloseReason == CloseReason.None && !AcceptedTerms)
        {
            _logger.LogWarning("Form closed without acceptance - terminating application");
            // The application should close if the user did not accept
        }
    }

    #endregion

    #region Helper Methods

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
            // CTS already disposed, ignore
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

    #endregion
}
