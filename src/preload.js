const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  runBatch: (fileName) => ipcRenderer.send('execute-batch', fileName),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  getConfigPath: () => ipcRenderer.invoke('get-config-path'),
  copyScripts: () => ipcRenderer.invoke('copy-scripts'),
  resetConfig: () => ipcRenderer.invoke('reset-config'),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  toggleAutoClose: (value) => ipcRenderer.invoke('toggle-auto-close', value),
  setTargetDrive: (value) => ipcRenderer.invoke('set-target-drive', value),
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  openTool: (toolKey) => ipcRenderer.send('open-system-tool', toolKey)
});