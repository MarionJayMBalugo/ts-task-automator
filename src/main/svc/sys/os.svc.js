/**
 * =============================================================================
 * OS & HARDWARE SERVICE (OsSvc)
 * =============================================================================
 * Handles local machine diagnostics (RAM, CPU, Drive Space) AND acts as the 
 * "Master Orchestrator" to gather all system health data into a single payload.
 */

const os = require('node:os');

// Imports
const { APP_CNF, NET_CNF, APP_SCAN } = require('#cnf/index.js');
const { SysUtil } = require('#utils/index.js');

// Domain Services (Direct imports to avoid circular dependency loops on boot)
const SetSvc = require('../settings.svc.js'); 
const ExecSvc = require('./exec.svc.js'); 
const NetSvc = require('./net.svc.js'); 
const AppSvc = require('./app.svc.js'); 

const OsSvc = {
    // =========================================================================
    // --- HARDWARE DIAGNOSTICS ---
    // =========================================================================

    /**
     * [HARDWARE] Gather Basic OS Identity
     * * WHY WE USE POWERSHELL FOR THE OS VERSION:
     * Node's native 'os.release()' only returns a build number (e.g., '10.0.22631'). 
     * We use PowerShell's Win32_OperatingSystem to get the human-readable 
     * caption (e.g., "Microsoft Windows 11 Pro") for the UI Dashboard.
     */
    getOsInfo: async () => {
        // 1. Get the first active IPv4 address that isn't localhost (127.0.0.1)
        const ip = Object.values(os.networkInterfaces())
            .flat()
            .find(i => i.family === 'IPv4' && !i.internal)?.address || 'Offline';

        // 2. Fetch the pretty OS name (Fallback to build number if PS fails)
        const osVersion = await ExecSvc.execPS('(Get-CimInstance Win32_OperatingSystem).Caption') || os.release();

        return {
            ip,
            hostname: os.hostname(),
            ramGB: Math.round(os.totalmem() / (1024 ** 3)), // Convert bytes to Gigabytes
            cpuInfo: `${os.cpus().length} Cores, ${os.cpus()[0].model}`, // e.g., "16 Cores, AMD Ryzen 7..."
            osVersion
        };
    },

    /**
     * [HARDWARE] Fetch Free Disk Space
     * * WHY POWERSHELL?: Node.js does not have a native, cross-platform way to 
     * check free drive space without requiring heavy C++ compiled modules. 
     * PowerShell is the safest, native way to do this on Windows.
     * * @param {string} driveLetter - The drive to check (e.g., 'C' or 'C:').
     */
    getDSpace: async (driveLetter) => {
        // Sanitize input to guarantee format like 'C:'
        const dl = driveLetter.replace(/[^A-Za-z]/g, '').toUpperCase() + ':';
        
        // Asks Windows for the exact drive and converts the output directly into a JSON string
        const cmd = `Get-CimInstance Win32_LogicalDisk | Where-Object DeviceID -eq '${dl}' | Select-Object FreeSpace, Size | ConvertTo-Json -Compress`;

        try {
            const out = await ExecSvc.execPS(cmd);
            if (!out) return null;
            
            const data = JSON.parse(out);
            return { 
                letter: dl, 
                free: Math.round(data.FreeSpace / (1024 ** 3)), // Bytes to GB
                total: Math.round(data.Size / (1024 ** 3))      // Bytes to GB
            };
        } catch { 
            return null; // Return null gracefully so the UI doesn't crash, it just shows "Unknown"
        }
    },

    // =========================================================================
    // --- THE MASTER ORCHESTRATOR ---
    // =========================================================================

    /**
     * [ORCHESTRATOR] Build Validation Payload
     * Gathers all system hardware, network firewall statuses, and app installations 
     * into a single, massive JSON payload for the UI dashboard.
     * * WHY IT USES PROMISE.ALL: If we ran these one by one (Network, then Apps, 
     * then Hardware), the UI spinner would take 10+ seconds. Running them 
     * concurrently slashes the load time down to the slowest individual task.
     */
    getFullSystemInfo: async () => {
        const settings = SetSvc.get();
        
        // 1. Determine the target installation drive (Fallback to App config default if unset)
        const targetDrive = settings.targetDrive || `${APP_CNF.defDrv}:\\`;
        const baseDrive = SysUtil.ensureTrailingSlash(targetDrive);
        const targetDriveLetter = targetDrive.charAt(0).toUpperCase();

        // 2. Fetch Base OS Data
        const osData = await OsSvc.getOsInfo();

        // 3. Fetch Storage Space (Always check C:, plus the target drive if it's different)
        const storage = {
            c: await OsSvc.getDSpace(APP_CNF.devDefDrv),
            target: targetDriveLetter !== APP_CNF.devDefDrv ? await OsSvc.getDSpace(targetDriveLetter) : null
        };

        // 4. Parallel Execution: Fire the Network Pings and Hard-Drive Scans at the same time
        const [urls, apps] = await Promise.all([
            NetSvc.checkAllUrls(NET_CNF.monitors),
            AppSvc.scanAllApps(baseDrive, APP_SCAN)
        ]);

        // 5. Package it all up for the UI (Status.ui.js)
        return {
            ...osData, 
            driveD: "Checked " + targetDrive, // Context string for the UI
            storage,
            urls,
            apps
        };
    },
}

module.exports = OsSvc;