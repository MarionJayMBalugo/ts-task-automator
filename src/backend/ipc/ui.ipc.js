/**
 * =============================================================================
 * UI IPC HANDLERS
 * =============================================================================
 * Handles requests specific to the user interface, like view loading and versions.
 */
const { ViewSvc } = require('#svc');

module.exports = function setUiIPC(ipcMain, app) {
    
    // Sends the current application version
    ipcMain.handle('get-app-version', () => {
        return app.getVersion();
    });

    ipcMain.handle('load-view', (_, viewName) => {
        return ViewSvc.loadHtml(`views/${viewName}/template`);
    });

    ipcMain.handle('load-partial', (_, prtlName) => {
        return ViewSvc.loadHtml(`partials/${prtlName}`);
    });
};