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

module.exports = { APP_SCAN };