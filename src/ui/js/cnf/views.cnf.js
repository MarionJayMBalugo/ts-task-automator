// We use 'export' here because this is for the browser frontend!
export const TAB_CONFIG = {
    'dashboard': {
        actions: ['refreshSettings', 'runValidation'],
        title: 'dashboard.title',         // The i18n key for the title
        subtitle: 'dashboard.subtitle',    // The i18n key for the subtitle
        showRefresh: true
    },
    'server-validation': {
        actions: ['runValidation'],
        title: 'validation.title', // Assuming you have a title key for this!
        subtitle: 'validation.subtitle',
        showRefresh: true
    },
    'server-installation': {
        actions: [],
        title: 'install.title',
        subtitle: 'install.subtitle',
        showRefresh: false
    },
    'settings': {
        actions: ['refreshSettings'],
        title: 'settings.title',
        subtitle: 'settings.subtitle',
        showRefresh: false
    }
};

export const PARTIALS = {
    modal: {
        path: 'core/modal/template'
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
