import { Shell } from '@jsui/modules';
import { API } from '@jsui/core';
import { ChckSchedlrsStatus } from './validate';

export const dashbrdVw = {
    // Array to store event listeners for memory cleanup
    _listeners: [],

    /**
     * Called by App.loadTab immediately after the dashboard HTML is injected
     */
    mount: (containerEl) => {
        // 1. Grab the specific buttons inside the dashboard
        const refreshBtn = document.getElementById('header-btn-refresh');
        const toolBtns = containerEl.querySelectorAll('[data-action="open-tool"]');
        ChckSchedlrsStatus();

        // 2. Define the handler functions (Routing to legacy App logic for now)
        const handleRefresh = (e) => {
            e.preventDefault();
            Shell.runValidation(true);
            ChckSchedlrsStatus();
        };

        const handleToolOpen = (e) => {
            e.preventDefault();
            // The tool name is stored in data-tool (e.g., data-tool="opentmsdos")
            const trigger = e.target.closest('[data-action]');
            const toolName = trigger.dataset.tool; 
            API.openTool(toolName);
        };

        // 3. Attach listeners and store them so we can delete them later
        if (refreshBtn) {
            refreshBtn.addEventListener('click', handleRefresh);
            dashbrdVw._listeners.push({ el: refreshBtn, type: 'click', fn: handleRefresh });
        }

        toolBtns.forEach(btn => {
            btn.addEventListener('click', handleToolOpen);
            dashbrdVw._listeners.push({ el: btn, type: 'click', fn: handleToolOpen });
        });
    },

    /**
     * Called by App.loadTab right before switching away from the dashboard
     */
    unmount: () => {
        // Remove every listener we attached to prevent ghost clicks
        dashbrdVw._listeners.forEach(({ el, type, fn }) => {
            el.removeEventListener(type, fn);
        });
        
        // Clear the array
        dashbrdVw._listeners = [];
    }
};