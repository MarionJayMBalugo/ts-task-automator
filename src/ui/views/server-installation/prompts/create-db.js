import { API } from '@jsui/core';
import { Modal } from '@jspartials/core/modal';

export const prmptCreatDB = () => {
    let title = 'Create DBs';
    let desc = 'This will run create-database.bat to initialize new database schemas';

    const components = [{ 
        id: 'dbNames', 
        type: 'list', 
        label: 'Target Database Names', 
        listbtn: 'ADD',
        placeholder: 'Type name and press Enter', 
        required: true,
        pills: true 
    }];

    const steps = [{ title, desc, fields: components }];
    const data = { title, desc, size: 'lg' };

    Modal.openModal('create-database.bat', data, steps, (script, data) => {
        API.runBatch(script, [data.dbNames.join(',')])
    });
};