/**
 * API BRIDGE (Renderer Side)
 * Automatically aggregates all methods exposed in preload.js.
 * * WHY: This prevents "Double-Entry" work. When you add a new 
 * method to preload.js, it is immediately available here.
 */
export const API = {
    // Spread all categorized methods into a flat API object
    ...window.electronAPI.system,
    ...window.electronAPI.settings,
    ...window.electronAPI.ui
};