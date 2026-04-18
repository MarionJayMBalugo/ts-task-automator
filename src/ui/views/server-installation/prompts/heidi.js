import { FilePckr } from "@jspartials";
import { API } from '@jsui/core';
import { Flows } from '@jsui/modules';

// This is being called when installing Heidi
export const promptHeidiInstaller = async () => {
    const data = {
        title: 'Heidi Installation',
        desc: 'Please select the installation directory and confirm.',
        size: 'md'
    };

    Flows.openModal(
        'run-heidi-install',
        data,
        [{ 
            id: 'folderpicker', 
            type: 'partial', 
            url: 'partials/widgets/fold-pckr.html', 
            label: 'Installation Path',
            fldLbl: 'directory',
            mode: 'folder',
            // Uses the global translation shortcut available in JS
            errMsge: __('validation.errHint1', { fldLbl: 'directory' }),
            
            // 🚨 THE ON-RENDER HOOK 🚨
            // Modals are injected into the DOM asynchronously. We cannot attach 
            // event listeners to the File Picker until the HTML actually exists!
            // ModalSvc calls this hook exactly when the HTML is safely in the DOM.
            onRender: (container) => FilePckr.init(container) 
        }],
        (script, data) => {
            // The user either used the radio buttons OR the file picker.
            // We fallback (||) to whichever one actually contains data.
            const pth = data.folderpicker;
            API.instHeidi(pth);
        }
    );
}