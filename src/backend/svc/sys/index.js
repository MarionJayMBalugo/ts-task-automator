/**
 * =============================================================================
 * SERVICE LAYER EXPORTS (Index)
 * =============================================================================
 * This module centralizes all backend logic controllers. 
 * By exporting them from a single point, we enable clean, consistent imports 
 * throughout the application (via the '#svc' alias).
 */

const ExecSvc = require('./exec.svc.js');
const OsSvc = require('./os.svc.js');
const NetSvc = require('./net.svc.js');
const AppSvc = require('./app.svc.js');
const SchedlrSvc = require('./schedlr.svc.js');
const InstallerSvc = require('./installer.svc.js');

module.exports = {
    /** --- NATIVE EXECUTION ---
     * Handles Batch scripts, PowerShell wrappers, and Admin elevation logic.
     */
    ExecSvc,

    /** --- SYSTEM & HARDWARE ---
     * Handles OS-level diagnostics like RAM, CPU usage, and Disk space.
     */
    OsSvc,

    /** --- NETWORKING ---
     * Handles IP discovery, Mac addresses, and connectivity checks.
     */
    NetSvc,

    /** --- APP METADATA ---
     * Handles internal app versioning, path resolution, and environment status.
     */
    AppSvc,

    /** --- WINDOWS TASK SCHEDULER ---
     * Handles task verification and XML-based deployment with drive-path mapping.
     */
    SchedlrSvc,

    InstallerSvc
};