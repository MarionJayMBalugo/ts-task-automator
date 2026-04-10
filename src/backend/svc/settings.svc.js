const { app, dialog } = require('electron'); // <-- Added dialog here
const path = require('node:path');
const fs = require('node:fs');

// 1. Use your clean barrel import!
const { APP_CNF } = require('#cnf/index.js'); 

const settingsPath = path.join(app.getPath('userData'), 'settings.json');

const defaultSettings = { 
    customScriptLoc: "", 
    autoCloseCmd: false, 
    targetDrive: `${APP_CNF.defDrv}:\\` 
};

const SetSvc = {
    // --- EXISTING CORE METHODS ---
    get() {
        try {
            if (fs.existsSync(settingsPath)) {
                const data = fs.readFileSync(settingsPath, APP_CNF.encoding);
                return JSON.parse(data || JSON.stringify(defaultSettings));
            }
        } catch (e) {
            console.error("Settings read error:", e);
        }
        return defaultSettings;
    },

    save(newSettings) {
        try {
            fs.writeFileSync(settingsPath, JSON.stringify(newSettings, null, 2));
            return true;
        } catch (err) {
            console.error("Failed to save settings:", err);
            return false;
        }
    },

    update(key, value) {
        const settings = this.get();
        settings[key] = value;
        this.save(settings);
        return value;
    },

    /**
     * Triggers the OS folder selection dialog and updates the config.
     * Keeps UI/OS logic strictly inside the Service, not the IPC router.
     */
    async selectCustomDir() {
        // Pops open the Windows folder picker
        const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
        
        if (!result.canceled && result.filePaths.length > 0) {
            const selectedPath = result.filePaths[0];
            this.update('customScriptLoc', selectedPath); // Saves it immediately
            return selectedPath;
        }
        return null;
    },

    /**
     * Wipes the custom script location back to its default state.
     */
    resetCustomDir() {
        this.update('customScriptLoc', "");
    }
};

module.exports = SetSvc;