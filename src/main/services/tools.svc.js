/**
 * =============================================================================
 * TOOL SERVICE (ToolSvc)
 * =============================================================================
 * This service acts as the execution layer for Dashboard quick-access tools.
 * It translates a 'toolKey' (e.g., 'pc', 'ip', 'tms') into a physical system 
 * action—either opening a file explorer path or executing a CLI command.
 */

const { shell } = require('electron');          // Electron module for desktop integration (File Explorer)
const { exec } = require('child_process');      // Node.js module to spawn shell processes (CLI/CMD)
const { ToolCmds } = require('#cnf/tools.js');   // Registry of command definitions (the 'c' and 's' mappings)
const { getDrv } = require('#helpers/fsHelper.js'); // Helper to sanitize and validate drive letters
const SetSvc = require('#svc/settings.svc.js');  // Access to user preferences (like targetDrive)
const { DF_DRV } = require('#cnf/const.js');    // System-wide default drive constant (usually 'D')

const ToolSvc = {
    
    /**
     * Executes a tool based on its registered key.
     * * @param {Object} event - The Electron IPC event object (used to reply to the UI).
     * @param {string} toolKey - The unique identifier for the tool (e.g., 'about', 'cust').
     */
    async runTool(event, toolKey) {
        // 1. Resolve the Target Drive
        // Fetches the saved drive from settings, falling back to the global default (DF_DRV)
        // ensure getDrv returns a clean format like "D:\"
        const drive = getDrv(SetSvc.get().targetDrive, `${DF_DRV}:\\`);

        // 2. Fetch the Command Configuration
        // ToolCmds contains functions that return { c: '...', s: '...' } objects
        const getCmd = ToolCmds[toolKey];

        // Safety check: Prevent app crash if a button points to a non-existent key
        if (!getCmd) {
            console.error(`Execution Error: No mapping found for key '${toolKey}'`);
            return event.reply('tool-reply', `Error: Unknown tool '${toolKey}'`);
        }

        // 3. Generate the Action Object
        // Pass the resolved 'drive' into the config function to build the final path/command
        const action = getCmd(drive);

        /**
         * 4. BRANCHING LOGIC: Shell vs. Exec
         */

        // CASE A: The action is a 'shell' operation (Opening a Folder)
        if (action.shell) {
            /**
             * shell.openPath is the safest way to open Windows Explorer.
             * It returns an empty string if successful, or an error message if the path 
             * is missing or permissions are denied.
             */
            const errMsg = await shell.openPath(action.shell);
            
            if (errMsg !== '') {
                // If the folder is missing (e.g., User selected D: but it's not plugged in)
                console.error(`Folder Access Failure [${toolKey}]:`, errMsg);
                event.reply('tool-reply', `Folder does not exist: ${action.shell}`);
            }
        } 
        
        // CASE B: The action is an 'exec' operation (Running a System App)
        else if (action.exec) {
            /**
             * child_process.exec runs a command in the background.
             * Use this for system-level calls like 'dxdiag' or 'ms-settings'.
             */
            exec(action.exec, (err) => { 
                if (err) {
                    console.error(`System Execution Failure [${toolKey}]:`, err);
                    event.reply('tool-reply', `System error: Could not launch ${toolKey}`);
                }
            });
        }
    }
};

module.exports = ToolSvc;