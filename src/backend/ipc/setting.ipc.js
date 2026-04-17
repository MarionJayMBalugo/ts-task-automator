/**
 * =============================================================================
 * SETTINGS IPC HANDLERS
 * =============================================================================
 * Acts strictly as a router for reading/writing user preferences.
 */
const { SetSvc } = require('#svc');
const { MSG } = require('#cnf');

module.exports = (ipcMain) => {
    // Reads the entire settings object
    ipcMain.handle('get-settings', () => SetSvc.get());

    // Reads just the custom script location
    ipcMain.handle('cfg-path', () => SetSvc.get().customScriptLoc);

    // Triggers OS dialog to select a folder
    ipcMain.handle('sel-dir', async () => {
        return await SetSvc.selectCustomDir();
    });

    // Resets the folder location and returns success msg
    ipcMain.handle('rst-cfg', () => {
        SetSvc.resetCustomDir();
        return MSG.ok.resetDir;
    });
    
    // Toggles the auto-close CMD window flag
    ipcMain.handle('tog-exit', (_, val) => SetSvc.update('autoCloseCmd', val));

    // Sets the target drive letter (e.g., 'E:')
    ipcMain.handle('set-drv', (_, val) => SetSvc.update('targetDrive', val));
};