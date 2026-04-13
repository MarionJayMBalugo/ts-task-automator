// We use 'export' here because this is for the browser frontend!
export const TAB_CONFIG = {
    'dashboard': ['refreshSettings', 'runValidation'],
    'server-validation': ['runValidation'],
    'settings': ['refreshSettings'],
    'server-installation': []
};

export const PARTIALS = {
    modal: {
        path: 'core/modal'
    },
    icons: {
        path: 'core/icons'
    }
}

export const VIEWS = {
    dashboard : {
        path: 'dashboard/template'
    },
}

export const VIEW_ROOT = 'app-container';
