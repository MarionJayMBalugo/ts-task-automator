/**
 * =============================================================================
 * VALIDATION REGISTRY HUB (Index)
 * =============================================================================
 * This module centralizes all system state checks and requirement verifications.
 * * WHY: Before triggering an installation prompt, the UI uses these methods 
 * to determine if a step is already completed, allowing us to toggle "Disabled" 
 * states or show "Installed" badges on action cards.
 * =============================================================================
 */

/** --- SYSTEM AUTOMATION CHECKS ---
 * Verifies the status of background processes.
 * Includes checking the Windows Task Scheduler for our specific XML-based tasks.
 */
export { chckSchedlrsInstalld } from './chck-schedlrs-installd.js';

/** --- APPLICATION & SOFTWARE CHECKS ---
 * (Future exports like 'checkMariaDBStatus' or 'checkHeidiVersion' would go here)
 */