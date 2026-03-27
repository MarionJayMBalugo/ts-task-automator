/**
 * =============================================================================
 * UI IPC HANDLERS
 * =============================================================================
 * Handles requests specific to the user interface, like view loading and versions.
 */
const { FsUtil } = require('#utils/index.js');

module.exports = function setUiIPC(ipcMain, app) {
    
    // Sends the current application version
    ipcMain.handle('get-app-version', () => {
        return app.getVersion();
    });

    // Handles Single Page Application (SPA) view loading
    ipcMain.handle('load-view', (_, viewName) => {
        const htmlContent = FsUtil.readView(viewName);
        
        if (!htmlContent) {
            // We throw a standard error here.
            // The frontend (preload/ui.js) should catch this and render the 404 HTML.
            throw new Error(`View not found: ${viewName}`); 
        }
        
        return htmlContent;
    });
};