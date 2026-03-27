const path = require('node:path');
const fs = require('node:fs');
const { APP_CNF } = require('#cnf/index.js');

/**
 * FILE SYSTEM UTILITIES (FsUtil)
 * Pure functions for reading files, formatting paths, and disk parsing.
 */
const FsUtil = {

    /**
     * Gets the current drive name from a path.
     * Example: "E:\Folder" -> "E:"
     * @param {string} td - Target drive string
     * @param {string} fp - Fallback string
     * @returns {string} The formatted drive letter.
     */
    getDrv: (td, fp) => {
        return (td || fp).charAt(0).toUpperCase() + ':'; 
        // Note: Added .toUpperCase() to ensure it always returns "E:" instead of "e:"!
    },
    
    /**
     * Safely reads an HTML view component.
     * Returns null if the file doesn't exist, letting the UI handle the error state.
     * @param {string} viewName - The name of the HTML file without the extension.
     */
    readView: (viewName) => {
        try {
            const viewPath = path.join(APP_CNF.uiDir, 'views', `${viewName}.html`);
            if (fs.existsSync(viewPath)) {
                return fs.readFileSync(viewPath, 'utf8');
            }
            return null; // Return null instead of an HTML error string
        } catch (error) {
            console.error(`Error reading view ${viewName}:`, error.message);
            return null;
        }
    }
};

module.exports = FsUtil;