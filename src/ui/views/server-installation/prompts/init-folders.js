import { Modal } from '@jspartials/core/modal';
import { API } from '@jsui/core';
import { chckFoldersInstalld } from '../validate';

export const prmptInitFolders = (folderStateObj) => {
    const data = { 
        title: 'Initialize Default Folders', 
        size: 'md', 
        execBtn: 'Execute Task' 
    };

    const steps = [
        {
            title: 'Directory Tree',
            desc: 'The following folders will be verified. If they already exist, they will safely be skipped.',
            fields: [
                {
                    id: 'folder_review',
                    type: 'review',
                    onRender: (zone, field) => {
                        const listEl = document.getElementById(`modal-review-${field.id}`);
                        if (!listEl) return;

                        listEl.innerHTML = `<ul class="list-unstyled d-flex flex-column gap-2 m-0">` + 
                            folderStateObj.map(f => `
                                <li class="d-flex justify-content-between align-items-center p-3 rounded border bg-white">
                                    <div class="d-flex align-items-center gap-3">
                                        <div class="text-primary"><svg width="18" height="18"><use href="#icon-folder"></use></svg></div>
                                        <span class="fw-bold text-dark" style="font-size: 0.85rem;">${f.name}</span>
                                    </div>
                                    <span class="badge ${f.installed ? 'bg-success' : 'bg-secondary'} bg-opacity-10 ${f.installed ? 'text-success border-success' : 'text-secondary border-secondary'} status-badge">
                                        ${f.installed ? 'Exists' : 'Pending'}
                                    </span>
                                </li>
                            `).join('') + `</ul>`;
                    }
                }
            ]
        }
    ];

    // Combine all folder names into a single comma-separated string
    const folderString = folderStateObj.map(f => f.name).join(',');

    Modal.openModal('setup-folders.bat', data, steps, async (scriptName) => {
        // Send the empty array for data (since there are no inputs to extract), 
        // but pass the folderString directly as the argument to the batch script!
        API.runBatch(scriptName, [folderString]);
        
        // Re-check state to lock the card if successful
        setTimeout(() => chckFoldersInstalld(), 1000); 
    });
};