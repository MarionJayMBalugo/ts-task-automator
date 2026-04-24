import { API } from '@jsui/core';
import { Modal } from '@jspartials/core/modal';

export const prmptCreatDB = () => {
    let title = 'Create DBs';
    let desc = 'This will run create-database.bat to initialize new database schemas';

    const components = [
        { 
            id: 'dbNames', 
            type: 'list', 
            label: 'Target Database Names', 
            listbtn: 'ADD',
            placeholder: 'Type name and press Enter', 
            required: true,
            pills: true 
        }
    ];

    const steps = [
        { title, desc, fields: components },
        { 
            title: 'Review Configuration', 
            desc: 'Please verify the databases you are about to create:', 
            fields: [{
                id: 'dbReview', 
                type: 'review', // Loads your new review.html!
                label: 'Databases to Create:',
                onRender: (container, field) => {
                    const dbList = Modal._executionData.dbNames || [];
                    const ul = document.getElementById(`modal-review-${field.id}`);
                    
                    if (dbList.length === 0) {
                        ul.innerHTML = '<li class="list-group-item text-muted">No databases selected.</li>';
                        return;
                    }
                    
                    // Loop through the saved DBs and draw the list items
                    ul.innerHTML = dbList.map(db => `
                        <li class="list-group-item fw-bold text-dark d-flex align-items-center py-3">
                            <svg class="me-3 text-primary" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
                                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
                            </svg>
                            ${db}
                        </li>`).join('');
                }
            }] 
        }
    ];
    const data = { title, desc, size: 'lg', execBtn: __('create', {name: 'DB'}) };

    Modal.openModal('create-database.bat', data, steps, (script, data) => {
        API.runBatch(script, [data.dbNames.join(',')])
    });
};