using Fiplex.Control.Software.WinForms.Core.Security.Interfaces;
using Microsoft.Extensions.Logging;

namespace Fiplex.Control.Software.WinForms.Forms;

/// <summary>
/// Dialog to show CLSS subscription and training information.
/// </summary>
/// <remarks>
/// Displays subscription expiration dates, training and last update,
/// along with user and organization information. Uses colors to indicate
/// training status (green=valid, orange=expires today, red=expired).
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
    /// Populates controls with license and training information.
    /// </summary>
    /// <remarks>
    /// Reads values from <see cref="ITrainingValidationService"/> service and
    /// displays them in corresponding labels with date format "dd MMM yyyy".
    /// Applies colors based on training expiration status.
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

                // Add remaining days indicator
                var daysRemaining = _trainingValidation.DaysRemaining;
                if (daysRemaining > 0)
                {
                    lblTrainingExpiryValue.Text += $" ({daysRemaining} days remaining)";
                    // Dark green color to indicate valid (visible on light background)
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

            // Additional user information
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
    /// Closes the dialog when OK button is pressed.
    /// </summary>
    private void BtnOk_Click(object sender, EventArgs e)
    {
        Close();
    }

}
