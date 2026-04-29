/**
 * Component Logic for the Server Validation view.
 */
import { Shell } from '@jsui/modules';
import { API } from '@jsui/core';
import { ChckSchedlrsStatus } from './validate';

export const svrVldationVw = {
    // Store event listeners for memory cleanup
    _listeners: [],

    mount: (containerEl) => {
        // 1. Grab the specific buttons inside this view
        const refreshBtn = document.getElementById('header-btn-refresh');
        const toolBtns = containerEl.querySelectorAll('[data-action');
        ChckSchedlrsStatus();
        
        // 2. Define the handler functions
        const handleRefresh = (e) => {
            e.preventDefault();
            // True forces a fresh scan instead of using the cache
            Shell.runValidation(true); 
            ChckSchedlrsStatus();
        };

        const handleToolOpen = (e) => {
            e.preventDefault();
            const trigger = e.target.closest('[data-action]');
            const toolName = trigger.dataset.tool;
            const action = trigger.dataset.action;

            if (action === 'open-tmsdos') {
                API.openTMSDOS();
            } else {
                API.openTool(toolName);
            }
        };

        // 3. Attach listeners and store them for memory cleanup
        if (refreshBtn) {
            refreshBtn.addEventListener('click', handleRefresh);
            svrVldationVw._listeners.push({ el: refreshBtn, type: 'click', fn: handleRefresh });
        }

        toolBtns.forEach(btn => {
            btn.addEventListener('click', handleToolOpen);
            svrVldationVw._listeners.push({ el: btn, type: 'click', fn: handleToolOpen });
        });
    },

    unmount: () => {
        // Remove every listener we attached to prevent memory leaks
        svrVldationVw._listeners.forEach(({ el, type, fn }) => {
            el.removeEventListener(type, fn);
        });
        
        svrVldationVw._listeners = [];
    }
};