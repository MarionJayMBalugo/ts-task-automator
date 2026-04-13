import { Template } from '../core/template.js';

export const ModalSvc = {
    openModal: async function(scriptName, data, fields = [], onExecuteCallback) {
        ModalSvc.setModalDef(data);

        await ModalSvc.loadAllTemplates(fields);

        this._attachConfirmLogic(scriptName, fields, onExecuteCallback);
        document.getElementById('modal-overlay').style.display = 'flex';
    },

    closeModal: function() {
        document.getElementById('modal-overlay').style.display = 'none';
    },

    _attachConfirmLogic: function(scriptName, fields, onExecuteCallback) {
        const confirmBtn = document.getElementById('modal-confirm-btn');
        const newConfirmBtn = confirmBtn.cloneNode(true); 
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

        newConfirmBtn.onclick = () => {
            let executionData = {};
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
                            executionData[field.id] = values; 
                        }
                    } else if (field.type === 'radio') {
                        // Find the specific input in the group that is actually checked
                        const checkedEl = document.querySelector(`input[name="${field.id}"]:checked`);
                        const allRadios = document.querySelectorAll(`input[name="${field.id}"]`);

                        if (field.required && !checkedEl) {
                            // Apply a visual error to the parent cards for better visibility
                            allRadios.forEach(r => r.closest('.radio-crd')?.classList.add('border-danger'));
                            isValid = false;
                        } else {
                            // Clean up the error state and capture the value
                            allRadios.forEach(r => r.closest('.radio-crd')?.classList.remove('border-danger'));
                            executionData[field.id] = checkedEl ? checkedEl.value : null;
                        }
                    }
                    else {
                        // Check for standard modal inputs OR custom partial IDs like your file picker
                        const el = document.getElementById(`modal-input-${field.id}`) || document.getElementById(field.id);

                        if (el) {
                            if (field.required && !el.value && field.type !== 'checkbox') {
                                el.classList.add('is-invalid');
                                isValid = false;
                            } else {
                                el.classList.remove('is-invalid');
                                executionData[field.id] = field.type === 'checkbox' ? el.checked : el.value;
                            }
                        }
                    }
                });
            }

            if (!isValid) return; 

            if (typeof onExecuteCallback === 'function') {
                onExecuteCallback(scriptName, executionData);
            }
            
            this.closeModal(); 
        };
    },

    // If the field parameter is of type 'partial' (meaning a component) then use the field's url/path to retrieve the html file.
    resolveTemplatePath: (field) => field.type === 'partial' ? field.url : `partials/forms/${field.type || 'text'}.html`,
    
    loadAllTemplates: async (fields) => {
        const dynamicZone = document.getElementById('modal-dynamic-content');
        dynamicZone.style.display = 'none';
        dynamicZone.innerHTML = '';
        
        if (fields && fields.length > 0) {
            let combinedHtml = '';
            // 1. Load HTML templates concurrently for all fields
            for (const field of fields) {
                // If it's a custom partial, use its URL. Otherwise, load from the fields folder.
                combinedHtml += await Template.load(ModalSvc.resolveTemplatePath(field), field);
            }

            // 2. Inject the fully compiled HTML
            dynamicZone.innerHTML = combinedHtml;

            // 3. Post-Render Events (Attach JS logic for complex fields like selects and lists)
            fields.forEach(field => {
                if (typeof field.onRender === 'function') field.onRender(dynamicZone, field); 
            });

        }

        if (dynamicZone.innerHTML != '') dynamicZone.style.display = 'block' 
    },
    
    setModalDef: (data) => {
        document.getElementById('modal-title').innerText = data.title;
        document.getElementById('modal-body').innerText = data.desc;
        // document.getElementById('modal-prev-btn').style.display = 'block';
        
        const mdlel = document.querySelector('.tms-modal');
        // Clear any old size classes from previous clicks
        mdlel.classList.remove('mdl-sm', 'mdl-md', 'mdl-lg', 'mdl-full');
        // Apply the requested size
        mdlel.classList.add(`mdl-${data.size}`);
    }
};