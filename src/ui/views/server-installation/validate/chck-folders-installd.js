import { DOM } from '@jsutils';
import { API } from '@jsui/core';

export const chckFoldersInstalld = async () => {
    const card = DOM.el('.folder-init-card');
    if (!card) return [];

    const folderStateObj = await API.chckFoldersStatus();
    if (!folderStateObj) return [];

    const hasMissingFolders = folderStateObj.some(f => !f.installed);
    const label = card.querySelector('.action-label');

    if (hasMissingFolders) {
        DOM.toggleClass(card, 'disabled-state', false);
        label.innerHTML = `<span>Initialize Directory Tree</span>`;
    } else {
        DOM.toggleClass(card, 'disabled-state', true);
        label.innerHTML = `<span class="text-success fw-bold">Directory Tree (Installed)</span>`;
    }

    return folderStateObj;
};