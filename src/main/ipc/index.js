/**
 * =============================================================================
 * IPC REGISTRATION HUB (Index)
 * =============================================================================
 * This module acts as the central traffic controller for Electron's 
 * Inter-Process Communication (IPC). 
 * * Instead of defining every 'ipcMain' listener in one giant file, we 
 * delegate responsibility to specialized modules:
 * - setCfgIPC: Handles persistent storage and app configuration.
 * - setSysIPC: Handles OS-level tasks (Batch files, hardware info).
 * - setUiIPC:  Handles window-level tasks (View switching, versioning).
 */

const setCfgIPC = require('./setting.ipc');
const setSysIPC = require('./sys.ipc'); 
const setUiIPC  = require('./ui.ipc');  

/**
 * Initializes and binds all IPC listeners.
 * * @param {Object} ipcMain - The Electron IPC main module for receiving messages.
 * @param {Object} app - The Electron app instance (used for path/version context).
 */
module.exports = function setupIPC(ipcMain, app) {
    
    /** * 1. CONFIGURATION HANDLERS
     * Manages settings.json, target drive selection, and folder exports.
     */
    setCfgIPC(ipcMain);

    /** * 2. SYSTEM HANDLERS
     * The "Engine Room": Executes PowerShell/Batch scripts and gathers 
     * hardware diagnostics like RAM, CPU, and IP addresses.
     */
    setSysIPC(ipcMain, app);

    /** * 3. UI HANDLERS
     * Manages the "Single Page Application" (SPA) feel by loading HTML 
     * view partials into the main window and providing app metadata.
     */
    setUiIPC(ipcMain, app);
    
    // Developer feedback to confirm the bridge is active during startup
    console.log("✅ All IPC Handlers Registered Successfully");
};