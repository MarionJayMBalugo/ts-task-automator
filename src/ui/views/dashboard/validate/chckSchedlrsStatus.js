import { DOM } from '@jsutils';
import { API } from '@jsui/core';

export const ChckSchedlrsStatus = async () => {
    
    // --- FETCH SYSTEM STATE ---
    const installedStateObj = await API.chckSchedlrsInstlled();

    if (!installedStateObj) return [];

    // --- MAP TASK NAMES TO HTML IDs ---
    const taskMap = {
        'Clean Expired Bottles': 'status-task-clean-bottles',
        'Clean up Orders': 'status-task-clean-orders',
        'HL7 Transaction Clean Up': 'status-task-hl7'
    };

    // --- UPDATE UI FEEDBACK FOR EACH TASK ---
    installedStateObj.forEach(task => {
        // Find the matching HTML ID for the current task
        const badgeId = taskMap[task.name];

        if (!badgeId) return; // Skip if it's not one of our 3 dashboard tasks

        // Grab the badge element from the DOM
        const badgeEl = DOM.el(`#${badgeId}`);

        if (!badgeEl) return;

        // Apply 3-State Styling Logic
        if (!task.installed) {
            // STATE 1: Missing (Gray)
            badgeEl.className = 'badge bg-danger';
            badgeEl.innerText = 'Not Found';
            
        } else if (task.disabled) {
            // STATE 2: Installed but Disabled (Glowing Warning)
            badgeEl.className = 'badge bg-warning bg-opacity-10 text-warning border border-warning';
            badgeEl.innerText = 'Disabled';
            
        } else {
            // STATE 3: Running Perfectly (Green)
            badgeEl.className = 'badge bg-success';
            badgeEl.innerText = 'Running';
        }
    });

    // Return the raw state array back to the caller in case other logic needs it
    return installedStateObj;
};