/**
 * THE COMPONENT REGISTRY
 * Maps layout names (tabs) to their specific Vanilla JS component logic.
 */

import { DashboardComponent } from './dashboard';
import { ServerInstallationComponent } from './server-installation';
import { ServerValidationComponent } from './server-validation';

export const ComponentRegistry = {
    'dashboard': DashboardComponent,
    'server-installation': ServerInstallationComponent,
    'server-validation': ServerValidationComponent
};