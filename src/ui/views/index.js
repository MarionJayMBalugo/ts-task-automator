/**
 * THE COMPONENT REGISTRY
 * Maps layout names (tabs) to their specific Vanilla JS component logic.
 */

import { dashbrdVw } from './dashboard';
import { svrInstllVw } from './server-installation';
import { svrVldationVw } from './server-validation';

export const VwRegistry = {
    'dashboard': dashbrdVw,
    'server-installation': svrInstllVw,
    'server-validation': svrVldationVw
};