/**
 * =============================================================================
 * PRELOAD SCRIPT (The Bridge)
 * =============================================================================
 * Safely exposes specific IPC methods to the renderer process (app.js) 
 * under the global 'window.electronAPI' object.
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    
    // --- SYSTEM OPERATIONS (Maps to sys.ipc.js) ---
    system: {
        runBatch: (file, data) => ipcRenderer.send('execute-batch', file, data),
        openTool: (toolKey) => ipcRenderer.send('open-sys-tool', toolKey),
        getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
        
        // MOVED: Copying files is a system operation!
        copyScripts: () => ipcRenderer.invoke('copy-scripts'),

        // MOVED: Batch listeners grouped with batch execution
        onBatchReply: (callback) => {
            const subscription = (_event, message) => callback(message);
            ipcRenderer.on('batch-reply', subscription);
            return () => ipcRenderer.removeListener('batch-reply', subscription);
        },
        removeBatchListeners: () => ipcRenderer.removeAllListeners('batch-reply')
    },

    // --- SETTINGS & CONFIGURATION (Maps to setting.ipc.js) ---
    settings: {
        getSettings: () => ipcRenderer.invoke('get-settings'),
        setTargetDrive: (value) => ipcRenderer.invoke('set-drv', value),
        toggleAutoClose: (value) => ipcRenderer.invoke('tog-exit', value),
        resetConfig: () => ipcRenderer.invoke('rst-cfg'),
        selectFolder: () => ipcRenderer.invoke('sel-dir'),
        getConfigPath: () => ipcRenderer.invoke('cfg-path')
    },

    // --- UI & APPLICATION STATE (Maps to ui.ipc.js) ---
    ui: {
        loadView: (viewName) => ipcRenderer.invoke('load-view', viewName),
        getVersion: () => ipcRenderer.invoke('get-app-version')
    }
});