/**
 * =============================================================================
 * MAIN APPLICATION CONTROLLER (app.js)
 * =============================================================================
 * This is the central conductor of the frontend. It orchestrates the 
 * initialization sequence, injects global UI components, and sets up the 
 * top-level event delegation strategy.
 */

import { API, I18n, Template, ActionMap } from '@jsui/core';
import { PARTIALS, VIEWS } from '@jsui/cnf';
import { Shell, Clipboard } from '@jsui/modules';

const App = {

    /** --- BOOTSTRAP SEQUENCE ---
     * The primary entry point. It loads critical shared components (icons/modals),
     * prepares the environment modules, and triggers the initial view load.
     */
    init: async () => {
        // Load persistent UI elements that live outside the SPA view-switching logic
        await App.loadGlobalComponents([PARTIALS.icons.path, PARTIALS.modal.path]);

        // Initialize core UX engines
        Shell.init();
        Clipboard.init();
        
        // Prepare listeners and the central routing logic
        App.setupListeners();
        App.setupEventDelegator();
        
        // Sync application state (Theme, Versioning, Translation)
        Shell.setTheme();
        Shell.setVersion(); 
        I18n.apply();
        
        // Load the default entry view
        await Shell.loadTab(VIEWS.dashboard.path);
        
        // Deferred import of heavy vendor assets to keep initial load snappy
        import('bootstrap/dist/js/bootstrap.bundle.min.js');
    },

    /** --- GLOBAL ACTION ROUTING ---
     * Listens for clicks on any element with a [data-action] attribute.
     * It looks up the corresponding function in the ActionMap and executes it.
     * This eliminates the need for manual event listeners on individual buttons.
     */
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

    /** --- PERSISTENT UI INJECTION ---
     * Fetches HTML partials from the backend and injects them into the DOM.
     * Used for components that need to be available globally, like the 
     * SVG Icon Sprite or the shared Modal container.
     */
    loadGlobalComponents: async (components) => {
        try {
            const htmlStrings = await Promise.all(
                components.map(comp => API.loadPartial(comp))
            );
            
            htmlStrings.forEach((html, index) => {
                const parsedHtml = Template.parse(html);
                
                // Icons should be injected at the very top for proper SVG referencing
                const position = components[index] === PARTIALS.icons.path ? 'afterbegin' : 'beforeend';
                document.body.insertAdjacentHTML(position, parsedHtml);
            });
        } catch (e) {
            console.error("App: Failed to load global components:", e);
        }
    },

    /** --- EVENT ORCHESTRATION ---
     * Handles miscellaneous window events and custom IPC listeners 
     * forwarded from the backend.
     */
    setupListeners: () => {
        // Close modal when clicking the backdrop overlay
        window.addEventListener('click', (e) => {
            const overlay = document.getElementById('modal-overlay');
            if (e.target === overlay && typeof window.closeModal === 'function') {
                window.closeModal(); 
            }
        });

        // Listen for specific backend triggers (e.g., installer completion)
        API.on('heidi-inst-done', () => {
            Shell.validateHeidiActionCard();
        });
    },
};

// =============================================================================
// GLOBAL HELPERS & RUNTIME EXECUTION
// =============================================================================

/**
 * Global translation alias (__) to keep partial templates and JS readable.
 */
window.__ = (key, params = {}) => I18n.getText(key, params);

/**
 * Ensures the init sequence only runs once the DOM is fully interactive.
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
} else {
    App.init(); 
}