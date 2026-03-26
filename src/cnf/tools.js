const { FC_DIR } = require('#cnf/const.js');

/**
 * Registry of Quick Access Commands
 * * Each key returns an object defining the execution method:
 * - exec:  Runs a system command (Process/CLI)
 * - shell: Opens a file path or URL (Windows Explorer)
 */
const ToolCmds = {
    // These are System Commands (run via exec)
    'ipconf':        () => ({ exec: 'start cmd /k "ipconfig /all"' }),
    'dxdiag':        () => ({ exec: 'dxdiag' }),
    'explorer':      () => ({ exec: 'explorer shell:MyComputerFolder' }), // Windows alias
    'about':         () => ({ exec: 'start ms-settings:about' }),

    // These are Folder Paths (run via Electron shell)
    'openDrv':       (d) => ({ shell: `${d}\\` }),
    'opentmsdos':    (d) => ({ shell: `${d}\\tms-dos` }),
    'opencustomers': (d) => ({ shell: `${d}\\${FC_DIR}` }),
    'opentmstools':  (d) => ({ shell: `${d}\\tms-tools` })
};

module.exports = {
    ToolCmds
};