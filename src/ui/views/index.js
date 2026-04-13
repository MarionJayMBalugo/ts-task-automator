/**
 * THE COMPONENT REGISTRY
 * Maps layout names (tabs) to their specific Vanilla JS component logic.
 */

import { DashboardComponent } from './dashboard/index.js';
import { ServerInstallationComponent } from './server-installation/index.js';
import { ServerValidationComponent } from './server-validation/index.js';

export const ComponentRegistry = {
    'dashboard': DashboardComponent,
    'server-installation': ServerInstallationComponent,
    'server-validation': ServerValidationComponent
};