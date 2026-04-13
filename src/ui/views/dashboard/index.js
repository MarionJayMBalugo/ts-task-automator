export const DashboardComponent = {
    // Array to store event listeners for memory cleanup
    _listeners: [],

    /**
     * Called by App.loadTab immediately after the dashboard HTML is injected
     */
    mount(containerEl) {
        console.log("[DashboardComponent] Mounted");

        // 1. Grab the specific buttons inside the dashboard
        const refreshBtn = containerEl.querySelector('[data-action="run-validation"]');
        const toolBtns = containerEl.querySelectorAll('[data-action="open-tool"]');

        // 2. Define the handler functions (Routing to legacy App logic for now)
        const handleRefresh = (e) => {
            e.preventDefault();
            window.UI.runValidation(true);
        };

        const handleToolOpen = (e) => {
            e.preventDefault();
            // The tool name is stored in data-tool (e.g., data-tool="opentmsdos")
            const trigger = e.target.closest('[data-action]');
            const toolName = trigger.dataset.tool; 
            window.App.openTool(toolName);
        };

        // 3. Attach listeners and store them so we can delete them later
        if (refreshBtn) {
            refreshBtn.addEventListener('click', handleRefresh);
            this._listeners.push({ el: refreshBtn, type: 'click', fn: handleRefresh });
        }

        toolBtns.forEach(btn => {
            btn.addEventListener('click', handleToolOpen);
            this._listeners.push({ el: btn, type: 'click', fn: handleToolOpen });
        });
    },

    /**
     * Called by App.loadTab right before switching away from the dashboard
     */
    unmount() {
        console.log("[DashboardComponent] Unmounting and cleaning up listeners...");
        
        // Remove every listener we attached to prevent ghost clicks
        this._listeners.forEach(({ el, type, fn }) => {
            el.removeEventListener(type, fn);
        });
        
        // Clear the array
        this._listeners = [];
    }
};