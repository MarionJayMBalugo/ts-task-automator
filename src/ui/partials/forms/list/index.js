import { DOM } from '@jsutils'; // Or whatever alias you use for your DOM util

export const ListField = {
    /**
     * Binds the event listeners and renders pills for a List input field.
     * @param {Object} field - The field configuration object.
     * @param {Array} savedValues - An array of previously saved values (if any).
     */
    bind: (field, savedValues = []) => {
        const inputEl = DOM.el(`modal-input-${field.id}`);
        const addBtn = DOM.el(`modal-btn-add-${field.id}`);
        const listContainer = DOM.el(`modal-list-${field.id}`);
        
        if (!inputEl || !addBtn || !listContainer) return;

        // Initialize the dataset
        listContainer.dataset.values = JSON.stringify(savedValues);

        // Function to redraw the pills
        const renderPills = () => {
            const values = JSON.parse(listContainer.dataset.values || '[]');
            listContainer.innerHTML = ''; // Clear current pills
            
            values.forEach((val, index) => {
                const pill = document.createElement('span');
                pill.className = 'badge bg-primary bg-opacity-10 text-primary border border-primary d-flex align-items-center px-3 py-3';
                pill.innerHTML = `
                    <span class="me-2 list-badge">${val}</span>
                    <button type="button" class="btn-close" style="font-size: 0.5rem;" data-index="${index}"></button>
                `;
                
                // Add event listener to remove the item
                pill.querySelector('.btn-close').addEventListener('click', (e) => {
                    const idx = parseInt(e.target.dataset.index, 10);
                    values.splice(idx, 1); 
                    listContainer.dataset.values = JSON.stringify(values);
                    renderPills();
                });
                
                listContainer.appendChild(pill);
            });
        };
       
        // Call renderPills immediately
        renderPills();

        const addItem = () => {
            const val = inputEl.value.trim();
            if (val) {
                const values = JSON.parse(listContainer.dataset.values || '[]');
                // Prevent duplicate entries
                if (!values.includes(val)) {
                    values.push(val);
                    listContainer.dataset.values = JSON.stringify(values);
                    renderPills();
                }
                inputEl.value = ''; 
                inputEl.focus();    
            }
        };

        // Bind 'Enter' key press
        inputEl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault(); 
                addItem();
            }
        });

        // Bind 'Add/Select' button click
        addBtn.addEventListener('click', addItem);
    }
};