import { FilePckr } from "@jspartials";
import { API } from '@jsui/core';
import { Flows } from '@jsui/modules';

export const prmptTmsdInstllr = async () => {
    let tmsdosInstalled = await API.chckappInstlled('tms-dos');
    const installers = await API.getTmsdInst();
    let title = 'TMS-DOS Installation';
    let desc = `Unable to find the installer in the path specified.`;
    let components = [];
    
    // --- STATE 1: MULTIPLE INSTALLERS FOUND ---
    if (installers.length > 1) {
        desc = 'Multiple Installers are found. Please select just One.';
        
        installers.forEach((inst, index) => {
            components.push({ 
                id: 'selectedInstaller', 
                type: 'radio', 
                url: 'partials/modals/installer-radio.html', 
                label: inst, 
                value: inst, 
                index: index, 
                required: true 
            });
        }); 
        
    // --- STATE 2: EXACTLY ONE INSTALLER FOUND ---
    } else if (installers.length === 1) {
        desc = `Found installer! Click Next to continue.`;
        
        components.push({ 
            id: 'selectedInstaller', 
            type: 'radio', 
            label: installers[0], 
            value: installers[0], 
            readonly: true, 
            checked: true, 
            required: true 
        });
        
    // --- STATE 3: NO INSTALLERS FOUND ---
    } else {
        desc = 'No installer found. Please choose manually.';
        
        components.push({ 
            id: 'filepicker', 
            type: 'partial', 
            url: 'partials/widgets/file-pckr.html', 
            label: 'Installation Path',
            fldLbl: 'file path',
            mode: 'file',
            errMsge: __('validation.errHint1', { fldLbl: 'file path' }),
            onRender: (container) => FilePckr.init(container) 
        });
    }

    // =====================================================================
    // 2. DEFINE THE WIZARD STEPS
    // =====================================================================
    const steps = [
        {
            title: title,
            desc: desc,            // The dynamic description we built above
            fields: components     // The dynamic components we built above
        }
    ];

    if (tmsdosInstalled) {
        steps.unshift({
            title: title,
            desc: 'TMS-DOS is already installed. Clicking "NEXT" will start TMS-DOS Update Instead. ',
            fields: []
        })
    }

    // =====================================================================
    // 3. LAUNCH THE WIZARD
    // =====================================================================
    const data = {
        title: 'TMS-DOS Wizard', // Global modal title (if steps don't provide one)
        size: 'lg'
    };

    Flows.openModal('install.bat', data, steps, (script, executionData) => {
        // Because it's a multi-step modal, `executionData` accumulates EVERYTHING!
        // It will look like: { step1_confirm: true, selectedInstaller: 'C:/inst.exe', final_confirm: true }
        
        const pth = executionData.selectedInstaller || executionData.filepicker;
        API.runBatch(script, [pth]);
    });
}
