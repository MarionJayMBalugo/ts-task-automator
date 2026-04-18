/**
 * =============================================================================
 * UI SHELL MODULE (Shell)
 * =============================================================================
 * Manages the physical layout of the application (Sidebar, Containers, Tabs).
 * * WHY IT EXISTS: It keeps the core DOM manipulation (like swapping out HTML 
 * views and toggling CSS classes) separate from the heavy business logic in Flows.
 */

import { API , I18n, Template } from '@jsui/core';
import { ModalSvc } from '../partials/modal.js';
import { TAB_CONFIG, VIEW_ROOT } from '../cnf';
import { VwRegistry } from '../../views';
import { Validate } from './validate.js';

export const Shell = {
    // Cache for heavy DOM elements so we don't have to query the document repeatedly.
    el: {},

    activePartial: null,

    // =========================================================================
    // --- INITIALIZATION ---
    // =========================================================================

    /**
     * Bootstraps the UI skeleton. Called exactly once by App.init().
     */
    init: () => {
        Shell.el.sidebar = document.getElementById('sidebar');
        Shell.el.appContainer = document.getElementById('app-container');
        Shell.el.versionDisplay = document.getElementById('app-version-display');
        Shell.el.pathInfo = document.getElementById('path-info');
        
        // [GLOBAL BRIDGE] 
        // Exposes ModalSvc.closeModal to the global window.
        // * WHY: So simple HTML buttons like <button onclick="closeModal()"> 
        // can close the active modal without needing complex event listeners.
        window.closeModal = () => ModalSvc.closeModal();
    },

    /**
     * Toggles the collapsed state of the sidebar for smaller screens.
     */
    toggleSidebar: () => {
        Shell.el.sidebar?.classList.toggle('collapsed');
    },

    // =========================================================================
    // --- NAVIGATION & VIEW LOADING ---
    // =========================================================================

    /**
     * Handles the heavy lifting of swapping views when a user clicks a Sidebar Tab.
     * * @param {string} tabName - The ID/Name of the view to load (e.g., 'dashboard')
     */
    switchTab: async (tabName) => {
        // 1. Visual Update: Remove 'active' class from all links, add to the clicked one.
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        const active = document.getElementById(`nav-${tabName}`);
        if (active) active.classList.add('active');

        // 2. Fetch & Parse the Main View
        // 🚨 WE MUST PARSE BEFORE INJECTING to ensure {{ __('translations') }} are evaluated!
        let rawHtml = await API.loadView(tabName);
        Shell.el.appContainer.innerHTML = Template.parse(rawHtml);

        // 3. Micro-Component Auto-Loader
        // * WHY: Instead of putting huge chunks of HTML inside a single file, you 
        // can use <div data-component="partials/sys-hw"></div>. This loops through 
        // the newly injected view, finds those placeholders, and fetches them concurrently.
        const components = Array.from(Shell.el.appContainer.querySelectorAll('[data-component]'));
        
        await Promise.all(components.map(async (mount) => {
            const compName = mount.getAttribute('data-component');
            let rawCompHtml = await API.loadPartial(compName);
            
            // Parse the component's HTML for translations too, then mount it!
            mount.innerHTML = Template.parse(rawCompHtml);
        }));
        
        // 4. Final Sweep: Apply translations to standard attributes (i18n="key")
        I18n.apply(); 
    },

    // =========================================================================
    // --- SETTINGS UI BINDING ---
    // =========================================================================

    /**
     * Paints the Settings Tab with the user's saved preferences.
     * * WHY: When the app boots or the user saves a new setting, this ensures 
     * the physical HTML toggles and text inputs actually reflect the Backend state.
     * * @param {Object} settings - The settings object returned from the Backend API.
     */
    updateSettingsUI: (settings) => {
        // 1. Update Path Labels
        const displayPath = settings.customScriptLoc || "Default: /resources/";
        if (Shell.el.pathInfo) Shell.el.pathInfo.innerText = displayPath; // Global footer path
        
        const sPath = document.getElementById('settings-path-info');    // Settings view specific
        if (sPath) sPath.innerText = displayPath;
        
        // 2. Bind Toggles & Inputs
        const autoClose = document.getElementById('auto-close-switch');
        const driveSel = document.getElementById('target-drive-select');
        const darkSwitch = document.getElementById('dark-mode-switch');
        
        if (autoClose) autoClose.checked = settings.autoCloseCmd === true;
        if (driveSel && settings.targetDrive) driveSel.value = settings.targetDrive;

        // 3. Bind Theme Toggle (Reads from browser localStorage, not backend)
        if (darkSwitch) {
            darkSwitch.checked = localStorage.getItem('tms-theme') === 'dark';
        }
    },

    loadTab: async (tabName) => {
        tabName = tabName.split('/')[0];

        Shell.unmountPrtlScript();

        await Shell.switchTab(tabName);

        Shell.mountPrtlScript(tabName);
        Shell.runDefTabFunc(tabName);
    },

    unmountPrtlScript: () => {
        if (Shell.activePartial && Shell.activePartial.unmount) {
            Shell.activePartial.unmount();
            Shell.activePartial = null;
        }
    },

    mountPrtlScript: (tabName) => {
        // 3. DYNAMICALLY MOUNT the new component
        const container = document.getElementById(VIEW_ROOT);

        const ComponentToMount = VwRegistry[tabName];
        
        if (ComponentToMount) {
            Shell.activePartial = ComponentToMount;
            Shell.activePartial.mount(container);
        } else {
            console.log(`[Router] No JS component found for '${tabName}'. Running in HTML-only mode.`);
        }
    },

    refreshSettings: async () => {
        const settings = await API.getSettings();
        Shell.updateSettingsUI(settings);
    },

    runValidation: async (force = false) => {
        Validate.run(force);
    },

    runDefTabFunc: (tabName) => {
        const actions = TAB_CONFIG[tabName] || [];
        actions.forEach(actionName => {
            if (typeof Shell[actionName] === 'function') {
                Shell[actionName]();
            }
        });
    },

    toggleDarkMode: (isDark) => {
        const theme = isDark ? 'dark' : 'light';
        document.documentElement.setAttribute('data-bs-theme', theme);
        localStorage.setItem('tms-theme', theme); 
    },

    setTheme: () => {
        const savedTheme = localStorage.getItem('tms-theme') || 'light';
        document.documentElement.setAttribute('data-bs-theme', savedTheme);
        const themeSwitch = document.getElementById('dark-mode-switch');
        if (themeSwitch) themeSwitch.checked = (savedTheme === 'dark');
    },

    setVersion: async () => {
        try {
            const version = await API.getVersion();
            if (Shell.el.versionDisplay) Shell.el.versionDisplay.innerText = `v${version}`;
        } catch (e) { console.error("Version load failed"); }
    }
};