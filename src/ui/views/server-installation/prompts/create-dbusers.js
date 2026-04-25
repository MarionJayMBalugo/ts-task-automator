import { API, Template } from '@jsui/core'; 
import { Modal } from '@jspartials/core/modal';
import { DBROLES, UNKNOWNROLE } from '@jsui/cnf';
import { DOM } from '@jsutils';

export const prmptCreateDbUser = () => {
    
    // Define Global Modal Configurations
    const modalData = { 
        title: __('crtdbacc'), 
        size: 'md',
        execBtn: __('crtdbacc') 
    };

    // Define the Workflow Steps
    const steps = [
        // STEP: INPUT CREDENTIALS
        {
            title: __('crtdbacc'),
            desc: __('forms.descdbusr'),
            fields: [
                { 
                    id: 'username', 
                    type: 'txt',
                    label: 'Username', 
                    placeholder: __('forms.entruname'), 
                    required: true 
                },
                { 
                    id: 'password', 
                    type: 'psswrd',
                    label: 'Password', 
                    placeholder: __('forms.entrpass'), 
                    required: true 
                },
                { 
                    id: 'confirmpass', 
                    type: 'psswrd',
                    label: __('forms.confirmpass2'), 
                    placeholder: __('forms.confirmpass'), 
                    required: true,
                    customValidate: (val) => {
                        const passEl = DOM.el('modal-input-password');
                        return passEl && val === passEl.value ? true : __('forms.pssmismatch');
                    }
                },
                { id: 'host', type: 'txt', label: 'Host', placeholder: 'e.g., % or localhost', required: true },
                { 
                    id: 'role', 
                    type: 'select', 
                    label: 'User Role',
                    required: true,
                    onRender: (container, field) => {
                        const selectEl = DOM.el(`modal-input-${field.id}`);
                        if (!selectEl) return;

                        let optionsHtml = `<option value="">Select a role...</option>`;

                        optionsHtml += DBROLES.map(role => 
                            `<option value="${role.id}">${role.label}</option>`
                        ).join('');

                        selectEl.innerHTML = optionsHtml;
                    }
                }
            ]
        },

        // STEP: CONFIRMATION SCREEN
        {
            title: __('crtdbacc'),
            desc: __('forms.verifydbAcc'),
            fields: [
                {
                    id: 'user_review',
                    type: 'review', 
                    label: 'Account Summary', 
                    onRender: (zone, field) => {
                        const listEl = DOM.el(`modal-review-${field.id}`);
                        const itemTpl = DOM.el('tpl-review-item')?.innerHTML;
                        
                        if (!listEl || !itemTpl) return;

                        const data = Modal._executionData;

                        const selectedRole = DBROLES.find(r => r.id === data.role);
                        const roleLabel = selectedRole ? selectedRole.label : UNKNOWNROLE.label;

                        // Define the data for each row
                        const listItems = [
                            { 
                                itemLabel: 'Username', 
                                value: data.username, 
                                valueClass: 'text-dark fw-bold' 
                            },
                            { 
                                itemLabel: 'Password', 
                                value: '********', 
                                valueClass: 'text-dark' 
                            },
                            { itemLabel: 'Host Binding', value: data.host, valueClass: 'text-dark' },
                            { 
                                itemLabel: 'Role Access', 
                                value: roleLabel, 
                                valueClass: 'badge bg-primary bg-opacity-10 text-primary border border-primary px-2 py-1',
                                extraClass: 'bg-light' 
                            }
                        ];

                        // Parse the hidden template for each item and inject it
                        listEl.innerHTML = listItems.map(item => 
                            Template.parse(itemTpl, item)
                        ).join('');
                    }
                }
            ]
        }
    ];

    // Initialize Modal Execution
    // Pass the 'steps' array so the engine builds the workflow navigation
    Modal.openModal('create-db-user.bat', modalData, steps, (script, executionData) => {
        const selectedRole = DBROLES.find(r => r.id === executionData.role);
        const sqlPrivileges = selectedRole ? selectedRole.sql : 'SELECT';
       
        // CRITICAL FIX FOR SPACES: 
        // We wrap every single argument in literal double-quotes `""`. 
        // This forces Windows to treat spaces as part of the string, not a new argument
        API.runBatch(script, [
            `"${executionData.username}"`, 
            `"${executionData.password}"`, 
            `"${executionData.host}"`, 
            `"${sqlPrivileges}"` 
        ]);
    });
};