const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  system : {
    runBatch: (fileName) => ipcRenderer.send('execute-batch', fileName),
    openTool: (toolKey) => ipcRenderer.send('open-system-tool', toolKey),
    getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  },
  settings: {
    getSettings: () => ipcRenderer.invoke('get-settings'),
    setTargetDrive: (value) => ipcRenderer.invoke('set-target-drive', value),
    toggleAutoClose: (value) => ipcRenderer.invoke('toggle-auto-close', value),
    resetConfig: () => ipcRenderer.invoke('reset-config'),
    selectFolder: () => ipcRenderer.invoke('select-folder'),
    getConfigPath: () => ipcRenderer.invoke('get-config-path'),
    copyScripts: () => ipcRenderer.invoke('copy-scripts'),
  },
  ui: {
    loadView: (viewName) => ipcRenderer.invoke('load-view', viewName),
    getVersion: () => ipcRenderer.invoke('get-app-version'),
  },

  onBatchReply: (callback) => {
      const subscription = (_event, message) => callback(message);
      ipcRenderer.on('batch-reply', subscription);

      return () => {
        ipcRenderer.removeListener('batch-reply', subscription);
    };
  },
  
  removeBatchListeners: () => ipcRenderer.removeAllListeners('batch-reply')
});