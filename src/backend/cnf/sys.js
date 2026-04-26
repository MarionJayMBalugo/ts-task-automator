/**
 * APPLICATION SCANNER CONFIG (APP_SCAN)
 * Defines the folder/process names to look for when checking system health.
 */
const APP_SCAN = {
    tmsDos:     ['tms-dos', 'TMS-DOS', 'TMS DOS'],
    mirth:      ['Mirth Connect', 'mirth'],
    bridgelink: ['BridgeLink', 'BridgeLink Administrator Launcher'],
    vscode:     ['Microsoft VS Code', 'Visual Studio Code', 'vscode'],
    heidiSQL:   ['HeidiSQL', 'Heidi'],
};

const TSK_SCHEDLRS = [
    {
        name: 'Clean Expired Bottles',
        desc: 'Scheduler that will cleanup expired containers in the db.'
    },
    {
        name: 'Clean up Orders',
        desc: 'Scheduler that will cleanup orders in the db.'
    },
    {
        name: 'HL7 Transaction Clean Up',
        desc: 'Scheduler that will HL7 records in the db.'
    }
];


module.exports = { APP_SCAN, TSK_SCHEDLRS };