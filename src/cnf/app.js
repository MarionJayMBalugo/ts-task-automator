/**
 * =============================================================================
 * APPLICATION CONFIGURATION (APP_CNF)
 * =============================================================================
 * This module acts as the Single Source of Truth for application metadata,
 * window dimensions, and critical system paths.
 */

const { app } = require('electron'); // <-- FIXED: Required to use app.getAppPath()
const path = require('node:path');

// When unbundled, this is your project root. When packaged, it is the app.asar archive.
const rootDir = app.getAppPath();

/** * esbuild will automatically resolve and inline this package.json at build time,
 * so we don't have to worry about the path breaking in production!
 */
const packageJson = require('../../package.json');

const APP_CNF = {
    // --- UI & Appearance ---
    title: "TMS Pulse",          // The text displayed in the OS Title Bar
    width: 950,                  // Default window width in pixels
    height: 750,                 // Default window height in pixels
    bgColor: '#f0f2f5',          // Background color shown while UI loads
    defDrv: 'D',
    devDefDrv: 'C',
    encoding: 'utf8',
    
    /**
     * Application ID (UAMID)
     * Prioritizes the ID defined in electron-builder config, 
     * falling back to a generated string based on the package name.
     */
    appId: packageJson.build?.appId || `com.tsautomation.${packageJson.name}`,

    // --- File System Paths (ESBUILD BUNDLE-PROOF) ---
    // All paths now point to the 'dist' folder where esbuild copies our static assets.
    
    uiDir: path.join(rootDir, 'dist', 'ui'),
    
    /** Path to the application icon used in the taskbar and window frame */
    icon: path.join(rootDir, 'dist', 'assets', 'icon.png'),
    
    /** The main entry point for the frontend (the HTML "Shell") */
    uiPath: path.join(rootDir, 'dist', 'ui', 'index.html'),
    
    /** The bridge script that connects the Renderer process to the Main process */
    preload: path.join(rootDir, 'dist', 'preload.js'),

    // --- External Resources ---
    // The unpackKey tells electron-builder NOT to compress these files so Windows can run them.
    resourcesFldr: path.join('dist', 'resources'),
    unpackKey: 'app.asar.unpacked',

    // --- OS Detection Flags ---
    // Used throughout the app to handle platform-specific logic
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