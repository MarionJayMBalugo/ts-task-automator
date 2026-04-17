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
    // --- DATABASE FLOWS ---
    // =========================================================================

    /**
     * [FLOW] Prompt: Create Database
     * Opens a modal asking the user for a list of database names to initialize.
     */
    promptCreateDB() {
        const data = {
            title: 'Run Create Databases?',
            desc: 'Enter the target database names to initialize the core schemas.',
            size: 'md'
        };

        ModalSvc.openModal(
            'create-database.bat', 
            data, 
            [
                { 
                    id: 'dbNames', 
                    type: 'list', 
                    label: 'Target Database Names', 
                    placeholder: 'Type name and press Enter', 
                    required: true 
                }
            ],
            // 🚨 DATA FORMATTING: The list component returns an Array of strings. 
            // Batch scripts cannot read JS Arrays, so we must .join(',') them 
            // into a single comma-separated string before sending to the backend.
            (script, data) => API.runBatch(script, [data.dbNames.join(',')])
        );
    },

    // =========================================================================
    // --- GENERIC FLOWS ---
    // =========================================================================

    openModal: function(scriptName, data, fields = [], onExecuteCallback) {
        ModalSvc.openModal(scriptName, data, fields, onExecuteCallback);
    }
};