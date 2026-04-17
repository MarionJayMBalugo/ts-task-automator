/**
 * Component Logic for the Server Installation view.
 */

import { FilePckr } from "../../js/partials";

export const ServerInstallationComponent = {
    // Store event listeners for memory cleanup
    _listeners: [],

    mount(containerEl) {
        console.log("[ServerInstallationComponent] Mounted");

        // 1. Find all action cards that have a data-action attribute
        const actionCards = containerEl.querySelectorAll('[data-action]');

        // 2. Define our master click handler
        const handleAction = (e) => {
            e.preventDefault();
            
            // Get the exact element that was clicked
            const trigger = e.target.closest('[data-action]');
            const action = trigger.dataset.action;

            // Route to the correct legacy UI function
            if (action === 'prompt-tmsdos-installer') {
                this.promptTmsDosInstaller();
            } 
            else if (action === 'prompt-heidi-installer') {
                this.promptHeidiInstaller();
            } 
            else if (action === 'open-modal') {
                // Because Template.parse() processes your __('...') syntax 
                // before injection, these datasets are ALREADY translated!
                const script = trigger.dataset.script;
                const title = trigger.dataset.title;
                const desc = trigger.dataset.desc;
                const data = {
                    title: title,
                    desc: desc,
                    size: 'md'
                };
                window.UI.openModal(script, data, [], (script) => window.API.runBatch(script));
            }
        };

        // 3. Attach listeners and store them for memory cleanup
        actionCards.forEach(card => {
            card.addEventListener('click', handleAction);
            this._listeners.push({ el: card, type: 'click', fn: handleAction });
        });
    },

    unmount() {
        console.log("[ServerInstallationComponent] Unmounting and cleaning up...");
        
        // Remove every listener we attached to prevent memory leaks
        this._listeners.forEach(({ el, type, fn }) => {
            el.removeEventListener(type, fn);
        });
        
        this._listeners = [];
    },

    async promptTmsDosInstaller() {
        
        let tmsdosInstalled = await window.API.chckappInstlled('tms-dos');
        console.log(tmsdosInstalled)
        const installers = await window.API.getTmsdInst();
        let title = 'TMS-DOS Installation';
        let desc = `Unable to find the installer in the path specified.`;
        let components = [];

        
        // --- STATE 1: MULTIPLE INSTALLERS FOUND ---
        if (installers.length > 1) {
            desc = 'Multiple Installers are found. Please select just One.';
            
            installers.forEach((inst, index) => {
                components.push({ 
                    id: 'selectedInstaller', 
                    type: 'radio', 
                    url: 'partials/modals/installer-radio.html', 
                    label: inst, 
                    value: inst, 
                    index: index, 
                    required: true 
                });
            }); 
            
        // --- STATE 2: EXACTLY ONE INSTALLER FOUND ---
        } else if (installers.length === 1) {
            desc = `Found installer! Click Next to continue.`;
            
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
                url: 'partials/widgets/file-pckr.html', 
                label: 'Installation Path',
                fldLbl: 'file path',
                mode: 'file',
                errMsge: __('validation.errHint1', { fldLbl: 'file path' }),
                onRender: (container) => FilePckr.init(container) 
            });
        }

        // =====================================================================
        // 2. DEFINE THE WIZARD STEPS
        // =====================================================================
        const steps = [
            {
                title: title,
                desc: desc,            // The dynamic description we built above
                fields: components     // The dynamic components we built above
            }
        ];

        if (tmsdosInstalled) {
            steps.unshift({
                title: title,
                desc: 'TMS-DOS is already installed. Clicking "NEXT" will start TMS-DOS Update Instead. ',
                fields: []
            })
        }

        // =====================================================================
        // 3. LAUNCH THE WIZARD
        // =====================================================================
        const data = {
            title: 'TMS-DOS Wizard', // Global modal title (if steps don't provide one)
            size: 'lg'
        };

        window.UI.openModal('install.bat', data, steps, (script, executionData) => {
            // Because it's a multi-step modal, `executionData` accumulates EVERYTHING!
            // It will look like: { step1_confirm: true, selectedInstaller: 'C:/inst.exe', final_confirm: true }
            
            const pth = executionData.selectedInstaller || executionData.filepicker;
            window.API.runBatch(script, [pth]);
        });
    },

    async promptTmsDosInstallerLegacy() {
        const installers = await window.API.getTmsdInst();
        
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
                    url: 'partials/modals/installer-radio.html', 
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
                url: 'partials/widgets/file-pckr.html', 
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

        const data = {
            title: 'TMS-DOS Installation',
            desc: desc,
            size: 'lg'
        };

        // 2. Launch the Modal with the dynamically generated components
        window.UI.openModal('install.bat', data, components, (script, data) => {
            // The user either used the radio buttons OR the file picker.
            // We fallback (||) to whichever one actually contains data.
            const pth = data.selectedInstaller || data.filepicker;
            window.API.runBatch(script, [pth]);
        });

    },

    // This is being called when installing Heidi
    async promptHeidiInstaller() {
        const data = {
            title: 'Heidi Installation',
            desc: 'Please select the installation directory and confirm.',
            size: 'md'
        };
        window.UI.openModal(
            'run-heidi-install',
            data,
            [{ 
                id: 'folderpicker', 
                type: 'partial', 
                url: 'partials/widgets/fold-pckr.html', 
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
                const pth = data.folderpicker;
                API.instHeidi(pth);
            }
        );
    }
};