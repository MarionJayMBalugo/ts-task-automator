/**
 * =============================================================================
 * CUSTOM FILE PICKER COMPONENT (FilePckr)
 * =============================================================================
 * A UI wrapper that triggers native Windows File Explorer dialogs.
 * * * 🚨 THE BROWSER "FAKEPATH" LIMITATION (Why this exists) 🚨: 
 * Standard HTML `<input type="file">` elements are sandboxed by Chromium. 
 * If a user selects "C:\MyTools\install.exe", the browser deliberately hides 
 * the real path and returns "C:\fakepath\install.exe" for security.
 * * Since our batch scripts absolutely NEED the real system path to execute, 
 * we must bypass the HTML file input entirely, use a standard text box, 
 * and trigger a native OS dialog via our backend IPC Bridge.
 */

import { API } from '@jsui/core';

export const FilePckr = {
    /**
     * Binds the click listeners to the dynamically injected HTML.
     * * WHY IT TAKES A CONTAINER: This component is usually loaded inside a Modal. 
     * Because Modals are injected asynchronously, we cannot attach event listeners 
     * when the app first boots. The Flows module calls this `init` function 
     * exactly when the HTML is successfully rendered in the DOM.
     * * @param {HTMLElement} mdlCntnr - The DOM element containing the loaded modal.
     */
    init: async (mdlCntnr) => {
        // Find all instances of our custom file picker inside this specific modal
        const pckrs = mdlCntnr.querySelectorAll('.file-pckr-cntnr');
        
        pckrs.forEach(pckr => {
            // Find the sub-elements (The "Browse" button and the readonly Text Input)
            const browseBtn = pckr.querySelector('.browse-btn');
            const visblInpt = pckr.querySelector('.file-pth-inpt');
            const mode = pckr.getAttribute('data-mode') || 'folder';

            browseBtn.addEventListener('click', async () => {
                // Pause the UI and ask the backend to open a Windows Explorer window
                // Condition: Determine which API method to call based on the mode
                let filePath = null;
                if (mode === 'file') {
                    filePath = await API.openFileDialog();
                } else {
                    filePath = await API.selectFolder();
                }
                
                // 2. Process the Result
                // If filePath is null, it means the user clicked 'Cancel' or the 'X'. 
                // We only update the UI if they actually picked a file.
                if (filePath) {
                    visblInpt.value = filePath; // Boom! The true Absolute path (C:\...)

                    // Trigger events so the Modal UI recognizes the value update
                    visblInpt.dispatchEvent(new Event('input', { bubbles: true }));
                    visblInpt.dispatchEvent(new Event('change', { bubbles: true }));
                    
                    // Clear any red validation borders now that they have satisfied the requirement
                    visblInpt.classList.remove('is-invalid'); 
                }
            });
        });
    }
};