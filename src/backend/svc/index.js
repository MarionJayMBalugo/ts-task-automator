/**
 * SERVICES BARREL FILE
 * Aggregates all service modules so they can be imported on a single line.
 */

const SysSubSvcs = require('./sys');
const UiSubSvcs = require('./ui');

module.exports = {
    SetSvc:  require('./settings.svc.js'),
    ToolSvc: require('./tools.svc.js'),
    ...SysSubSvcs,
    ...UiSubSvcs
};