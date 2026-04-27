/**
 * =============================================================================
 * UI SHELL MODULE (Shell)
 * =============================================================================
 * Manages the physical layout of the application (Sidebar, Containers, Tabs).
 * * WHY IT EXISTS: It keeps the core DOM manipulation (like swapping out HTML 
 * views and toggling CSS classes) separate from the heavy business logic in Flows.
 */

import { API , I18n, Template } from '@jsui/core';
import { Modal } from '@jspartials/core/modal';
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
        // Exposes Modal.closeModal to the global window.
        // * WHY: So simple HTML buttons like <button onclick="closeModal()"> 
        // can close the active modal without needing complex event listeners.
        window.closeModal = () => Modal.closeModal();
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
        let rawHtml = await API.loadView(tabName);
        Shell.el.appContainer.innerHTML = Template.parse(rawHtml);

        // 3. RECURSIVE Micro-Component Auto-Loader
        // Find initial components
        let components = Array.from(Shell.el.appContainer.querySelectorAll('[data-component]'));
        
        // Use a while loop! This ensures that if a newly injected component has 
        // ANOTHER component inside of it, the engine will keep fetching until everything is built.
        while (components.length > 0) {
            await Promise.all(components.map(async (mount) => {
                const compName = mount.getAttribute('data-component');
                
                // Extract Slot and Props
                const slotContent = mount.innerHTML;
                const props = { ...mount.dataset, slot: slotContent }; 
                let rawCompHtml = await API.loadPartial(compName);
                
                // Parse and inject
                mount.innerHTML = Template.parse(rawCompHtml, props);
                
                // 🚨 CRITICAL: Remove the attribute so we don't process this exact div again!
                mount.removeAttribute('data-component'); 
            }));

            // Re-query the DOM! If the injected components had nested components, 
            // they will be found here and trigger the next loop cycle.
            components = Array.from(Shell.el.appContainer.querySelectorAll('[data-component]'));
        }
        
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
        
        // UPDATE GLOBAL HEADER
        Shell.updateHeader(tabName);
        Shell.unmountPrtlScript();

        await Shell.switchTab(tabName);

        Shell.mountPrtlScript(tabName);
        Shell.runDefTabFunc(tabName);
        // Shell.validateHeidiActionCard(); //disable while app installation not complete
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
        const config = TAB_CONFIG[tabName] || {};
        // Safely checks if config.actions exists, otherwise falls back to config array for legacy support
        const actions = Array.isArray(config) ? config : (config.actions || []);
        
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
    },

    validateHeidiActionCard: async () => {
        const card = document.querySelector('.heidi-install-card');
        if (!card) return;
        const isInstalled = await API.checkHeidiInstalled();
        if (isInstalled) {
            card.classList.add('disabled-state');
            card.removeAttribute('onclick'); // For legacy protection
            card.removeAttribute('data-action'); // New logic protection
            const label = card.querySelector('.action-label');
            if (label) label.innerText += " (Installed)";
        }
    },

    /**
     * Translates and injects the title and subtitle into the top header
     */
    updateHeader: (tabName) => {
        const config = TAB_CONFIG[tabName];
        if (!config) return;

        const titleEl = document.getElementById('headr-title');
        const subtitleEl = document.getElementById('headr-sbtitle');
        const refreshBtn = document.getElementById('header-btn-refresh');

        // Translate the keys stored in the config using the global __() helper
        if (titleEl && config.title) titleEl.innerText = window.__(config.title);
        
        if (subtitleEl && config.subtitle) {
            subtitleEl.innerText = window.__(config.subtitle);
            subtitleEl.style.display = 'block';
        } else if (subtitleEl) {
            // Hide the subtitle if the view doesn't have one!
            subtitleEl.style.display = 'none'; 
        }

        if (refreshBtn) {
            if (config.showRefresh) {
                refreshBtn.classList.remove('d-none');
                refreshBtn.classList.add('d-flex'); // Use d-flex to keep icon and text aligned
            } else {
                refreshBtn.classList.add('d-none');
                refreshBtn.classList.remove('d-flex');
            }
        }
    }
};