const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron
})

// Add this bridge to handle script execution
contextBridge.exposeInMainWorld('electronAPI', {
  runBatch: (scriptName) => ipcRenderer.send('execute-batch', scriptName)
})