import { ListField } from '@jspartials/forms/list';
import { DOM } from './dom.util.js';

/**
 * =============================================================================
 * FORM UTILITIES (FormUtil)
 * =============================================================================
 * This utility handles the "heavy lifting" for modal forms, including:
 * 1. State Restoration: Re-filling inputs when navigating back.
 * 2. Event Binding: Linking validation and custom field logic (like lists).
 * 3. Data Extraction: Validating and gathering all user input for execution.
 */
export const FormUtil = {

    /**
     * Re-populates form fields with previously saved values.
     * This is critical for the "Previous" button functionality.
     * * @param {string} type - The field type (e.g., 'radio', 'checkbox', 'txt').
     * @param {string} id - The unique ID of the field.
     * @param {any} val - The previously saved value to restore.
     */
    restore: (type, id, val) => {
        // If no value was saved, there's nothing to restore
        if (val === undefined) return;

        if (type === 'radio') {
            // Find the specific radio option that matches the saved value
            const r = DOM.el(`input[name="${id}"][value="${val}"]`);
            if (r) r.checked = true;
        } else if (type === 'checkbox') {
            // Restore boolean state for checkboxes
            const el = DOM.el(`modal-input-${id}`);
            if (el) el.checked = val;
        } else if (type !== 'list' && type !== 'review') {
            // Standard text/select inputs: simply restore the raw value
            const el = DOM.el(`modal-input-${id}`);
            if (el) el.value = val;
        }
    },
    
    /**
     * Initializes a field by restoring its value, binding validation listeners,
     * and triggering custom render logic.
     * * @param {Object} field - The field configuration object from the modal config.
     * @param {HTMLElement} zone - The container where the field is rendered.
     * @param {any} savedVal - Data from Modal._executionData to restore.
     */
    bind: (field, zone, savedVal) => {

        if (typeof field.onRender === 'function') field.onRender(zone, field);

        // 1. Restore the field's previous state
        FormUtil.restore(field.type, field.id, savedVal);

        // 2. Specialized binding for complex "list" types
        if (field.type === 'list' && field.pills) {
            ListField.bind(field, savedVal || []);
        }

        // 3. Validation Logic: Auto-clear red "invalid" borders when the user starts typing/clicking
        if (field.type === 'radio') {
            // For radios, clear the error border on any option change
            DOM.all(`input[name="${field.id}"]`).forEach(r => 
                r.addEventListener('change', () => {
                    DOM.all(`input[name="${field.id}"]`).forEach(el => 
                        el.closest('.radio-crd')?.classList.remove('border-danger')
                    );
                })
            );
        } else {
            // For standard inputs, clear error state on any input or change event
            const el = DOM.el(`modal-input-${field.id}`) || DOM.el(field.id);
            if (el) {
                ['input', 'change'].forEach(ev => {
                    // 🚨 NOTICE THE BRACES! Everything below must happen INSIDE the event listener!
                    el.addEventListener(ev, () => {
                        
                        el.classList.remove('is-invalid');

                        // 1. Clear the red border on the eye button for THIS field
                        if (field.type === 'psswrd') {
                            const eyeBtn = document.getElementById(`modal-btn-eye-${field.id}`);
                            if (eyeBtn) eyeBtn.classList.remove('border-danger', 'text-danger');
                        }

                        // 2. If they type in the main password, clear the confirm box AND its eye too!
                        if (field.id === 'password') {
                            // Support for both 'confirm_password' and 'confirmpass' IDs
                            const confirmId = document.getElementById('modal-input-confirmpass') ? 'confirmpass' : 'confirm_password';
                            
                            const confirmEl = document.getElementById(`modal-input-${confirmId}`);
                            const confirmEye = document.getElementById(`modal-btn-eye-${confirmId}`);
                            
                            if (confirmEl) confirmEl.classList.remove('is-invalid');
                            if (confirmEye) confirmEye.classList.remove('border-danger', 'text-danger');
                        }

                    }); // <-- End of event listener
                });
            }
        }
        if (field.type === 'psswrd') {
            const eyeBtn = DOM.el(`modal-btn-eye-${field.id}`);
            const inputEl = DOM.el(`modal-input-${field.id}`);

            if (eyeBtn && inputEl) {
                eyeBtn.addEventListener('click', () => {
                    const isPass = inputEl.type === 'password';
                    inputEl.type = isPass ? 'text' : 'password';
                    eyeBtn.style.opacity = isPass ? '1' : '0.6';
                });
            }
        }
    },

    /**
     * Validates every field in a step and extracts their current values.
     * Handles UI feedback (red borders/icons) automatically if a required field is empty.
     * * @param {Array} fields - The list of field configurations for the current step.
     * @returns {Object} - { isValid: boolean, data: Object }
     */
    extract: (fields) => {
        let data = {}, isValid = true;
        
        (fields || []).forEach(f => {
            let val, hasErr = false;

            if (f.type === 'list') {
                // Lists store their data in a hidden 'values' dataset
                val = JSON.parse(DOM.el(`modal-list-${f.id}`)?.dataset.values || '[]');
                hasErr = f.required && val.length === 0;
                DOM.toggleClass(`modal-input-${f.id}`, 'is-invalid', hasErr);

            } else if (f.type === 'radio') {
                // Check which radio option is currently selected
                const checkedEl = DOM.el(`input[name="${f.id}"]:checked`);
                val = checkedEl ? checkedEl.value : null;
                hasErr = f.required && !val;
                // Add red border to the custom radio card wrapper
                DOM.all(`input[name="${f.id}"]`).forEach(r => 
                    r.closest('.radio-crd')?.classList.toggle('border-danger', hasErr)
                );

            } else {
                // Standard Input Handling (Text, Select, Checkbox, Password)
                const el = DOM.el(`modal-input-${f.id}`) || DOM.el(f.id);
                val = f.type === 'checkbox' ? el?.checked : el?.value;
                
                let errorMsg = null;

                // 1. Base check: Is it required but empty?
                if (f.required && !el?.value && f.type !== 'checkbox') {
                    // Try to grab translation, fallback to English
                    errorMsg = typeof window.__ === 'function' 
                        ? window.__('err.req', { field: f.label }) 
                        : `${f.label} is required.`;
                    console.log(errorMsg, f)
                } 
                // 2. Custom Validation Hook (e.g., matching passwords)
                else if (typeof f.customValidate === 'function') {
                    const customCheck = f.customValidate(val);
                    // customValidate should return an error string if invalid, or true if valid
                    if (customCheck !== true) {
                        errorMsg = customCheck; 
                    }
                }

                hasErr = errorMsg !== null;

                // Apply UI Feedback and Error Text
                if (el) {
                    el.classList.toggle('is-invalid', hasErr);
                    
                    if (f.type === 'psswrd') {
                        const eyeBtn = document.getElementById(`modal-btn-eye-${f.id}`);
                        if (eyeBtn) {
                            eyeBtn.classList.toggle('border-danger', hasErr);
                            eyeBtn.classList.toggle('text-danger', hasErr);
                        }
                    }

                    const errContainer = document.getElementById(`modal-err-${f.id}`);
                    if (errContainer) {
                        errContainer.innerText = errorMsg || '';
                    }
                }
            }

            // Track if the entire form is valid
            if (hasErr) {
                isValid = false;
            } else {
                data[f.id] = val; // Store valid data to be saved to Modal._executionData
            }
        });

        return { isValid, data };
    }
};