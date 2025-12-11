using System.Diagnostics;
using Fiplex.Control.Software.WinForms.Core.Security;
using Fiplex.Control.Software.WinForms.Core.Security.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Fiplex.Control.Software.WinForms.Forms;

/// <summary>
/// Formulario de términos y condiciones de licencia.
/// </summary>
/// <remarks>
/// Funcionalidad:
/// - Muestra términos IFC 510.5.3 para ERCES/BDA
/// - Valida usuarios privilegiados (estaciones de calibración)
/// - Controla flujo de aceptación/rechazo de términos
/// - Abre enlace a códigos IFC oficiales
/// </remarks>
public partial class frmInitLicense : Form
{
    #region Campos privados
    
    private readonly IPrivilegedUserService _privilegedUserService;
    private readonly IOfflineTokenValidator _tokenValidator;
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<frmInitLicense> _logger;

    /// <summary>
    /// CancellationTokenSource para operaciones asíncronas.
    /// </summary>
    private CancellationTokenSource? _cts;

    /// <summary>
    /// Indica si el usuario actual es privilegiado.
    /// </summary>
    private bool _isPrivilegedUser;

    /// <summary>
    /// Indica si la validación inicial ya se completó.
    /// Evita race conditions entre OnLoad y OnActivated.
    /// </summary>
    private bool _validationCompleted;

    /// <summary>
    /// Indica si el formulario ya procesó la navegación automática.
    /// Evita múltiples llamadas desde OnActivated.
    /// </summary>
    private bool _autoNavigationProcessed;

    #endregion

    #region Propiedades públicas

    /// <summary>
    /// Resultado del formulario para control de flujo.
    /// </summary>
    public bool AcceptedTerms { get; private set; }

    /// <summary>
    /// Indica si debe navegar directamente a frmMain (usuario privilegiado o token válido).
    /// </summary>
    public bool ShouldNavigateToMain { get; private set; }

    /// <summary>
    /// Password del usuario privilegiado (si aplica).
    /// </summary>
    public string? PrivilegedPassword { get; private set; }

    #endregion

    #region Constantes

    /// <summary>
    /// URL de los códigos IFC para ERCES/BDA.
    /// </summary>
    private const string IFC_CODES_URL = 
        "https://codes.iccsafe.org/content/IFC2021P2/chapter-5-fire-service-features#IFC2021P2_Pt03_Ch05_Sec510.5.3";

    #endregion

    #region Constructor

    /// <summary>
    /// Constructor con inyección de dependencias.
    /// </summary>
    /// <exception cref="ArgumentNullException">Si alguna dependencia es null.</exception>
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

    #region Configuración UI

    /// <summary>
    /// Configura comportamientos de UI en runtime (texto dinámico, tooltips).
    /// Nota: Los estilos visuales Fiplex se aplican en Designer.cs en tiempo de diseño.
    /// </summary>
    private void ConfigureUIBehavior()
    {
        // Configurar texto de términos IFC
        linkTerms.Text = GetTermsText();
        
        // Configurar área de enlace para "IFC 510.5.3"
        var linkStart = linkTerms.Text.IndexOf("IFC 510.5.3", StringComparison.OrdinalIgnoreCase);
        if (linkStart >= 0)
        {
            linkTerms.LinkArea = new LinkArea(linkStart, 11); // "IFC 510.5.3" = 11 chars
        }

        // Configurar tooltips
        toolTip1.SetToolTip(linkTerms, "Click to open IFC codes website");
        toolTip1.SetToolTip(btnAccept, "Accept terms and continue");
        toolTip1.SetToolTip(btnDecline, "Decline terms and exit application");
    }

    /// <summary>
    /// Obtiene el texto de términos y condiciones IFC.
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

    #region Eventos del Formulario

    /// <summary>
    /// Evento Load del formulario.
    /// Valida si el usuario actual es privilegiado (estación de calibración).
    /// </summary>
    protected override async void OnLoad(EventArgs e)
    {
        base.OnLoad(e);

        // Inicializar CancellationTokenSource
        _cts = new CancellationTokenSource();

        try
        {
            _logger.LogInformation("frmInitLicense: Iniciando validación de usuario privilegiado");

            var (isValid, password) = await _privilegedUserService.ValidatePrivilegedUserAsync();
            
            // Verificar cancelación antes de actualizar estado
            if (_cts.Token.IsCancellationRequested || IsDisposed)
                return;

            _isPrivilegedUser = isValid;
            PrivilegedPassword = password;

            if (_isPrivilegedUser)
            {
                _logger.LogInformation("Usuario privilegiado detectado. Password disponible: {HasPassword}", 
                    !string.IsNullOrEmpty(password));
            }
            else
            {
                _logger.LogDebug("Usuario estándar - mostrando términos");
            }
        }
        catch (OperationCanceledException)
        {
            _logger.LogDebug("Validación de usuario cancelada");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validando usuario privilegiado");
            _isPrivilegedUser = false;
        }
        finally
        {
            _validationCompleted = true;
        }
    }

    /// <summary>
    /// Evento Activated del formulario.
    /// Si el usuario es privilegiado, oculta el form y navega directamente.
    /// </summary>
    protected override void OnActivated(EventArgs e)
    {
        base.OnActivated(e);

        // Evitar procesamiento múltiple o antes de que termine validación
        if (_autoNavigationProcessed || !_validationCompleted)
            return;

        if (_isPrivilegedUser)
        {
            _autoNavigationProcessed = true;
            
            _logger.LogInformation("Usuario privilegiado - navegación directa a aplicación principal");
            
            this.Visible = false;
            ShouldNavigateToMain = true;
            AcceptedTerms = true;
            DialogResult = DialogResult.OK;
            Close();
        }
    }

    /// <summary>
    /// Click en botón Accept.
    /// Valida token offline y determina siguiente formulario.
    /// </summary>
    private async void btnAccept_Click(object sender, EventArgs e)
    {
        try
        {
            btnAccept.Enabled = false;
            btnDecline.Enabled = false;
            Cursor = Cursors.WaitCursor;

            _logger.LogInformation("Usuario aceptó términos - validando token offline");

            var isValidToken = await _tokenValidator.ValidateTokenAsync(
                OfflineTokenManager.OFFLINE_TOKEN_NAME);

            AcceptedTerms = true;
            ShouldNavigateToMain = isValidToken;

            if (isValidToken)
            {
                _logger.LogInformation("Token offline válido - navegando a frmMain");
            }
            else
            {
                _logger.LogInformation("Token offline inválido/ausente - navegando a Login");
            }

            DialogResult = DialogResult.OK;
            Close();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error procesando aceptación de términos");
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
    /// Click en botón Decline.
    /// Cierra la aplicación.
    /// </summary>
    private void btnDecline_Click(object sender, EventArgs e)
    {
        _logger.LogInformation("Usuario rechazó términos - cerrando aplicación");

        AcceptedTerms = false;
        ShouldNavigateToMain = false;
        DialogResult = DialogResult.Cancel;
        Close();
    }

    /// <summary>
    /// Click en enlace de términos IFC.
    /// Abre URL de códigos IFC en navegador.
    /// </summary>
    private void linkTerms_LinkClicked(object sender, LinkLabelLinkClickedEventArgs e)
    {
        try
        {
            _logger.LogDebug("Abriendo enlace IFC codes: {Url}", IFC_CODES_URL);

            Process.Start(new ProcessStartInfo
            {
                FileName = IFC_CODES_URL,
                UseShellExecute = true
            });
        }
        catch (Exception ex) when (ex is System.ComponentModel.Win32Exception win32Ex && win32Ex.NativeErrorCode == 384)
        {
            _logger.LogDebug("Error 384 ignorado al abrir URL");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error abriendo URL IFC");
            MessageBox.Show(
                $"Could not open the link. Please visit:\n{IFC_CODES_URL}",
                "Error",
                MessageBoxButtons.OK,
                MessageBoxIcon.Warning);
        }
    }

    /// <summary>
    /// Evento FormClosing del formulario.
    /// Si el cierre es por razón desconocida (0), termina la app.
    /// </summary>
    protected override void OnFormClosing(FormClosingEventArgs e)
    {
        // Cancelar operaciones pendientes antes de cerrar
        CancelPendingOperations();

        base.OnFormClosing(e);

        if (e.CloseReason == CloseReason.None && !AcceptedTerms)
        {
            _logger.LogWarning("Formulario cerrado sin aceptación - terminando aplicación");
            // La aplicación debe cerrarse si el usuario no aceptó
        }
    }

    #endregion

    #region Métodos Auxiliares

    /// <summary>
    /// Cancela cualquier operación async pendiente.
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
            // CTS ya fue disposed, ignorar
        }
    }

    /// <summary>
    /// Dispose del formulario - libera CancellationTokenSource.
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
