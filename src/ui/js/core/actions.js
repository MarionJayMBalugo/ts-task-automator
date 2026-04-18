import { Shell } from '@jsui/modules';

/**
 * GLOBAL ACTION MAP
 * This handles all top-level UI clicks (Sidebar, Nav, etc.)
 */
export const ActionMap = {
    'navigate': (trigger, event) => {
        const viewName = trigger.dataset.view;
        Shell.loadTab(viewName);
    },
    
    'toggle-sidebar': (trigger, event) => {
        Shell.toggleSidebar();
    }
};