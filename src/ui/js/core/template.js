/**
 * =============================================================================
 * HTML TEMPLATE ENGINE (Template)
 * =============================================================================
 * A lightweight, custom template engine. 
 * * WHY IT EXISTS: Instead of using a massive library like React or Vue, this 
 * handles injecting dynamic variables and translations into raw HTML files.
 */

export const Template = {
    // Stores previously loaded HTML strings so we don't spam the network/hard drive 
    // every time the user switches tabs.
    cache: {},
    
    // =========================================================================
    // --- FETCHER & CACHE MANAGER ---
    // =========================================================================

    /**
     * Loads an HTML file, caches it, and replaces {{ keys }} with data.
     * * @param {string} url - The path to the HTML file (e.g., 'views/modal.html').
     * @param {Object} data - The data object to inject (e.g., { id: 'btn-1' }).
     */
    async load(url, data = {}) {
        // 1. Fetch and Cache the HTML
        if (!this.cache[url]) {
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error('Not found');
                this.cache[url] = await response.text();
            } catch (err) {
                console.error(`Failed to load template: ${url}`);
                // Graceful failure: Instead of crashing the app, show a red error block in the UI.
                return `<div class="text-danger small">Missing template: ${url}</div>`;
            }
        }
        
        // 2. Send the fetched HTML through our standalone parser
        return this.parse(this.cache[url], data);
    },

    // =========================================================================
    // --- THE CORE PARSER ---
    // =========================================================================

    /**
     * [STANDALONE PARSER] Evaluates variables and translations in any HTML string.
     * * WHY IT IS SEPARATE FROM LOAD(): By keeping this decoupled, we can pass 
     * *any* HTML string through it (like when app.js loads main views), not just 
     * files fetched specifically through Template.load().
     */
    parse(html, data = {}) {
        
        // 1. THE UNIFIED PARSER: Catches EVERYTHING inside {{ ... }} brackets.
        // /{{\s*([\s\S]+?)\s*}}/g  -> Looks for {{, then captures any character (even newlines), then }}
        html = html.replace(/{{\s*([\s\S]+?)\s*}}/g, (match, innerText) => {
            const command = innerText.trim();

            // CONDITION A: It's a dynamic translation (e.g., {{ __('key', {param}) }} )
            if (command.startsWith('__(')) {
                if (typeof window.__ === 'function') {
                    try {
                        // 🚨 THE MAGIC TRICK: 
                        // Regex is terrible at parsing nested objects like {val: 'x'}. 
                        // Instead, we use 'new Function' to force the browser to execute 
                        // the raw string as actual JavaScript, which evaluates perfectly!
                        return new Function('return window.' + command + ';')();
                    } catch (err) {
                        console.error("Template Translation Error:", command, err);
                        // If you typo'd the translation string, leave the raw broken text 
                        // on the screen so it's obvious where the bug is.
                        return match; 
                    }
                }
                return match; // window.__ isn't loaded yet, ignore.
            }

            // CONDITION B: It's a standard variable (e.g., {{ user.name }} )
            // Magic trick: Uses array.reduce to dig down into nested JSON objects.
            // If the variable is 'fld.label', it safely checks data['fld']['label'].
            const val = command.split('.').reduce((o, i) => o ? o[i] : null, data);
            
            // If the variable doesn't exist, return an empty string to keep the UI clean.
            return val !== undefined && val !== null ? val : '';
        });

        // 2. LEGACY FALLBACK
        // * WHY THIS IS HERE: Before the unified parser, translations were written 
        // as raw __('key') without the {{ }} wrappers. This keeps older code from 
        // breaking until everything is transitioned to the new bracket format.
        if (typeof window.__ === 'function') {
            html = html.replace(/__\(['"]([^'"]+)['"]\)/g, (match, transKey) => window.__(transKey));
        }

        return html;
    }
};