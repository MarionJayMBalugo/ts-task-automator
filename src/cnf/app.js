/**
 * =============================================================================
 * APPLICATION CONFIGURATION (APP_CNF)
 * =============================================================================
 * This module acts as the Single Source of Truth for application metadata,
 * window dimensions, and critical system paths.
 */

const path = require('node:path');

/** * Dynamically resolve the path to package.json.
 * We move up two levels ('..', '..') from this config file's location 
 * to reach the project root.
 */
const packageJsonPath = path.join(__dirname, '..', '..', 'package.json');
const packageJson = require(packageJsonPath);

const APP_CNF = {
    // --- UI & Appearance ---
    title: "TMS Pulse",          // The text displayed in the OS Title Bar
    width: 950,                  // Default window width in pixels
    height: 750,                 // Default window height in pixels
    bgColor: '#f0f2f5',          // Background color shown while the UI is loading (prevents white flash)
    defDrv: 'D',
    devDefDrv: 'C',
    encoding: 'utf8',
    resourcesFldr: 'resources',
    unpackKey: 'app.asar.unpacked',
    uiDir: path.join(__dirname, '..', 'ui'),
    /**
     * Application ID (UAMID)
     * Prioritizes the ID defined in electron-builder config, 
     * falling back to a generated string based on the package name.
     */
    appId: packageJson.build?.appId || `com.tsautomation.${packageJson.name}`,

    // --- File System Paths ---
    // All paths are absolute to ensure reliability across different OS environments.
    
    /** Path to the application icon used in the taskbar and window frame */
    icon: path.join(__dirname, '..', 'assets', 'icon.ico'),
    
    /** The main entry point for the frontend (the HTML "Shell") */
    uiPath: path.join(__dirname, '..', 'ui', 'index.html'),
    
    /** The bridge script that connects the Renderer process to the Main process */
    preload: path.join(__dirname, '..', 'preload', 'preload.js'),

    // --- OS Detection Flags ---
    // Used throughout the app to handle platform-specific logic (like window closing or shortcuts).
    platform: {
        isMac: process.platform === 'darwin',
        isWindows: process.platform === 'win32',
        isLinux: process.platform === 'linux'
    }
};

/**
 * Export the configuration object for use in main.js and other services.
 */
module.exports = {
  APP_CNF
};