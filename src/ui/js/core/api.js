/**
 * =============================================================================
 * API BRIDGE (Renderer Side)
 * =============================================================================
 * This module acts as the global gateway for the frontend UI. It aggregates 
 * and flattens all secure methods exposed via the Electron Preload script.
 * * WHY IT EXISTS: To prevent "Double-Entry" development. By spreading the 
 * categorized methods from 'window.electronAPI', any new function added to 
 * the preload script is automatically available to the UI without further 
 * configuration here.
 */

export const API = {

    /** --- SYSTEM & OS OPERATIONS ---
     * Methods for batch execution, system info gathering, and hardware checks.
     */
    ...window.electronAPI.system,

    /** --- APP PERSISTENCE ---
     * Methods for reading/writing settings.json and managing the target drive.
     */
    ...window.electronAPI.settings,

    /** --- UI ARCHITECTURE ---
     * Methods for loading HTML partials and fetching app metadata.
     */
    ...window.electronAPI.ui,

    /** --- TASK SCHEDULER OPERATIONS ---
     * Methods for verifying and deploying Windows Task Scheduler XML tasks.
     */
    ...window.electronAPI.schedlr,
};