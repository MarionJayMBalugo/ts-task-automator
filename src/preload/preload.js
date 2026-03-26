/**
 * =============================================================================
 * PRELOAD SCRIPT (The Bridge)
 * =============================================================================
 * This script runs in a unique, isolated context. It has access to both the 
 * Node.js APIs (require) and the Browser globals (window).
 * * It uses 'contextBridge' to safely expose specific IPC (Inter-Process 
 * Communication) methods to the renderer process (app.js) under the 
 * global 'window.electronAPI' object.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    
    // --- SYSTEM OPERATIONS ---
    // Actions that trigger OS-level processes or hardware checks
    system: {
        /** Executes a .bat file with optional data arguments */
        runBatch: (file, data) => ipcRenderer.send('execute-batch', file, data),
        
        /** Triggers a system tool or folder open via ToolSvc/ToolCmds */
        openTool: (toolKey) => ipcRenderer.send('open-sys-tool', toolKey),
        
        /** Returns a Promise containing full hardware/network diagnostic data */
        getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
    },

    // --- SETTINGS & CONFIGURATION ---
    // Persistent data management handled by the Store (settings.svc)
    settings: {
        getSettings: () => ipcRenderer.invoke('get-settings'),
        
        /** Updates the preferred drive (e.g., 'D:') for automation tasks */
        setTargetDrive: (value) => ipcRenderer.invoke('set-target-drive', value),
        
        /** Toggles whether CMD windows close automatically after script completion */
        toggleAutoClose: (value) => ipcRenderer.invoke('toggle-auto-close', value),
        
        /** Reverts app settings to factory defaults */
        resetConfig: () => ipcRenderer.invoke('reset-config'),
        
        /** Opens a native OS dialog to select a directory for script exports */
        selectFolder: () => ipcRenderer.invoke('select-folder'),
        
        /** Returns the physical file path of the settings.json file */
        getConfigPath: () => ipcRenderer.invoke('get-config-path'),
        
        /** Exports internal resource scripts to the user-selected folder */
        copyScripts: () => ipcRenderer.invoke('copy-scripts'),
    },

    // --- UI & APPLICATION STATE ---
    // Helper methods for view management and app metadata
    ui: {
        /** Fetches HTML content for dynamic tab loading */
        loadView: (viewName) => ipcRenderer.invoke('load-view', viewName),
        
        /** Returns the current version from package.json */
        getVersion: () => ipcRenderer.invoke('get-app-version'),
    },

    // --- EVENT LISTENERS (Subscription Pattern) ---
    
    /**
     * Sets up a listener for feedback from batch file executions.
     * @param {Function} callback - Function to run when a reply is received.
     * @returns {Function} - A cleanup function to remove the listener (Memory Management).
     */
    onBatchReply: (callback) => {
        // Create a scoped subscription function
        const subscription = (_event, message) => callback(message);
        
        // Bind the listener to the 'batch-reply' channel
        ipcRenderer.on('batch-reply', subscription);

        // Return a teardown function. This allows the frontend to 'unmount' 
        // the listener when changing views or components to prevent duplicate triggers.
        return () => {
            ipcRenderer.removeListener('batch-reply', subscription);
        };
    },
    
    /**
     * Forcefully clears all listeners on the 'batch-reply' channel.
     * Useful as a "Nuclear Option" during app-wide resets.
     */
    removeBatchListeners: () => ipcRenderer.removeAllListeners('batch-reply')
});