/**
 * =============================================================================
 * PROMPT: TASK SCHEDULER SETUP
 * =============================================================================
 * Orchestrates the modal view for installing Windows Task Schedulers.
 * Pre-loads the task-status-card partial to keep the JS logic completely 
 * free of raw HTML strings.
 */

import { Modal } from '@jspartials/core/modal';
import { DOM } from '@jsutils';
import { API } from '@jsui/core'; 
import { chckSchedlrsInstalld } from '../validate';

// Note: Accepts both arguments from the wrapper now!
export const prmptSchedulrSetup = async (schedlrs, backupState) => {

    const tasks = (schedlrs || [])
        .filter(task => !task.checkOnly)
        .map((task, index) => ({
            id: `task_${index}`,
            name: task.name,
            desc: task.desc || 'System maintenance task.',
            installed: task.installed
        }));

    const pendingTasksToInstall = tasks.filter(t => !t.installed);
    const cardTemplate = await API.loadPartial('widgets/task-status-card/template');

    const modalData = { 
        title: __('setuptask'), 
        size: 'md',
        execBtn: __('instTask')
    };

    const steps = [
        {
            title: __('setuptask'),
            desc: __('modal.taskdesc'),
            fields: [
                {
                    id: 'scheduler_status',
                    type: 'review', 
                    onRender: (zone, field) => {
                        const listEl = DOM.el(`modal-review-${field.id}`);
                        if (!listEl) return;

                        let htmlBuffer = `<div class="row row-cols-1 g-3 mb-3">`;
                        
                        // 1. RENDER STANDARD TASKS
                        tasks.forEach(task => {
                            const isInst = task.installed;
                            const templateData = {
                                name: task.name,
                                desc: task.desc,
                                cardBorder: isInst ? 'border-success' : 'border-secondary border-opacity-25',
                                cardBg:     isInst ? 'bg-success bg-opacity-10' : 'bg-light',
                                iconColor:  isInst ? 'text-success' : 'text-muted',
                                titleColor: isInst ? 'text-success fw-bold' : 'text-dark fw-bold',
                                badgeBg:    isInst ? 'bg-success' : 'bg-secondary',
                                badgeIcon:  isInst ? '#icon-chck' : '#icon-info',
                                badgeText:  isInst ? 'Ready' : 'Pending'
                            };

                            let hydratedCard = cardTemplate;
                            Object.keys(templateData).forEach(key => {
                                hydratedCard = hydratedCard.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), templateData[key]);
                            });
                            htmlBuffer += hydratedCard;
                        });

                        // 2. RENDER THE CUSTOM BACKUP TOGGLE CARD
                        let toggleHtml = '';
                        let badgeHtml = '';
                        let cardClass = 'bg-light border-secondary border-opacity-25';
                        let titleColor = 'text-dark';
                        let descHtml = 'Upgrades the TMS-DOS backup task to use 7-Zip compression.';

                        if (!backupState.installed) {
                            badgeHtml = `<span class="badge bg-danger">Not Found</span>`;
                            descHtml = `<span class="text-danger fw-bold" style="font-size:0.75rem;">TMSDOS Backup is not yet installed. Install it in TMS-DOS app.</span>`;
                            toggleHtml = `<div class="form-check form-switch fs-5 m-0"><input class="form-check-input" type="checkbox" disabled></div>`;
                        } else if (backupState.isUpgraded) {
                            cardClass = 'bg-success bg-opacity-10 border-success';
                            titleColor = 'text-success fw-bold';
                            badgeHtml = `<span class="badge bg-success"><svg width="12" height="12" class="me-1"><use href="#icon-chck"></use></svg>Upgraded</span>`;
                            toggleHtml = `<div class="form-check form-switch fs-5 m-0"><input class="form-check-input bg-success border-success" type="checkbox" checked disabled></div>`;
                        } else {
                            badgeHtml = `<span class="badge bg-secondary">Pending</span>`;
                            toggleHtml = `<div class="form-check form-switch fs-5 m-0"><input class="form-check-input cursor-pointer" type="checkbox" id="toggle-upgrade-backup"></div>`;
                        }

                        // Inject the highly-customized 4th card
                        htmlBuffer += `
                        <div class="col">
                            <div class="card h-100 ${cardClass} shadow-sm transition-all">
                                <div class="card-body p-3 d-flex align-items-center gap-3">
                                    <div class="rounded-circle d-flex align-items-center justify-content-center bg-white shadow-sm" style="width: 48px; height: 48px; min-width: 48px;">
                                        <div class="text-primary"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg></div>
                                    </div>
                                    <div class="flex-grow-1">
                                        <div class="d-flex justify-content-between align-items-center mb-1">
                                            <h6 class="mb-0 ${titleColor}">7-Zip Backup Compression</h6>
                                            ${badgeHtml}
                                        </div>
                                        <div class="small text-muted lh-sm">${descHtml}</div>
                                    </div>
                                    <div class="ms-2">
                                        ${toggleHtml}
                                    </div>
                                </div>
                            </div>
                        </div>`;
                        
                        htmlBuffer += `</div>`;
                        listEl.innerHTML = htmlBuffer;
                    }
                }
            ]
        }
    ];

    Modal.openModal('install-schedulers', modalData, steps, async (scriptName, executionData) => {
        try {
            // 1. Install XML tasks if any are pending
            if (pendingTasksToInstall.length > 0) {
                await API.instllSchedlrs(pendingTasksToInstall);
            }

            // 2. Check if the user flipped the 7z upgrade switch
            const toggle = document.getElementById('toggle-upgrade-backup');
            if (toggle && toggle.checked) {
                await API.upgradeDbBackupTask();
            }

            // 3. Re-verify the system to lock the action card
            await chckSchedlrsInstalld();
        } catch (error) {
            console.error("Setup Prompt: Failed to trigger installation", error);
        }
    });
};