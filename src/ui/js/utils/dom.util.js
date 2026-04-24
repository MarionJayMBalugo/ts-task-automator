/**
 * =============================================================================
 * DOM UTILITIES (DOM)
 * =============================================================================
 * Standardized helpers for physical element manipulation.
 */

export const DOM = {
    /**
     * [CORE GETTER] Resolves a string or element to a DOM element.
     * Use this instead of document.getElementById or querySelector.
     */
    el: (target) => {
        if (typeof target === 'string') {
            // If it starts with # or . use it as is, 
            // otherwise assume it's an ID for backward compatibility
            const selector = (target.startsWith('#') || target.startsWith('.')) 
                ? target 
                : `#${target}`;
            return document.querySelector(selector);
        }
        if (target instanceof HTMLElement) return target;
        return null;
    },

    /**
     * [INTERNAL HELPER] Resolves a target to a DOM element.
     * Supports CSS selectors (strings) or raw DOM elements.
     */
    _get: (target) => {
        if (typeof target === 'string') return document.querySelector(target);
        if (target instanceof HTMLElement) return target;
        return null;
    },

    /**
     * [MULTI GETTER] Returns all matching elements as a NodeList.
     * @param {string} selector - CSS selector (e.g., ".my-class", "button")
     */
    all: (selector) => {
        if (typeof selector === 'string') return document.querySelectorAll(selector);
        return [];
    },

    /**
     * Internal resolver that handles strings, single elements, or lists.
     */
    _resolve: (target) => {
        if (typeof target === 'string') {
            // Check if it looks like it's meant to be a list (class or tag)
            if (target.startsWith('.') || (!target.startsWith('#') && !document.getElementById(target))) {
                return document.querySelectorAll(target);
            }
            return DOM.el(target);
        }
        return target;
    },

    /**
     * Standardized Action Wrapper
     * This allows us to apply a function to 1 or 100 elements automatically.
     */
    _apply: (target, action) => {
        const resolved = DOM._resolve(target);
        if (!resolved) return;

        if (resolved instanceof NodeList || Array.isArray(resolved)) {
            resolved.forEach(el => action(el));
        } else {
            action(resolved);
        }
    },

    /**
     * Sets display to a specific value.
     * @param {string|HTMLElement|NodeList} target - Selector or Element
     * @param {string} value - CSS display value (default: 'block')
     */
    show: (target, value = 'block') => DOM._apply(target, (el) => el.style.display = value),

    /** Shortcut for flex display */
    showFlex: (target) => DOM.show(target, 'flex'),

    /** Shortcut for inline-flex display */
    showInlineFlex: (target) => DOM.show(target, 'inline-flex'),

    /** Hides an element */
    hide: (target) => DOM._apply(target, (el) => el.style.display = 'none'),

    /**
     * Toggles visibility between none and a specified display value.
     */
    toggle: (target, displayValue = 'block') => {
        DOM._apply(target, (el) => {
            el.style.display = (el.style.display === 'none') ? displayValue : 'none';
        });
    },

    /**
     * Safely toggles a CSS class.
     */
    toggleClass: (target, className, force) => {
        DOM._apply(target, (el) => el.classList.toggle(className, force));
    }
};