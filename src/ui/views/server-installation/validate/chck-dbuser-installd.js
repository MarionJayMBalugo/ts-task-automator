import { DOM } from '@jsutils';
import { API } from '@jsui/core';

export const chckDbUserInstalld = async () => {
    const card = DOM.el('.create-user-card');
    if (!card) return false;

    // Fetch the settings.json data
    const settings = await API.getSettings();

    // If the flag exists and is true, lock the card!
    if (settings.dbUserCreated) {
        DOM.toggleClass(card, 'disabled-state', true);
        const label = card.querySelector('.action-label');
        if (label) {
            label.innerHTML = `<span class="text-success fw-bold">${__('install.btns.createUser.title')} (Created)</span>`;
        }
        return true;
    }

    return false;
};