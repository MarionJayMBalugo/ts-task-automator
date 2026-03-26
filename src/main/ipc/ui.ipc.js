const path = require('node:path');
const fs = require('node:fs');

module.exports = function setUiIPC(ipcMain, app) {
    
    // Send the current version from package.json to the UI
    ipcMain.handle('get-app-version', () => {
        return app.getVersion();
    });

    // Handle the SPA view loading
    ipcMain.handle('load-view', (event, viewName) => {
        try {
            // Since this file is in src/main/ipc, we go up twice to reach src/ui/views
            const viewPath = path.join(__dirname, '..', '..', 'ui', 'views', `${viewName}.html`);
            return fs.readFileSync(viewPath, 'utf8');
        } catch (error) {
            console.error(`Failed to load view ${viewName}:`, error);
            // Return a safe fallback UI component if the file is missing
            return `<div class="p-5 text-center text-danger">
                        <h4>Error 404: View Not Found</h4>
                        <p>Could not locate ${viewName}.html</p>
                    </div>`;
        }
    });
};