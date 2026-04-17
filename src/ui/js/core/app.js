/**
 * =============================================================================
 * MAIN APPLICATION CONTROLLER (app.js)
 * =============================================================================
 */

import 'bootstrap/dist/js/bootstrap.bundle.min.js';

import { API } from './api.js';
import { I18n } from './i18n.js';
import { PARTIALS, VIEWS } from '../cnf';
import { Template } from './template.js';

// DYNAMIC DOMAIN IMPORTS
import { Shell, Status, Flows, Notify } from '../modules';

// THE NEW COMPONENT REGISTRY
import { ActionMap } from './actions.js';

// ==========================================
// MAIN APP OBJECT
// ==========================================
const App = {
    init: async () => {
        await App.loadGlobalComponents([PARTIALS.icons.path, PARTIALS.modal.path]);

        Shell.init();
        App.setupListeners();
        App.setupEventDelegator(); // Boot the global click router
        Shell.setTheme();
        
        // Note: Check if you meant App.setVersion() here instead of Shell.setVersion()
        Shell.setVersion(); 
        
        I18n.apply();
        App.loadTab(VIEWS.dashboard.path);
    },

    /**
     * Handles navigation between the main sidebar tabs.
     */
    loadTab: async (tabName) => {
        tabName = tabName.split('/')[0];
        await Shell.loadTab(tabName);

        App.validateHeidiActionCard();
    },

    openTool: (key) => API.openTool(key),

    toggleAutoClose: (val) => API.toggleAutoClose(val),

    changeTargetDrive: (val) => API.setTargetDrive(val),
    
    runBatch: (script) => runBatch(script),

    setupEventDelegator: () => {
        document.addEventListener('click', (event) => {
            const trigger = event.target.closest('[data-action]');
            if (!trigger) return;

            const actionFunction = ActionMap[trigger.dataset.action];

            if (actionFunction) {
                event.preventDefault(); 
                actionFunction(trigger, event);
            }
        });
    },

    loadGlobalComponents: async (components) => {
        try {
            const htmlStrings = await Promise.all(
                components.map(comp => API.loadPartial(comp))
            );
            
            htmlStrings.forEach((html, index) => {
                const parsedHtml = Template.parse(html);
                const position = components[index] === PARTIALS.icons.path ? 'afterbegin' : 'beforeend';
                document.body.insertAdjacentHTML(position, parsedHtml);
            });
        } catch (e) {
            console.error("Failed to load global components:", e);
        }
    },

    setupListeners: () => {
        window.addEventListener('click', (e) => {
            const overlay = document.getElementById('modal-overlay');
            if (e.target === overlay && typeof window.closeModal === 'function') {
                window.closeModal(); 
            }
        });

        API.on('heidi-inst-done', () => {
            App.validateHeidiActionCard();
        });
    },

    exportScripts: async () => {
        const result = await API.exportScripts();
        if (result && result.success) Shell.refreshSettings();
    },
    
    changeFolder: async () => {
        if (await API.selectFolder()) Shell.refreshSettings();
    },

    resetConfig: async () => {
        const result = await API.resetConfig();
        if (result) {
            const isError = result.includes('❌');
            Notify.showAlert(result, isError); 
            Shell.refreshSettings();
        }
    },

    copyScripts: async () => {
        const result = await API.copyScripts();
        if (result) {
            const isError = result.includes('❌');
            Notify.showAlert(result, isError);
            Shell.refreshSettings();
        }
    },

    validateHeidiActionCard: async () => {
        const card = document.querySelector('.heidi-install-card');
        if (!card) return;
        const isInstalled = await API.checkHeidiInstalled();
        if (isInstalled) {
            card.classList.add('disabled-state');
            card.removeAttribute('onclick'); // For legacy protection
            card.removeAttribute('data-action'); // New logic protection
            const label = card.querySelector('.action-label');
            if (label) label.innerText += " (Installed)";
        }
    },

    setVersion: async () => {
        try {
            const version = await API.getVersion();
            if (Shell.el.versionDisplay) Shell.el.versionDisplay.innerText = `v${version}`;
        } catch (e) { console.error("Version load failed"); }
    }
};

// =============================================================================
// GLOBAL WINDOW BINDINGS (Legacy Support)
// =============================================================================
window.App = App;
window.API = API;
window.UI = { ...Shell, ...Status, ...Flows, ...Notify }; 
window.__ = (key, params = {}) => I18n.getText(key, params);

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
} else {
    App.init(); 
}