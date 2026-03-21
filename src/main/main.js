const { app, BrowserWindow, ipcMain } = require('electron');

const APP_CONFIG = require('../config/appconfig');
// const setupIPC = require('./ipc/ipc-handlers');
const setupIPC = require('./ipc/index');

app.setAppUserModelId(APP_CONFIG.appId);

function createWindow() {
  const win = new BrowserWindow({
    width: APP_CONFIG.width,
    height: APP_CONFIG.height,
    title: APP_CONFIG.title,
    icon: APP_CONFIG.icon,
    backgroundColor: APP_CONFIG.bgColor,
    autoHideMenuBar: true,
    webPreferences: {
      preload: APP_CONFIG.preload,
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile(APP_CONFIG.uiPath);
}

app.whenReady().then(() => {
  setupIPC(ipcMain, app); 
  createWindow();
});

app.on('window-all-closed', () => { 
  if (!APP_CONFIG.platform.isMac) app.quit(); 
});