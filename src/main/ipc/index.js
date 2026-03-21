const registerSettingsHandlers = require('./settings.handlers');
const registerSystemHandlers = require('./system.handlers'); // You'd put get-system-info and run-batch here
const registerUiHandlers = require('./ui.handlers');         // You'd put load-view and get-app-version here

module.exports = function setupIPC(ipcMain, app) {
    registerSettingsHandlers(ipcMain);
    registerSystemHandlers(ipcMain, app);
    registerUiHandlers(ipcMain, app);
    
    console.log("✅ All IPC Handlers Registered Successfully");
};