/**
 * =============================================================================
 * VIEW CONTROLLER: SERVER INSTALLATION
 * =============================================================================
 * Handles the logic, state, and event binding for the Server Installation tab.
 * This acts as a localized router, intercepting clicks on action cards and 
 * delegating them to the appropriate prompt or modal.
 */

import * as Prmpts from './prompts';
import * as Validate from './validate';
import { API } from '@jsui/core';
import { Modal } from '@jspartials/core/modal';

export const svrInstllVw = {
    
    /** --- LOCAL STATE MANAGEMENT ---
     * _listeners: Caches event bindings so we can remove them later (preventing memory leaks).
     * schedlrs: Caches the backend validation state so we don't have to re-fetch it 
     * when the user clicks the setup button.
     */
    _listeners: [],
    schedlrs: [],
    folders: [],

    /** --- LIFECYCLE: MOUNT ---
     * Triggered when the view is injected into the DOM. 
     * Handles pre-flight API checks and establishes the UI event listeners.
     */
    mount: (containerEl) => {
        Validate.chckDbUserInstalld();
        
        Validate.chckFoldersInstalld().then((results) => {
            svrInstllVw.folders = results;
        });
        // BACKGROUND VALIDATION
        // Pre-fetch the task scheduler status immediately upon view load.
        Validate.chckSchedlrsInstalld().then((results) => {
            svrInstllVw.schedlrs = results;
        }).catch((error) => {
            console.error("Install View: Failed to validate schedulers", error);
        });
        
        // EVENT DELEGATION SETUP
        // Target all interactive cards within this specific view container
        const actionCards = containerEl.querySelectorAll('[data-action]');

        /** --- DYNAMIC ACTION ROUTER ---
         * Intercepts all card clicks and routes them based on the 'data-action' attribute.
         */
        const handleAction = (e) => {
            e.preventDefault();
            
            // Resolve the exact card that triggered the event
            const trigger = e.target.closest('[data-action]');
            const action = trigger.dataset.action;

            if (action === 'prompt-app-installer') {
                svrInstllVw.promptHeidiInstaller();
                
            } else if (action === 'open-modal') {
                // GENERIC MODAL DISPATCHER
                // NOTE: Because Template.parse() processes your __('...') syntax 
                // before the HTML is injected, these dataset strings are ALREADY translated!
                const script = trigger.dataset.script;
                const checkEnv = API.checkEnv();
                if (script === 'create-env.bat' && checkEnv) {
                    const data = {
                        title: 'ENV file found!',
                        desc: 'Please make sure env variables are updated accordingly.\n\nDB_HOST = localhost\nDB_PORT = 3306\nDB_USERNAME = root\nDB_PASSWORD = T1m3l3ss@Nutr1t1on.PlatF0RM\nDB_NAME = tmnp+clientname\nDB_DATABASE = tmnp+clientname\nAPP_ENV = uat/production\nSPA_ENVIRONMENT = uat/production',
                        size: 'md',
                        execBtn: 'Okay',
                        hideCancel: true
                    };
                    Modal.openModal('', data, [], (script) => {});
                } else {
                    const data = {
                        title: trigger.dataset.title,
                        desc: trigger.dataset.desc,
                        size: 'md'
                    };

                    Modal.openModal(script, data, [], (script) => API.runBatch(script));
                }
            } else {
                // DYNAMIC FUNCTION INVOCATION
                // This looks for a matching function name directly on this svrInstllVw object.
                // It relies on the ...Prmpts spread at the bottom of this file!
                svrInstllVw[action]();
            }
        };

        // BIND & CACHE LISTENERS
        actionCards.forEach(card => {
            card.addEventListener('click', handleAction);
            svrInstllVw._listeners.push({ el: card, type: 'click', fn: handleAction });
        });
    },

    /** --- LIFECYCLE: UNMOUNT ---
     * Triggered when navigating away from this view. 
     * Purges all cached event listeners to ensure the browser garbage collector 
     * can clean up the DOM elements, preventing severe memory leaks in the SPA.
     */
    unmount: () => {
        svrInstllVw._listeners.forEach(({ el, type, fn }) => {
            el.removeEventListener(type, fn);
        });
        
        svrInstllVw._listeners = [];
    },

    /** --- PROMPT INJECTION ---
     * Spreading the imported Prmpts here makes every exported function from 
     * 'prompts.js' a direct method of this view controller. 
     * This is what allows `svrInstllVw[action]()` to work dynamically!
     */
    ...Prmpts,

    /** --- CUSTOM WRAPPERS ---
     * Intercepts the generic prompt call to inject the locally cached state.
     */
    prmptSchedulrSetupWrappr: () => {
        // Passes the array we fetched in the 'mount' phase directly into the prompt
        svrInstllVw.prmptSchedulrSetup(svrInstllVw.schedlrs);
    },

    prmptInitFoldersWrapper: () => {
        svrInstllVw.prmptInitFolders(svrInstllVw.folders);
    }
};