/**
 * =============================================================================
 * CORE SYSTEM CONSTANTS & PATH DEFINITIONS
 * =============================================================================
 * This file acts as the ultimate "Source of Truth" for hardcoded folder names, 
 * default paths, and system flags used across the Service layer.
 */

const p = require('path');

// [SHORTHAND] Tiny alias for path.join. 
// WHY: Makes constructing deep, nested folder hierarchies (like FC_DIR) 
// much easier to read without cluttering the code with 'path.join()' everywhere.
const j = p.join; 

// --- 1. SYSTEM DEFAULTS ---

/**
 * Default Target Drive (drv)
 * Fallback used by SysUtil/FsUtil if the user hasn't selected a custom drive 
 * in the Settings UI yet.
 */
const DF_DRV = 'E'; 

// --- 2. TMS & TOOL DIRECTORIES ---

/**
 * Root directory names for the TMS ecosystem.
 * Used by 'app.svc.js' when scanning the hard drive to locate installations.
 */
const TMS_DIR = 'tms-dos';       // The main application root dir
const TMS_TOOLS = 'tms-tools';   // The global tools/utilities dir
const TMS_DOS = 'tms-dos Setup'; // The partial filename used to auto-find the installer (.exe)

// --- 3. WEB & CUSTOMER PATH RESOLUTION ---

/**
 * WAI (Web App Interface) Path Segments
 * These represent the strict, hardcoded internal directory structure required 
 * by the TMS web application architecture.
 */
const CUST_DIR = 'customer';                  // The target folder name for customer-specific configs
const WEB_DIR = 'default';                    // The target folder name for the base web setup
const CUST_PATH = 'vendor\\timeless';         // The internal relative path to the vendor directory
const WEB_PATH = 'resources\\resources\\www'; // The internal relative path to the web root

/**
 * [COMPILED] Full Customer Directory (FC_DIR)
 * Dynamically stitches the segments together into the exact relative pth 
 * needed to reach the customer config folder inside a TMS-DOS installation.
 * Resolves to: 'tms-dos\resources\resources\www\default\vendor\timeless\customer'
 */
const FC_DIR = j(TMS_DIR, WEB_PATH, WEB_DIR, CUST_PATH, CUST_DIR); 

// --- 4. EXECUTION FLAGS ---

/**
 * Windows Command Prompt (CMD) Execution Flags
 * Passed to PowerShell/CMD when spawning batch (.bat) files.
 * Tied directly to the "Auto-Close CMD Window" toggle in the Settings UI!
 */
const CMD_OPTS = {
    close: '/c', // Executes the script and forces the CMD window to close immediately.
    keep:  '/k'  // Executes the script but leaves the CMD window open (crucial for debugging!).
};

module.exports = {
    TMS_DIR,
    TMS_TOOLS,
    TMS_DOS,
    DF_DRV,
    CUST_DIR,
    WEB_DIR,
    CUST_PATH,
    WEB_PATH,
    FC_DIR,
    CMD_OPTS
};