/**
 * Database User Roles Configuration
 * * Defines the mapping between friendly UI labels and raw SQL privileges.
 * - 'id' is the abstracted key used in the HTML value attribute.
 * - 'label' is the human-readable text shown in the dropdown.
 * - 'sql' is the raw string of permissions passed to the execution script.
 */
export const DBROLES = [
    { 
        id: 'admin', 
        label: 'System Administrator (Full Access)', 
        sql: 'ALL PRIVILEGES' 
    },
    { 
        id: 'schema_mgr', 
        label: 'Schema Manager (Create & Drop Tables)', 
        sql: 'CREATE, DROP, SELECT, INSERT, UPDATE, DELETE' 
    },
    { 
        id: 'editor', 
        label: 'Data Editor (Read & Modify Data)', 
        sql: 'SELECT, INSERT, UPDATE, DELETE' 
    },
    { 
        id: 'viewer', 
        label: 'Data Viewer (Read-Only)', 
        sql: 'SELECT' 
    }
];

export const UNKNOWNROLE = {
    id: 'Unknown',
    label: 'Unknown Role'
}