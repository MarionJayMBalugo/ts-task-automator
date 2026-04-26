/**
 * =============================================================================
 * VALIDATION: TASK SCHEDULERS
 * =============================================================================
 * Queries the backend to verify if the required Windows Task Schedulers are active.
 * Automatically transitions the UI action card from its "Loading/Checking" state 
 * into either an interactive "Ready to Install" state or a locked "Installed" state.
 */

import { DOM } from '@jsutils';
import { API } from '@jsui/core';

export const chckSchedlrsInstalld = async () => {
    
    // --- RESOLVE UI TARGET ---
    // Locate the specific action card using your global DOM helper
    const card = DOM.el('.schedlr-install-card');
    if (!card) return [];

    // --- FETCH SYSTEM STATE ---
    const installedStateObj = await API.chckSchedlrsInstlled();
    if (!installedStateObj) return [];

    // --- EVALUATE INSTALLATION COMPLETENESS ---
    const hasMissingSchedulers = installedStateObj.some(task => !task.installed);

    // --- UPDATE UI FEEDBACK ---
    // Use native querySelector for scoped, child-element lookups
    const label = card.querySelector('.action-label');

    if (hasMissingSchedulers) {
        // STATE: Missing Tasks (Ready to Install)
        // Leveraging DOM.toggleClass with 'false' to force REMOVE the class
        DOM.toggleClass(card, 'disabled-state', false);
        label.innerHTML = `<span>${__('setuptask')}</span>`;
        
    } else {
        // STATE: Fully Installed (Success)
        // Leveraging DOM.toggleClass with 'true' to force ADD the class
        DOM.toggleClass(card, 'disabled-state', true);
        label.innerHTML = `<span class="text-success fw-bold">${__('setuptask')} (Installed)</span>`;
    }

    // Return the raw state array back to the caller in case other logic needs it
    return installedStateObj;
};