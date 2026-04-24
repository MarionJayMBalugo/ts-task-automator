/**
 * =============================================================================
 * HTML TEMPLATE ENGINE (Template)
 * =============================================================================
 * A lightweight, dependency-free template engine designed to handle dynamic 
 * data injection and translations without the overhead of React or Vue.
 */

export const Template = {
    /**
     * Primary cache to store raw HTML strings. This prevents redundant network 
     * requests and disk I/O when switching between views.
     */
    cache: {},
    
    // =========================================================================
    // --- TEMPLATE LOADER ---
    // =========================================================================

    /**
     * Fetches an external HTML file, caches it for future use, and passes 
     * it through the parser to inject live data.
     * * @param {string} url - Path to the template (e.g., 'partials/forms/txt.html').
     * @param {Object} data - The context object containing variables to inject.
     */
    load: async (url, data = {}) => {
        // Attempt to retrieve from cache first to boost performance
        if (!Template.cache[url]) {
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error('Template fetch failed');
                Template.cache[url] = await response.text();
            } catch (err) {
                console.error(`Critical Template Error: ${url}`, err);
                // Return a non-breaking error block so the UI doesn't crash entirely
                return `<div class="text-danger small">Missing template: ${url}</div>`;
            }
        }
        
        // Always pass cached content through the parser for the current data cycle
        return Template.parse(Template.cache[url], data);
    },

    // =========================================================================
    // --- CORE PARSER LOGIC ---
    // =========================================================================

    /**
     * The processing heart of the engine. It handles "Shielding" (protecting 
     * template tags), "Variable Injection", and "Translation Mapping".
     * * @param {string} html - Raw HTML string containing {{ braces }}.
     * @param {Object} data - The data source for variable replacement.
     */
    parse: (html, data = {}) => {
        if (!html) return '';

        /**
         * THE TEMPLATE SHIELD
         * We extract native <template> tags and hide them behind placeholders.
         * This prevents the parser from accidentally wiping out logic or braces 
         * inside hidden templates that are intended for a later rendering cycle.
         */
        const protectedTemplates = [];
        html = html.replace(/<template[^>]*>[\s\S]*?<\/template>/gi, (match) => {
            protectedTemplates.push(match);
            return `__TPL_SHIELD_${protectedTemplates.length - 1}__`;
        });
        
        /**
         * THE UNIFIED BRACE PARSER
         * This regex captures everything inside {{ }} and decides if it's 
         * a translation function or a standard data variable.
         */
        html = html.replace(/{{\s*([\s\S]+?)\s*}}/g, (match, innerText) => {
            const command = innerText.trim();

            /**
             * TRANSLATION LOGIC
             * If the brace starts with '__(' it's a call to the i18n system.
             * We use 'new Function' to safely evaluate the JS string within 
             * the window scope, allowing us to pass complex objects to our 
             * translation helper.
             */
            if (command.startsWith('__(')) {
                if (typeof __ === 'function') {
                    try {
                        return new Function('return window.' + command + ';')();
                    } catch (err) {
                        console.error("Translation Execution Failed:", command, err);
                        return match; 
                    }
                }
                return match; 
            }

            /**
             * VARIABLE INJECTION
             * Digs into nested objects (e.g., {{ user.profile.name }}) using 
             * reduce. If a property is missing, it returns an empty string 
             * to keep the UI clean.
             */
            const val = command.split('.').reduce((o, i) => o ? o[i] : null, data);
            return val !== undefined && val !== null ? val : '';
        });

        /**
         * LEGACY TRANSLATION FALLBACK
         * Supports the older style of raw __("key") strings without braces. 
         * This ensures backwards compatibility for older partials while 
         * we migrate everything to the unified {{ }} format.
         */
        if (typeof __ === 'function') {
            html = html.replace(/__\(['"]([^'"]+)['"]\)/g, (match, transKey) => window.__(transKey));
        }

        /**
         * SHIELD RESTORATION
         * After all variable and translation replacements are done, we 
         * re-inject the raw <template> tags we saved earlier. They are 
         * now ready to be used as components by the JavaScript controllers.
         */
        protectedTemplates.forEach((tpl, index) => {
            html = html.replace(`__TPL_SHIELD_${index}__`, tpl);
        });

        return html;
    }
};