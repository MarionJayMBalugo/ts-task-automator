/**
 * =============================================================================
 * SYSTEM IPC HANDLERS
 * =============================================================================
 * Acts strictly as a router, passing frontend requests to the Service layer.
 */

const { SysSvc, ToolSvc } = require('#svc/index.js');

module.exports = function setSysIPC(ipcMain, app) {

    // --- SCRIPTS & TOOLS ---

    // Exports bundled resources to the user's custom script location
    ipcMain.handle('copy-scripts', async () => {
        return SysSvc.exportScripts(app);
    });

    // Spawns elevated PowerShell commands via the service engine
    ipcMain.on('execute-batch', async (event, fileName, data) => {
        try {
            const successMsg = await SysSvc.runAdminBatch(app, fileName, data);
            event.reply('batch-reply', successMsg);
        } catch (errorMsg) {
            event.reply('batch-reply', errorMsg);
        }
    });

    // Opens specific system-level folders or tools
    ipcMain.on('open-sys-tool', async (event, toolKey) => {
        await ToolSvc.runTool(event, toolKey);
    });

    // --- SYSTEM DIAGNOSTICS ---

    // Gathers comprehensive hardware, OS, network, and storage details
    ipcMain.handle('get-system-info', async () => {
        return await SysSvc.getFullSystemInfo();
    });
};