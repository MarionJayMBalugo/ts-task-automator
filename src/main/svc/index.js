/**
 * SERVICES BARREL FILE
 * Aggregates all service modules so they can be imported on a single line.
 */
module.exports = {
    SetSvc:  require('./settings.svc.js'),
    SysSvc:  require('./sys.svc.js'),
    ToolSvc: require('./tools.svc.js')
};