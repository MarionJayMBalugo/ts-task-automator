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
     * Updates the workspace path displayed in the header
     */
    async updatePathDisplay() {
        try {
            const path = await window.electronAPI.getConfigPath();
            const pathElement = document.getElementById('path-info');
            if (pathElement) {
                pathElement.innerText = path || "Default: /resources/";
            }
        } catch (err) {
            console.error("IPC Error (getConfigPath):", err);
        }
    },

    /**
     * Opens folder picker and refreshes display
     */
    async changeFolder() {
        try {
            const newPath = await window.electronAPI.selectFolder();
            if (newPath) {
                await this.updatePathDisplay();
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
    }
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

// Bootstrap the application
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});