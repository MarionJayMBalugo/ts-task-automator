const { dialog } = require('electron');
const SettingsService = require('../services/settings.service');

module.exports = function registerSettingsHandlers(ipcMain) {
    ipcMain.handle('get-settings', () => SettingsService.get());
    ipcMain.handle('get-config-path', () => SettingsService.get().customScriptPath);

    ipcMain.handle('select-folder', async () => {
        const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
        if (!result.canceled && result.filePaths.length > 0) {
            SettingsService.update('customScriptPath', result.filePaths[0]);
            return result.filePaths[0];
        }
        return null;
    });

    ipcMain.handle('reset-config', () => SettingsService.update('customScriptPath', ""));
    ipcMain.handle('toggle-auto-close', (_, val) => SettingsService.update('autoCloseCmd', val));
    ipcMain.handle('set-target-drive', (_, val) => SettingsService.update('targetDrive', val));
};