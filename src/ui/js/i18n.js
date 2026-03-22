import { state } from './state.js';

export const I18n = {
    apply() {
        if (typeof i18n === 'undefined') return console.warn("i18n dictionary missing");
        const lang = i18n[state.currentLang];

        const getVal = (path) => path.split('.').reduce((o, k) => (o && o[k] !== undefined) ? o[k] : null, lang);

        // NEW: Interpolation helper
        // Looks for {key} in the text and replaces it with el.dataset.key
        const interpolate = (text, dataset) => {
            if (!text) return null;
            return text.replace(/{([^}]+)}/g, (match, key) => {
                return dataset[key] !== undefined ? dataset[key] : match;
            });
        };

        document.querySelectorAll('[i18n]').forEach(el => {
            const rawText = getVal(el.getAttribute('i18n'));
            const text = interpolate(rawText, el.dataset); // Apply parameters
            if (text) el.innerText = text;
        });

        document.querySelectorAll('[i18n-desc]').forEach(el => {
            const rawText = getVal(el.getAttribute('i18n-desc'));
            const text = interpolate(rawText, el.dataset); // Apply parameters
            if (text) el.setAttribute('data-description', text);
        });
    }
};