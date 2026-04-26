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
                    
                    // THE FIX 1: Strip out the default Bootstrap 'list-group' classes 
                    // and replace them with a flex-column gap layout so the items look like separate cards.
                    ul.className = 'd-flex flex-column gap-2 list-unstyled p-0 m-0';
                    
                    // THE FIX 2: Premium SaaS Card UI
                    ul.innerHTML = dbList.map(db => `
                        <li class="d-flex justify-content-between align-items-center p-3 rounded" style="background-color: var(--tms-surface-alt); border: 1px solid var(--tms-border);">
                            
                            <div class="d-flex align-items-center">
                                <div class="d-flex align-items-center justify-content-center rounded-3 me-3 flex-shrink-0" style="width: 42px; height: 42px; background-color: rgba(0, 102, 255, 0.08); color: var(--tms-blue);">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                                        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
                                        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
                                    </svg>
                                </div>
                                
                                <div class="d-flex flex-column">
                                    <span class="fw-bold" style="font-size: 0.95rem; color: var(--tms-text-main); line-height: 1.2;">${db}</span>
                                    <span style="font-size: 0.7rem; color: var(--tms-text-muted); margin-top: 4px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700;">Target Schema</span>
                                </div>
                            </div>

                            <span class="badge bg-success bg-opacity-10 text-success border border-success flex-shrink-0" style="font-size: 0.65rem; padding: 5px 8px; box-shadow: none;">READY</span>
                            
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