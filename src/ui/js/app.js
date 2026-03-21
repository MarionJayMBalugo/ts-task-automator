import { API } from './api.js';
import { state } from './state.js';
import { UI } from './ui.js';
import { I18n } from './i18n.js';

const App = {
    async init() {
        UI.init();
        this.setupListeners();

        try {
            const iconSprite = await API.loadView('icons');
            document.body.insertAdjacentHTML('afterbegin', iconSprite);
        } catch (e) {
            console.error("Failed to load icon sprite");
        }
        // Run this when the app loads
        const savedTheme = localStorage.getItem('tms-theme') || 'light';
        document.documentElement.setAttribute('data-bs-theme', savedTheme);

        // Also, make sure the switch in settings reflects the saved state
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

    setupListeners() {
        document.getElementById('modal-confirm-btn')?.addEventListener('click', () => {
            if (state.pendingTask) API.runBatch(state.pendingTask);
            UI.closeModal();
        });

        window.addEventListener('click', (e) => {
            if (e.target === UI.el.modalOverlay) UI.closeModal();
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
        if (isDark) {
            document.documentElement.setAttribute('data-bs-theme', 'dark');
            localStorage.setItem('tms-theme', 'dark'); // Save preference
        } else {
            document.documentElement.setAttribute('data-bs-theme', 'light');
            localStorage.setItem('tms-theme', 'light');
        }
    }
};

window.App = App;
window.UI = UI; 

document.addEventListener('DOMContentLoaded', () => App.init());