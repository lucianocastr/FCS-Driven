using Microsoft.Extensions.Configuration;
using System.Text.Json;

namespace Fiplex.Control.Software.WinForms.Core.Configuration;

/// <summary>
/// Servicio para gestionar configuraci�n persistente de la aplicaci�n
/// 
/// [General]
/// rs232port=10
/// port=8080
/// ...
/// </summary>
public interface IAppSettingsService
{
    Task<T?> GetSettingAsync<T>(string key);
    Task SaveSettingAsync<T>(string key, T value);
    Task<int> GetLastUsedComPortAsync();
    Task SaveLastUsedComPortAsync(int portNumber);
}

public class AppSettingsService : IAppSettingsService
{
    private readonly string _settingsPath;
    private readonly SemaphoreSlim _lock = new(1, 1);

    public AppSettingsService()
    {
        var appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
        var appFolder = Path.Combine(appData, "Fiplex", "ControlSoftware");
        Directory.CreateDirectory(appFolder);
        _settingsPath = Path.Combine(appFolder, "settings.json");
    }

    public async Task<T?> GetSettingAsync<T>(string key)
    {
        await _lock.WaitAsync();
        try
        {
            if (!File.Exists(_settingsPath))
            {
                return default;
            }

            var json = await File.ReadAllTextAsync(_settingsPath);
            var settings = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(json);
            
            if (settings != null && settings.TryGetValue(key, out var value))
            {
                return value.Deserialize<T>();
            }

            return default;
        }
        finally
        {
            _lock.Release();
        }
    }

    public async Task SaveSettingAsync<T>(string key, T value)
    {
        await _lock.WaitAsync();
        try
        {
            Dictionary<string, object> settings;
            
            if (File.Exists(_settingsPath))
            {
                var json = await File.ReadAllTextAsync(_settingsPath);
                settings = JsonSerializer.Deserialize<Dictionary<string, object>>(json) 
                    ?? new Dictionary<string, object>();
            }
            else
            {
                settings = new Dictionary<string, object>();
            }

            settings[key] = value!;

            var newJson = JsonSerializer.Serialize(settings, new JsonSerializerOptions 
            { 
                WriteIndented = true 
            });
            
            await File.WriteAllTextAsync(_settingsPath, newJson);
        }
        finally
        {
            _lock.Release();
        }
    }

    public async Task<int> GetLastUsedComPortAsync()
    {
        var result = await GetSettingAsync<int>("LastUsedComPort");
        return result;
    }

    public async Task SaveLastUsedComPortAsync(int portNumber)
    {
        await SaveSettingAsync("LastUsedComPort", portNumber);
    }
}
