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

        setBadge('status-upload', info.urls.upload);
        setBadge('status-deploy', info.urls.deploy);
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
};