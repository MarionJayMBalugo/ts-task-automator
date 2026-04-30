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
    
    /** --- SYSTEM OPERATIONS ---
     * Maps to: sys.ipc.js
     * Handles low-level OS interaction, batch execution, and hardware discovery.
     */
    system: {
        // [SEND - One-Way] 
        // Best for fire-and-forget tasks (e.g., launching a tool).
        runBatch: (file, data) => ipcRenderer.send('execute-batch', file, data),
        openTool: (toolKey) => ipcRenderer.send('open-sys-tool', toolKey),
        openTMSDOS: () => ipcRenderer.send('open-tmsdos'),
        instHeidi: (path) => ipcRenderer.send('run-heidi-install', path),

        // [INVOKE - Two-Way Promises] 
        // Best for tasks where the UI must 'await' data (e.g., fetching hardware info).
        getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
        copyScripts: () => ipcRenderer.invoke('copy-scripts'),
        getTmsdInst: () => ipcRenderer.invoke('get-tmsdos-installer'),
        openFileDialog: () => ipcRenderer.invoke('dialog:openFile'),
        checkHeidiInstalled: () => ipcRenderer.invoke('check-heidi-installed'),
        chckappInstlled: (name) => ipcRenderer.invoke('chck-app-installd', name),
        checkEnv: () => ipcRenderer.invoke('check-env'),
        chckFoldersStatus: () => ipcRenderer.invoke('chck-folders-status'),
        
        // [ON - Event Listeners]
        // Intercepts streams of data from the backend.
        on: (channel, callback) => ipcRenderer.on(channel, (event, ...args) => callback(...args)),

        /**
         * [ON - Listener Setup with Cleanup]
         * Listens for replies from batch scripts. 
         * NOTE: Returning the removeListener function allows the UI component 
         * to 'unmount' the listener, preventing memory leaks.
         */
        onBatchReply: (callback) => {
            const subscription = (_event, message) => callback(message);
            ipcRenderer.on('batch-reply', subscription);
            return () => ipcRenderer.removeListener('batch-reply', subscription);
        },
        
        removeBatchListeners: () => ipcRenderer.removeAllListeners('batch-reply')
    },

    /** --- WINDOWS TASK SCHEDULER ---
     * Maps to: schedlr.ipc.js
     * Bridges UI-driven task verification and XML-based task deployment.
     */
    schedlr: {
        // Verifies if specific tasks are already registered in Windows.
        chckSchedlrsInstlled: (tskNams) => ipcRenderer.invoke('chck-schedlrs-installd', tskNams),
        
        // Triggers the deployment of XML tasks with dynamic drive-path replacement.
        instllSchedlrs: (pendingTasks) => ipcRenderer.invoke('instll-schedlrs', pendingTasks)
    },

    /** --- SETTINGS & PERSISTENCE ---
     * Maps to: setting.ipc.js
     * Handles app configuration, target drive preferences, and folder selections.
     */
    settings: {
        getSettings: () => ipcRenderer.invoke('get-settings'),
        setTargetDrive: (value) => ipcRenderer.invoke('set-drv', value),
        toggleAutoClose: (value) => ipcRenderer.invoke('tog-exit', value),
        resetConfig: () => ipcRenderer.invoke('rst-cfg'),
        selectFolder: () => ipcRenderer.invoke('sel-dir'),
        getConfigPath: () => ipcRenderer.invoke('cfg-path'),
        updateSetting: (key, value) => ipcRenderer.invoke('update-setting', { key, value }),
    },

    /** --- UI COMPONENT NAVIGATION ---
     * Maps to: ui.ipc.js
     * Powers the "SPA" architecture by fetching HTML partials and app metadata.
     */
    ui: {
        loadView: (viewName) => ipcRenderer.invoke('load-view', viewName),
        loadPartial: (prtlName) => ipcRenderer.invoke('load-partial', prtlName),
        getVersion: () => ipcRenderer.invoke('get-app-version')
    }
});