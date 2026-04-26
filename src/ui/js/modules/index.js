/**
 * =============================================================================
 * UI MODULES REGISTRY (Barrel)
 * =============================================================================
 * This module acts as the central export hub for all specialized UI logic.
 * By aggregating modules here, we enable clean, single-line imports in app.js
 * and other views.
 * * WHY: It prevents "Import Bloat" and provides a clear directory of the 
 * application's frontend capabilities.
 * =============================================================================
 */

import { Shell }     from './shell.js';
import { Status }    from './status.js';
import { Notify }    from './notify.js';
import { Validate }  from './validate.js';
import { Clipboard } from './clipboard.js';

export { 
    /** --- CORE UI FRAMEWORK ---
     * Manages tab navigation, view loading, theme switching, and app-wide 
     * metadata (versioning).
     */
    Shell, 

    /** --- STATE & FEEDBACK ---
     * Handles progress bars, status badges, and visual state indicators 
     * for ongoing background processes.
     */
    Status, 

    /** --- USER MESSAGING ---
     * Handles toasts, alerts, and notifications to keep the user informed 
     * of success or failure events.
     */
    Notify,

    /** --- DATA VALIDATION ---
     * Handles pre-flight checks for forms and system requirements before 
     * allowing installations or updates.
     */
    Validate,

    /** --- UTILITY OPERATIONS ---
     * Handles specialized interactions like global click-to-copy functionality
     * with automated visual feedback.
     */
    Clipboard
};