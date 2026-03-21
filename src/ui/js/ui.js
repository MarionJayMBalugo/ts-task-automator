import { API } from './api.js';
import { state } from './state.js';
import { I18n } from './i18n.js';

export const UI = {
    el: {},

    init() {
        this.el.sidebar = document.getElementById('sidebar');
        this.el.modalOverlay = document.getElementById('modal-overlay');
        this.el.modalTitle = document.getElementById('modal-title');
        this.el.modalBody = document.getElementById('modal-body');
        this.el.appContainer = document.getElementById('app-container');
        this.el.versionDisplay = document.getElementById('app-version-display');
        this.el.pathInfo = document.getElementById('path-info');
    },

    toggleSidebar() {
        if (this.el.sidebar) this.el.sidebar.classList.toggle('collapsed');
    },

    async switchTab(tabName) {
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        const active = document.getElementById(`nav-${tabName}`);
        if (active) active.classList.add('active');

        this.el.appContainer.innerHTML = await API.loadView(tabName);
        I18n.apply(); 
    },

    openModal(fileName, title, desc) {
        if (!this.el.modalOverlay) return;
        this.el.modalTitle.innerText = `Run ${title}?`;
        this.el.modalBody.innerText = desc;
        state.pendingTask = fileName; // Mutating imported state works!
        this.el.modalOverlay.style.display = 'flex';
    },

    closeModal() {
        if (this.el.modalOverlay) this.el.modalOverlay.style.display = 'none';
        state.pendingTask = null;
    },

    updateSettingsUI(settings) {
        const displayPath = settings.customScriptPath || "Default: /resources/";
        if (this.el.pathInfo) this.el.pathInfo.innerText = displayPath;
        
        const sPath = document.getElementById('settings-path-info');
        const autoClose = document.getElementById('auto-close-switch');
        const driveSel = document.getElementById('target-drive-select');
        
        if (sPath) sPath.innerText = displayPath;
        if (autoClose) autoClose.checked = settings.autoCloseCmd === true;
        if (driveSel && settings.targetDrive) driveSel.value = settings.targetDrive;
    },

    updateValidationBadges(info) {
        document.getElementById('sys-hostname').innerText = info.hostname || 'Offline';
        document.getElementById('sys-ip').innerText = info.ip || 'Offline';
        document.getElementById('sys-os').innerText = info.osVersion || 'Unknown';
        document.getElementById('sys-ram').innerText = info.ramGB ? `${info.ramGB} GB` : 'Unknown';
        document.getElementById('sys-cpu').innerText = info.cpuInfo || 'Unknown';
        document.getElementById('sys-drive-d').innerText = info.driveD || 'Unknown';

        const setBadge = (id, isSuccess) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.innerText = isSuccess ? "Installed" : "Not Found";
            el.className = isSuccess ? "badge bg-success px-2 py-1" : "badge bg-danger px-2 py-1";
        };

        // URLs & Apps
        setBadge('status-upload', info.urls.upload);
        setBadge('status-deploy', info.urls.deploy);
        // ... (call setBadge for the rest of your items) ...
    },
};