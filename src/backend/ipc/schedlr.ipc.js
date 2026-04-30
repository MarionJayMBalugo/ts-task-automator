/**
 * =============================================================================
 * TASK SCHEDULER IPC HANDLERS
 * =============================================================================
 * This module bridges the frontend UI with the Windows Task Scheduler service.
 * It allows the renderer process to query existing tasks and deploy new ones
 * using XML definitions stored in the app resources.
 */

const { app } = require('electron'); 
const { SchedlrSvc } = require('#svc');

module.exports = (ipcMain) => {

    /** --- TASK VERIFICATION ---
     * Checks the Windows Task Scheduler to see which of the required 
     * background tasks are currently registered and active.
     */
    ipcMain.handle('chck-schedlrs-installd', async () => {
        return await SchedlrSvc.chckSchedlrsInstalld();
    });

    /** --- TASK DEPLOYMENT ---
     * Installs missing XML-based tasks. 
     * * NOTE: We pass the 'app' instance here so the service can correctly 
     * resolve the path to the internal 'resources' folder, especially 
     * when the app is packaged in a production (.asar) environment.
     */
    ipcMain.handle('instll-schedlrs', async (_, pendingTasks) => {
        return await SchedlrSvc.instllSchedlrs(app, pendingTasks);
    });

    ipcMain.handle('chck-backup-task', async () => {
        return await SchedlrSvc.checkDbBackupTask();
    });

    ipcMain.handle('upgrade-backup-task', async () => {
        return await SchedlrSvc.upgradeDbBackupTask(app);
    });
};