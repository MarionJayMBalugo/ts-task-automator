/**
 * SERVICES BARREL FILE
 * Aggregates all service modules so they can be imported on a single line.
 */

const SysSubSvcs = require('./sys/index.js');

module.exports = {
    SetSvc:  require('./settings.svc.js'),
    ToolSvc: require('./tools.svc.js'),
    ...SysSubSvcs
};