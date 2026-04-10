/**
 * SYSTEM MESSAGES (MSG)
 * Centralized dictionary for all backend string outputs.
 */
const MSG = {
    // --- ❌ ERROR MESSAGES ---
    err: {
        noDir:       "❌ Error: Select a destination folder first!",
        elevation:   "❌ Error: Administrator elevation denied or failed.",
        // Dynamic errors (takes arguments)
        noSrc:       (srcPath) => `❌ Error: Source 'resources' not found at ${srcPath}`,
        exportFail:  (errText) => `❌ Export failed: ${errText}`
    },

    // --- ✅ SUCCESS MESSAGES ---
    ok: {
        exported:    (destPath) => `✅ Successfully exported all scripts to: ${destPath}`,
        batchLaunch: (fileName) => `✅ Launched ${fileName} as Administrator.`,
        resetDir:    `✅ Successfully reset the folder path to default` // <-- New!
    }
};

module.exports = { MSG };