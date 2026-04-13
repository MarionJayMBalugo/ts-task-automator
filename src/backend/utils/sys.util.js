const path = require('node:path');
const { APP_CNF } = require('#cnf/index.js');

/**
 * SYSTEM UTILITIES (SysUtil)
 * Pure functions for formatting data, parsing arguments, and resolving paths.
 */
const SysUtil = {
    /**
     * Resolves the correct path to the resources folder.
     * Uses APP_CNF keys to handle DEV vs PROD (app.asar.unpacked) environments.
     */
    getResPath: (app, fileName = '') => {
        const base = app.isPackaged 
            ? path.join(process.resourcesPath, APP_CNF.unpackKey, APP_CNF.resourcesFldr) 
            : path.join(app.getAppPath(), APP_CNF.resourcesFldr);

        return path.join(base, fileName);
    },

    /**
     * Flattens a dynamic data object into a CLI-friendly string of arguments.
     */
    formatCliArgs: (data) => {
        if (!data) return '';
        const args = [];
        Object.values(data).forEach(val => {
            Array.isArray(val) ? args.push(...val) : args.push(val.toString());
        });
        return args.length > 0 ? args.map(arg => `\\"${arg}\\"`).join(' ') : '';
    },

    /**
     * Ensures a drive string strictly ends with a backslash (e.g., "D:\")
     */
    ensureTrailingSlash: (driveStr) => {
        return driveStr.endsWith('\\') ? driveStr : driveStr + '\\';
    }
};

module.exports = SysUtil;