const { dialog } = require('electron');
const SetSvc = require('../services/settings.svc');

module.exports = function registerSettingsHandlers(ipcMain) {
    ipcMain.handle('get-settings', () => SetSvc.get());
    ipcMain.handle('get-config-path', () => SetSvc.get().customScriptPath);

    ipcMain.handle('select-folder', async () => {
        const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
        if (!result.canceled && result.filePaths.length > 0) {
            SetSvc.update('customScriptPath', result.filePaths[0]);
            return result.filePaths[0];
        }
        return null;
    });

    ipcMain.handle('reset-config', () => SetSvc.update('customScriptPath', ""));
    ipcMain.handle('toggle-auto-close', (_, val) => SetSvc.update('autoCloseCmd', val));
    ipcMain.handle('set-target-drive', (_, val) => SetSvc.update('targetDrive', val));
};