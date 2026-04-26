/**
 * =============================================================================
 * UI MODULE: CLIPBOARD
 * =============================================================================
 * Handles global "click-to-copy" functionality by intercepting clicks on 
 * elements with the '.btn-copy' class. It provides temporary visual feedback 
 * by swapping icons and toggling Bootstrap utility classes.
 */

import { DOM } from '@jsutils';

export const Clipboard = {

    /** --- INITIALIZATION ---
     * Sets up a global event listener using Event Delegation. 
     */
    init: () => {
        document.addEventListener('click', Clipboard.handleCopyClick);
    },

    /** --- INTERACTION HANDLER ---
     * Orchestrates the copy process: identifies the trigger, resolves the 
     * target element via DOM.el, and executes the native clipboard operation.
     */
    handleCopyClick: async (e) => {
        // Locate the nearest copy button trigger
        const copyBtn = e.target.closest('.btn-copy');
        if (!copyBtn) return;

        // Resolve the target element containing the text
        const targetId = copyBtn.getAttribute('data-copy');
        
        // 🚨 Leveraging your DOM.el()! It safely handles the string conversion 
        // and automatically prepends the '#' selector if needed.
        const targetEl = DOM.el(targetId);
        if (!targetEl) return;

        // Clean and validate the text content
        const textToCopy = targetEl.innerText.trim();

        // VALIDATION: Ensure we aren't copying placeholders or empty states
        if (textToCopy === '---' || textToCopy === 'Fetching...') {
            return console.warn("Clipboard: Data not ready or empty. Aborting copy.");
        }

        try {
            // NATIVE CLIPBOARD API
            await navigator.clipboard.writeText(textToCopy);
            
            // Trigger visual "Success" state
            Clipboard.provideFeedback(copyBtn);
        } catch (err) {
            console.error('Clipboard: Failed to execute copy operation:', err);
        }
    },

    /** --- UX FEEDBACK LOOP ---
     * Swaps the button icon to a checkmark and updates colors to provide 
     * immediate confirmation. Automatically reverts to the original state.
     */
    provideFeedback: (btn) => {
        const iconRef = btn.querySelector('use');
        if (!iconRef) return;

        // Capture original state for the reset timer
        const originalIcon = iconRef.getAttribute('href');
        
        // TRANSITION: Apply Success Visuals
        iconRef.setAttribute('href', '#icon-chck'); 
        
        // 🚨 Leveraging your DOM.toggleClass(target, className, force) logic!
        // True = Add, False = Remove
        DOM.toggleClass(btn, 'text-success', true);
        DOM.toggleClass(btn, 'text-muted', false);

        // RESTORATION: Revert to original appearance after 1.5s
        setTimeout(() => {
            iconRef.setAttribute('href', originalIcon);
            DOM.toggleClass(btn, 'text-success', false);
            DOM.toggleClass(btn, 'text-muted', true);
        }, 1500);
    }
};