/**
 * =============================================================================
 * MAIN APPLICATION CONTROLLER (app.js)
 * =============================================================================
 */

import { API, I18n, Template, ActionMap } from '@jsui/core';
import { PARTIALS, VIEWS } from '@jsui/cnf';
import { Shell } from '@jsui/modules';

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
        import('bootstrap/dist/js/bootstrap.bundle.min.js');
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
            Shell.validateHeidiActionCard();
        });
    },
};

// =============================================================================
// GLOBAL WINDOW BINDINGS
// =============================================================================
window.__ = (key, params = {}) => I18n.getText(key, params);

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
} else {
    App.init(); 
}