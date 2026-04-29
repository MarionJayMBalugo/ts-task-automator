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
    sevenZip:   ['7-Zip', '7-zip'],
    chrome:     ['Google\\Chrome'],
    openjdk:    ['Java\\jdk', 'Eclipse Adoptium', 'OpenJDK', 'Java']
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

const INSTALL_DEPS = [
    { id: '7zip', name: '7-Zip Extract Utility', exe: '7z2600-x64.exe', type: 'nsis', scanKey: 'sevenZip', defaultPath: 'C:\\Program Files\\7-Zip' },
    // { id: 'chrome', name: 'Google Chrome', exe: 'ChromeSetup.exe', type: 'chrome', scanKey: 'chrome', defaultPath: '' }, // Chrome ignores paths
    // { id: 'vscode', name: 'Visual Studio Code', exe: 'VSCodeSetup-x64-1.109.5.exe', type: 'inno', args: '/MERGETASKS=!runcode,addtopath', scanKey: 'vscode', defaultPath: 'C:\\Program Files\\Microsoft VS Code' },
    // { id: 'openjdk', name: 'OpenJDK 25', exe: 'OpenJDK25U-jdk_x64_windows_hotspot.msi', type: 'msi', args: 'ADDLOCAL=FeatureMain,FeatureEnvironment,FeatureJarFileRunWith,FeatureJavaHome', scanKey: 'openjdk', defaultPath: 'C:\\Program Files\\Java\\jdk-25' },
    // { id: 'bridgelink', name: 'TMS BridgeLink', exe: 'BridgeLink_windows-x64_4_6_1.exe', type: 'inno', scanKey: 'bridgelink', defaultPath: 'C:\\TMS\\BridgeLink' },
    // { id: 'heidi', name: 'HeidiSQL', exe: 'HeidiSQL_12.15.0.7171_Setup.exe', type: 'inno', scanKey: 'heidiSQL', defaultPath: 'C:\\Program Files\\HeidiSQL' }
];


module.exports = { APP_SCAN, TSK_SCHEDLRS, INSTALL_DEPS };