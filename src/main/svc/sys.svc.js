const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs');
const https = require('node:https');
const util = require('node:util');
const execAsync = util.promisify(require('node:child_process').exec);
const { exec: execCb } = require('node:child_process'); // Standard callback version for the batch runner

// Imports
const { APP_CNF, NET_CNF, APP_SCAN, MSG, CMD_OPTS } = require('#cnf/index.js');
const { SysUtil } = require('#utils/index.js');
const SetSvc = require('./settings.svc.js'); // Direct import to avoid circular dependency

const SysSvc = {
    // =========================================================================
    // 1. HIGH-LEVEL ORCHESTRATION (Called directly by IPC)
    // =========================================================================

    /**
     * Gathers all system, network, and app info into a single payload.
     */
    getFullSystemInfo: async () => {
        const settings = SetSvc.get();
        const targetDrive = settings.targetDrive || `${APP_CNF.defDrv}:\\`;
        
        const baseDrive = SysUtil.ensureTrailingSlash(targetDrive);
        const targetDriveLetter = targetDrive.charAt(0).toUpperCase();

        const osData = await SysSvc.getOsInfo();

        const storage = {
            c: await SysSvc.getDSpace(APP_CNF.devDefDrv),
            target: targetDriveLetter !== APP_CNF.devDefDrv ? await SysSvc.getDSpace(targetDriveLetter) : null
        };

        const [urls, apps] = await Promise.all([
            SysSvc.checkAllUrls(NET_CNF.monitors),
            SysSvc.scanAllApps(baseDrive, APP_SCAN)
        ]);

        return {
            ...osData, 
            driveD: "Checked " + targetDrive,
            storage,
            urls,
            apps
        };
    },

    /**
     * Copies all bundled scripts to the user's selected external folder.
     */
    exportScripts: (app) => {
        const dest = SetSvc.get().customScriptLoc;
        if (!dest) return MSG.err.noDir;
        
        let source = SysUtil.getResPath(app); // <-- We change 'const' to 'let'
        
        // 🚨 CRITICAL FIX FOR PRODUCTION (ASAR TRAP) 🚨
        if (source.includes('app.asar')) {
            source = source.replace('app.asar', 'app.asar.unpacked');
        }
            
        try {
            if (!fs.existsSync(source)) return MSG.err.noSrc(source);
            fs.cpSync(source, dest, { recursive: true, force: true });
            return MSG.ok.exported(dest);
        } catch (err) { 
            return MSG.err.exportFail(err.message); 
        }
    },

    /**
     * Executes a batch file with Administrator privileges.
     */
    runAdminBatch: (app, fileName, data) => {
        return new Promise((resolve, reject) => {
            const settings = SetSvc.get();
            
            let internalPath = SysUtil.getResPath(app, fileName); // <-- Change to 'let'
            
            // 🚨 CRITICAL FIX FOR PRODUCTION (ASAR TRAP) 🚨
            if (internalPath.includes('app.asar')) {
                internalPath = internalPath.replace('app.asar', 'app.asar.unpacked');
            }

            const externalPath = settings.customScriptLoc ? path.join(settings.customScriptLoc, fileName) : null;
            
            const finalPath = (externalPath && fs.existsSync(externalPath)) ? externalPath : internalPath;
            const cmdFlag = settings.autoCloseCmd ? CMD_OPTS.close : CMD_OPTS.keep;
            const driveArg = (settings.targetDrive || `${APP_CNF.defDrv}:`).replace(/\\+$/, '');
            
            const scriptArgs = SysUtil.formatCliArgs(data);

            const command = `powershell -Command "Start-Process cmd -ArgumentList '${cmdFlag} \\"\\"${finalPath}\\" ${driveArg} ${scriptArgs}\\"' -Verb RunAs"`;
            
            execCb(command, (error) => {
                if (error) reject(MSG.err.elevation);
                else resolve(MSG.ok.batchLaunch(fileName));
            });
        });
    },

    // =========================================================================
    // 2. CORE ENGINE METHODS (Hardware, Network, OS checks)
    // =========================================================================

    execPS: async (cmd) => {
        try {
            const { stdout } = await execAsync(`powershell -NoProfile -Command "${cmd}"`);
            return stdout ? stdout.trim() : null;
        } catch { return null; }
    },

    getOsInfo: async () => {
        const ip = Object.values(os.networkInterfaces())
            .flat()
            .find(i => i.family === 'IPv4' && !i.internal)?.address || 'Offline';

        const osVersion = await SysSvc.execPS('(Get-CimInstance Win32_OperatingSystem).Caption') || os.release();

        return {
            ip,
            hostname: os.hostname(),
            ramGB: Math.round(os.totalmem() / (1024 ** 3)),
            cpuInfo: `${os.cpus().length} Cores, ${os.cpus()[0].model}`,
            osVersion
        };
    },

    checkUrl: (urlStr) => new Promise(res => {
        const req = https.get(urlStr, { timeout: 5000, rejectUnauthorized: false }, (response) => {
            response.resume(); 
            res(response.statusCode >= 200 && response.statusCode < 400);
        }).on('error', () => res(false));
        req.setTimeout(5000, () => { req.destroy(); res(false); }); 
    }),

    checkAllUrls: async (monitorConfig) => {
        const results = {};
        await Promise.all(
            Object.entries(monitorConfig).map(async ([key, url]) => {
                results[key] = await SysSvc.checkUrl(url);
            })
        );
        return results;
    },

    checkApp: (baseDrive, folderNames) => {
        const paths = [
            baseDrive, 
            path.join(baseDrive, 'tms-tools'), 
            path.join(os.homedir(), 'AppData', 'Local', 'Programs'),
            'C:\\ProgramData\\Microsoft\\Windows\\Start Menu\\Programs',
            path.join(os.homedir(), 'AppData', 'Roaming', 'Microsoft', 'Windows', 'Start Menu', 'Programs')
        ].filter(fs.existsSync);

        return paths.some(base => 
            folderNames.some(name => 
                fs.existsSync(path.join(base, name)) || fs.existsSync(path.join(base, `${name}.lnk`))
            )
        );
    },

    scanAllApps: (baseDrive, appConfig) => {
        const results = {};
        Object.entries(appConfig).forEach(([key, searchTerms]) => {
            results[key] = SysSvc.checkApp(baseDrive, searchTerms);
        });
        return results;
    },

    getDSpace: async (driveLetter) => {
        const dl = driveLetter.replace(/[^A-Za-z]/g, '').toUpperCase() + ':';
        const cmd = `Get-CimInstance Win32_LogicalDisk | Where-Object DeviceID -eq '${dl}' | Select-Object FreeSpace, Size | ConvertTo-Json -Compress`;

        try {
            const out = await SysSvc.execPS(cmd);
            if (!out) return null;
            const data = JSON.parse(out);
            return { 
                letter: dl, 
                free: Math.round(data.FreeSpace / (1024 ** 3)), 
                total: Math.round(data.Size / (1024 ** 3)) 
            };
        } catch { return null; }
    }
};

module.exports = SysSvc;