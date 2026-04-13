/**
 * =============================================================================
 * UI SHELL MODULE (Shell)
 * =============================================================================
 * Manages the physical layout of the application (Sidebar, Containers, Tabs).
 * * WHY IT EXISTS: It keeps the core DOM manipulation (like swapping out HTML 
 * views and toggling CSS classes) separate from the heavy business logic in Flows.
 */

import { API } from '../core/api.js';
import { I18n } from '../core/i18n.js';
import { ModalSvc } from '../partials/modal.js';
import { Template } from '../core/template.js';
import { TAB_CONFIG, VIEW_ROOT } from '../cnf/index.js';
import { ComponentRegistry } from '../../views/index.js';
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
    init() {
        this.el.sidebar = document.getElementById('sidebar');
        this.el.appContainer = document.getElementById('app-container');
        this.el.versionDisplay = document.getElementById('app-version-display');
        this.el.pathInfo = document.getElementById('path-info');
        
        // [GLOBAL BRIDGE] 
        // Exposes ModalSvc.closeModal to the global window.
        // * WHY: So simple HTML buttons like <button onclick="closeModal()"> 
        // can close the active modal without needing complex event listeners.
        window.closeModal = () => ModalSvc.closeModal();
    },

    /**
     * Toggles the collapsed state of the sidebar for smaller screens.
     */
    toggleSidebar() {
        this.el.sidebar?.classList.toggle('collapsed');
    },

    // =========================================================================
    // --- NAVIGATION & VIEW LOADING ---
    // =========================================================================

    /**
     * Handles the heavy lifting of swapping views when a user clicks a Sidebar Tab.
     * * @param {string} tabName - The ID/Name of the view to load (e.g., 'dashboard')
     */
    async switchTab(tabName) {
        // 1. Visual Update: Remove 'active' class from all links, add to the clicked one.
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        const active = document.getElementById(`nav-${tabName}`);
        if (active) active.classList.add('active');

        // 2. Fetch & Parse the Main View
        // 🚨 WE MUST PARSE BEFORE INJECTING to ensure {{ __('translations') }} are evaluated!
        let rawHtml = await API.loadView(tabName);
        console.log(rawHtml, tabName)
        this.el.appContainer.innerHTML = Template.parse(rawHtml);

        // 3. Micro-Component Auto-Loader
        // * WHY: Instead of putting huge chunks of HTML inside a single file, you 
        // can use <div data-component="partials/sys-hw"></div>. This loops through 
        // the newly injected view, finds those placeholders, and fetches them concurrently.
        const components = Array.from(this.el.appContainer.querySelectorAll('[data-component]'));
        
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
    updateSettingsUI(settings) {
        // 1. Update Path Labels
        const displayPath = settings.customScriptLoc || "Default: /resources/";
        if (this.el.pathInfo) this.el.pathInfo.innerText = displayPath; // Global footer path
        
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

    async loadTab(tabName) {
        tabName = tabName.split('/')[0];

        this.unmountPrtlScript();

        await this.switchTab(tabName);

        this.mountPrtlScript(tabName);
        this.runDefTabFunc(tabName);
    },

    unmountPrtlScript() {
        if (this.activePartial && this.activePartial.unmount) {
            this.activePartial.unmount();
            this.activePartial = null;
        }
    },

    mountPrtlScript(tabName) {
        // 3. DYNAMICALLY MOUNT the new component
        const container = document.getElementById(VIEW_ROOT);

        const ComponentToMount = ComponentRegistry[tabName];
        
        if (ComponentToMount) {
            this.activeComponent = ComponentToMount;
            this.activeComponent.mount(container);
        } else {
            console.log(`[Router] No JS component found for '${tabName}'. Running in HTML-only mode.`);
        }
    },

    async refreshSettings() {
        const settings = await API.getSettings();
        this.updateSettingsUI(settings);
    },

    async runValidation(force = false) {
        Validate.run(force);
    },

    runDefTabFunc (tabName) {
        const actions = TAB_CONFIG[tabName] || [];
        actions.forEach(actionName => {
            if (typeof this[actionName] === 'function') {
                this[actionName]();
            }
        });
    },

    toggleDarkMode(isDark) {
        const theme = isDark ? 'dark' : 'light';
        document.documentElement.setAttribute('data-bs-theme', theme);
        localStorage.setItem('tms-theme', theme); 
    },

    setTheme() {
        const savedTheme = localStorage.getItem('tms-theme') || 'light';
        document.documentElement.setAttribute('data-bs-theme', savedTheme);
        const themeSwitch = document.getElementById('dark-mode-switch');
        if (themeSwitch) themeSwitch.checked = (savedTheme === 'dark');
    },

    async setVersion() {
        try {
            const version = await API.getVersion();
            if (this.el.versionDisplay) this.el.versionDisplay.innerText = `v${version}`;
        } catch (e) { console.error("Version load failed"); }
    }
};