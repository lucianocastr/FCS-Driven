using Fiplex.Control.Software.WinForms.Core.Security;
using Fiplex.Control.Software.WinForms.Core.Security.Interfaces;
using Fiplex.Control.Software.WinForms.Models;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System.ComponentModel;
using System.Diagnostics;

namespace Fiplex.Control.Software.WinForms.Forms;

/// <summary>
/// Formulario de login con autenticación OIDC.
/// </summary>
/// <remarks>
/// Gestiona la autenticación de usuarios mediante OpenID Connect (OIDC) con Firebase.
/// Valida tokens offline existentes al cargar y permite login interactivo mediante
/// el navegador web. Muestra enlaces a términos/condiciones y solicitud de acceso.
/// </remarks>
public partial class Login : Form
{
    private readonly IOidcAuthService _oidcService;
    private readonly ILicenseValidator _licenseValidator;
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<Login> _logger;
    
    // CancellationTokenSource para operaciones async
    private CancellationTokenSource? _cts;
    
    // Flag para evitar operaciones múltiples
    private bool _isLoggingIn;

    /// <summary>
    /// Indica si el login fue exitoso.
    /// </summary>
    public bool LoginSuccessful { get; private set; }

    /// <summary>
    /// Token obtenido tras login exitoso.
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

        // Configurar cursor por defecto
        Cursor.Current = Cursors.Default;
        Application.UseWaitCursor = false;
    }

    /// <summary>
    /// Evento Load del formulario.
    /// </summary>
    /// <remarks>
    /// Valida si existe un token offline válido. Si es válido, cierra el formulario
    /// con <see cref="DialogResult.OK"/> y redirige a la aplicación principal.
    /// </remarks>
    protected override async void OnLoad(EventArgs e)
    {
        base.OnLoad(e);
        
        // Inicializar CancellationTokenSource
        _cts = new CancellationTokenSource();

        try
        {
            _logger.LogInformation("Iniciando validación de token offline");

            // Verificar si existe token offline válido
            if (await _oidcService.ValidateOfflineTokenAsync())
            {
                // Verificar cancelación antes de actualizar estado
                if (_cts.Token.IsCancellationRequested || IsDisposed)
                    return;
                    
                _logger.LogInformation("Token offline válido. Redirigiendo a aplicación principal.");
                LoginSuccessful = true;
                DialogResult = DialogResult.OK;
                Close();
                return;
            }

            _logger.LogDebug("No hay token offline válido. Mostrando formulario de login.");
        }
        catch (OperationCanceledException)
        {
            _logger.LogDebug("Validación de token cancelada");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validando token offline");
        }
    }

    /// <summary>
    /// Inicia el proceso de autenticación OIDC al hacer click en login.
    /// </summary>
    private async void BtnLogin_Click(object sender, EventArgs e)
    {
        // Evitar login múltiple
        if (_isLoggingIn)
        {
            _logger.LogDebug("Login ya en progreso, ignorando click");
            return;
        }
        
        // Verificar que no hay otro login abierto
        if (Application.OpenForms.Cast<Form>().Any(x => x.Name == "WebAuthentication"))
        {
            _logger.LogWarning("Ya hay una ventana de autenticación abierta");
            return;
        }

        _isLoggingIn = true;
        
        try
        {
            // Deshabilitar UI durante login
            BtnLogin.Enabled = false;

            // Mostrar barra de progreso
            progLoginInProcess.Visible = true;
            progLoginInProcess.Value = 0;

            // Crear reporte de progreso
            var progress = new Progress<int>(percent =>
            {
                if (!IsDisposed && !progLoginInProcess.IsDisposed)
                {
                    progLoginInProcess.Value = percent;
                }
            });

            _logger.LogInformation("Iniciando proceso de login OIDC");

            // Ejecutar login
            var result = await _oidcService.LoginAsync(progress);
            
            // Verificar cancelación
            if (_cts?.Token.IsCancellationRequested == true || IsDisposed)
                return;

            if (result.Success)
            {
                _logger.LogInformation("Login exitoso para usuario: {UserName}", result.UserName);

                // Leer información de tokens almacenados
                await _oidcService.ReadTokenInformationAsync();

                LoginSuccessful = true;
                DialogResult = DialogResult.OK;
                Close();
            }
            else
            {
                _logger.LogWarning("Login fallido: {Error} (Code: {ErrorCode})",
                    result.ErrorMessage, result.ErrorCode);

                // Mostrar mensaje de error apropiado
                ShowLoginError(result);
            }
        }
        catch (OperationCanceledException)
        {
            _logger.LogDebug("Login cancelado por el usuario");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error durante login");
            HandleLoginException(ex);
        }
        finally
        {
            _isLoggingIn = false;
            
            // Rehabilitar UI solo si el form no está disposed
            if (!IsDisposed)
            {
                BtnLogin.Enabled = true;
                progLoginInProcess.Visible = false;
            }
        }
    }

    /// <summary>
    /// Muestra mensaje de error de login según el código de error.
    /// </summary>
    /// <param name="result">Resultado del intento de login con información del error.</param>
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
    /// Maneja excepciones de login mostrando mensajes apropiados.
    /// </summary>
    /// <param name="ex">Excepción capturada durante el proceso de login.</param>
    /// <remarks>
    /// El HResult -2146233079 indica error de conexión a internet.
    /// Otros errores inesperados pueden resultar en cierre de la aplicación.
    /// </remarks>
    private void HandleLoginException(Exception ex)
    {
        var message = ex.HResult switch
        {
            // HResult -2146233079 = Error de conexión
            -2146233079 =>
                "Login Error: Please make sure you connect to internet when you are attempting to login.",

            _ =>
                "Login Error: Unexpected error occurred. Tools is going to exit."
        };

        MessageBox.Show(message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);

        // Si es error inesperado, cerrar aplicación
        if (ex.HResult != -2146233079)
        {
            _logger.LogCritical(ex, "Error crítico en login. Cerrando aplicación.");
            // Descomentar si se desea cerrar la app en error crítico
            // Application.Exit();
        }
    }

    /// <summary>
    /// Abre el formulario de términos y condiciones de licencia.
    /// </summary>
    /// <remarks>
    /// Si el usuario cancela el formulario de licencia, la aplicación se cierra.
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
            _logger.LogInformation("Usuario canceló el formulario de licencia. Cerrando aplicación.");
            Close();
            Application.Exit();
        }
    }


    /// <summary>
    /// Abre la página de solicitud de acceso en el navegador.
    /// </summary>
    /// <remarks>
    /// Abre https://fire.honeywell.com/#/signup en el navegador predeterminado.
    /// </remarks>
    private void linkLabelRequestAccess_LinkClicked(object sender, LinkLabelLinkClickedEventArgs e)
    {
        try
        {
            _logger.LogDebug("Usuario solicitó acceso");

            // Abrir URL de registro en navegador por defecto
            var psi = new ProcessStartInfo
            {
                FileName = "https://fire.honeywell.com/#/signup",
                UseShellExecute = true
            };
            Process.Start(psi);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error abriendo URL de registro");
            MessageBox.Show("Could not open the registration page. Please visit https://fire.honeywell.com/#/signup manually.",
                "Error", MessageBoxButtons.OK, MessageBoxIcon.Warning);
        }
    }

    /// <summary>
    /// Evento FormClosing del formulario.
    /// Cancela operaciones pendientes antes de cerrar.
    /// </summary>
    protected override void OnFormClosing(FormClosingEventArgs e)
    {
        CancelPendingOperations();
        base.OnFormClosing(e);
    }

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
}
