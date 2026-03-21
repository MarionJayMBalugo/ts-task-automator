const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs');
const https = require('node:https');
const { exec } = require('node:child_process');

const SystemService = {
    execPS: (cmd) => new Promise(res => exec(`powershell -NoProfile -Command "${cmd}"`, (err, stdout) => res(stdout ? stdout.trim() : null))),
    
    checkUrl: (urlStr) => new Promise(res => {
        const options = { timeout: 5000, rejectUnauthorized: false };
        const req = https.get(urlStr, options, (response) => res(response.statusCode < 500))
                         .on('error', () => res(false));
        req.setTimeout(5000, () => { req.destroy(); res(false); }); 
    }),

    checkApp: (baseDrive, folderNames) => {
        const searchPaths = [
            baseDrive, path.join(baseDrive, 'tms-tools'), path.join(os.homedir(), 'AppData', 'Local', 'Programs'),
            'C:\\ProgramData\\Microsoft\\Windows\\Start Menu\\Programs',
            path.join(os.homedir(), 'AppData', 'Roaming', 'Microsoft', 'Windows', 'Start Menu', 'Programs')
        ];
        for (const base of searchPaths) {
            if (!fs.existsSync(base)) continue;
            for (const name of folderNames) {
                if (fs.existsSync(path.join(base, name)) || fs.existsSync(path.join(base, name + '.lnk'))) return true;
            }
        }
        return false;
    }
};

module.exports = SystemService;