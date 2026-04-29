const { exec } = require('child_process');
const path = require('node:path');
const { SysUtil } = require('#utils');
const { INSTALL_DEPS, APP_SCAN, DF_DRV } = require('#cnf');
const AppSvc = require('./app.svc.js');
const SetSvc = require('../settings.svc.js');

const InstallerSvc = {
    /** Checks which dependencies are already installed on the OS */
    checkDepsStatus: async () => {
        const settings = SetSvc.get();
        const baseDrive = SysUtil.ensureTrailingSlash(settings.targetDrive || `${DF_DRV}:\\`);

        return INSTALL_DEPS.map(dep => {
            const searchTerms = APP_SCAN[dep.scanKey];
            const isInstalled = AppSvc.checkApp(baseDrive, searchTerms);
            return { ...dep, installed: isInstalled };
        });
    },

    /** Executes the silent installation */
    runSilentInstall: (app, appId, executionData) => {
        return new Promise((resolve, reject) => {
            const dep = INSTALL_DEPS.find(d => d.id === appId);
            if (!dep) return reject(new Error('Unknown dependency ID'));

            // Safely resolve the installer path from resources/installers
            let internalPath = SysUtil.getResPath(app, `installers\\${dep.exe}`);
            if (internalPath.includes('app.asar') && !internalPath.includes('app.asar.unpacked')) {
                internalPath = internalPath.replace('app.asar', 'app.asar.unpacked');
            }

            let command = '';
            const userPath = executionData[`path_${appId}`];
            
            // Map the correct silent flags
            switch (dep.type) {
                case 'nsis':
                    command = `"${internalPath}" /S ${userPath ? `/D=${userPath}` : ''}`;
                    break;
                case 'inno':
                    command = `"${internalPath}" /VERYSILENT /SUPPRESSMSGBOXES /NORESTART`;
                    if (userPath) command += ` /DIR="${userPath}"`;
                    if (dep.args) command += ` ${dep.args}`;
                    break;
                case 'msi':
                    command = `msiexec.exe /i "${internalPath}" /qn /norestart`;
                    if (userPath) command += ` INSTALLDIR="${userPath}"`;
                    if (dep.args) command += ` ${dep.args}`;
                    break;
                case 'chrome':
                    command = `"${internalPath}" /silent /install`;
                    break;
                default:
                    command = `"${internalPath}" /S`;
            }

            console.log(`[InstallerSvc] Executing: ${command}`);
            exec(command, (error) => {
                if (error) return reject(error);
                resolve(`Installed ${dep.name}`);
            });
        });
    }
};

module.exports = InstallerSvc;