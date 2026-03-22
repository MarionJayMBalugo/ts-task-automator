export const ModalService = {
    openModal: function(scriptName, title, desc, fields = [], onExecuteCallback) {
        document.getElementById('modal-title').innerText = title;
        document.getElementById('modal-body').innerText = desc;

        const dynamicZone = document.getElementById('modal-dynamic-content');
        dynamicZone.innerHTML = ''; 

        if (fields && fields.length > 0) {
            dynamicZone.style.display = 'block';
            
            fields.forEach(field => {
                const wrapper = document.createElement('div');
                wrapper.className = field.type === 'checkbox' ? 'form-check text-start mb-3' : 'mb-3 text-start';

                if (field.type === 'checkbox') {
                    const input = document.createElement('input');
                    input.type = 'checkbox';
                    input.className = 'form-check-input';
                    input.id = `modal-input-${field.id}`;
                    
                    const label = document.createElement('label');
                    label.className = 'form-check-label small fw-bold text-muted';
                    label.htmlFor = input.id;
                    label.innerText = field.label;
                    
                    wrapper.appendChild(input);
                    wrapper.appendChild(label);

                } else if (field.type === 'select') {
                    const label = document.createElement('label');
                    label.className = 'form-label small fw-bold text-muted mb-1';
                    label.innerText = field.label;
                    
                    const select = document.createElement('select');
                    select.className = 'form-select';
                    select.id = `modal-input-${field.id}`;
                    
                    field.options.forEach(opt => {
                        const option = document.createElement('option');
                        option.value = opt.value || opt;
                        option.innerText = opt.label || opt;
                        select.appendChild(option);
                    });
                    
                    wrapper.appendChild(label);
                    wrapper.appendChild(select);

                } else if (field.type === 'list') {
                    // NEW: Tag/List Input System
                    const label = document.createElement('label');
                    label.className = 'form-label small fw-bold text-muted mb-1';
                    label.innerText = field.label;

                    const inputGroup = document.createElement('div');
                    inputGroup.className = 'input-group mb-2';

                    const input = document.createElement('input');
                    input.type = 'text';
                    input.className = 'form-control';
                    input.id = `modal-input-${field.id}`;
                    input.placeholder = field.placeholder || '';

                    const addBtn = document.createElement('button');
                    addBtn.className = 'btn btn-outline-primary fw-bold px-3';
                    addBtn.type = 'button';
                    addBtn.innerText = 'Add';

                    inputGroup.appendChild(input);
                    inputGroup.appendChild(addBtn);

                    const listContainer = document.createElement('div');
                    listContainer.className = 'd-flex flex-wrap gap-2';
                    listContainer.id = `modal-list-${field.id}`;
                    listContainer.dataset.values = JSON.stringify([]); // Hidden storage

                    // Function to redraw the little cards
                    // Function to redraw the little cards
                    const renderTags = () => {
                        const values = JSON.parse(listContainer.dataset.values);
                        listContainer.innerHTML = '';
                        
                        values.forEach((val, index) => {
                            const badge = document.createElement('div');
                            // Added px-3 py-2 for padding, and rounded-pill for a modern tag look
                            badge.className = 'badge bg-primary bg-opacity-10 text-primary border border-primary d-flex align-items-center px-3 py-2 rounded-pill';
                            badge.style.fontSize = '0.95rem'; // Increased from 0.8rem
                            badge.style.fontWeight = '600';
                            
                            badge.innerHTML = `
                                <span class="me-2">${val}</span>
                                <button type="button" class="btn-close" style="font-size: 0.65rem;"></button>
                            `;
                            
                            // Remove tag logic
                            badge.querySelector('.btn-close').onclick = () => {
                                values.splice(index, 1);
                                listContainer.dataset.values = JSON.stringify(values);
                                renderTags();
                            };
                            listContainer.appendChild(badge);
                        });
                    };

                    // Add tag logic
                    const addItem = () => {
                        const val = input.value.trim();
                        if (val) {
                            const values = JSON.parse(listContainer.dataset.values);
                            if (!values.includes(val)) {
                                values.push(val);
                                listContainer.dataset.values = JSON.stringify(values);
                                renderTags();
                            }
                            input.value = '';
                            input.focus();
                        }
                    };

                    addBtn.onclick = addItem;
                    input.onkeypress = (e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            addItem();
                        }
                    };

                    wrapper.appendChild(label);
                    wrapper.appendChild(inputGroup);
                    wrapper.appendChild(listContainer);

                } else {
                    const label = document.createElement('label');
                    label.className = 'form-label small fw-bold text-muted mb-1';
                    label.innerText = field.label;
                    
                    const input = document.createElement('input');
                    input.type = field.type || 'text';
                    input.className = 'form-control';
                    input.id = `modal-input-${field.id}`;
                    input.placeholder = field.placeholder || '';
                    
                    wrapper.appendChild(label);
                    wrapper.appendChild(input);
                }
                
                dynamicZone.appendChild(wrapper);
            });
        } else {
            dynamicZone.style.display = 'none';
        }

        const confirmBtn = document.getElementById('modal-confirm-btn');
        const newConfirmBtn = confirmBtn.cloneNode(true); 
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

        newConfirmBtn.onclick = () => {
            let executionData = {};
            let isValid = true;

            if (fields && fields.length > 0) {
                fields.forEach(field => {
                    if (field.type === 'list') {
                        // Gather array from the hidden dataset
                        const listContainer = document.getElementById(`modal-list-${field.id}`);
                        const values = JSON.parse(listContainer.dataset.values || '[]');
                        const inputEl = document.getElementById(`modal-input-${field.id}`);
                        
                        if (field.required && values.length === 0) {
                            inputEl.classList.add('is-invalid');
                            isValid = false;
                        } else {
                            inputEl.classList.remove('is-invalid');
                            executionData[field.id] = values; // Returns an array!
                        }
                    } else {
                        const el = document.getElementById(`modal-input-${field.id}`);
                        if (field.required && !el.value && field.type !== 'checkbox') {
                            el.classList.add('is-invalid');
                            isValid = false;
                        } else {
                            el.classList.remove('is-invalid');
                            executionData[field.id] = field.type === 'checkbox' ? el.checked : el.value;
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

        document.getElementById('modal-overlay').style.display = 'flex';
    },

    closeModal: function() {
        document.getElementById('modal-overlay').style.display = 'none';
    }
};