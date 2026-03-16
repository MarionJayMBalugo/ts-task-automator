const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('node:path');
const { exec } = require('node:child_process');
const fs = require('node:fs');

/**
 * 1. HANDLE SQUIRREL INSTALL EVENTS
 * This block must be at the very top to handle shortcut creation and 
 * installation events before the app fully starts.
 */
if (require('electron-squirrel-startup')) {
    app.quit();
    process.exit(0);
}

// Path to settings in AppData
const settingsPath = path.join(app.getPath('userData'), 'settings.json');
const isPackaged = app.isPackaged;

/**
 * Safely loads settings from the JSON file.
 */
function getSettings() {
  try {
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, 'utf8');
      return JSON.parse(data || '{"customScriptPath": ""}');
    }
  } catch (e) { 
    console.error("Settings read error:", e); 
  }
  return { customScriptPath: "" };
}

function createWindow() {
  const win = new BrowserWindow({
    width: 950,
    height: 750,
    title: "TMS Pulse",
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    backgroundColor: '#f0f2f5',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  /**
   * 2. FIX WINDOWS SEARCHABILITY
   * Squirrel.Windows automatically sets a specific AppUserModelID for shortcuts.
   * You must match it here so Windows indexes the app correctly.
   * Format: com.squirrel.[config.name in forge.config.js].[package.json name]
   */
  app.setAppUserModelId("com.squirrel.ts_automation_app.ts-automation-app");

  win.setMenuBarVisibility(false);
  win.loadFile(path.join(__dirname, 'ui', 'index.html'));
}

/**
 * IPC HANDLERS
 */

// Handle folder selection for external workspace
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
  if (!result.canceled && result.filePaths.length > 0) {
    const newPath = result.filePaths[0];
    try {
      fs.writeFileSync(settingsPath, JSON.stringify({ customScriptPath: newPath }, null, 2));
      return newPath;
    } catch (err) {
      console.error("Failed to save settings:", err);
    }
  }
  return null;
});

// Send current path back to UI
ipcMain.handle('get-config-path', () => {
  return getSettings().customScriptPath;
});

// Copy internal resources to destination (handles app.asar.unpacked)
ipcMain.handle('copy-scripts', async () => {
  const settings = getSettings();
  const destination = settings.customScriptPath;

  if (!destination) return "❌ Error: Select a folder first!";

  // Point to unpacked directory in production or standard folder in dev
  const source = isPackaged 
    ? path.join(process.resourcesPath, 'app.asar.unpacked', 'resources') 
    : path.join(app.getAppPath(), 'resources');

  try {
    if (!fs.existsSync(source)) return `❌ Error: Source 'resources' not found at ${source}`;

    fs.cpSync(source, destination, { 
      recursive: true, 
      force: true 
    });

    return `✅ Successfully exported all scripts and folders to: ${destination}`;
  } catch (err) {
    console.error("Export Error:", err);
    return `❌ Export failed: ${err.message}`;
  }
});

// Reset custom workspace path
ipcMain.handle('reset-config', () => {
  fs.writeFileSync(settingsPath, JSON.stringify({ customScriptPath: "" }));
  return "";
});

// Execute Batch file with Administrator privileges
ipcMain.on('execute-batch', (event, fileName) => {
  const settings = getSettings();
  
  const internalBase = isPackaged 
    ? path.join(process.resourcesPath, 'app.asar.unpacked', 'resources') 
    : path.join(app.getAppPath(), 'resources');

  const internalPath = path.join(internalBase, fileName);
  const externalPath = settings.customScriptPath ? path.join(settings.customScriptPath, fileName) : null;

  let finalPath = (externalPath && fs.existsSync(externalPath)) ? externalPath : internalPath;

  // Launch CMD via PowerShell to force UAC admin elevation
  const command = `powershell -Command "Start-Process cmd -ArgumentList '/k \\"${finalPath}\\"' -Verb RunAs"`;

  exec(command, (error) => {
    if (error) {
      console.error(`Elevation Error: ${error.message}`);
      event.reply('batch-reply', `Error: Elevation denied or failed.`);
    } else {
      event.reply('batch-reply', `Launched ${fileName} as Administrator.`);
    }
  });
});

/**
 * APP LIFECYCLE
 */
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});