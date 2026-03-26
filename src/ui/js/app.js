import { API } from './api.js';
import { UI } from './ui.js';
import { I18n } from './i18n.js';
import { TAB_CONFIG } from './cnf.js';

let cachedSystemInfo = null;

const App = {
    async init() {
        await this.loadGlobalComponents(['icons', 'modal']);

        UI.init();
        this.setupListeners();

        const savedTheme = localStorage.getItem('tms-theme') || 'light';
        document.documentElement.setAttribute('data-bs-theme', savedTheme);
        const themeSwitch = document.getElementById('dark-mode-switch');

        if (themeSwitch) {
            themeSwitch.checked = (savedTheme === 'dark');
        }
        
        try {
            const version = await API.getVersion();
            if (UI.el.versionDisplay) UI.el.versionDisplay.innerText = `v${version}`;
        } catch (e) { console.error("Version load failed"); }

        I18n.apply();
        this.loadTab('dashboard');
    },

    async loadGlobalComponents(components) {
        try {
            const htmlStrings = await Promise.all(
                components.map(comp => API.loadView(comp))
            );
            
            htmlStrings.forEach((html, index) => {
                const position = components[index] === 'icons' ? 'afterbegin' : 'beforeend';
                document.body.insertAdjacentHTML(position, html);
            });
        } catch (e) {
            console.error("Failed to load global components:", e);
        }
    },

    setupListeners() {
        window.addEventListener('click', (e) => {
            const overlay = document.getElementById('modal-overlay');
            if (e.target === overlay && typeof window.closeModal === 'function') {
                window.closeModal(); 
            }
        });
    },

    async loadTab(tabName) {
        // Always switch the UI first
        await UI.switchTab(tabName);

        // Get the list of actions for this tab from our config
        const actions = TAB_CONFIG[tabName] || [];

        // Run every action assigned to this tab
        actions.forEach(actionName => {
            if (typeof this[actionName] === 'function') {
                this[actionName]();
            }
        });
    },

    async refreshSettings() {
        const settings = await API.getSettings();
        UI.updateSettingsUI(settings);
    },

    async runValidation(force = false) {
        // If we already have data AND we aren't forcing a refresh, just paint the UI instantly
        if (!force && cachedSystemInfo) {
            UI.updateValidationBadges(cachedSystemInfo);
            return; 
        }

        UI.setValidationLoading(true); // <-- Start spinning
        try {
            cachedSystemInfo = await API.getSystemInfo();
            UI.updateValidationBadges(cachedSystemInfo);
        } catch (error) {
            console.error("Validation failed:", error);
        } finally {
            UI.setValidationLoading(false); // <-- Stop spinning!
        }
    },

    async exportScripts() {
        const result = await API.exportScripts();
        if (result && result.success) {
            console.log("Exported successfully to:", result.path);
            this.refreshSettings();
        }
    },

    openTool: (key) => API.openTool(key),
    toggleAutoClose: (val) => API.toggleAutoClose(val),
    changeTargetDrive: (val) => API.setTargetDrive(val),
    
    async changeFolder() {
        if (await API.selectFolder()) this.refreshSettings();
    },

    async resetConfig() {
        const result = await API.resetConfig();
        console.log(result)
        if (result) {
            const isError = result.includes('❌');
            UI.showAlert(result, isError);
            this.refreshSettings();
        }
    },

    toggleDarkMode(isDark) {
        const theme = isDark ? 'dark' : 'light';
        document.documentElement.setAttribute('data-bs-theme', theme);
        localStorage.setItem('tms-theme', theme);
    },

    async copyScripts() {
        const result = await API.copyScripts();

        if (result) {
            const isError = result.includes('❌');
            UI.showAlert(result, isError);
            this.refreshSettings();
        }
    },
};

window.App = App;
window.UI = UI; 

document.addEventListener('DOMContentLoaded', () => App.init());