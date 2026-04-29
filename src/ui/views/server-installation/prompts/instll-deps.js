import { Modal } from '@jspartials/core/modal';
import { API } from '@jsui/core';
import { chckDepsInstalld } from '../validate';

export const prmptInstallDeps = async (depsList) => {
    
    // Filter to ONLY the apps that are not installed yet
    const pendingDeps = depsList.filter(d => !d.installed);
    if (pendingDeps.length === 0) return; 

    // Dynamically create text inputs ONLY for missing apps that require a path
    const pathFields = pendingDeps
        .filter(dep => dep.defaultPath !== '') 
        .map(dep => ({
            id: `path_${dep.id}`, 
            type: 'txt', 
            label: `${dep.name} Path`, 
            placeholder: dep.defaultPath, 
            required: true 
        }));

    const steps = [
        {
            title: 'Configuration Paths',
            desc: 'Define the installation directories for the missing dependencies.',
            fields: pathFields
        },
        {
            title: 'Execution Tracker',
            desc: 'Review the setup. Click "Start Installation" to begin automated background processing.',
            fields: [
                {
                    id: 'install_tracker',
                    type: 'review',
                    onRender: (zone, field) => {
                        const listEl = document.getElementById(`modal-review-${field.id}`);
                        if (!listEl) return;

                        // Only render tracking cards for the apps we are actually installing
                        listEl.innerHTML = `<ul class="list-unstyled d-flex flex-column gap-2 m-0">` + 
                            pendingDeps.map(app => `
                                <li class="d-flex justify-content-between align-items-center p-3 rounded border bg-white" id="tracker-${app.id}">
                                    <div class="d-flex align-items-center gap-3">
                                        <div class="text-muted"><svg width="18" height="18"><use href="#icon-package"></use></svg></div>
                                        <span class="fw-bold text-dark" style="font-size: 0.9rem;">${app.name}</span>
                                    </div>
                                    <span class="badge bg-secondary bg-opacity-10 text-secondary border border-secondary status-badge">Pending</span>
                                </li>
                            `).join('') + `</ul>`;
                    }
                }
            ]
        }
    ];

    // If there are no paths to ask for (e.g. only Chrome is missing), skip the first step!
    if (pathFields.length === 0) steps.shift();

    const updateTrackerStatus = (appId, status) => {
        const row = document.getElementById(`tracker-${appId}`);
        if (!row) return;

        const badge = row.querySelector('.status-badge');
        const iconWrapper = row.firstElementChild.firstElementChild;
        const textSpan = row.firstElementChild.lastElementChild;

        row.className = 'd-flex justify-content-between align-items-center p-3 rounded border';

        if (status === 'installing') {
            row.classList.add('border-primary', 'bg-primary', 'bg-opacity-10');
            iconWrapper.className = 'text-primary';
            textSpan.className = 'fw-bold text-primary';
            badge.className = 'badge bg-primary d-flex align-items-center gap-2 status-badge';
            badge.innerHTML = `<span class="spinner-border spinner-border-sm" style="width: 10px; height: 10px; border-width: 2px;"></span> Installing...`;
        } else if (status === 'success') {
            row.classList.add('bg-white');
            iconWrapper.className = 'text-success';
            iconWrapper.innerHTML = `<svg width="18" height="18"><use href="#icon-chck"></use></svg>`;
            textSpan.className = 'fw-bold text-dark';
            badge.className = 'badge bg-success bg-opacity-10 text-success border border-success status-badge';
            badge.innerText = 'Done';
        } else if (status === 'error') {
            row.classList.add('border-danger', 'bg-danger', 'bg-opacity-10');
            iconWrapper.className = 'text-danger';
            iconWrapper.innerHTML = `<svg width="18" height="18"><use href="#icon-info"></use></svg>`;
            textSpan.className = 'fw-bold text-danger';
            badge.className = 'badge bg-danger status-badge';
            badge.innerText = 'Failed';
        }
    };

    Modal.openModal('install-dependencies', { title: 'Install Dependencies', size: 'md', execBtn: 'Start Installation' }, steps, async (scriptName, executionData) => {
        const execBtnEl = document.getElementById('modal-confirm-btn');
        if (execBtnEl) execBtnEl.disabled = true;

        for (const dep of pendingDeps) {
            updateTrackerStatus(dep.id, 'installing');
            try {
                await API.runSilentInstall(dep.id, executionData);
                updateTrackerStatus(dep.id, 'success');
            } catch (error) {
                updateTrackerStatus(dep.id, 'error');
                console.error(`Failed to install ${dep.id}:`, error);
            }
        }

        // Recheck to lock the UI card once complete!
        await chckDepsInstalld();

        if (execBtnEl) {
            execBtnEl.disabled = false;
            execBtnEl.innerText = "Finish & Close";
            execBtnEl.onclick = () => window.closeModal(); 
        }
    });
};