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
import { FilePckr } from '../partials/index.js';

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

    // This is being called when installing Heidi
    async promptHeidiInstaller() {
        const data = {
            title: 'Heidi Installation',
            desc: 'Please select the installation directory and confirm.',
            size: 'md'
        };
        ModalSvc.openModal(
            'run-heidi-install',
            data,
            [{ 
                id: 'folderpicker', 
                type: 'partial', 
                url: 'partials/widget/fold-pckr.html', 
                label: 'Installation Path',
                fldLbl: 'directory',
                mode: 'folder',
                // Uses the global translation shortcut available in JS
                errMsge: __('validation.errHint1', { fldLbl: 'directory' }),
                
                // 🚨 THE ON-RENDER HOOK 🚨
                // Modals are injected into the DOM asynchronously. We cannot attach 
                // event listeners to the File Picker until the HTML actually exists!
                // ModalSvc calls this hook exactly when the HTML is safely in the DOM.
                onRender: (container) => FilePckr.init(container) 
            }],
            (script, data) => {
                // The user either used the radio buttons OR the file picker.
                // We fallback (||) to whichever one actually contains data.
                const pth = data.filepicker;
                API.instHeidi(pth);
            }
        );
    },

    // =========================================================================
    // --- GENERIC FLOWS ---
    // =========================================================================

    openModal: function(scriptName, data, fields = [], onExecuteCallback) {
        ModalSvc.openModal(scriptName, data, fields, onExecuteCallback);
    }
};