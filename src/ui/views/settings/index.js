/**
 * Component Logic for the Settings view.
 */

import { API } from '@jsui/core';
import { Shell, Notify } from '@jsui/modules';

export const SettingsComponent = {
    _listeners: [],

    mount: (containerEl) => {
        // 1. Separate our interactive elements by their type
        const buttons = containerEl.querySelectorAll('button[data-action]');
        const inputs = containerEl.querySelectorAll('input[data-action], select[data-action]');

        // 2. Define the Click Handler (for buttons)
        const handleClick = (e) => {
            e.preventDefault();
            const trigger = e.target.closest('[data-action]');
            const action = trigger.dataset.action;

            if (action === 'change-folder') SettingsComponent.changeFolder();
            else if (action === 'copy-scripts') SettingsComponent.copyScripts();
            else if (action === 'reset-config') SettingsComponent.resetConfig();
        };

        // 3. Define the Change Handler (for toggles and dropdowns)
        const handleChange = (e) => {
            const trigger = e.target;
            const action = trigger.dataset.action;

            if (action === 'change-drive') {
                API.setTargetDrive(trigger.value);
            } 
            else if (action === 'toggle-auto-close') {
                API.toggleAutoClose(trigger.checked);
            } 
            else if (action === 'toggle-dark-mode') {
                Shell.toggleDarkMode(trigger.checked);
            }
        };

        // 4. Attach listeners and store them for memory cleanup
        buttons.forEach(btn => {
            btn.addEventListener('click', handleClick);
            SettingsComponent._listeners.push({ el: btn, type: 'click', fn: handleClick });
        });

        inputs.forEach(input => {
            input.addEventListener('change', handleChange);
            SettingsComponent._listeners.push({ el: input, type: 'change', fn: handleChange });
        });
    },

    unmount: () => {
        SettingsComponent._listeners.forEach(({ el, type, fn }) => {
            el.removeEventListener(type, fn);
        });
        SettingsComponent._listeners = [];
    },

    changeFolder: async () => {
        if (await API.selectFolder()) Shell.refreshSettings();
    },

    resetConfig: async () => {
        const result = await API.resetConfig();
        if (result) {
            const isError = result.includes('❌');
            Notify.showAlert(result, isError); 
            Shell.refreshSettings();
        }
    },

    copyScripts: async () => {
        const result = await API.copyScripts();
        if (result) {
            const isError = result.includes('❌');
            Notify.showAlert(result, isError);
            Shell.refreshSettings();
        }
    }
};