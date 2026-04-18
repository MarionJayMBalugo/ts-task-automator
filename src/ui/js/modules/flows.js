/**
 * =============================================================================
 * UI FLOWS MODULE (Flows)
 * =============================================================================
 * Handles complex, multi-step user interactions and business logic.
 * * WHY IT EXISTS: If a button click requires fetching data from the backend 
 * BEFORE opening a modal, or requires complex data formatting before executing 
 * a script, that logic belongs here. It keeps the HTML dumb and the ModalSvc clean.
 */

import { API } from '../core/api.js';
import { ModalSvc } from '../partials/modal.js';

export const Flows = {
    // =========================================================================
    // --- GENERIC FLOWS ---
    // =========================================================================

    openModal: function(scriptName, data, fields = [], onExecuteCallback) {
        ModalSvc.openModal(scriptName, data, fields, onExecuteCallback);
    }
};