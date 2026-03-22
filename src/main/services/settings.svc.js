const { app } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

const settingsPath = path.join(app.getPath('userData'), 'settings.json');
const defaultSettings = { customScriptPath: "", autoCloseCmd: false, targetDrive: "D:\\" };

const SetSvc = {
    get() {
        try {
            if (fs.existsSync(settingsPath)) {
                const data = fs.readFileSync(settingsPath, 'utf8');
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
    }
};

module.exports = SetSvc;