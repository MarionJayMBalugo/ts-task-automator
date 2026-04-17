/**
 * Component Logic for the Server Validation view.
 */

export const svrVldationVw = {
    // Store event listeners for memory cleanup
    _listeners: [],

    mount: (containerEl) => {
        // 1. Grab the specific buttons inside this view
        const refreshBtn = containerEl.querySelector('[data-action="run-validation"]');
        const toolBtns = containerEl.querySelectorAll('[data-action="open-tool"]');

        // 2. Define the handler functions
        const handleRefresh = (e) => {
            e.preventDefault();
            // True forces a fresh scan instead of using the cache
            window.UI.runValidation(true); 
        };

        const handleToolOpen = (e) => {
            e.preventDefault();
            const trigger = e.target.closest('[data-action]');
            const toolName = trigger.dataset.tool; 
            window.App.openTool(toolName);
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