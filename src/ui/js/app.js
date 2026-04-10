/**
 * =============================================================================
 * MAIN APPLICATION CONTROLLER (app.js)
 * =============================================================================
 * The "Boss" of the frontend. This is the ONLY script loaded by index.html.
 * * WHY: It orchestrates the boot process, binds the UI modules to the window, 
 * and handles all communication between the UI buttons and the Backend API.
 */

import { API } from './api.js';
import { I18n } from './i18n.js';
import { TAB_CONFIG } from './cnf.js';
import { Template } from './template.js';

// 1. DYNAMIC DOMAIN IMPORTS
// We import the split modules here instead of using a monolithic ui.js file.
import { Shell, Status, Flows, Notify } from './modules/index.js';

// Memory cache to prevent spamming the backend with heavy PowerShell scripts
let cachedSystemInfo = null;

const App = {
    // =========================================================================
    // --- LIFECYCLE & BOOTSTRAP ---
    // =========================================================================

    /**
     * The Master Boot Sequence. Runs immediately when the DOM is ready.
     */
    async init() {
        // 1. Load hidden global HTML components (SVG icons, Modal Wrappers)
        await this.loadGlobalComponents(['icons', 'modal']);

        // 2. Initialize the App Shell (Sidebar, Main Containers)
        Shell.init();
        this.setupListeners();

        // 3. Apply Theme Preference
        const savedTheme = localStorage.getItem('tms-theme') || 'light';
        document.documentElement.setAttribute('data-bs-theme', savedTheme);
        const themeSwitch = document.getElementById('dark-mode-switch');
        if (themeSwitch) {
            themeSwitch.checked = (savedTheme === 'dark');
        }
        
        // 4. Fetch the App Version from package.json via the backend
        try {
            const version = await API.getVersion();
            if (Shell.el.versionDisplay) Shell.el.versionDisplay.innerText = `v${version}`;
        } catch (e) { console.error("Version load failed"); }

        // 5. Apply translations to any hardcoded HTML in index.html
        I18n.apply();

        // 6. Load the default starting view
        this.loadTab('dashboard');
    },

    /**
     * Injects base HTML files directly into the body.
     * * WHY: We don't want index.html to be 2,000 lines long. We keep icons 
     * and modals in separate files and inject them dynamically on boot.
     */
    async loadGlobalComponents(components) {
        try {
            const htmlStrings = await Promise.all(
                components.map(comp => API.loadView(comp))
            );
            
            htmlStrings.forEach((html, index) => {
                // 🚨 CRITICAL: Parse the raw HTML for {{ __('keys') }} before injecting!
                const parsedHtml = Template.parse(html);
                const position = components[index] === 'icons' ? 'afterbegin' : 'beforeend';
                document.body.insertAdjacentHTML(position, parsedHtml);
            });
        } catch (e) {
            console.error("Failed to load global components:", e);
        }
    },

    setupListeners() {
        // Global click listener to close the modal if the user clicks the dark background overlay
        window.addEventListener('click', (e) => {
            const overlay = document.getElementById('modal-overlay');
            if (e.target === overlay && typeof window.closeModal === 'function') {
                window.closeModal(); 
            }
        });
        // Will disable install heidi card after installation
        API.on('heidi-inst-done', () => {
            this.validateHeidiActionCard();
        });
    },

    /**
     * Handles navigation between the main sidebar tabs.
     */
    async loadTab(tabName) {
        // 1. Tell the Shell module to swap out the HTML container
        await Shell.switchTab(tabName);

        // 2. Run Tab-Specific Startup Logic
        // Checks cnf.js to see if this tab requires data to be fetched immediately 
        // (e.g., 'dashboard' requires runValidation to fire).
        const actions = TAB_CONFIG[tabName] || [];
        actions.forEach(actionName => {
            if (typeof this[actionName] === 'function') {
                this[actionName]();
            }
        });
        this.validateHeidiActionCard();
    },

    // =========================================================================
    // --- BUSINESS LOGIC & API BRIDGES ---
    // =========================================================================

    async refreshSettings() {
        const settings = await API.getSettings();
        Shell.updateSettingsUI(settings);
    },

    /**
     * Executes the heavy System Diagnostics scan (Network, CPU, Drive Space).
     * @param {boolean} force - If true, ignores cache and forces a fresh scan.
     */
    async runValidation(force = false) {
        // Cache Check: If we already scanned the PC, instantly paint the UI 
        // using the cached data to make the app feel blazingly fast.
        if (!force && cachedSystemInfo) {
            Status.updateValidationBadges(cachedSystemInfo);
            return; 
        }

        Status.setValidationLoading(true); // Spinners ON
        try {
            cachedSystemInfo = await API.getSystemInfo();
            Status.updateValidationBadges(cachedSystemInfo);
        } catch (error) {
            console.error("Validation failed:", error);
        } finally {
            Status.setValidationLoading(false); // Spinners OFF
        }
    },

    // --- BUTTON HANDLERS ---
    // These map directly to the 'onclick="App.functionName()"' attributes in your HTML views.

    async exportScripts() {
        const result = await API.exportScripts();
        if (result && result.success) this.refreshSettings();
    },

    openTool: (key) => API.openTool(key),
    toggleAutoClose: (val) => API.toggleAutoClose(val),
    changeTargetDrive: (val) => API.setTargetDrive(val),
    
    async changeFolder() {
        if (await API.selectFolder()) this.refreshSettings();
    },

    async resetConfig() {
        const result = await API.resetConfig();
        if (result) {
            const isError = result.includes('❌');
            Notify.showAlert(result, isError); // Toast Notification
            this.refreshSettings();
        }
    },

    toggleDarkMode(isDark) {
        const theme = isDark ? 'dark' : 'light';
        document.documentElement.setAttribute('data-bs-theme', theme);
        localStorage.setItem('tms-theme', theme); // Save preference across app restarts
    },

    async copyScripts() {
        const result = await API.copyScripts();
        if (result) {
            const isError = result.includes('❌');
            Notify.showAlert(result, isError);
            this.refreshSettings();
        }
    },

    async validateHeidiActionCard() {
        // Identify the card (Added the class 'heidi-install-card' as per your HTML)
        const card = document.querySelector('.heidi-install-card');
        if (!card) return;

        // Ask the Main process if Heidi is installed
        const isInstalled = await API.checkHeidiInstalled();

        if (isInstalled) {
            // Apply the 'shield' class
            card.classList.add('disabled-state');
            
            // Strip the onclick attribute so the function can't be triggered
            card.removeAttribute('onclick');
            
            // Update the label to give user feedback
            const label = card.querySelector('.action-label');
            if (label) {
                label.innerText += " (Installed)";
            }
        }
    }
};

// =============================================================================
// --- GLOBAL WINDOW BINDINGS (The Magic Trick) ---
// =============================================================================

// 1. Bind 'App' to the window so HTML 'onclick="App.runValidation()"' works.
window.App = App;

// 2. THE VIRTUAL UI OBJECT
// Instead of having a massive ui.js file, we dynamically merge our split modules 
// into a single 'window.UI' object. This means all your existing HTML buttons 
// (e.g., 'onclick="UI.promptCreateDB()"') continue working without any edits!
window.UI = { ...Shell, ...Status, ...Flows, ...Notify }; 

// 3. Register the global translation shorthand function {{ __('key') }}
window.__ = (key, params = {}) => I18n.getText(key, params);

// =============================================================================
// --- IGNITION ---
// =============================================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
} else {
    App.init(); // The DOM is already ready, execute immediately.
}