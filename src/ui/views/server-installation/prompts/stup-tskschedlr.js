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

export const prmptSchedulrSetup = async (schedlrs) => {

    // --- DATA PREPARATION ---
    const tasks = (schedlrs || []).map((task, index) => ({
        id: `task_${index}`,
        name: task.name,
        desc: task.desc || 'System maintenance task.',
        installed: task.installed
    }));

    // Filter missing tasks for the backend
    const pendingTasksToInstall = tasks.filter(t => !t.installed);

    if (pendingTasksToInstall.length === 0) {
        console.warn("Setup Prompt: All required tasks are already installed.");
        // return; // Uncomment to block the modal entirely when there's nothing to do
    }

    // --- TEMPLATE FETCHING ---
    // Await the partial from the backend BEFORE building the modal
    const cardTemplate = await API.loadPartial('widgets/task-status-card/template');

    // --- MODAL CONFIGURATION ---
    const modalData = { 
        title: __('setuptask'), 
        size: 'md',
        execBtn: __('instTask')
    };

    const steps = [
        {
            title: __('setuptask'),
            desc: __('modal.taskdesc'), // Ensure you updated this translation key as requested!
            fields: [
                {
                    id: 'scheduler_status',
                    type: 'review', 
                    onRender: (zone, field) => {
                        const listEl = DOM.el(`modal-review-${field.id}`);
                        if (!listEl) return;

                        let htmlBuffer = `<div class="row row-cols-1 g-3 mb-3">`;
                        
                        // --- TEMPLATE HYDRATION ---
                        tasks.forEach(task => {
                            const isInst = task.installed;
                            
                            // Map logic to template variables
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

                            // Inject variables into the raw HTML string
                            let hydratedCard = cardTemplate;
                            Object.keys(templateData).forEach(key => {
                                hydratedCard = hydratedCard.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), templateData[key]);
                            });

                            htmlBuffer += hydratedCard;
                        });
                        
                        htmlBuffer += `</div>`;
                        listEl.innerHTML = htmlBuffer;
                    }
                }
            ]
        }
    ];

    // --- MODAL EXECUTION ---
    Modal.openModal('install-schedulers', modalData, steps, async (scriptName, executionData) => {
        try {
            await API.instllSchedlrs(pendingTasksToInstall);
            await chckSchedlrsInstalld();
        } catch (error) {
            console.error("Setup Prompt: Failed to trigger installation", error);
        }
    });
};