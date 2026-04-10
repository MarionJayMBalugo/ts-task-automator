/**
 * =============================================================================
 * EXECUTION SERVICE (ExecSvc)
 * =============================================================================
 * Handles all native OS command execution, PowerShell scripts, and batch file 
 * routing. If it opens a terminal or runs a script, it lives here.
 */

const util = require('node:util');
const fs = require('node:fs');
const path = require('node:path');
const { exec: execCb } = require('node:child_process');

// Promisified exec for cleaner async/await syntax when we need to capture stdout
const execAsync = util.promisify(require('node:child_process').exec);

// Context & Utils
const SetSvc = require('../settings.svc.js'); // Direct import to avoid circular dependency
const { SysUtil } = require('#utils/index.js');
const { APP_CNF, MSG, CMD_OPTS } = require('#cnf/index.js');

const ExecSvc = {
    // =========================================================================
    // --- SCRIPT LAUNCHERS ---
    // =========================================================================

    /**
     * [ELEVATED EXECUTION] Run Batch Script as Administrator
     * * WHY: Many TMS scripts (like setting environment variables or configuring IIS) 
     * require Admin rights. This function constructs a secure PowerShell wrapper 
     * that forces the Windows UAC (User Account Control) prompt to appear before running.
     * * @param {Object} app - The global Electron app instance.
     * @param {string} fileName - The name of the batch script (e.g., 'install.bat').
     * @param {Object} data - Parameters to pass into the script as CLI arguments.
     * @returns {Promise<string>} Success message or rejection error.
     */
    runAdminBatch: (app, fileName, data) => {
        return new Promise((resolve, reject) => {
            const settings = SetSvc.get();
            
            // 1. Locate the internal packaged script
            let internalPath = SysUtil.getResPath(app, fileName); 
            
            // 🚨 CRITICAL FIX FOR PRODUCTION (ASAR TRAP) 🚨
            // Electron bundles apps into a read-only archive (.asar). 
            // Windows CMD cannot execute a .bat file hidden inside an archive!
            // We ensure it targets the '.unpacked' version which lives in the real OS file system.
            if (internalPath.includes('app.asar') && !internalPath.includes('app.asar.unpacked')) {
                internalPath = internalPath.replace('app.asar', 'app.asar.unpacked');
            }

            // 2. Check for User Overrides
            // If the user set a 'Custom Script Location' in the UI, prioritize that folder.
            const externalPath = settings.customScriptLoc ? path.join(settings.customScriptLoc, fileName) : null;
            const finalPath = (externalPath && fs.existsSync(externalPath)) ? externalPath : internalPath;
            
            // 3. Construct Command Line Arguments
            const cmdFlag = settings.autoCloseCmd ? CMD_OPTS.close : CMD_OPTS.keep;
            const driveArg = (settings.targetDrive || `${APP_CNF.defDrv}:`).replace(/\\+$/, '');
            const scriptArgs = SysUtil.formatCliArgs(data);

            // 4. Build PowerShell Wrapper
            // Starts a new CMD process via PS, passing the script and its arguments, and forces '-Verb RunAs' for Admin privileges.
            const command = `powershell -Command "Start-Process cmd -ArgumentList '${cmdFlag} \\"\\"${finalPath}\\" ${driveArg} ${scriptArgs}\\"' -Verb RunAs"`;
            
            // 5. Execute
            execCb(command, (error) => {
                if (error) reject(MSG.err.elevation);
                else resolve(MSG.ok.batchLaunch(fileName));
            });
        });
    },

    /**
     * [UTILITY] Export Bundled Scripts
     * Copies all internal .bat files out of the Electron app to a user-selected folder.
     * * WHY: Allows advanced users to modify the automation scripts directly 
     * without having to recompile the Electron app.
     * * @param {Object} app - The global Electron app instance.
     * @returns {string} Success or Error message from the MSG config.
     */
    exportScripts: (app) => {
        const dest = SetSvc.get().customScriptLoc;
        if (!dest) return MSG.err.noDir;
        
        let source = SysUtil.getResPath(app); 
        
        // 🚨 CRITICAL FIX FOR PRODUCTION (ASAR TRAP) 🚨
        if (source.includes('app.asar') && !source.includes('app.asar.unpacked')) {
            source = source.replace('app.asar', 'app.asar.unpacked');
        }
            
        try {
            if (!fs.existsSync(source)) return MSG.err.noSrc(source);
            
            // Copies the entire folder natively
            fs.cpSync(source, dest, { recursive: true, force: true });
            return MSG.ok.exported(dest);
            
        } catch (err) { 
            return MSG.err.exportFail(err.message); 
        }
    },

    // =========================================================================
    // --- DIRECT POWERSHELL EXECUTION ---
    // =========================================================================

    /**
     * [SILENT EXECUTION] Run PowerShell Command
     * Executes a raw PS command in the background without opening a visible window.
     * * WHY: Used by OsSvc to silently gather System Hardware info (RAM, Disk Space) 
     * without interrupting the user.
     * * @param {string} cmd - The PowerShell command to run.
     * @returns {Promise<string|null>} Trimmed standard output, or null if it fails.
     */
    execPS: async (cmd) => {
        try {
            // -NoProfile ensures it runs fast without loading user-specific PS themes/configs
            const { stdout } = await execAsync(`powershell -NoProfile -Command "${cmd}"`);
            return stdout ? stdout.trim() : null;
        } catch { 
            return null; 
        }
    },
}

module.exports = ExecSvc;