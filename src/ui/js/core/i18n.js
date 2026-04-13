/**
 * =============================================================================
 * INTERNATIONALIZATION ENGINE (I18n)
 * =============================================================================
 * Handles all text translation and dynamic string interpolation.
 * * WHY: Hardcoding text in HTML makes it impossible to translate the app later,
 * and makes it difficult to change wording across the app consistently. 
 * This engine pulls strings from a global dictionary ('text.js') and injects them.
 */

import { state } from './state.js';

export const I18n = {
    // =========================================================================
    // --- DOM MANIPULATION ---
    // =========================================================================

    /**
     * [AUTO-BINDER] Apply Translations to the DOM
     * Scans the currently visible HTML for specific attributes and translates them.
     * * WHY IT MATTERS: This is called every time a new Tab or Component loads 
     * (via Shell.switchTab) to ensure the newly injected HTML gets translated.
     */
    apply() {
        // 1. Standard Text Replacement (e.g., <span i18n="btns.save"></span>)
        document.querySelectorAll('[i18n]').forEach(el => {
            const rawText = I18n.getVal(el.getAttribute('i18n'));
            
            // Uses HTML5 dataset attributes to pass dynamic variables 
            // e.g., <span i18n="hello" data-name="John"> -> "Hello John"
            const text = I18n.interpolate(rawText, el.dataset); 
            if (text) el.innerText = text;
        });

        // 2. Tooltip / Description Replacement
        // specifically targets elements with 'i18n-desc' and puts the translated 
        // text into a 'data-description' attribute instead of the innerText.
        document.querySelectorAll('[i18n-desc]').forEach(el => {
            const rawText = I18n.getVal(el.getAttribute('i18n-desc'));
            const text = I18n.interpolate(rawText, el.dataset); 
            if (text) el.setAttribute('data-description', text);
        });

        document.querySelectorAll('[data-title]').forEach(el => {
            const rawText = I18n.getVal(el.getAttribute('data-title'));
            const text = I18n.interpolate(rawText, el.dataset); 
            if (text) el.setAttribute('data-description', text);
        });
    },

    // =========================================================================
    // --- DICTIONARY PARSING ---
    // =========================================================================

    /**
     * [RESOLVER] Fetch Raw String by Dot-Notation
     * Retrieves the text from the global dictionary based on the current language.
     * * @param {string} path - The dictionary key (e.g., 'dashboard.title')
     * @returns {string|null} The raw, un-interpolated string.
     */
    getVal(path) {
        // 'i18n' is assumed to be a globally loaded variable from text.js
        if (typeof i18n === 'undefined') return console.warn("i18n dictionary missing");
        
        // Grab the dictionary tree for the currently active language (e.g., 'en')
        const lang = i18n[state.currentLang];

        // Magic trick: Uses array.reduce to dig down into the nested JSON object safely.
        // If the path is 'dashboard.title', it checks lang['dashboard'], then goes deeper to ['title'].
        // If a key doesn't exist, it gracefully returns null instead of crashing.
        return path.split('.').reduce((o, k) => (o && o[k] !== undefined) ? o[k] : null, lang);
    },

    /**
     * [INJECTOR] Dynamic Variable Replacement
     * Replaces bracketed variables in a string with actual data.
     * * @param {string} text - The raw string (e.g., "Welcome, {name}!")
     * @param {Object} dataset - The data to inject (e.g., { name: 'Admin' })
     * @returns {string|null} The formatted string.
     */
    interpolate(text, dataset) {
        if (!text) return null;
        
        // Looks for anything inside { } brackets.
        return text.replace(/{([^}]+)}/g, (match, key) => {
            // If the key exists in our dataset, swap it out. Otherwise, leave it alone.
            return dataset[key] !== undefined ? dataset[key] : match;
        });
    },

    // =========================================================================
    // --- THE GLOBAL SHORTCUT ---
    // =========================================================================

    /**
     * [MAIN EXPORT] The Workhorse
     * Combines getVal and interpolate into a single step.
     * * WHY IT MATTERS: This is the exact function that is bound to the `window.__()` 
     * shortcut in app.js, which allows the template engine to parse `{{ __('key') }}`!
     */
    getText(key, dataset = []) {
        return I18n.interpolate(I18n.getVal(key), dataset);
    }
};