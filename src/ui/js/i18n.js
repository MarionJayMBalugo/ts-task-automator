import { state } from './state.js';

export const I18n = {
    apply() {
        if (typeof i18n === 'undefined') return console.warn("i18n dictionary missing");
        const lang = i18n[state.currentLang];

        const getVal = (path) => path.split('.').reduce((o, k) => (o && o[k] !== undefined) ? o[k] : null, lang);

        document.querySelectorAll('[data-i18n]').forEach(el => {
            const text = getVal(el.getAttribute('data-i18n'));
            if (text) el.innerText = text;
        });

        document.querySelectorAll('[data-i18n-desc]').forEach(el => {
            const text = getVal(el.getAttribute('data-i18n-desc'));
            if (text) el.setAttribute('data-description', text);
        });
    }
};