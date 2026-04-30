import { API, Template } from '@jsui/core'; 
import { Modal } from '@jspartials/core/modal';
import { DOM } from '@jsutils';
import { chckDbUserInstalld } from '../validate';

export const prmptCreateDbUser = () => {
    const modalData = { 
        title: __('crtdbacc'), 
        size: 'lg',
        execBtn: __('crtdbacc') 
    };

    const steps = [
        // STEP: INPUT CREDENTIALS
        {
            title: __('crtdbacc'),
            desc: 'Please enter the credentials for the new DB user. (System Administrator privileges will be applied automatically).',
            fields: [
                { id: 'username', type: 'txt', label: 'Username', placeholder: __('forms.entruname'), required: true },
                { id: 'password', type: 'psswrd', label: 'Password', placeholder: __('forms.entrpass'), required: true },
                { 
                    id: 'confirmpass', type: 'psswrd', label: __('forms.confirmpass2'), placeholder: __('forms.confirmpass'), required: true,
                    customValidate: (val) => {
                        const passEl = DOM.el('modal-input-password');
                        return passEl && val === passEl.value ? true : __('forms.pssmismatch');
                    }
                },
                { id: 'host', type: 'txt', label: 'Host', placeholder: 'e.g., % or localhost', required: true }
                // NO ROLE DROPDOWN HERE
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

                        const listItems = [
                            { itemLabel: 'Username', value: data.username, valueClass: 'text-dark fw-bold' },
                            { itemLabel: 'Password', value: '********', valueClass: 'text-dark' },
                            { itemLabel: 'Host Binding', value: data.host, valueClass: 'text-dark' },
                            { 
                                itemLabel: 'Role Access', 
                                value: 'System Administrator (ALL PRIVILEGES)', 
                                valueClass: 'badge bg-primary bg-opacity-10 text-primary border border-primary px-2 py-1',
                                extraClass: 'bg-light' 
                            }
                        ];

                        listEl.innerHTML = listItems.map(item => Template.parse(itemTpl, item)).join('');
                    }
                }
            ]
        }
    ];

    Modal.openModal('create-db-user.bat', modalData, steps, async (script, executionData) => {
        // 1. Hardcode Privileges and Execute
        const sqlPrivileges = 'ALL PRIVILEGES';
        API.runBatch(script, [
            `"${executionData.username}"`, 
            `"${executionData.password}"`, 
            `"${executionData.host}"`, 
            `"${sqlPrivileges}"` 
        ]);

        // 2. Save directly to settings.json!
        await API.updateSetting('dbUserCreated', true);

        // 3. Trigger the validation check to lock the UI card immediately
        chckDbUserInstalld();
    });
};