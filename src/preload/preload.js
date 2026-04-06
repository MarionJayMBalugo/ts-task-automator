/**
 * =============================================================================
 * PRELOAD SCRIPT (The Bridge)
 * =============================================================================
 * This is the ONLY file that can talk to both Node.js (Backend) and the DOM (Frontend).
 * * WHY IT EXISTS: Electron's "Context Isolation" prevents the Renderer (app.js) 
 * from directly accessing the OS/Node.js to prevent malicious code injections. 
 * We use `contextBridge` to poke tiny, secure holes through that wall, exposing 
 * only specific, strictly defined functions under `window.electronAPI`.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    
    // =========================================================================
    // --- SYSTEM OPERATIONS (Maps directly to sys.ipc.js) ---
    // =========================================================================
    system: {
        // [SEND - One-Way] 
        // Used for tasks where we don't immediately need data back (fire-and-forget), 
        // or tasks that take a long time and will stream data back via listeners later.
        runBatch: (file, data) => ipcRenderer.send('execute-batch', file, data),
        openTool: (toolKey) => ipcRenderer.send('open-sys-tool', toolKey),
        
        // [INVOKE - Two-Way Promises] 
        // Used when the UI needs to 'await' an immediate response from the backend.
        getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
        copyScripts: () => ipcRenderer.invoke('copy-scripts'),
        getTmsdInst: () => ipcRenderer.invoke('get-tmsdos-installer'),
        openFileDialog: () => ipcRenderer.invoke('dialog:openFile'),

        // --- CONTINUOUS EVENT LISTENERS ---
        
        /**
         * [ON - Listener Setup]
         * Listens for replies from long-running tasks (like batch scripts).
         * * WHY WE WRAP IT: We intercept the raw IPC event and only pass the actual 
         * `message` string to the UI. This prevents the UI from accidentally 
         * gaining access to the raw Electron `event` object.
         * * @returns {Function} An "Unsubscribe" function so the UI can clean up 
         * after itself to prevent memory leaks!
         */
        onBatchReply: (callback) => {
            const subscription = (_event, message) => callback(message);
            ipcRenderer.on('batch-reply', subscription);
            
            // Returns a cleanup function that the UI can call when it's done listening
            return () => ipcRenderer.removeListener('batch-reply', subscription);
        },
        
        // Nuclear option to clear all listeners at once
        removeBatchListeners: () => ipcRenderer.removeAllListeners('batch-reply')
    },

    // =========================================================================
    // --- SETTINGS & CONFIGURATION (Maps directly to setting.ipc.js) ---
    // =========================================================================
    settings: {
        getSettings: () => ipcRenderer.invoke('get-settings'),
        setTargetDrive: (value) => ipcRenderer.invoke('set-drv', value),
        toggleAutoClose: (value) => ipcRenderer.invoke('tog-exit', value),
        resetConfig: () => ipcRenderer.invoke('rst-cfg'),
        selectFolder: () => ipcRenderer.invoke('sel-dir'),
        getConfigPath: () => ipcRenderer.invoke('cfg-path')
    },

    // =========================================================================
    // --- UI & APPLICATION STATE (Maps directly to ui.ipc.js) ---
    // =========================================================================
    ui: {
        loadView: (viewName) => ipcRenderer.invoke('load-view', viewName),
        getVersion: () => ipcRenderer.invoke('get-app-version')
    }
});