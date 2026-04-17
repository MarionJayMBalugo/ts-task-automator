import { Template } from '../core/template.js';

export const ModalSvc = {
    // --- STATE VARIABLES ---
    _currentStep: 0,
    _steps: [],
    _executionData: {},
    _scriptName: '',
    _onExecuteCallback: null,
    _modalData: {},

    // =========================================================================
    // --- CORE INITIALIZATION ---
    // =========================================================================

    /**
     * @param {string} scriptName 
     * @param {Object} data - { title, desc, size }
     * @param {Array} config - Either a flat array of fields (legacy) or an array of step objects.
     * @param {Function} onExecuteCallback 
     */
    openModal: async (scriptName, data, config = [], onExecuteCallback) => {
        // 1. Reset state
        ModalSvc._scriptName = scriptName;
        ModalSvc._modalData = data;
        ModalSvc._onExecuteCallback = onExecuteCallback;
        ModalSvc._currentStep = 0;
        ModalSvc._executionData = {};

        // 2. Backward Compatibility Check
        // If config[0] has a 'fields' property, it's a multi-step wizard.
        // Otherwise, it's a legacy simple modal, so we wrap the fields in a single step.
        const isMultiStep = config.length > 0 && config[0].fields !== undefined;
        ModalSvc._steps = isMultiStep ? config : [{ fields: config }];

        // 3. Render the first step
        await ModalSvc._renderStep();
        document.getElementById('modal-overlay').style.display = 'flex';
    },

    closeModal: () => {
        document.getElementById('modal-overlay').style.display = 'none';
    },

    // =========================================================================
    // --- RENDER & UI UPDATES ---
    // =========================================================================

    _renderStep: async () => {
        const step = ModalSvc._steps[ModalSvc._currentStep];
        
        // 1. Update text and size (Step data overrides main modal data)
        const stepData = {
            title: step.title || ModalSvc._modalData.title,
            desc: step.desc || ModalSvc._modalData.desc,
            size: step.size || ModalSvc._modalData.size || 'md'
        };
        ModalSvc.setModalDef(stepData);

        // 2. Load the HTML for the fields in this specific step
        await ModalSvc.loadAllTemplates(step.fields || []);

        // 3. Update the button text and visibility
        ModalSvc._updateButtons();

        ModalSvc._renderStepper();
    },

    _renderStepper: () => {
        const container = document.getElementById('modal-stepper-container');

        if (ModalSvc._steps.length <= 1) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'block';

        // FIX: Removed px-4 padding, added w-100 so it spans the whole width
        let html = `<div class="d-flex justify-content-between align-items-center w-100 mb-4 mt-1">`;

        ModalSvc._steps.forEach((step, index) => {
            let statusClass = '';
            if (index < ModalSvc._currentStep) statusClass = 'completed';
            else if (index === ModalSvc._currentStep) statusClass = 'active';

            // Checkmark SVG for completed, Number for pending
            const iconContent = index < ModalSvc._currentStep 
                ? `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/></svg>` 
                : (index + 1);

            html += `<div class="tms-step-icon ${statusClass}">${iconContent}</div>`;
            
            // FIX: Removed flex-grow-1 (handled by CSS now) and reduced mx to 1
            if (index < ModalSvc._steps.length - 1) {
                const lineClass = index < ModalSvc._currentStep ? 'completed' : '';
                html += `<div class="tms-step-line ${lineClass} mx-1"></div>`;
            }
        });

        html += `</div>`;
        container.innerHTML = html;
    },

    _updateButtons: () => {
        const confirmBtn = document.getElementById('modal-confirm-btn');
        const prevBtn = document.getElementById('modal-prev-btn');
        
        // Handle Previous Button
        prevBtn.style.display = ModalSvc._currentStep > 0 ? 'block' : 'none';

        // Handle Next / Execute Button Text
        const isLastStep = ModalSvc._currentStep === ModalSvc._steps.length - 1;
        if (isLastStep) {
            confirmBtn.innerText = window.__ ? window.__('field.execute') : 'Execute';
        } else {
            confirmBtn.innerText = window.__ ? window.__('field.next') : 'Next';
        }

        ModalSvc._attachButtonListeners();
    },

    // =========================================================================
    // --- EVENT LISTENERS & LOGIC ---
    // =========================================================================

    _attachButtonListeners: () => {
        // Strip old listeners by cloning
        const confirmBtn = document.getElementById('modal-confirm-btn');
        const newConfirmBtn = confirmBtn.cloneNode(true); 
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

        const prevBtn = document.getElementById('modal-prev-btn');
        const newPrevBtn = prevBtn.cloneNode(true);
        prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);

        // --- PREVIOUS BUTTON ---
        newPrevBtn.addEventListener('click', () => {
            if (ModalSvc._currentStep > 0) {
                ModalSvc._currentStep--;
                ModalSvc._renderStep();
            }
        });

        // --- NEXT / EXECUTE BUTTON ---
        newConfirmBtn.addEventListener('click', () => {
            const step = ModalSvc._steps[ModalSvc._currentStep];
            
            // 1. Validate the current screen
            const validationResult = ModalSvc._validateAndExtractData(step.fields);
            if (!validationResult.isValid) return;

            // 2. Save the data to the master state
            ModalSvc._executionData = { ...ModalSvc._executionData, ...validationResult.data };

            // 3. Decide what to do next
            const isLastStep = ModalSvc._currentStep === ModalSvc._steps.length - 1;
            
            if (isLastStep) {
                if (typeof ModalSvc._onExecuteCallback === 'function') {
                    ModalSvc._onExecuteCallback(ModalSvc._scriptName, ModalSvc._executionData);
                }
                ModalSvc.closeModal(); 
            } else {
                ModalSvc._currentStep++;
                ModalSvc._renderStep();
            }
        });
    },

    _validateAndExtractData: (fields) => {
        let data = {};
        let isValid = true;

        if (fields && fields.length > 0) {
            fields.forEach(field => {
                if (field.type === 'list') {
                    const listContainer = document.getElementById(`modal-list-${field.id}`);
                    const values = JSON.parse(listContainer.dataset.values || '[]');
                    const inputEl = document.getElementById(`modal-input-${field.id}`);
                        
                    if (field.required && values.length === 0) {
                        if(inputEl) inputEl.classList.add('is-invalid');
                        isValid = false;
                    } else {
                        if(inputEl) inputEl.classList.remove('is-invalid');
                        data[field.id] = values; 
                    }
                } else if (field.type === 'radio') {
                    const checkedEl = document.querySelector(`input[name="${field.id}"]:checked`);
                    const allRadios = document.querySelectorAll(`input[name="${field.id}"]`);

                    if (field.required && !checkedEl) {
                        allRadios.forEach(r => r.closest('.radio-crd')?.classList.add('border-danger'));
                        isValid = false;
                    } else {
                        allRadios.forEach(r => r.closest('.radio-crd')?.classList.remove('border-danger'));
                        data[field.id] = checkedEl ? checkedEl.value : null;
                    }
                } else {
                    const el = document.getElementById(`modal-input-${field.id}`) || document.getElementById(field.id);

                    if (el) {
                        if (field.required && !el.value && field.type !== 'checkbox') {
                            el.classList.add('is-invalid');
                            isValid = false;
                        } else {
                            el.classList.remove('is-invalid');
                            data[field.id] = field.type === 'checkbox' ? el.checked : el.value;
                        }
                    }
                }
            });
        }
        return { isValid, data };
    },

    // =========================================================================
    // --- TEMPLATE MANAGERS ---
    // =========================================================================

    resolveTemplatePath: (field) => field.type === 'partial' ? field.url : `partials/forms/${field.type || 'text'}.html`,
    
    loadAllTemplates: async (fields) => {
        const dynamicZone = document.getElementById('modal-dynamic-content');
        dynamicZone.style.display = 'none';
        dynamicZone.innerHTML = '';
        
        if (fields && fields.length > 0) {
            let combinedHtml = '';
            for (const field of fields) {
                combinedHtml += await Template.load(ModalSvc.resolveTemplatePath(field), field);
            }

            dynamicZone.innerHTML = combinedHtml;

            fields.forEach(field => {
                if (typeof field.onRender === 'function') field.onRender(dynamicZone, field); 
            });
        }

        if (dynamicZone.innerHTML != '') dynamicZone.style.display = 'block';
    },
    
    setModalDef: (data) => {
        document.getElementById('modal-title').innerText = data.title;
        document.getElementById('modal-body').innerText = data.desc;
        
        const mdlel = document.querySelector('.tms-modal');
        mdlel.classList.remove('mdl-sm', 'mdl-md', 'mdl-lg', 'mdl-full');
        mdlel.classList.add(`mdl-${data.size}`);
    }
};