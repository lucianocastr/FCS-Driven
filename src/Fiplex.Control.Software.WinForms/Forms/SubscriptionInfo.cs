using Fiplex.Control.Software.WinForms.Core.Security.Interfaces;
using Microsoft.Extensions.Logging;

namespace Fiplex.Control.Software.WinForms.Forms;

/// <summary>
/// Diálogo para mostrar información de suscripción y entrenamiento CLSS.
/// </summary>
/// <remarks>
/// Muestra fechas de expiración de suscripción, entrenamiento y última actualización,
/// junto con información del usuario y organización. Utiliza colores para indicar
/// el estado del entrenamiento (verde=vigente, naranja=expira hoy, rojo=expirado).
/// </remarks>
public partial class SubscriptionInfo : Form
{
    private readonly ITrainingValidationService _trainingValidation;
    private readonly ILogger<SubscriptionInfo> _logger;

    public SubscriptionInfo(
        ITrainingValidationService trainingValidation,
        ILogger<SubscriptionInfo> logger)
    {
        _trainingValidation = trainingValidation;
        _logger = logger;

        InitializeComponent();
    }

    private void SubscriptionInfoDialog_Load(object sender, EventArgs e)
    {
        PopulateControls();
    }

    /// <summary>
    /// Pobla los controles con información de licencia y entrenamiento.
    /// </summary>
    /// <remarks>
    /// Lee los valores del servicio <see cref="ITrainingValidationService"/> y los
    /// muestra en los labels correspondientes con formato de fecha "dd MMM yyyy".
    /// Aplica colores según el estado de expiración del entrenamiento.
    /// </remarks>
    private void PopulateControls()
    {
        try
        {
            _logger.LogDebug("Populating subscription info controls");

            // Subscription Expiry Date
            if (_trainingValidation.SubscriptionExpiryDate.HasValue)
            {
                lblSubscriptionExpiryValue.Text = _trainingValidation.SubscriptionExpiryDate.Value
                    .ToString("dd MMM yyyy");
            }
            else
            {
                lblSubscriptionExpiryValue.Text = "N/A (Basic Subscription)";
            }

            // Training Expiry Date
            if (_trainingValidation.TrainingExpiryDate.HasValue)
            {
                lblTrainingExpiryValue.Text = _trainingValidation.TrainingExpiryDate.Value
                    .ToString("dd MMM yyyy");

                // Agregar indicador de días restantes
                var daysRemaining = _trainingValidation.DaysRemaining;
                if (daysRemaining > 0)
                {
                    lblTrainingExpiryValue.Text += $" ({daysRemaining} days remaining)";
                    // Color verde oscuro para indicar vigente (visible sobre fondo claro)
                    lblTrainingExpiryValue.ForeColor = Color.FromArgb(0, 128, 0); // Green
                }
                else if (daysRemaining == 0)
                {
                    lblTrainingExpiryValue.Text += " (expires today)";
                    lblTrainingExpiryValue.ForeColor = Color.FromArgb(255, 140, 0); // DarkOrange
                }
                else
                {
                    lblTrainingExpiryValue.Text += " (EXPIRED)";
                    lblTrainingExpiryValue.ForeColor = Color.FromArgb(178, 34, 34); // Firebrick (rojo oscuro)
                }
            }
            else
            {
                lblTrainingExpiryValue.Text = "N/A";
            }

            // Updated On Date
            if (_trainingValidation.UpdatedOnDate.HasValue)
            {
                lblUpdatedOnValue.Text = _trainingValidation.UpdatedOnDate.Value
                    .ToString("dd MMM yyyy");
            }
            else
            {
                lblUpdatedOnValue.Text = "N/A";
            }

            // Información adicional del usuario
            lblUserValue.Text = _trainingValidation.UserName ?? "Unknown";
            lblOrganizationValue.Text = _trainingValidation.Organization ?? "Unknown";

            _logger.LogDebug("Subscription info populated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error populating subscription info");
            lblUpdatedOnValue.Text = "N/A";
        }
    }

    /// <summary>
    /// Cierra el diálogo al presionar el botón OK.
    /// </summary>
    private void BtnOk_Click(object sender, EventArgs e)
    {
        Close();
    }

}
