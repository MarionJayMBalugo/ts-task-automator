import common from './en/common.js';
import modals from './en/modals.js';
import errors from './en/errors.js';
import forms from './en/forms.js';

import legacy from './text.js';

window.i18n = {
    en: {
        ...legacy.en,

        ...common,
        ...modals,
        ...errors,
        ...forms
    },
    es: {}
};

window.activeLang = window.activeLang || 'en';