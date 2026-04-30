/**
 * =============================================================================
 * SERVICE: TASK SCHEDULER
 * =============================================================================
 * Handles the verification and installation of Windows Task Scheduler tasks.
 * It dynamically injects drive letter preferences into XML definitions and 
 * manages strict Windows text encoding requirements.
 */

const { exec } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

const SetSvc = require('../settings.svc.js'); 
const { SysUtil } = require('#utils');
const { TSK_SCHEDLRS, APP_CNF } = require('#cnf');

const SchedlrSvc = {
    
    /** --- TASK VERIFICATION ---
     * Queries the OS to check if predefined tasks currently exist AND are enabled.
     * @returns {Promise<Array<Object>>} Resolves to the configuration array with 'installed' and 'disabled' booleans injected.
     */
    chckSchedlrsInstalld: () => {
        return new Promise(async (resolve) => {
            const checks = TSK_SCHEDLRS.map(task => {
                return new Promise((res) => {
                    const fullTaskName = task.path ? `${task.path}\\${task.name}` : task.name;

                    // TARGETED QUERY
                    // We request the output in CSV format (/fo CSV) so we can easily read the status column
                    exec(`schtasks /query /tn "${fullTaskName}" /fo CSV`, (error, stdout) => {
                        
                        const isInstalled = !error;
                        const isDisabled = isInstalled && stdout ? stdout.includes('"Disabled"') : false;

                        res({
                            ...task,
                            installed: isInstalled,
                            disabled: isDisabled
                        });
                    });
                });
            });

            const updatedTasksArray = await Promise.all(checks);
            resolve(updatedTasksArray);
        });
    },

    /** --- TASK DEPLOYMENT ---
     * Installs XML-based tasks. It safely resolves internal vs external paths, 
     * replaces placeholder drive letters, and forces UTF-16LE encoding for Windows compatibility.
     * @param {Object} app - The global Electron app instance.
     * @param {Array<Object>} pendingTasks - Definitions of tasks to install.
     * @returns {Promise<Array>} Resolves with the success state of each installation.
     */
    instllSchedlrs: (app, pendingTasks) => {
        return new Promise(async (resolve) => {
            const settings = SetSvc.get();
            
            // DRIVE RESOLUTION
            // Extract the raw letter (e.g., 'C' or 'D'), stripping colons or slashes.
            const targetDrive = (settings.targetDrive || APP_CNF.defDrv).replace(/[:\\]/g, '');
            
            // INTERNAL PATH RESOLUTION
            // Corrects paths when running inside a packaged Electron application to target the unpacked resources.
            let internalDir = path.join(SysUtil.getResPath(app), 'schedlrs');
            if (internalDir.includes('app.asar') && !internalDir.includes('app.asar.unpacked')) {
                internalDir = internalDir.replace('app.asar', 'app.asar.unpacked');
            }

            // EXTERNAL OVERRIDE RESOLUTION
            // Prioritize custom script directories defined by the user over internal defaults.
            const externalDir = settings.customScriptLoc ? path.join(settings.customScriptLoc, 'schedlrs') : null;
            const baseDir = (externalDir && fs.existsSync(externalDir)) ? externalDir : internalDir;

            const installPromises = pendingTasks.map(task => {
                return new Promise((res) => {
                    const xmlPath = path.join(baseDir, `${task.name}.xml`);
                    
                    if (!fs.existsSync(xmlPath)) {
                        console.error(`[SchedlrSvc] Missing XML definition for: ${xmlPath}`);
                        return res({ name: task.name, success: false, error: 'XML file not found' });
                    }

                    try {
                        // READ RAW BINARY
                        const rawBuffer = fs.readFileSync(xmlPath);
                        let xmlContent = '';

                        // ENCODING DETECTION
                        // Check for the UTF-16LE Byte Order Mark (FF FE). If absent, assume UTF-8.
                        if (rawBuffer[0] === 0xFF && rawBuffer[1] === 0xFE) {
                            xmlContent = rawBuffer.toString('utf16le');
                        } else {
                            xmlContent = rawBuffer.toString('utf8');
                        }

                        // BOM SANITIZATION
                        // Strip residual invisible characters from the start of the string.
                        if (xmlContent.charCodeAt(0) === 0xFEFF) {
                            xmlContent = xmlContent.slice(1);
                        }

                        // DYNAMIC INJECTION
                        xmlContent = xmlContent.replace(/{{TARGET_DRIVE}}/g, targetDrive);

                        // TEMP FILE GENERATION
                        // schtasks requires a physical file path. We write to the OS temp directory.
                        const tempXmlPath = path.join(os.tmpdir(), `TMS_${task.name.replace(/\s+/g, '_')}_temp.xml`);
                        
                        // FORCE UTF-16LE ENCODING
                        // Windows schtasks will reject the XML if it is not strictly UTF-16LE with a BOM.
                        const bom = Buffer.from([0xFF, 0xFE]);
                        const contentBuffer = Buffer.from(xmlContent, 'utf16le');
                        const finalBuffer = Buffer.concat([bom, contentBuffer]);
                        
                        fs.writeFileSync(tempXmlPath, finalBuffer);

                        // EXECUTE NATIVE INSTALLATION
                        const fullTaskName = task.path ? `${task.path}\\${task.name}` : task.name;
                        const command = `schtasks /create /tn "${fullTaskName}" /xml "${tempXmlPath}" /f`;

                        exec(command, (error) => {
                            // CLEANUP
                            if (fs.existsSync(tempXmlPath)) {
                                fs.unlinkSync(tempXmlPath);
                            }

                            if (error) {
                                console.error(`[SchedlrSvc] Execution failed for ${task.name}:`, error);
                                res({ name: task.name, success: false, error: error.message });
                            } else {
                                res({ name: task.name, success: true });
                            }
                        });

                    } catch (err) {
                        console.error(`[SchedlrSvc] Processing fault for ${task.name}:`, err);
                        res({ name: task.name, success: false, error: err.message });
                    }
                });
            });

            // Await execution of all tasks concurrently
            const results = await Promise.all(installPromises);
            resolve(results);
        });
    },

    /** --- SPECIFIC BACKUP TASK VERIFICATION ---
     * Checks if the TmsDosDbBackup task exists and if it uses the 7z script.
     */
    checkDbBackupTask: () => {
        return new Promise((resolve) => {
            exec(`schtasks /query /tn "TmsDosDbBackup" /xml`, (error, stdout) => {
                if (error || !stdout) {
                    resolve({ installed: false, isUpgraded: false });
                } else {
                    // If the XML contains the 7z filename, it's already upgraded!
                    const isUpgraded = stdout.includes('mysql_backup_7z.ps1');
                    resolve({ installed: true, isUpgraded });
                }
            });
        });
    },

    /** --- BACKUP TASK UPGRADE ---
     * Exports the task, copies the new 7z script to the target directory, 
     * safely injects the 7z script argument, and overwrites the task.
     */
    upgradeDbBackupTask: (app) => {
        return new Promise((resolve, reject) => {
            exec(`schtasks /query /tn "TmsDosDbBackup" /xml`, (error, stdout) => {
                if (error || !stdout) return reject(new Error('TmsDosDbBackup task not found'));

                let xmlContent = stdout;
                if (xmlContent.includes('mysql_backup_7z.ps1')) return resolve(true);

                // 1. EXTRACT THE TARGET DIRECTORY FROM THE XML
                const pathRegex = /([a-zA-Z]:\\[^\s<>"']+)\\mysql_backup\.ps1/i;
                const match = xmlContent.match(pathRegex);
                
                if (match && match[1]) {
                    const targetDir = match[1];
                    const targetFile = path.join(targetDir, 'mysql_backup_7z.ps1');
                    
                    // 2. RESOLVE THE SOURCE SCRIPT (WITH EXTERNAL OVERRIDE)
                    const settings = SetSvc.get();
                    
                    // A. Internal Packaged Path
                    let internalPath = path.join(SysUtil.getResPath(app), 'mysql_backup_7z.ps1');
                    if (internalPath.includes('app.asar') && !internalPath.includes('app.asar.unpacked')) {
                        internalPath = internalPath.replace('app.asar', 'app.asar.unpacked');
                    }

                    // B. External Override Path (If user exported scripts)
                    const externalPath = settings.customScriptLoc ? path.join(settings.customScriptLoc, 'mysql_backup_7z.ps1') : null;
                    
                    // C. Choose the correct path
                    const sourcePath = (externalPath && fs.existsSync(externalPath)) ? externalPath : internalPath;

                    // 3. COPY THE SCRIPT TO THE USER'S APPDATA FOLDER
                    try {
                        if (fs.existsSync(sourcePath)) {
                            fs.copyFileSync(sourcePath, targetFile);
                            console.log(`[SchedlrSvc] Successfully copied 7z backup script from ${sourcePath} to ${targetFile}`);
                        } else {
                            console.warn(`[SchedlrSvc] Source script not found at ${sourcePath}`);
                        }
                    } catch (copyErr) {
                        console.error(`[SchedlrSvc] Failed to copy 7z script:`, copyErr);
                    }
                }

                // 4. SAFELY REPLACE THE SCRIPT FILENAME IN THE XML
                xmlContent = xmlContent.replace(/mysql_backup\.ps1/gi, 'mysql_backup_7z.ps1');

                const tempXmlPath = path.join(os.tmpdir(), `TMS_DbBackup_Upgrade.xml`);
                
                // Force UTF-16LE encoding with BOM for Windows schtasks compatibility
                const bom = Buffer.from([0xFF, 0xFE]);
                const contentBuffer = Buffer.from(xmlContent, 'utf16le');
                const finalBuffer = Buffer.concat([bom, contentBuffer]);
                
                fs.writeFileSync(tempXmlPath, finalBuffer);

                // 5. OVERWRITE THE EXISTING TASK
                exec(`schtasks /create /tn "TmsDosDbBackup" /xml "${tempXmlPath}" /f`, (err) => {
                    if (fs.existsSync(tempXmlPath)) fs.unlinkSync(tempXmlPath);
                    if (err) return reject(err);
                    resolve(true);
                });
            });
        });
    }
};

module.exports = SchedlrSvc;