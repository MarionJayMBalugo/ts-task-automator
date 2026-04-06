import { Template } from './template.js';

export const ModalSvc = {
    openModal: async function(scriptName, title, desc, fields = [], onExecuteCallback) {
        ModalSvc.setModalHeadrs(title, desc);

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
                    } else {
                        // Check for standard modal inputs OR custom partial IDs like your file picker
                        const el = document.getElementById(`modal-input-${field.id}`) || document.getElementById(field.id);
                        console.log(field.id, el);
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
    resolveTemplatePath: (field) => field.type === 'partial' ? field.url : `views/partials/fields/${field.type || 'text'}.html`,
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
                console.log([
                    ModalSvc.resolveTemplatePath(field),
                    combinedHtml
                ])
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
    setModalHeadrs: (title, desc) => {
        document.getElementById('modal-title').innerText = title;
        document.getElementById('modal-body').innerText = desc;
    }
};