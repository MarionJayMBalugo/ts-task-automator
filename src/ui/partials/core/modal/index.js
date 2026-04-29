import { Template } from '@jsui/core';
import { DOM, FormUtil } from '@jsutils';

/**
 * =============================================================================
 * CORE MODAL ENGINE
 * =============================================================================
 * Handles the state, rendering, and navigation of dynamic pop-up modals. 
 * Supports both single-view popups and multi-step "wizard" workflows.
 */
export const Modal = {
    // --- STATE VARIABLES ---
    _currentStep: 0,
    _steps: [], 
    _executionData: {}, // Accumulates user input across all steps
    _scriptName: '',
    _onExecuteCallback: null,
    _modalData: {}, // Holds global modal settings (title, desc, size)

    /**
     * Initializes and displays the modal.
     * @param {string} scriptName - The identifier or script to run on execution.
     * @param {Object} data - Global configuration { title, desc, size, execBtn }.
     * @param {Array} config - Either a flat array of fields or an array of step objects.
     * @param {Function} onExecuteCallback - Triggered when the final step is confirmed.
     */
    openModal: async (scriptName, data, config = [], onExecuteCallback) => {
        // Reset state for a fresh modal session
        Modal._scriptName = scriptName;
        Modal._modalData = data;
        Modal._onExecuteCallback = onExecuteCallback;
        Modal._currentStep = 0;
        Modal._executionData = {};
        
        // Ensure standard structure: Wrap legacy flat configs into a single step array
        Modal._steps = (config.length > 0 && config[0].fields !== undefined) 
            ? config 
            : [{ fields: config }];

        await Modal._renderStep();
        DOM.showFlex('#modal-overlay');
    },

    closeModal: () => DOM.hide('#modal-overlay'),

    /**
     * Orchestrates the rendering of the current step in the workflow.
     */
    _renderStep: async () => {
        const step = Modal._steps[Modal._currentStep];
        
        // Setup Wrapper Design: Prefer step-specific overrides, fallback to global settings
        DOM.el('modal-title').innerText = step.title || Modal._modalData.title;
        DOM.el('modal-body').innerText = step.desc || Modal._modalData.desc;
        DOM.el('.tms-modal').className = `tms-modal mdl-${step.size || Modal._modalData.size || 'md'}`;

        // Prepare Dynamic Zone: Clear out previous content before loading new fields
        const zone = DOM.el('modal-dynamic-content');
        DOM.hide(zone);
        zone.innerHTML = '';
        
        // Fetch and Compile HTML for all fields in the current step
        if (step.fields && step.fields.length > 0) {
            let html = '';
            for (const f of step.fields) {

                // This condition allows to accept other text field type without creating new html file for it.
                const templateFolder = ['email', 'number', 'tel'].includes(f.type) 
                    ? 'txt' 
                    : (f.type || 'txt');
                const path = f.type === 'partial' 
                    ? f.url 
                    : `partials/forms/${templateFolder}/template.html`;
                html += await Template.load(path, f);
            }
            
            // Inject the raw HTML into the DOM first, so we can bind events to it
            zone.innerHTML = html;
            
            // Hand off to FormUtil to restore previous values and attach listeners
            step.fields.forEach(f => FormUtil.bind(f, zone, Modal._executionData[f.id]));
            
            DOM.show(zone);
        }

        // Final UI Polish
        Modal._updateButtons();
        Modal._renderStepper();
    },

    /**
     * Draws the visual progress indicator (dots and lines) at the top of the modal.
     * Automatically hides itself if there is only one step.
     */
    _renderStepper: () => {
        const container = DOM.el('#modal-stepper-container');
        if (Modal._steps.length <= 1) return DOM.hide(container);

        DOM.show(container);

        // Extract native HTML templates used for building the stepper UI
        const wrapTpl  = DOM.el('#tpl-stepper-wrapper').innerHTML;
        const itemTpl  = DOM.el('#tpl-stepper-item').innerHTML;
        const lineTpl  = DOM.el('#tpl-stepper-line').innerHTML;
        const checkTpl = DOM.el('#tpl-stepper-check').innerHTML;

        // Construct the stepper items dynamically based on the current step index
        const itemsHtml = Modal._steps.map((step, i) => {
            const statusClass = i < Modal._currentStep ? 'completed' : (i === Modal._currentStep ? 'active' : '');
            const iconContent = i < Modal._currentStep ? checkTpl : (i + 1);
            
            // Generate a connecting line unless it's the very last step
            const lineContent = i < Modal._steps.length - 1 
                ? Template.parse(lineTpl, { lineClass: i < Modal._currentStep ? 'completed' : '' }) 
                : '';
                
            return Template.parse(itemTpl, { statusClass, iconContent, lineContent });
        }).join('');

        container.innerHTML = Template.parse(wrapTpl, { content: itemsHtml });
    },

    /**
     * Updates button labels and visibility based on the current position in the workflow.
     */
    _updateButtons: () => {
        // Only show the "Previous" button if we are not on the first screen
        DOM.show('modal-prev-btn', Modal._currentStep > 0 ? 'block' : 'none');

        if (Modal._modalData.hideCancel) {
            DOM.hide('modal-cancel-btn');
        } else {
            DOM.show('modal-cancel-btn', 'block');
        }

        const isLast = Modal._currentStep === Modal._steps.length - 1;
        
        // Resolve translation fallbacks dynamically
        const defaultExec = typeof __ === 'function' ? __('field.execute') : 'Execute';
        const defaultNext = typeof __ === 'function' ? __('field.next') : 'Next';
        
        // Swap the confirm button text to reflect the final action
        DOM.el('modal-confirm-btn').innerText = isLast 
            ? (Modal._modalData.execBtn || defaultExec) 
            : defaultNext;

        Modal._attachButtonListeners();
    },

    /**
     * Binds navigation and execution logic to the modal buttons.
     */
    _attachButtonListeners: () => {
        // Strip old listeners by cloning the buttons to prevent duplicate fires
        ['modal-confirm-btn', 'modal-prev-btn'].forEach(id => {
            const btn = DOM.el(id);
            btn.parentNode.replaceChild(btn.cloneNode(true), btn);
        });

        // Navigation: Go Back
        DOM.el('modal-prev-btn').addEventListener('click', () => {
            if (Modal._currentStep > 0) { 
                Modal._currentStep--; 
                Modal._renderStep(); 
            }
        });

        // Navigation & Execution: Validate, Save Data, and Go Forward
        DOM.el('modal-confirm-btn').addEventListener('click', () => {
            const step = Modal._steps[Modal._currentStep];
            
            // Hand off to FormUtil to check required rules and grab input values
            const { isValid, data } = FormUtil.extract(step.fields);
            if (!isValid) return; // Halt execution if validation fails

            // Accumulate data into the master state
            Modal._executionData = { ...Modal._executionData, ...data };

            if (Modal._currentStep === Modal._steps.length - 1) {
                // Final Step: Execute the callback and close
                if (typeof Modal._onExecuteCallback === 'function') {
                    Modal._onExecuteCallback(Modal._scriptName, Modal._executionData);
                }
                Modal.closeModal(); 
            } else {
                // Intermediate Step: Proceed to the next screen
                Modal._currentStep++;
                Modal._renderStep();
            }
        });
    }
};