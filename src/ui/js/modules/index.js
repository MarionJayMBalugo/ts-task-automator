/**
 * UI MODULES BARREL
 * Aggregates specialized UI logic into a single entry point.
 * This allows the main UI controller to import everything on one line.
 */

import { Shell }  from './shell.js';
import { Status } from './status.js';
import { Flows }  from './flows.js';
import { Notify } from './notify.js';
import { Validate } from './validate.js';

// Exporting them as named objects
export { 
    Shell, 
    Status, 
    Flows, 
    Notify,
    Validate
};