/**
 * Component Logic for the Server Installation view.
 */

import * as Prmpts from './prompts';
import { API } from '@jsui/core';
import { Flows } from '@jsui/modules';

export const svrInstllVw = {
    // Store event listeners for memory cleanup
    _listeners: [],

    mount: (containerEl) => {
        // 1. Find all action cards that have a data-action attribute
        const actionCards = containerEl.querySelectorAll('[data-action]');

        // 2. Define our master click handler
        const handleAction = (e) => {
            e.preventDefault();
            
            // Get the exact element that was clicked
            const trigger = e.target.closest('[data-action]');
            const action = trigger.dataset.action;

            if (action === 'prompt-heidi-installer') {
                svrInstllVw.promptHeidiInstaller();
            } 
            else if (action === 'open-modal') {
                // Because Template.parse() processes your __('...') syntax 
                // before injection, these datasets are ALREADY translated!
                const script = trigger.dataset.script;
                const title = trigger.dataset.title;
                const desc = trigger.dataset.desc;
                const data = {
                    title: title,
                    desc: desc,
                    size: 'md'
                };
                
                Flows.openModal(script, data, [], (script) => API.runBatch(script));
            } else {
                //calls the same exact function as the one passed in the dataset
                svrInstllVw[action]();
            }
        };

        // 3. Attach listeners and store them for memory cleanup
        actionCards.forEach(card => {
            card.addEventListener('click', handleAction);
            svrInstllVw._listeners.push({ el: card, type: 'click', fn: handleAction });
        });
    },

    unmount: () => {
        // Remove every listener we attached to prevent memory leaks
        svrInstllVw._listeners.forEach(({ el, type, fn }) => {
            el.removeEventListener(type, fn);
        });
        
        svrInstllVw._listeners = [];
    },

    ...Prmpts
};