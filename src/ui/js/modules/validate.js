import { API } from '../core/api.js';
import { Status } from './status.js';

export const Validate = {
    cache: null,

    run: async (force = false) => {
        if (!force && Validate.cache) {
            Status.updateValidationBadges(Validate.cache);
            return;
        }

        Status.setValidationLoading(true);

        try {
            Validate.cache = await API.getSystemInfo();
            Status.updateValidationBadges(Validate.cache);
            return Validate.cache;
        } catch (error) {
            console.error("Validation failed:", error);
        } finally {
            Status.setValidationLoading(false);
        }
    }
};