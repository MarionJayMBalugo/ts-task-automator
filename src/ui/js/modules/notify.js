/**
 * =============================================================================
 * NOTIFICATIONS MODULE (Notify)
 * =============================================================================
 * Handles non-blocking user feedback (Toasts, Alerts).
 * * WHY IT EXISTS: When a user performs a background task (like copying scripts 
 * or resetting config), we need to tell them it succeeded or failed without 
 * locking up the screen with a heavy Modal or a native alert().
 */

export const Notify = {
    /**
     * [UI FEEDBACK] Show Floating Toast Alert
     * Dynamically creates a DOM element, animates it in, and cleans it up.
     * * @param {string} message - The text to display.
     * @param {boolean} isError - If true, paints the toast red. If false, green.
     */
    showAlert(message, isError = false) {
        // 1. Create the Element Dynamically
        // WHY DYNAMIC?: Creating it via JS means we don't have to keep a hidden, 
        // empty <div id="toast"> cluttering up our index.html all the time.
        const toast = document.createElement('div');
        
        // 2. Apply Bootstrap Styling
        // Uses standard Bootstrap 5 utility classes to pin it to the bottom-right ('bottom-0 end-0')
        toast.className = `position-fixed bottom-0 end-0 m-4 p-3 rounded shadow text-white ${isError ? 'bg-danger' : 'bg-success'}`;
        
        // Ensure it floats above absolutely everything (including modals)
        toast.style.zIndex = '9999';
        
        // CSS transition required for the smooth fade-out effect below
        toast.style.transition = 'opacity 0.5s ease';
        toast.innerHTML = `<h6 class="mb-0 fw-bold">${message}</h6>`;
        
        // 3. Inject into the page
        document.body.appendChild(toast);

        // 4. The Two-Step Teardown (Prevents Memory Leaks)
        // Step A: At 3 seconds, fade the opacity to 0 (Triggers the CSS transition).
        setTimeout(() => toast.style.opacity = '0', 3000);
        
        // Step B: At 3.5 seconds (after the fade animation finishes), completely 
        // destroy the HTML element so the DOM doesn't get clogged with invisible divs.
        setTimeout(() => toast.remove(), 3500);
    }
};