const { exec } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const SettingsService = require('../services/settings.service');
const SystemService = require('../services/system.service');

module.exports = function registerSystemHandlers(ipcMain, app) {
    const isPackaged = app.isPackaged;

    // --- SCRIPTS & BATCH FILES ---
    ipcMain.handle('copy-scripts', async () => {
        const settings = SettingsService.get();
        const destination = settings.customScriptPath;
        if (!destination) return "❌ Error: Select a folder first!";
        
        const source = isPackaged 
            ? path.join(process.resourcesPath, 'app.asar.unpacked', 'resources') 
            : path.join(app.getAppPath(), 'resources');
            
        try {
            if (!fs.existsSync(source)) return `❌ Error: Source 'resources' not found at ${source}`;
            fs.cpSync(source, destination, { recursive: true, force: true });
            return `✅ Successfully exported all scripts and folders to: ${destination}`;
        } catch (err) { 
            return `❌ Export failed: ${err.message}`; 
        }
    });

    ipcMain.on('execute-batch', (event, fileName) => {
        const settings = SettingsService.get();
        const internalBase = isPackaged 
            ? path.join(process.resourcesPath, 'app.asar.unpacked', 'resources') 
            : path.join(app.getAppPath(), 'resources');
            
        const internalPath = path.join(internalBase, fileName);
        const externalPath = settings.customScriptPath ? path.join(settings.customScriptPath, fileName) : null;
        let finalPath = (externalPath && fs.existsSync(externalPath)) ? externalPath : internalPath;
        
        const cmdFlag = settings.autoCloseCmd ? '/c' : '/k';
        const driveArg = (settings.targetDrive || 'D:').replace(/\\+$/, ''); 
        const command = `powershell -Command "Start-Process cmd -ArgumentList '${cmdFlag} \\"${finalPath}\\" ${driveArg}' -Verb RunAs"`;
        
        exec(command, (error) => {
            if (error) event.reply('batch-reply', `Error: Elevation denied or failed.`);
            else event.reply('batch-reply', `Launched ${fileName} as Administrator.`);
        });
    });

    ipcMain.on('open-system-tool', (event, toolKey) => {
        let command = '';
        const drive = (SettingsService.get().targetDrive || 'D:\\').charAt(0) + ':';

        switch (toolKey) {
            case 'ipconfig': command = 'start cmd /k "ipconfig /all"'; break;
            case 'dxdiag': command = 'dxdiag'; break;
            case 'explorer-d': command = `explorer ${drive}\\`; break;
            case 'explorer-pc': command = 'explorer shell:MyComputerFolder'; break;
            case 'about-pc': command = 'start ms-settings:about'; break;
            case 'open-tms-dos': command = `explorer ${drive}\\tms-dos`; break;
            case 'open-customers': command = `explorer ${drive}\\Customers`; break;
            case 'open-tms-tools': command = `explorer ${drive}\\tms-tools`; break;
        }

        if (command) {
            exec(command, (err) => { 
                if (err) console.error(`Failed to open ${toolKey}:`, err); 
            });
        }
    });

    // --- SYSTEM DIAGNOSTICS ---
    ipcMain.handle('get-system-info', async () => {
        const settings = SettingsService.get();
        const targetDrive = settings.targetDrive || 'D:\\';
        const baseDrive = targetDrive.endsWith('\\') ? targetDrive : targetDrive + '\\';

        // 1. Basic OS Info
        const hostname = os.hostname();
        const ramGB = Math.round(os.totalmem() / (1024 ** 3));
        const cpus = os.cpus();
        const cpuInfo = `${cpus.length} Cores, ${cpus[0].model}`;
        const osVersion = await SystemService.execPS('(Get-CimInstance Win32_OperatingSystem).Caption') || os.release();

        // 2. Network IP
        let ip = 'Offline';
        const nets = os.networkInterfaces();
        for (const name of Object.keys(nets)) {
            for (const net of nets[name]) {
                if (net.family === 'IPv4' && !net.internal) ip = net.address;
            }
        }

        // 3. Check URLs concurrently for speed
        const urls = await Promise.all([
            SystemService.checkUrl('https://upload.timelesslabs.com/'), 
            SystemService.checkUrl('https://deploy.timelesslabs.com/'),
            SystemService.checkUrl('https://myaccount.google.com/'), 
            SystemService.checkUrl('https://www.innovarhealthcare.com/'),
            SystemService.checkUrl('https://www.nextgen.com/')
        ]);

        return {
            ip, hostname, ramGB, cpuInfo, osVersion, driveD: "Checked " + targetDrive,
            urls: { upload: urls[0], deploy: urls[1], google: urls[2], innovar: urls[3], nextgen: urls[4] },
            apps: {
                tmsDos: SystemService.checkApp(baseDrive, ['tms-dos', 'TMS-DOS', 'TMS DOS']), 
                mirth: SystemService.checkApp(baseDrive, ['Mirth Connect', 'mirth']),
                bridgelink: SystemService.checkApp(baseDrive, ['BridgeLink', 'BridgeLink Administrator Launcher']), 
                vscode: SystemService.checkApp(baseDrive, ['Microsoft VS Code', 'Visual Studio Code', 'vscode'])
            }
        };
    });
};