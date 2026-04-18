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
import { Shell } from '@jsui/modules';

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
        
        Shell.setVersion(); 
        
        I18n.apply();
        await Shell.loadTab(VIEWS.dashboard.path);
        App.validateHeidiActionCard();
    },

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
    }
};

// =============================================================================
// GLOBAL WINDOW BINDINGS (Legacy Support)
// =============================================================================
window.__ = (key, params = {}) => I18n.getText(key, params);

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
} else {
    App.init(); 
}