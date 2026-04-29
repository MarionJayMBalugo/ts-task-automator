/**
 * =============================================================================
 * SYSTEM IPC HANDLERS (The Switchboard)
 * =============================================================================
 * Acts strictly as a router. The UI (Renderer) cannot touch the OS layer, 
 * so it sends messages here. This file blindly catches those messages and 
 * routes them to the correct Domain Service (ExecSvc, OsSvc, etc.).
 * * WHY: Keeping this file thin prevents "God Object" anti-patterns.
 */

const { ToolSvc, ExecSvc, OsSvc, AppSvc, InstallerSvc } = require('#svc');
const path = require('node:path');
const { exec } = require('child_process');

module.exports = (ipcMain, app) => {

    // =========================================================================
    // --- SCRIPTS & EXECUTION (Routed to ExecSvc) ---
    // =========================================================================

    /**
     * [IPC: handle] Copy Scripts to Custom Location
     * * WHY: Electron packages files into a read-only archive (.asar). 
     * To run or edit batch scripts natively, we must first extract/copy them 
     * to a writable directory on the user's local drive.
     */
    ipcMain.handle('copy-scripts', async () => {
        return ExecSvc.exportScripts(app);
    });

    /**
     * [IPC: on] Execute Elevated Batch File
     * * WHY WE USE '.on' INSTEAD OF '.handle': Batch files take time to run and 
     * might need to stream continuous output back to the UI later. Using standard 
     * events with 'event.reply' allows for a longer, asynchronous pipeline without 
     * freezing the UI's promise chain.
     */
    ipcMain.on('execute-batch', async (event, fileName, data) => {
        try {
            const successMsg = await ExecSvc.runAdminBatch(app, fileName, data);
            event.reply('batch-reply', successMsg);
        } catch (errorMsg) {
            event.reply('batch-reply', errorMsg); // Sends err back to Notify/Status UI
        }
    });

    /**
     * [IPC: on] Open System Tools
     * Bridges frontend "Quick Access" clicks directly to Windows tools (like opening Explorer).
     */
    ipcMain.on('open-sys-tool', async (event, toolKey) => {
        await ToolSvc.runTool(event, toolKey);
    });

    // =========================================================================
    // --- SYSTEM DIAGNOSTICS (Routed to OsSvc) ---
    // =========================================================================

    /**
     * [IPC: handle] Get Full System Info
     * Gathers heavy OS data (RAM, CPU, Drive Space, Network IP).
     * * WHY: The UI needs this to paint the validation badges. This triggers 
     * multiple heavy PowerShell lookups, so it is awaited as a single payload.
     */
    ipcMain.handle('get-system-info', async () => {
        return await OsSvc.getFullSystemInfo();
    });

    // =========================================================================
    // --- FILES & APPS (Routed to AppSvc) ---
    // =========================================================================

    /**
     * [IPC: handle] Fetch TMS-DOS Installer Path
     * Bridge between UI and System Service to auto-locate the installer executable.
     * Searches standard directories using wildcard matching.
     * @returns {Promise<string|null>} Found absolute file pth or null.
     */
    ipcMain.handle('get-tmsdos-installer', async () => {
        return await AppSvc.getInstallerTmsD();
    });

    /**
     * [IPC: handle] Heidi Installer Path
     * Bridge between UI and System Service to auto-locate the installer executable.
     * Searches standard directories using wildcard matching.
     * @returns {Promise<string|null>} Found absolute file pth or null.
     */
    ipcMain.on('run-heidi-install', (event, targetPath) => {
        const scriptPath = path.resolve(app.getAppPath(), 'resources/install-heidi.bat');
        exec(`start cmd /c ""${scriptPath}" "${targetPath}""`, (error, stdout, stderr) => {
            if (error) return;  
            event.sender.send('heidi-inst-done');
        });
    });

    /**
     * [IPC: handle] Check if Heidi is installed
     * Bridge between UI and System Service to auto-locate the installer executable.
     * Searches standard directories using wildcard matching.
     * @returns {Promise<string|null>} Found absolute file pth or null.
     */
    ipcMain.handle('check-heidi-installed', async () => {
        return new Promise((resolve) => {
            // Query both 64-bit and 32-bit registry paths for HeidiSQL
            const cmd = 'reg query "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall" /s /f "HeidiSQL"';
            exec(cmd, (err, stdout) => {
                resolve(!!(stdout && stdout.includes('HeidiSQL')));
            });
        });
    });

    ipcMain.handle('chck-app-installd', async (_, name) => await AppSvc.chckAppInstalld(_, name));

    /**
     * [DIALOG] Open File Picker
     * Opens the native Windows File Explorer dialog.
     * * WHY: Standard <input type="file"> in Electron/Chromium is stripped of 
     * absolute 'C:\' paths for security. To get the full absolute pth needed for 
     * batch script execution, we must bypass the browser and use native dialogs.
     * * @returns {Promise<string|null>} The full system pth selected, or null if the user cancels.
     */
    ipcMain.handle('dialog:openFile', async () => await AppSvc.showOpenDialog('Select a File', ['openFile']));


    ipcMain.handle('chck-deps-status', async () => {
        return await InstallerSvc.checkDepsStatus();
    });

    ipcMain.handle('install-dependency', async (event, args) => {
        return await InstallerSvc.runSilentInstall(app, args.appId, args.executionData);
    });
};