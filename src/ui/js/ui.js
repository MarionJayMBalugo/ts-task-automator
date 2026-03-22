import { API } from './api.js';
import { I18n } from './i18n.js';
import { ModalService } from './modal.js';

export const UI = {
    el: {},

    init() {
        this.el.sidebar = document.getElementById('sidebar');
        this.el.appContainer = document.getElementById('app-container');
        this.el.versionDisplay = document.getElementById('app-version-display');
        this.el.pathInfo = document.getElementById('path-info');
        
        // Expose closeModal globally so the HTML "Cancel" button can use it
        window.closeModal = () => ModalService.closeModal();
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

    // DELETED the old openModal and closeModal from here!

    updateSettingsUI(settings) {
        const displayPath = settings.customScriptPath || "Default: /resources/";
        if (this.el.pathInfo) this.el.pathInfo.innerText = displayPath;
        
        const sPath = document.getElementById('settings-path-info');
        const autoClose = document.getElementById('auto-close-switch');
        const driveSel = document.getElementById('target-drive-select');
        const darkSwitch = document.getElementById('dark-mode-switch');
        
        if (sPath) sPath.innerText = displayPath;
        if (autoClose) autoClose.checked = settings.autoCloseCmd === true;
        if (driveSel && settings.targetDrive) driveSel.value = settings.targetDrive;

        if (darkSwitch) {
            darkSwitch.checked = localStorage.getItem('tms-theme') === 'dark';
        }
    },

    setValidationLoading(isLoading) {
        const btn = document.querySelector('button[onclick="App.runValidation()"]');
        if (btn) {
            btn.disabled = isLoading;
            btn.innerHTML = isLoading 
                ? `<span class="spinner-border spinner-border-sm" aria-hidden="true"></span> Scanning...`
                : `<svg width="18" height="18"><use href="#icon-refresh"></use></svg> <span i18n="validation.refresh"></span>`;
            
            if (!isLoading && typeof I18n !== 'undefined') I18n.apply();
        }

        if (isLoading) {
            const loadingHtml = '<span class="text-muted small">Fetching...</span>';
            ['sys-hostname', 'sys-ip', 'sys-os', 'sys-ram', 'sys-cpu', 'sys-drive-d'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.innerHTML = loadingHtml;
            });

            document.querySelectorAll('#server-validation-view .badge').forEach(b => {
                b.className = 'badge bg-secondary px-2 py-1';
                b.innerText = '...';
            });
        }
    },

    updateValidationBadges(info) {
        document.getElementById('sys-hostname').innerText = info.hostname || 'Offline';
        document.getElementById('sys-ip').innerText = info.ip || 'Offline';
        document.getElementById('sys-os').innerText = info.osVersion || 'Unknown';
        document.getElementById('sys-ram').innerText = info.ramGB ? `${info.ramGB} GB` : 'Unknown';
        document.getElementById('sys-cpu').innerText = info.cpuInfo || 'Unknown';
        document.getElementById('sys-drive-d').innerText = info.driveD || 'Unknown';

        const storageEl = document.getElementById('sys-drive-d');
        if (info.storage) {
            let html = '';
            // Display C: Drive
            if (info.storage.c) {
                html += `<div style="font-size: 0.8rem; line-height: 1.2;" class="mb-1 text-dark">
                            <span class="text-success">${info.storage.c.letter}</span> ${info.storage.c.free}GB free of ${info.storage.c.total}GB
                         </div>`;
            }
            // Display Target Drive (if it's not C)
            if (info.storage.target) {
                html += `<div style="font-size: 0.8rem; line-height: 1.2;" class="text-dark">
                            <span class="text-success">${info.storage.target.letter}</span> ${info.storage.target.free}GB free of ${info.storage.target.total}GB
                         </div>`;
            }
            storageEl.innerHTML = html || 'Unknown';
        }

        const setBadge = (id, isSuccess, successText = "Installed", failText = "Not Found") => {
            const el = document.getElementById(id);
            if (!el) return;
            el.innerText = isSuccess ? successText : failText;
            el.className = isSuccess ? "badge bg-success px-2 py-1" : "badge bg-danger px-2 py-1";
        };

        const w = "Whitelisted";
        const b = "Blocked";

        setBadge('status-upload', info.urls.upload, w, b);
        setBadge('status-deploy', info.urls.deploy, w, b);
        setBadge('status-google', info.urls.google, w, b);
        setBadge('status-innovar', info.urls.innovar, w, b);
        setBadge('status-nextgen', info.urls.nextgen, w, b);

        setBadge('status-tmsdos', info.apps.tmsDos);
        setBadge('status-mirth', info.apps.mirth);
        setBadge('status-bridgelink', info.apps.bridgelink);
        setBadge('status-vscode', info.apps.vscode);
    },

    promptCreateDB() {
        ModalService.openModal(
            'create-database.bat', 
            'Run Create Databases?', 
            'Enter the target database names to initialize the core schemas.', 
            [
                { 
                    id: 'dbNames', 
                    type: 'list',  
                    label: 'Target Database Names', 
                    placeholder: 'Type a name and press Enter or Add', 
                    required: true 
                }
            ],
            (scriptName, data) => {
                const argsForBatch = [
                    data.dbNames.join(',')
                ];
                console.log("Modal finished! Sending to backend:", scriptName, argsForBatch);
                // Make sure your backend API handles this properly!
                API.runBatch(scriptName, argsForBatch); 
            }
        );
    },

    // This handles all the "old" simple buttons that don't need input fields!
    openModal(fileName, title, desc) {
        ModalService.openModal(
            fileName, 
            title, 
            desc, 
            [], // Pass an empty array because there are no input fields needed!
            (scriptName, data) => {
                console.log("Executing standard task:", scriptName);
                // Run the script without any extra data
                API.runBatch(scriptName); 
            }
        );
    },

    showAlert(message, isError = false) {
        const toast = document.createElement('div');
        // Uses Bootstrap classes to make a floating, colored pill
        toast.className = `position-fixed bottom-0 end-0 m-4 p-3 rounded shadow text-white ${isError ? 'bg-danger' : 'bg-success'}`;
        toast.style.zIndex = '9999';
        toast.style.transition = 'opacity 0.5s ease';
        toast.innerHTML = `<h6 class="mb-0 fw-bold">${message}</h6>`;
        
        document.body.appendChild(toast);

        // Auto-fade out and remove after 3.5 seconds
        setTimeout(() => toast.style.opacity = '0', 3000);
        setTimeout(() => toast.remove(), 3500);
    },
};