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
    const card = DOM.el('.schedlr-install-card');
    if (!card) return {};

    const [installedStateObj, backupState] = await Promise.all([
        API.chckSchedlrsInstlled(),
        API.checkDbBackupTask()
    ]);

    if (!installedStateObj) return {};

    // THE FIX: Filter out checkOnly tasks (like Apache) before asking "are any missing?"
    const hasMissingSchedulers = installedStateObj
        .filter(task => !task.checkOnly)
        .some(task => !task.installed);
        
    const needsBackupUpgrade = backupState.installed && !backupState.isUpgraded;

    const label = card.querySelector('.action-label');

    if (hasMissingSchedulers || needsBackupUpgrade) {
        DOM.toggleClass(card, 'disabled-state', false);
        label.innerHTML = `<span>${__('setuptask')}</span>`;
    } else {
        DOM.toggleClass(card, 'disabled-state', true);
        label.innerHTML = `<span class="text-success fw-bold">${__('setuptask')} (Installed)</span>`;
    }

    return { installedStateObj, backupState };
};