/**
 * TMS Pulse - Main UI Logic
 */

let pendingTask = null;

const App = {
    /**
     * Initializes the application UI and listeners
     */
    init() {
        this.updatePathDisplay();
        this.setupEventListeners();
        console.log("TMS Pulse UI Initialized");
    },

    /**
     * Set up global listeners like backdrop clicks
     */
    setupEventListeners() {
        window.onclick = (event) => {
            const overlay = document.getElementById('modal-overlay');
            if (event.target === overlay) {
                this.closeModal();
            }
        };
    },

    /**
     * Toggles the sidebar collapsed/expanded state
     */
    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.toggle('collapsed');
        }
    },

    /**
     * Updates the workspace path displayed in the header and syncs settings
     */
    async updatePathDisplay() {
        try {
            // Get all settings from the backend
            const settings = await window.electronAPI.getSettings();
            
            // 1. Update paths
            const displayPath = settings.customScriptPath || "Default: /resources/";
            const pathElement = document.getElementById('path-info');
            const settingsPathElement = document.getElementById('settings-path-info');
            
            if (pathElement) pathElement.innerText = displayPath;
            if (settingsPathElement) settingsPathElement.innerText = displayPath;

            // 2. Update the toggle switch state
            const autoCloseSwitch = document.getElementById('auto-close-switch');
            if (autoCloseSwitch) {
                autoCloseSwitch.checked = settings.autoCloseCmd === true;
            }

            // 3. Update the Target Drive dropdown
            const driveSelect = document.getElementById('target-drive-select');
            if (driveSelect && settings.targetDrive) {
                driveSelect.value = settings.targetDrive;
            }

        } catch (err) {
            console.error("IPC Error (updatePathDisplay):", err);
        }
    },

    /**
     * Opens folder picker and refreshes display on BOTH tabs
     */
    async changeFolder() {
        try {
            const newPath = await window.electronAPI.selectFolder();
            if (newPath) {
                // Update the Dashboard path
                await this.updatePathDisplay(); 
                
                // Update the Settings path instantly
                const settingsPathElement = document.getElementById('settings-path-info');
                if (settingsPathElement) {
                    settingsPathElement.innerText = newPath;
                }
            }
        } catch (err) {
            console.error("IPC Error (selectFolder):", err);
        }
    },

    /**
     * Exports internal scripts to the selected workspace
     */
    async generateLocalScripts() {
        try {
            const result = await window.electronAPI.copyScripts();
            alert(result);
        } catch (err) {
            alert("Export failed: " + err.message);
        }
    },

    /**
     * Opens the confirmation modal for a specific batch file
     */
    triggerModal(fileName, taskDisplayName) {
        const overlay = document.getElementById('modal-overlay');
        const body = document.getElementById('modal-body');
        const title = document.getElementById('modal-title');
        const confirmBtn = document.getElementById('modal-confirm-btn');

        if (!overlay || !confirmBtn) return;

        title.innerText = `Run ${taskDisplayName}?`;
        body.innerText = `You are about to launch ${fileName}. This will open an elevated Command Prompt to perform system-level operations. Please ensure your .env configuration is correct.`;
        
        pendingTask = fileName;
        overlay.style.display = 'flex';

        // Use onclick to overwrite any previous assignments
        confirmBtn.onclick = () => {
            window.electronAPI.runBatch(pendingTask);
            this.closeModal();
        };
    },

    /**
     * Hides the modal and resets the pending task
     */
    closeModal() {
        const overlay = document.getElementById('modal-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
        pendingTask = null;
    },

    /**
     * Tab Switching Logic
     */
    switchTab(tabName) {
        // 1. Hide all views
        document.getElementById('dashboard-view').style.display = 'none';
        document.getElementById('settings-view').style.display = 'none';
        document.getElementById('server-validation-view').style.display = 'none';
        document.getElementById('server-installation-view').style.display = 'none';

        // 2. Remove 'active' class from all nav links
        document.getElementById('nav-dashboard').classList.remove('active');
        document.getElementById('nav-settings').classList.remove('active');
        document.getElementById('nav-server-validation').classList.remove('active');
        document.getElementById('nav-server-installation').classList.remove('active');

        // 3. Show the target view and highlight the nav link
        if (tabName === 'dashboard') {
            document.getElementById('dashboard-view').style.display = 'block';
            document.getElementById('nav-dashboard').classList.add('active');
            
        } else if (tabName === 'settings') {
            document.getElementById('settings-view').style.display = 'block';
            document.getElementById('nav-settings').classList.add('active');
            
            // Sync the path text in settings when opened
            const currentPath = document.getElementById('path-info').innerText;
            const settingsPathElement = document.getElementById('settings-path-info');
            if (settingsPathElement) {
                settingsPathElement.innerText = currentPath;
            }
            
        } else if (tabName === 'server-validation') {
            document.getElementById('server-validation-view').style.display = 'block';
            document.getElementById('nav-server-validation').classList.add('active');
            this.loadServerInfo(); // Triggers the data fetch automatically
            
        } else if (tabName === 'server-installation') {
            document.getElementById('server-installation-view').style.display = 'block';
            document.getElementById('nav-server-installation').classList.add('active');
        }
    },

    /**
     * Reset Workspace Configuration (Settings Tab)
     */
    async resetConfigPath() {
        try {
            await window.electronAPI.resetConfig(); 
            
            // Update both UI elements
            const defaultText = "Default: /resources/";
            
            const pathElement = document.getElementById('path-info');
            const settingsPathElement = document.getElementById('settings-path-info');
            
            if (pathElement) pathElement.innerText = defaultText;
            if (settingsPathElement) settingsPathElement.innerText = defaultText;
            
            alert("Workspace reset to internal default.");
        } catch (error) {
            console.error("Failed to reset config:", error);
        }
    },

    /**
     * Toggles the auto-close preference and saves it
     */
    async toggleAutoClose(isChecked) {
        try {
            await window.electronAPI.toggleAutoClose(isChecked);
        } catch (err) {
            console.error("Failed to save auto-close preference:", err);
        }
    },

    /**
     * NEW: Save the drive when the dropdown changes
     */
    async changeTargetDrive(driveValue) {
        try {
            await window.electronAPI.setTargetDrive(driveValue);
        } catch (err) {
            console.error("Failed to save target drive:", err);
        }
    },

    /**
     * Fetches system info from backend and populates the UI
     */
    async loadServerInfo() {
        try {
            // Set basic loading states
            document.getElementById('sys-hostname').innerText = "Scanning...";
            
            // Set UI badges back to checking state visually while the backend processes URLs
            const idsToReset = [
                'status-upload', 'status-deploy', 'status-google', 'status-innovar', 'status-nextgen',
                'status-tmsdos', 'status-mirth', 'status-bridgelink', 'status-vscode'
            ];
            idsToReset.forEach(id => {
                const el = document.getElementById(id);
                if(el) { el.innerText = "Checking..."; el.className = "badge bg-secondary px-2 py-1"; }
            });

            // Fetch data from main.js (This might take ~3 seconds if firewalls are blocking URLs)
            const info = await window.electronAPI.getSystemInfo();
            
            // Populate Text Info
            document.getElementById('sys-hostname').innerText = info.hostname;
            document.getElementById('sys-ip').innerText = info.ip;
            document.getElementById('sys-os').innerText = info.osVersion;
            document.getElementById('sys-ram').innerText = `${info.ramGB} GB`;
            document.getElementById('sys-cpu').innerText = info.cpuInfo;
            document.getElementById('sys-drive-d').innerText = info.driveD;

            // Helper function to update the UI Badges dynamically
            const updateBadge = (elementId, isSuccess, passText = "Installed", failText = "Not Found") => {
                const el = document.getElementById(elementId);
                if (!el) return;
                el.innerText = isSuccess ? passText : failText;
                el.className = isSuccess ? "badge bg-success px-2 py-1" : "badge bg-danger px-2 py-1";
            };

            // Update URLs
            updateBadge('status-upload', info.urls.upload, "Passed", "Failed");
            updateBadge('status-deploy', info.urls.deploy, "Passed", "Failed");
            updateBadge('status-google', info.urls.google, "Passed", "Failed");
            updateBadge('status-innovar', info.urls.innovar, "Passed", "Failed");
            updateBadge('status-nextgen', info.urls.nextgen, "Passed", "Failed");

            // Update Apps
            updateBadge('status-tmsdos', info.apps.tmsDos);
            updateBadge('status-mirth', info.apps.mirth);
            updateBadge('status-bridgelink', info.apps.bridgelink);
            updateBadge('status-vscode', info.apps.vscode);

        } catch (error) {
            console.error("Failed to load server info:", error);
            document.getElementById('sys-hostname').innerText = "Error loading data.";
        }
    },
    openTool(toolKey) {
        window.electronAPI.openTool(toolKey);
    },
};

/**
 * GLOBAL SCOPE MAPPINGS
 * Maps the App methods to the global window object so HTML 
 * onclick attributes can find them easily.
 */
window.App = App;
window.triggerModal = (file, name) => App.triggerModal(file, name);
window.closeModal = () => App.closeModal();
window.changeFolder = () => App.changeFolder();
window.generateLocalScripts = () => App.generateLocalScripts();
window.switchTab = (tabName) => App.switchTab(tabName);
window.resetConfigPath = () => App.resetConfigPath();
window.toggleAutoClose = (checked) => App.toggleAutoClose(checked);
window.changeTargetDrive = (val) => App.changeTargetDrive(val); // NEW
window.loadServerInfo = () => App.loadServerInfo();
window.openTool = (key) => App.openTool(key);

// Bootstrap the application
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});