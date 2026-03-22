import { API } from './api.js';
import { UI } from './ui.js';
import { I18n } from './i18n.js';

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
        await UI.switchTab(tabName);
        if (tabName === 'dashboard' || tabName === 'settings') {
            this.refreshSettings();
        } else if (tabName === 'server-validation') {
            this.runValidation();
        }
    },

    async refreshSettings() {
        const settings = await API.getSettings();
        UI.updateSettingsUI(settings);
    },

    async runValidation() {
        const info = await API.getSystemInfo();
        UI.updateValidationBadges(info);
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
        await API.resetConfig();
        this.refreshSettings();
    },
    toggleDarkMode(isDark) {
        const theme = isDark ? 'dark' : 'light';
        document.documentElement.setAttribute('data-bs-theme', theme);
        localStorage.setItem('tms-theme', theme);
    },

    async copyScripts() {
        const result = await API.copyScripts();
        if (result && result.success) {
            console.log("Exported successfully to:", result.path);
            this.refreshSettings();
        }
    },
};

window.App = App;
window.UI = UI; 

document.addEventListener('DOMContentLoaded', () => App.init());