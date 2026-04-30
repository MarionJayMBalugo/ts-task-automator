/**
 * =============================================================================
 * PROMPT REGISTRY HUB (Index)
 * =============================================================================
 * This module centralizes all multi-step modal workflows (Prompts).
 * Instead of importing individual files in your views, import from here:
 * * EXAMPLE: import { prmptSchedulrSetup } from './prompts';
 * * WHY: This keeps your view logic clean and ensures that all user interaction
 * flows are categorized and easy to locate.
 * =============================================================================
 */

/** --- APPLICATION & ENVIRONMENT INSTALLERS ---
 * Handles the external software requirements and the core TMS-DOS 
 * application environment setup.
 */
export { prmptTmsdInstllr } from './tms-dos.js';
export { promptHeidiInstaller } from './heidi.js';

/** --- DATABASE MANAGEMENT ---
 * Handles the creation of the MariaDB database instances and the 
 * configuration of dedicated database users/permissions.
 */
export { prmptCreatDB } from './create-db.js';
export { prmptCreateDbUser } from './create-dbusers.js';

/** --- SYSTEM AUTOMATION ---
 * Handles the deployment of background tasks into the Windows 
 * Task Scheduler using the XML-driven installation service.
 */
export { prmptSchedulrSetup } from './stup-tskschedlr.js';

export { prmptInitFolders } from './init-folders.js';