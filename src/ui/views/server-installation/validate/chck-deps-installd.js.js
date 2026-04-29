import { DOM } from '@jsutils';
import { API } from '@jsui/core';

export const chckDepsInstalld = async () => {
    const card = DOM.el('.deps-install-card');
    if (!card) return [];

    const depsObj = await API.chckDepsStatus();
    if (!depsObj) return [];

    // Evaluate if ANY dependency is missing
    const hasMissingDeps = depsObj.some(dep => !dep.installed);
    const label = card.querySelector('.action-label');

    if (hasMissingDeps) {
        DOM.toggleClass(card, 'disabled-state', false);
        label.innerHTML = `<span>Install Dependencies</span>`;
    } else {
        DOM.toggleClass(card, 'disabled-state', true);
        label.innerHTML = `<span class="text-success fw-bold">Dependencies (Installed)</span>`;
    }

    return depsObj;
};