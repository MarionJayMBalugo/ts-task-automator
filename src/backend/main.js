/**
 * =============================================================================
 * MAIN PROCESS (Entry Point)
 * =============================================================================
 * This is the primary Node.js process that controls the application lifecycle,
 * manages native GUI elements (windows, menus, tray), and handles all 
 * privileged system operations via IPC.
 */

const { app, BrowserWindow, ipcMain } = require('electron');

// 1. Core Config & IPC Routers
const { APP_CNF } = require('#cnf'); // Centralized from the barrel file
const setupIPC = require('./ipc');  // Bootstrapper for all IPC listeners

/**
 * Set the Application User Model ID for Windows Taskbar/Notifications.
 * This ensures that the app icon and notifications are correctly grouped 
 * by the Windows operating system.
 */
app.setAppUserModelId(APP_CNF.appId);

/**
 * Creates and configures the primary Chromium browser window.
 */
function createWindow() {
  const win = new BrowserWindow({
    width: APP_CNF.width,
    height: APP_CNF.height,
    title: APP_CNF.title,
    icon: APP_CNF.icon,          // Automatically resolved to dist/assets/icon.ico by APP_CNF
    backgroundColor: APP_CNF.bgColor,
    autoHideMenuBar: false,      // Set to true if you want a cleaner, frameless look
    
    /**
     * SECURITY LAYER: WebPreferences
     * These settings are critical for protecting the user's system.
     */
    webPreferences: {
      // Point to the bundled preload script
      preload: APP_CNF.preload,  // Automatically resolved to dist/preload.js by APP_CNF
      
      // contextIsolation: true ensures the renderer (frontend) 
      // cannot access Electron/Node internals directly.
      contextIsolation: true, 
      
      // nodeIntegration: false prevents the frontend from 
      // using require() or accessing the filesystem.
      nodeIntegration: false 
    }
  });

  // Load the compiled HTML interface from the dist folder
  win.loadFile(APP_CNF.uiPath);
}

/**
 * APP LIFECYCLE: Initialization
 * Electron has finished initialization and is ready to create browser windows.
 * Some APIs can only be used after this event occurs.
 */
app.whenReady().then(() => {
  /**
   * Initialize IPC Handlers
   * We pass 'ipcMain' and 'app' to the setup module so it can register 
   * all listeners (sys, set, ui) before the UI loads.
   */
  setupIPC(ipcMain, app); 
  
  createWindow();
});

/**
 * APP LIFECYCLE: Termination
 * Quits the application when all windows are closed, except on macOS (darwin).
 * On macOS, it is standard for apps to stay active in the dock until explicitly quit.
 */
app.on('window-all-closed', () => { 
  if (!APP_CNF.platform.isMac) {
    app.quit(); 
  }
});