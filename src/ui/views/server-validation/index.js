/**
 * Component Logic for the Server Validation view.
 */
import { Shell } from '@jsui/modules';
import { API } from '@jsui/core';
import { ChckSchedlrsStatus } from './validate';

export const svrVldationVw = {
    // Store event listeners for memory cleanup
    _listeners: [],

    // Make mount async so we can fetch settings on load
    mount: async (containerEl) => {
        // 1. Grab the specific buttons inside this view
        const refreshBtn = document.getElementById('header-btn-refresh');
        
        // Fixed the missing closing bracket on the selector here!
        const toolBtns = containerEl.querySelectorAll('[data-action]'); 
        
        // --- DYNAMIC DRIVE BUTTON LOGIC ---
        try {
            const settings = await API.getSettings();
            // Fallback to D:\ if undefined, then remove the backslashes
            const driveStr = settings.targetDrive || 'D:\\';
            const cleanDrive = driveStr.replace(/\\/g, ''); // Turns "D:\" into "D:"

            const driveCard = document.getElementById('card-btn-drive');
            const driveLabel = document.getElementById('label-btn-drive');

            if (driveCard && driveLabel) {
                // 1. Update the visible text on the button
                driveLabel.innerText = `Drive ${cleanDrive}`;
                
                // 2. Update the dataset for the ToolSvc backend
                driveCard.setAttribute('data-dir-name', cleanDrive); 
                
                // 3. Update the tooltip description dynamically using the global i18n helper
                if (typeof window.__ === 'function') {
                    driveCard.setAttribute('data-description', window.__('desc.openDir', { dirName: cleanDrive }));
                }
            }
        } catch (e) {
            console.warn("Failed to fetch target drive for validation UI", e);
        }

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

            // Keeps your custom TMS-DOS logic intact!
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