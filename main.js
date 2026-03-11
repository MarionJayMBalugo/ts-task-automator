const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('node:path');
const { exec } = require('node:child_process');
const fs = require('node:fs');

// Path to the local settings file in the user's AppData folder
const settingsPath = path.join(app.getPath('userData'), 'settings.json');

/**
 * Safely loads settings from the JSON file.
 * Returns default empty path if file doesn't exist or is corrupted.
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
    title: "TS Automation Dashboard",
    icon: path.join(__dirname, 'assets/icon.ico'),
    backgroundColor: '#f0f2f5',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.setMenuBarVisibility(false);
  win.loadFile('index.html');
}

// IPC: Let user choose a folder for their manual script updates
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

// IPC: Send the current saved path back to the UI
ipcMain.handle('get-config-path', () => {
  return getSettings().customScriptPath;
});

// IPC: Copy ALL internal resources (files & folders) to the external folder
ipcMain.handle('copy-scripts', async () => {
  const settings = getSettings();
  const destination = settings.customScriptPath;

  if (!destination) return "❌ Error: Select a folder first!";

  const source = path.join(app.getAppPath(), 'resources');

  try {
    if (!fs.existsSync(source)) return `❌ Error: Source 'resources' not found.`;

    /**
     * fs.cpSync is the modern way to copy directories recursively.
     * recursive: true -> Copies subfolders and their contents.
     * force: true -> Overwrites existing files if they already exist.
     */
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

// IPC: Clear the custom path and revert to internal defaults
ipcMain.handle('reset-config', () => {
  fs.writeFileSync(settingsPath, JSON.stringify({ customScriptPath: "" }));
  return "";
});

// IPC: Run the Batch file (Explicitly forcing Admin Elevation)
ipcMain.on('execute-batch', (event, fileName) => {
  const settings = getSettings();
  const internalPath = path.join(app.getAppPath(), 'resources', fileName);
  const externalPath = settings.customScriptPath ? path.join(settings.customScriptPath, fileName) : null;

  // PRIORITY: Check external user folder first, fallback to internal if not found
  let finalPath = (externalPath && fs.existsSync(externalPath)) ? externalPath : internalPath;

  /**
   * THE ADMIN FIX:
   * We use PowerShell's 'Start-Process' with the 'RunAs' verb.
   * This guarantees a UAC prompt and Administrator privileges for the script.
   * /k: Keeps the CMD window open so the user can see the script's output.
   */
  const command = `powershell -Command "Start-Process cmd -ArgumentList '/k \\"${finalPath}\\"' -Verb RunAs"`;

  console.log(`Requesting Admin elevation for: ${finalPath}`);

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
 * App Lifecycle
 */
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});