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
 * - setupSchedlrIPC: Handles Windows Task Scheduler status and installation.
 */

const setCfgIPC = require('./setting.ipc');
const setSysIPC = require('./sys.ipc'); 
const setUiIPC  = require('./ui.ipc');  
const setupSchedlrIPC = require('./schedlr.ipc');

/**
 * Initializes and binds all IPC listeners.
 * * @param {Object} ipcMain - The Electron IPC main module for receiving messages.
 * @param {Object} app - The Electron app instance (used for path/version context).
 */
module.exports = (ipcMain, app) => {
    
    /** * --- CONFIGURATION & SETTINGS ---
     * Manages settings.json, target drive selection, and folder exports.
     * Essential for maintaining user preferences across sessions.
     */
    setCfgIPC(ipcMain);

    /** * --- SYSTEM OPERATIONS ---
     * The "Engine Room": Executes PowerShell/Batch scripts and gathers 
     * hardware diagnostics like RAM, CPU, and IP addresses.
     */
    setSysIPC(ipcMain, app);

    /** * --- UI & VIEW NAVIGATION ---
     * Manages the "Single Page Application" (SPA) feel by loading HTML 
     * view partials into the main window and providing app metadata.
     */
    setUiIPC(ipcMain, app);

    /** * --- WINDOWS TASK SCHEDULER ---
     * Handles the verification of installed schedulers and manages the 
     * deployment of XML-based tasks with dynamic path replacement.
     */
    setupSchedlrIPC(ipcMain, app);
};