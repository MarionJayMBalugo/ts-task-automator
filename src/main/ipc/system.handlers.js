/**
 * =============================================================================
 * SYSTEM IPC HANDLERS
 * =============================================================================
 * This module registers all Inter-Process Communication (IPC) listeners for 
 * system-level operations including file management, batch execution, 
 * and hardware diagnostics.
 */

const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { dialog } = require('electron');
const { exec } = require('node:child_process');

// Internal Service Imports
const SetSvc = require('../services/settings.svc');
const SystemService = require('../services/system.service');
const ToolSvc = require('#svc/tools.svc.js');

module.exports = function registerSystemHandlers(ipcMain, app) {
    /** @type {boolean} Flag to determine if running in production (ASAR) or development */
    const isPackaged = app.isPackaged;

    // -------------------------------------------------------------------------
    // SECTION: SCRIPTS & BATCH FILES
    // -------------------------------------------------------------------------

    /**
     * Copies bundled resource scripts to a user-defined external directory.
     * Uses 'app.asar.unpacked' in production because .bat/.ps1 files 
     * cannot be executed directly from within a compressed ASAR archive.
     */
    ipcMain.handle('copy-scripts', async () => {
        const settings = SetSvc.get();
        const destination = settings.customScriptPath;
        
        if (!destination) return "❌ Error: Select a folder first!";
        
        // Define source based on environment:
        // In Prod: Resources are extracted to app.asar.unpacked
        // In Dev:  Resources are in the root /resources folder
        const source = isPackaged 
            ? path.join(process.resourcesPath, 'app.asar.unpacked', 'resources') 
            : path.join(app.getAppPath(), 'resources');
            
        try {
            if (!fs.existsSync(source)) return `❌ Error: Source 'resources' not found at ${source}`;
            
            // recursive: true ensures subfolders (like tms-dos) are copied
            // force: true allows overwriting existing files
            fs.cpSync(source, destination, { recursive: true, force: true });
            
            return `✅ Successfully exported all scripts and folders to: ${destination}`;
        } catch (err) { 
            return `❌ Export failed: ${err.message}`; 
        }
    });

    /**
     * Executes a .bat or .cmd file with Administrative Privileges.
     * Logic:
     * 1. Aggregates optional 'data' into a flat argument string.
     * 2. Checks if a customized version of the script exists in 'externalPath'.
     * 3. Wraps the call in PowerShell 'Start-Process -Verb RunAs' to trigger UAC.
     */
    ipcMain.on('execute-batch', (event, fileName, data) => {
        let args = [];
    
        // Parse incoming data object into a CLI-friendly argument array
        if (data) {
            Object.values(data).forEach(val => {
                if (Array.isArray(val)) {
                    args.push(...val); // Flatten arrays (useful for multi-select DB lists)
                } else {
                    args.push(val.toString());
                }
            });
        }

        const settings = SetSvc.get();
        const internalBase = isPackaged 
            ? path.join(process.resourcesPath, 'app.asar.unpacked', 'resources') 
            : path.join(app.getAppPath(), 'resources');
            
        const internalPath = path.join(internalBase, fileName);
        const externalPath = settings.customScriptPath ? path.join(settings.customScriptPath, fileName) : null;
        
        // Priority: Use the user's exported script if it exists, otherwise use the internal fallback
        let finalPath = (externalPath && fs.existsSync(externalPath)) ? externalPath : internalPath;
        
        // Determine if the CMD window should stay open (/k) or auto-close (/c) based on settings
        const cmdFlag = settings.autoCloseCmd ? '/c' : '/k';
        const driveArg = (settings.targetDrive || 'D:').replace(/\\+$/, '');
        
        // Sanitize arguments with escaped quotes to handle paths with spaces
        const scriptArgs = args.length > 0 ? args.map(arg => `\\"${arg}\\"`).join(' ') : '';

        /**
         * The "Command Chain":
         * PowerShell -> Start-Process (as Admin) -> CMD -> Target Script
         */
        const command = `powershell -Command "Start-Process cmd -ArgumentList '${cmdFlag} \\"\\"${finalPath}\\" ${driveArg} ${scriptArgs}\\"' -Verb RunAs"`;
        
        exec(command, (error) => {
            if (error) event.reply('batch-reply', `Error: Elevation denied or failed.`);
            else event.reply('batch-reply', `Launched ${fileName} as Administrator.`);
        });
    });

    /**
     * Generic Tool Launcher
     * Routes to ToolSvc to handle 'exec' (system apps) vs 'shell' (directories)
     */
    ipcMain.on('open-sys-tool', async (event, toolKey) => {
        await ToolSvc.runTool(event, toolKey);
    });

    // -------------------------------------------------------------------------
    // SECTION: SYSTEM DIAGNOSTICS
    // -------------------------------------------------------------------------

    /**
     * Comprehensive System Scan
     * Gathers OS info, Hardware specs, Network status, and Directory health.
     * This is the heavy-lifter for the 'Dashboard' and 'Server Validation' tabs.
     */
    ipcMain.handle('get-system-info', async () => {
        const settings = SetSvc.get();
        const targetDrive = settings.targetDrive || 'D:\\';
        const baseDrive = targetDrive.endsWith('\\') ? targetDrive : targetDrive + '\\';
        const targetDriveLetter = targetDrive.charAt(0).toUpperCase();

        // 1. Basic OS & Hardware Info (via Node 'os' module)
        const hostname = os.hostname();
        const ramGB = Math.round(os.totalmem() / (1024 ** 3));
        const cpus = os.cpus();
        const cpuInfo = `${cpus.length} Cores, ${cpus[0].model}`;
        
        // Fetch OS Caption via PowerShell for a "human-friendly" name (e.g. "Windows 11 Pro")
        const osVersion = await SystemService.execPS('(Get-CimInstance Win32_OperatingSystem).Caption') || os.release();

        // 2. Network IP Resolution
        // Filters out internal/loopback addresses to find the primary LAN IPv4
        let ip = 'Offline';
        const nets = os.networkInterfaces();
        for (const name of Object.keys(nets)) {
            for (const net of nets[name]) {
                if (net.family === 'IPv4' && !net.internal) ip = net.address;
            }
        }

        // 3. Connectivity & Environment Checks
        // Runs concurrently via Promise.all for maximum performance speed (avoids "Waterfall" loading)
        const urls = await Promise.all([
            SystemService.checkUrl('https://upload.timelesslabs.com/'), 
            SystemService.checkUrl('https://deploy.timelesslabs.com/'),
            SystemService.checkUrl('https://myaccount.google.com/'), 
            SystemService.checkUrl('https://www.innovarhealthcare.com/'),
            SystemService.checkUrl('https://www.nextgen.com/')
        ]);

        // 4. Storage & Application Checks
        const driveC = await SystemService.getDSpace('C');
        const driveTarget = targetDriveLetter !== 'C' ? await SystemService.getDSpace(targetDriveLetter) : null;

        return {
            ip, hostname, ramGB, cpuInfo, osVersion,
            driveD: "Checked " + targetDrive,
            storage: { c: driveC, target: driveTarget },
            urls: { 
                upload: urls[0], deploy: urls[1], google: urls[2], 
                innovar: urls[3], nextgen: urls[4] 
            },
            // Checks for specific software folder presence on the target drive
            apps: {
                tmsDos: SystemService.checkApp(baseDrive, ['tms-dos', 'TMS-DOS', 'TMS DOS']), 
                mirth: SystemService.checkApp(baseDrive, ['Mirth Connect', 'mirth']),
                bridgelink: SystemService.checkApp(baseDrive, ['BridgeLink', 'BridgeLink Administrator Launcher']), 
                vscode: SystemService.checkApp(baseDrive, ['Microsoft VS Code', 'Visual Studio Code', 'vscode'])
            }
        };
    });
};