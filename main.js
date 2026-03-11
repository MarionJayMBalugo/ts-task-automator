const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const { exec } = require('node:child_process');

/**
 * Creates the main application window.
 */
function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    title: "TMS Automation Dashboard",
    backgroundColor: '#f0f2f5',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, 
      nodeIntegration: false  
    }
  });

  win.loadFile('index.html');
}

/**
 * IPC Listener for executing batch scripts interactively.
 * Uses 'start cmd /k' to open a new visible window for user input.
 */
ipcMain.on('execute-batch', (event, fileName) => {
  // Locate the script within the 'resources' folder
  const scriptPath = path.join(app.getAppPath(), 'resources', fileName);

  console.log(`Launching interactive script: ${scriptPath}`);

  /**
   * COMMAND BREAKDOWN:
   * start: Windows command to start a separate window.
   * cmd /k: Runs the command and KEEP the window open afterward so you can see the results.
   * Change '/k' to '/c' if you want the window to close automatically when the script ends.
   */
  const command = `start cmd /k "${scriptPath}"`;

  exec(command, (error) => {
    if (error) {
      console.error(`Error launching window: ${error.message}`);
      event.reply('batch-reply', `LAUNCH ERROR: ${error.message}`);
      return;
    }
    
    // Note: stdout is not captured here because the output is in the new window.
    event.reply('batch-reply', `Script "${fileName}" launched in new window.`);
  });
});

/**
 * App Lifecycle Management
 */
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

/**
 * Cleanup: Quits the app completely when the UI is closed.
 */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});