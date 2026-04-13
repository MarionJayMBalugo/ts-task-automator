const path = require('node:path');
const fs = require('node:fs');
const fsP = require('node:fs/promises');

const { APP_CNF } = require('#cnf/index.js');

/**
 * =============================================================================
 * FILE SYSTEM UTILITIES (FsUtil)
 * =============================================================================
 * Pure, reusable functions for reading files, formatting paths, and disk parsing.
 * * WHY IT EXISTS: Windows file paths and extensions can be incredibly messy 
 * (e.g., 'e:\' vs 'E:', '.EXE' vs 'exe'). These utilities sanitize inputs 
 * so our main Services don't crash when interacting with the OS.
 */
const FsUtil = {

    /**
     * [SANITIZER] Extract and Normalize Drive Letter
     * Extracts the drive letter from any messy string and guarantees a clean Windows format.
     * * WHY WE NEED THIS: A user might type "e:\myFolder" or just "E". 
     * This forces it into a strict "E:" format so PowerShell scripts don't fail.
     * * @param {string} td - Target drive string (e.g., from user settings).
     * @param {string} fp - Fallback path string if 'td' is undefined.
     * @returns {string} The formatted drive letter (e.g., "E:").
     */
    getDrv: (td, fp) => {
        return (td || fp).charAt(0).toUpperCase() + ':'; 
        // Note: Added .toUpperCase() to ensure it always returns "E:" instead of "e:"!
    },
    
    /**
     * [SCANNER] Directory Partial Match Scanner
     * Scans a directory for any file that *starts* with a specific string.
     * * WHY PARTIAL MATCHES?: Downloaded software often appends version numbers 
     * to the file name (e.g., "tms-dos Setup 1.0.1.exe" vs "tms-dos Setup 2.0.exe"). 
     * Searching for an exact match would constantly fail. This guarantees we find it!
     * * @param {string} dir - The absolute directory path to scan.
     * @param {string} filename - The partial string to look for (e.g., "tms-dos Setup").
     * @param {string} ext - The required file extension (e.g., ".exe").
     * @returns {Promise<string[]>} Array of matching file names.
     */
    getPartialMatch: async (dir, filename, ext) => {
        try {
            const targetExt = FsUtil.clupExt(ext);
            const files = await fsP.readdir(dir);
            
            return files.filter(file => {
                // ToLowerCase() on both sides ensures "SETUP.EXE" matches "setup.exe"
                return file.toLowerCase().startsWith(filename.toLowerCase()) && 
                       path.extname(file).toLowerCase() === targetExt;
            });
        } catch (err) {
            return []; // Directory doesn't exist or is locked, return empty array
        }
    },

    /**
     * [SCANNER] Partial Match Boolean Check
     * Wrapper for getPartialMatch that simply returns True or False.
     * Used by AppSvc to quickly power the green/red badges in the UI Dashboard.
     */
    hasPartialMatch: async (dir, filename, ext) => {
        return (await FsUtil.getPartialMatch(dir, filename, ext)).length > 0;
    },

    /**
     * [SANITIZER] Extension Cleanup
     * Guarantees a string is formatted as a valid lowercase file extension.
     * * WHY: A developer might pass "exe", "EXE", or ".exe" into a function. 
     * This safely normalizes all of them into ".exe".
     * * @param {string} ext - The raw extension string.
     */
    clupExt: (ext) => ext.startsWith('.') ? ext.toLowerCase() : `.${ext.toLowerCase()}`,

    readHtml: (fpath) => {
        try {
            if (fs.existsSync(fpath)) {
                return fs.readFileSync(fpath, 'utf8');
            }

            return null;
        } catch (error) {
            console.error(`Error reading view ${fpath}:`, error.message);

            return null;
        }
    },

    join: (...args) => path.join(...args),
};

module.exports = FsUtil;