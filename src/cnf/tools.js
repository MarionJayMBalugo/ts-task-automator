const { FC_DIR } = require('#cnf/const.js');

const ToolCmds = {
    // These are System Commands (run via exec)
    'ipconfig':       () => ({ exec: 'start cmd /k "ipconfig /all"' }),
    'dxdiag':         () => ({ exec: 'dxdiag' }),
    'explorer-pc':    () => ({ exec: 'explorer shell:MyComputerFolder' }), // Windows alias
    'about-pc':       () => ({ exec: 'start ms-settings:about' }),

    // These are Folder Paths (run via Electron shell)
    'explorer-d':     (d) => ({ shell: `${d}\\` }),
    'open-tms-dos':   (d) => ({ shell: `${d}\\tms-dos` }),
    'open-customers': (d) => ({ shell: `${d}\\${FC_DIR}` }),
    'open-tms-tools': (d) => ({ shell: `${d}\\tms-tools` })
};

module.exports = ToolCmds;