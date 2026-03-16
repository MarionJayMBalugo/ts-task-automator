const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  runBatch: (fileName) => ipcRenderer.send('execute-batch', fileName),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  getConfigPath: () => ipcRenderer.invoke('get-config-path'),
  copyScripts: () => ipcRenderer.invoke('copy-scripts'),
  resetConfig: () => ipcRenderer.invoke('reset-config')
});