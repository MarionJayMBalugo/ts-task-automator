import { API } from '@jsui/core';
import { Flows } from '@jsui/modules';

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

    Flows.openModal('create-database.bat', data, steps, (script, data) => {
        API.runBatch(script, [data.dbNames.join(',')])
    });
};