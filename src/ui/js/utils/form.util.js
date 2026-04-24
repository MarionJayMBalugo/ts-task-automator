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
                ['input', 'change'].forEach(ev => 
                    el.addEventListener(ev, () => el.classList.remove('is-invalid'))
                );
            }
        }

        // 4. Trigger any custom onRender logic defined in the prompt config
        if (typeof field.onRender === 'function') field.onRender(zone, field); 
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
                // Standard Input Handling (Text, Select, Checkbox)
                const el = DOM.el(`modal-input-${f.id}`) || DOM.el(f.id);
                val = f.type === 'checkbox' ? el?.checked : el?.value;
                
                // Checkboxes are rarely "required" in a way that blocks submission,
                // so we primarily validate text-based values.
                hasErr = f.required && !el?.value && f.type !== 'checkbox';
                if (el) el.classList.toggle('is-invalid', hasErr);
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