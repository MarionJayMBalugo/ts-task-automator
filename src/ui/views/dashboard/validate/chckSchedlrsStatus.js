import { DOM } from '@jsutils';
import { API } from '@jsui/core';

export const ChckSchedlrsStatus = async () => {
    
    // --- FETCH SYSTEM STATE (Both standard array and specific backup task) ---
    const [installedStateObj, backupState] = await Promise.all([
        API.chckSchedlrsInstlled(),
        API.checkDbBackupTask()
    ]);

    if (!installedStateObj) return [];

    // --- MAP STANDARD TASK NAMES TO HTML IDs ---
    const taskMap = {
        'Clean Expired Bottles': 'status-task-clean-bottles',
        'Clean up Orders': 'status-task-clean-orders',
        'HL7 Transaction Clean Up': 'status-task-hl7',
        'Apache Log Rotation': 'status-task-apache-log'
    };

    // --- UPDATE UI FEEDBACK FOR STANDARD TASKS ---
    installedStateObj.forEach(task => {
        const badgeId = taskMap[task.name];
        if (!badgeId) return; 

        const badgeEl = DOM.el(`#${badgeId}`);
        if (!badgeEl) return;

        if (!task.installed) {
            badgeEl.className = 'badge bg-danger';
            badgeEl.innerText = 'Not Found';
        } else if (task.disabled) {
            badgeEl.className = 'badge bg-warning bg-opacity-10 text-warning border border-warning';
            badgeEl.innerText = 'Disabled';
        } else {
            badgeEl.className = 'badge bg-success';
            badgeEl.innerText = 'Running';
        }
    });

    // --- UPDATE UI FEEDBACK FOR DB BACKUP (7z Logic) ---
    const backupBadgeEl = DOM.el('#status-task-db-backup');
    if (backupBadgeEl && backupState) {
        if (!backupState.installed) {
            backupBadgeEl.className = 'badge bg-danger';
            backupBadgeEl.innerText = 'Not Found';
        } else if (backupState.isUpgraded) {
            backupBadgeEl.className = 'badge bg-success';
            backupBadgeEl.innerText = 'Running (7z)'; // Green if upgraded
        } else {
            backupBadgeEl.className = 'badge bg-warning bg-opacity-10 text-warning border border-warning';
            backupBadgeEl.innerText = 'Standard (No 7z)'; // Warning glow if using old script
        }
    }

    return installedStateObj;
};