export const API = {
    getVersion: () => window.electronAPI.ui.getVersion(),
    getSettings: () => window.electronAPI.settings.getSettings(),
    getSystemInfo: () => window.electronAPI.system.getSystemInfo(),
    runBatch: (file, data = {}) => window.electronAPI.system.runBatch(file, data),
    openTool: (key) => window.electronAPI.system.openTool(key),
    loadView: (name) => window.electronAPI.ui.loadView(name),
    selectFolder: () => window.electronAPI.settings.selectFolder(),
    resetConfig: () => window.electronAPI.settings.resetConfig(),
    toggleAutoClose: (val) => window.electronAPI.settings.toggleAutoClose(val),
    setTargetDrive: (val) => window.electronAPI.settings.setTargetDrive(val),
    copyScripts: () => window.electronAPI.system.copyScripts(),
};