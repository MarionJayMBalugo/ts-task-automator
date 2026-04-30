/**
 * =============================================================================
 * APPLICATION & FILE SERVICE (AppSvc)
 * =============================================================================
 * Handles all file system scans, application discovery, and native OS dialogs.
 * * WHY: The renderer (UI) runs in a sandbox and cannot touch the hard drive. 
 * This service does the heavy lifting of finding where apps are actually 
 * installed on the user's local machine.
 */

const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs');
const { exec } = require('child_process');

const { dialog } = require('electron');
const { FsUtil } = require('#utils');
const { DF_DRV, TMS_TOOLS, TMS_DOS, INFRA_FOLDERS } = require('#cnf');    // System-wide default drv constant (usually 'E')

// Direct import to avoid circular dependency issues when the app first boots.
const SetSvc = require('../settings.svc.js'); 

const AppSvc = {
    // =========================================================================
    // --- APPLICATION DISCOVERY ---
    // =========================================================================

    /**
     * Checks if a specific application exists on the local machine.
     * * WHY THOSE SPECIFIC PATHS?: Windows installations are notoriously messy. 
     * An app might be installed on the root drive, in AppData (user-specific), 
     * or globally in ProgramData. This scans all standard hiding spots.
     * * @param {string} baseDrive - The primary drv to check (e.g., 'E:\').
     * @param {string[]} folderNames - Array of possible folder names or shortcut names.
     * @returns {boolean} True if the app or its shortcut (.lnk) is found.
     */
    checkApp: (baseDrive, folderNames) => {
        const paths = [
            baseDrive, 
            path.join(baseDrive, 'tms-tools'), 
            path.join(os.homedir(), 'AppData', 'Local', 'Programs'), // User-level installs (e.g., VS Code)
            'C:\\ProgramData\\Microsoft\\Windows\\Start Menu\\Programs', // Global Start Menu
            path.join(os.homedir(), 'AppData', 'Roaming', 'Microsoft', 'Windows', 'Start Menu', 'Programs') // User Start Menu
        ].filter(fs.existsSync); // Drops any paths that don't exist on this PC to save processing time

        return paths.some(base => 
            folderNames.some(name => 
                // Checks for both the raw folder name AND Windows Shortcuts (.lnk)
                fs.existsSync(path.join(base, name)) || fs.existsSync(path.join(base, `${name}.lnk`))
            )
        );
    },

    /**
     * Scans for a batch of applications based on a configuration object.
     * * WHY: This is the engine that powers the green/red "Validation Badges" 
     * on the Dashboard UI. It loops through the config and tests every app.
     * @param {string} baseDrive - The active target drv.
     * @param {Object} appConfig - Dictionary of apps (e.g., { vscode: ['Visual Studio Code'] }).
     * @returns {Object} Key-value pair of results (e.g., { vscode: true, mirth: false }).
     */
    scanAllApps: (baseDrive, appConfig) => {
        const results = {};
        Object.entries(appConfig).forEach(([key, searchTerms]) => {
            results[key] = AppSvc.checkApp(baseDrive, searchTerms);
        });
        return results;
    },

    // =========================================================================
    // --- INSTALLER RESOLUTION ---
    // =========================================================================

    /**
     * [Service] TMS-DOS Specific Search
     * Wrapper for a partial match search within the standard TMS tools directory.
     * Uses 'TMS_TOOLS' constant for the dir and 'TMS_DOS' for the filename pattern.
     * @returns {Promise<string[]>} Array of matching installer paths.
     */
    getInstallerTmsD: async () => {
        return await AppSvc.getPartialMatch(TMS_TOOLS, TMS_DOS, '.exe');
    },

    /**
     * [Service] Generic Partial Match Resolver
     * Dynamically constructs the search path based on the current App configuration.
     * * WHY: Software versions change (e.g., "tms-dos Setup 1.0.1.exe"). A partial 
     * match ensures we find the installer even if the version numbers update.
     * * @param {string} dir - The sub-directory to search within (e.g., 'tms-tools').
     * @param {string} flname - Part of the filename to look for.
     * @param {string} ext - The file extension filter (e.g., '.exe').
     */
    getPartialMatch: async (dir, flname, ext) => {
        // 1. Resolve Drive (drv) & Build Absolute Path (pth): 
        //    Prioritize 'targetDrive' from SetSvc. If undefined, fallback to Default Drive (DF_DRV).
        //    Joins the resolved drive with the requested directory.
        dir = path.join(FsUtil.getDrv(SetSvc.get().targetDrive, `${DF_DRV}:\\`), dir);
        
        // 2. Execute Search:
        //    Delegates to FsUtil to scan the directory for the partial match.
        return (await FsUtil.getPartialMatch(dir, flname, ext)).map(file => path.join(dir, file));
    },

    // =========================================================================
    // --- NATIVE OS BRIDGES ---
    // =========================================================================

    /**
     * [DIALOG] Native Windows File/Folder Explorer
     * Opens the operating system's native dialog window.
     * * WHY: Standard HTML <input type="file"> hides the absolute system pth 
     * (e.g., C:\...) for security. We must use this native bridge to get the full 
     * pth required to run batch scripts.
     * * @param {string} title - Window header text.
     * @param {string[]} prop - Dialog flags (e.g., ['openFile'] or ['openDirectory']).
     * @returns {Promise<string|null>} The first absolute pth selected, or null if canceled.
     */
    showOpenDialog: async (title, prop) => {
        const { canceled, filePaths } = await dialog.showOpenDialog({
            title: title,
            properties: prop,
        });
        
        // Return null if the user clicked the 'X' or 'Cancel', otherwise return the string.
        return canceled ? null : filePaths[0];
    },

    chckAppInstalld: async (_, name) => {
        return new Promise((resolve) => {
            const cmd = `reg query "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall" /s /f "${name}"`;
            exec(cmd, (err, stdout) => {
                resolve(!!(stdout && stdout.includes(name)));
            });
        });
    },

    checkInfraFolders: () => {
        const settings = SetSvc.get();
        const baseDrive = settings.targetDrive || `${DF_DRV}:\\`;
        
        // Strip trailing slash if it exists, then re-add it cleanly
        const cleanDrive = baseDrive.replace(/\\+$/, '') + '\\';

        return INFRA_FOLDERS.map(folder => {
            const fullPath = path.join(cleanDrive, folder);
            return {
                name: folder,
                installed: fs.existsSync(fullPath)
            };
        });
    },
}

module.exports = AppSvc;