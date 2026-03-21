const { ipcMain, dialog, app } = require('electron');
const path = require('node:path');
const { exec } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');      
const https = require('node:https');

const settingsPath = path.join(app.getPath('userData'), 'settings.json');
const isPackaged = app.isPackaged;

// Helper: Get Settings
function getSettings() {
  try {
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, 'utf8');
      return JSON.parse(data || '{"customScriptPath": "", "autoCloseCmd": false, "targetDrive": "D:\\\\"}');
    }
  } catch (e) { 
    console.error("Settings read error:", e); 
  }
  return { customScriptPath: "", autoCloseCmd: false, targetDrive: "D:\\" };
}

// Export a single setup function
module.exports = function setupIPC() {
    ipcMain.handle('get-config-path', () => getSettings().customScriptPath);
    
    ipcMain.handle('get-settings', () => getSettings());

    ipcMain.handle('get-app-version', () => app.getVersion());

    // --- WORKSPACE & SETTINGS ---
    ipcMain.handle('select-folder', async () => {
        const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
        if (!result.canceled && result.filePaths.length > 0) {
            const newPath = result.filePaths[0];
            try {
                const settings = getSettings();
                settings.customScriptPath = newPath;
                fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
                return newPath;
            } catch (err) { console.error("Failed to save settings:", err); }
        }
        return null;
    });
    
    ipcMain.handle('reset-config', () => {
        const settings = getSettings();
        settings.customScriptPath = "";
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
        return "";
    });

    ipcMain.handle('toggle-auto-close', (event, value) => {
        const settings = getSettings();
        settings.autoCloseCmd = value;
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
        return value;
    });

    ipcMain.handle('set-target-drive', (event, value) => {
        const settings = getSettings();
        settings.targetDrive = value;
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
        return value;
    });

    // --- SCRIPTS & BATCH FILES ---
    ipcMain.handle('copy-scripts', async () => {
        const settings = getSettings();
        const destination = settings.customScriptPath;
        if (!destination) return "❌ Error: Select a folder first!";
        const source = isPackaged ? path.join(process.resourcesPath, 'app.asar.unpacked', 'resources') : path.join(app.getAppPath(), 'resources');
        try {
            if (!fs.existsSync(source)) return `❌ Error: Source 'resources' not found at ${source}`;
            fs.cpSync(source, destination, { recursive: true, force: true });
            return `✅ Successfully exported all scripts and folders to: ${destination}`;
        } catch (err) { return `❌ Export failed: ${err.message}`; }
    });

    // --- SYSTEM DIAGNOSTICS ---
    ipcMain.handle('get-system-info', async () => {
        const settings = getSettings();
        const hostname = os.hostname();
        const ramGB = Math.round(os.totalmem() / (1024 ** 3));
        const cpus = os.cpus();
        const cpuInfo = `${cpus.length} Cores, ${cpus[0].model}`;
        const execPS = (cmd) => new Promise(res => exec(`powershell -NoProfile -Command "${cmd}"`, (err, stdout) => res(stdout ? stdout.trim() : null)));
        const osVersion = await execPS('(Get-CimInstance Win32_OperatingSystem).Caption') || os.release();

        let ip = 'Offline';
        const nets = os.networkInterfaces();
        for (const name of Object.keys(nets)) {
            for (const net of nets[name]) {
                if (net.family === 'IPv4' && !net.internal) ip = net.address;
            }
        }

        const checkUrl = (urlStr) => new Promise(res => {
            const options = { timeout: 5000, rejectUnauthorized: false };
            const req = https.get(urlStr, options, (response) => {
                res(response.statusCode < 500); 
            }).on('error', () => res(false));
            req.setTimeout(5000, () => { req.destroy(); res(false); }); 
        });

        const urls = await Promise.all([
            checkUrl('https://upload.timelesslabs.com/'), checkUrl('https://deploy.timelesslabs.com/'),
            checkUrl('https://myaccount.google.com/'), checkUrl('https://www.innovarhealthcare.com/'),
            checkUrl('https://www.nextgen.com/')
        ]);

        const targetDrive = settings.targetDrive || 'D:\\';
        const baseDrive = targetDrive.endsWith('\\') ? targetDrive : targetDrive + '\\';
        
        const checkApp = (folderNames) => {
            const searchPaths = [
                baseDrive, path.join(baseDrive, 'tms-tools'), path.join(os.homedir(), 'AppData', 'Local', 'Programs'),
                'C:\\ProgramData\\Microsoft\\Windows\\Start Menu\\Programs',
                path.join(os.homedir(), 'AppData', 'Roaming', 'Microsoft', 'Windows', 'Start Menu', 'Programs')
            ];
            for (const base of searchPaths) {
                if (!fs.existsSync(base)) continue;
                for (const name of folderNames) {
                    if (fs.existsSync(path.join(base, name)) || fs.existsSync(path.join(base, name + '.lnk'))) return true;
                }
            }
            return false;
        };

        return {
            ip, hostname, ramGB, cpuInfo, osVersion, driveD: "Checked " + targetDrive,
            urls: { upload: urls[0], deploy: urls[1], google: urls[2], innovar: urls[3], nextgen: urls[4] },
            apps: {
                tmsDos: checkApp(['tms-dos', 'TMS-DOS', 'TMS DOS']), mirth: checkApp(['Mirth Connect', 'mirth']),
                bridgelink: checkApp(['BridgeLink', 'BridgeLink Administrator Launcher']), vscode: checkApp(['Microsoft VS Code', 'Visual Studio Code', 'vscode'])
            }
        };
    });

    // --- UI HELPERS ---
    ipcMain.handle('load-view', (event, viewName) => {
        try {
            const viewPath = path.join(__dirname, '..', '..', 'ui', 'views', `${viewName}.html`);
            return fs.readFileSync(viewPath, 'utf8');
        } catch (error) {
            console.error(`Failed to load view ${viewName}:`, error);
            return `<div class="p-5 text-center text-danger"><h4>Error loading view: ${viewName}</h4></div>`;
        }
    });

    ipcMain.on('execute-batch', (event, fileName) => {
        const settings = getSettings();
        const internalBase = isPackaged ? path.join(process.resourcesPath, 'app.asar.unpacked', 'resources') : path.join(app.getAppPath(), 'resources');
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
        const drive = (getSettings().targetDrive || 'D:\\').charAt(0) + ':';

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

        if (command) exec(command, (err) => { if (err) console.error(`Failed to open ${toolKey}:`, err); });
    });
};