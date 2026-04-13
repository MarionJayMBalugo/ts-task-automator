/**
 * Component Logic for the Settings view.
 */

export const SettingsComponent = {
    _listeners: [],

    mount(containerEl) {
        console.log("[SettingsComponent] Mounted");

        // 1. Separate our interactive elements by their type
        const buttons = containerEl.querySelectorAll('button[data-action]');
        const inputs = containerEl.querySelectorAll('input[data-action], select[data-action]');

        // 2. Define the Click Handler (for buttons)
        const handleClick = (e) => {
            e.preventDefault();
            const trigger = e.target.closest('[data-action]');
            const action = trigger.dataset.action;

            if (action === 'change-folder') window.App.changeFolder();
            else if (action === 'copy-scripts') window.App.copyScripts();
            else if (action === 'reset-config') window.App.resetConfig();
        };

        // 3. Define the Change Handler (for toggles and dropdowns)
        const handleChange = (e) => {
            const trigger = e.target;
            const action = trigger.dataset.action;

            if (action === 'change-drive') {
                window.App.changeTargetDrive(trigger.value);
            } 
            else if (action === 'toggle-auto-close') {
                window.App.toggleAutoClose(trigger.checked);
            } 
            else if (action === 'toggle-dark-mode') {
                window.UI.toggleDarkMode(trigger.checked);
            }
        };

        // 4. Attach listeners and store them for memory cleanup
        buttons.forEach(btn => {
            btn.addEventListener('click', handleClick);
            this._listeners.push({ el: btn, type: 'click', fn: handleClick });
        });

        inputs.forEach(input => {
            input.addEventListener('change', handleChange);
            this._listeners.push({ el: input, type: 'change', fn: handleChange });
        });
    },

    unmount() {
        console.log("[SettingsComponent] Unmounting and cleaning up...");
        this._listeners.forEach(({ el, type, fn }) => {
            el.removeEventListener(type, fn);
        });
        this._listeners = [];
    }
};