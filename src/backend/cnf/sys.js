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
        desc: 'Scheduler that will cleanup expired containers in the db.',
        checkOnly: false  
    },
    {
        name: 'Clean up Orders',
        desc: 'Scheduler that will cleanup orders in the db.',
        checkOnly: false  
    },
    {
        name: 'HL7 Transaction Clean Up',
        desc: 'Scheduler that will HL7 records in the db.',
        checkOnly: false  

    },
    {
        name: 'Apache Log Rotation',
        path: 'TMS-DOS',      // Automatically builds "\TMS-DOS\Apache Log Rotation"
        checkOnly: true       // Prevents it from showing up in the Installer Modal
    }
];

const INFRA_FOLDERS = [
    'tms-dos',
    'tms-dos-data',
    'tms-dos-data\\apache-configuration',
    'tms-dos-data\\mariadb-configuration',
    'tms-tools',
    'Archived',
    'Archived\\code',
    'Archived\\auto_backups'
];

module.exports = { APP_SCAN, TSK_SCHEDLRS, INFRA_FOLDERS };