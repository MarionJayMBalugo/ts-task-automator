const { shell } = require('electron');
const { exec } = require('child_process');
const ToolCmds = require('#cnf/tools.js');
const { getDrv } = require('#helpers/fsHelper.js');
const SetSvc = require('#svc/settings.svc.js');
const { DF_DRV } = require('#cnf/const.js');

const ToolService = {
    
    async handleSysTool(event, toolKey) {
        const drive = getDrv(SetSvc.get().targetDrive, `${DF_DRV}:\\`);
        const getCmd = ToolCmds[toolKey];

        if (!getCmd) {
            return event.reply('tool-reply', `Error: Unknown tool '${toolKey}'`);
        }

        const action = getCmd(drive);

        if (action.shell) {
            const errMsg = await shell.openPath(action.shell);
            if (errMsg !== '') {
                console.error(`Folder not found [${toolKey}]:`, errMsg);
                event.reply('tool-reply', `Folder does not exist: ${action.shell}`);
            }
        } else if (action.exec) {
            exec(action.exec, (err) => { 
                if (err) console.error(`Failed to run [${toolKey}]:`, err); 
            });
        }
    }
};

module.exports = ToolService;