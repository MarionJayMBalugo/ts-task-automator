/**
 * =============================================================================
 * UI FLOWS MODULE (Flows)
 * =============================================================================
 * Handles complex, multi-step user interactions and business logic.
 * * WHY IT EXISTS: If a button click requires fetching data from the backend 
 * BEFORE opening a modal, or requires complex data formatting before executing 
 * a script, that logic belongs here. It keeps the HTML dumb and the ModalSvc clean.
 */

import { API } from '../api.js';
import { ModalSvc } from '../modal.js';
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
        ModalSvc.openModal(
            'create-database.bat', 
            'Run Create Databases?', 
            'Enter the target database names to initialize the core schemas.', 
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
    // --- INSTALLER FLOWS ---
    // =========================================================================

    /**
     * [FLOW] Prompt: TMS-DOS Installer 
     * Dynamically builds a modal based on how many installers the backend finds.
     * * STATE 1 (>1 found): Shows radio buttons so the user can choose.
     * * STATE 2 (1 found): Shows a read-only input confirming the path.
     * * STATE 3 (0 found): Mounts the custom File Picker component.
     */
    async promptTmsDosInstaller() {
        // 1. Ask the backend to scan the hard drive for the installer
        const installers = await API.getTmsdInst();
        
        let desc = `Unable to find the installer in the path specified.`;
        let components = [];

        // --- STATE 1: MULTIPLE INSTALLERS FOUND ---
        if (installers.length > 1) {
            desc = 'Multiple Installers are found. Please select just One.';
            
            // Generate a radio button for every installer found
            installers.forEach((inst, index) => {
                components.push({ 
                    id: 'selectedInstaller', // Same ID groups them together
                    type: 'radio', 
                    url: 'views/partials/modals/installer-radio.html', 
                    label: inst, 
                    value: inst, 
                    index: index, 
                    required: true 
                });
            }); 
            
        // --- STATE 2: EXACTLY ONE INSTALLER FOUND ---
        } else if (installers.length === 1) {
            desc = `Found installer! Click confirm to start.`;
            
            components.push({ 
                id: 'selectedInstaller', 
                type: 'radio', 
                label: installers[0], 
                value: installers[0], 
                readonly: true, 
                checked: true, 
                required: true 
            });
            
        // --- STATE 3: NO INSTALLERS FOUND ---
        } else {
            desc = 'No installer found. Please choose manually.';
            
            components.push({ 
                id: 'filepicker', 
                type: 'partial', 
                url: 'views/partials/file-pckr.html', 
                label: 'Installation Path',
                fldLbl: 'file path',
                mode: 'file',
                // Uses the global translation shortcut available in JS
                errMsge: __('validation.errHint1', { fldLbl: 'file path' }),
                
                // 🚨 THE ON-RENDER HOOK 🚨
                // Modals are injected into the DOM asynchronously. We cannot attach 
                // event listeners to the File Picker until the HTML actually exists!
                // ModalSvc calls this hook exactly when the HTML is safely in the DOM.
                onRender: (container) => FilePckr.init(container) 
            });
        }

        // 2. Launch the Modal with the dynamically generated components
        ModalSvc.openModal(
            'install.bat', 
            'TMS-DOS Installation', 
            desc, 
            components, 
            (script, data) => {
                // The user either used the radio buttons OR the file picker.
                // We fallback (||) to whichever one actually contains data.
                const pth = data.selectedInstaller || data.filepicker;
                API.runBatch(script, [pth]);
            }
        );
    },

    // This is being called when installing Heidi
    async promptHeidiInstaller() {
        ModalSvc.openModal(
            'run-heidi-install',
            'Heidi Installation',
            'Please select the installation directory and confirm.',
            [{ 
                id: 'folderpicker', 
                type: 'partial', 
                url: 'views/partials/fold-pckr.html', 
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

    /**
     * [FLOW] Generic Confirmation Modal
     * Handles simple scripts that require user confirmation but DO NOT need 
     * any extra input fields (like textboxes or dropdowns).
     * * WHY: Prevents us from writing a custom Flow function for every single 
     * simple button in the app.
     * * @param {string} fileName - The script to run (e.g., 'export-db.bat')
     * @param {string} title - The modal header
     * @param {string} desc - The warning/informational text
     */
    openModal(fileName, title, desc) {
        // We pass an empty array [] because there are no input components to render.
        ModalSvc.openModal(fileName, title, desc, [], (script) => API.runBatch(script));
    }
};