import { Shell } from '../modules/index.js';

/**
 * GLOBAL ACTION MAP
 * This handles all top-level UI clicks (Sidebar, Nav, etc.)
 */
export const ActionMap = {
    
    'navigate': (trigger, event) => {
        const viewName = trigger.dataset.view;
        window.App.loadTab(viewName);
    },
    
    'toggle-sidebar': (trigger, event) => {
        Shell.toggleSidebar();
    }
};