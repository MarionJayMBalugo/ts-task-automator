const esbuild = require('esbuild');
const fs = require('node:fs');
const path = require('node:path');

// =============================================================================
// CLEANUP & INITIALIZATION
// Wipe out the old dist folder to ensure a fresh build with no ghost files.
// =============================================================================
const distDir = path.join(__dirname, 'dist');
if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir);

// =============================================================================
// --- UTILITY FUNCTIONS ---
// =============================================================================

/**
 * Recursively scans a directory for files matching a specific extension.
 */
function getFiles(dir, ext, fileList = []) {
    if (!fs.existsSync(dir)) return fileList;
    const files = fs.readdirSync(dir, { withFileTypes: true });

    for (const file of files) {
        const fullPath = path.join(dir, file.name);
        if (file.isDirectory()) {
            getFiles(fullPath, ext, fileList);
        } else if (file.name.endsWith(ext)) {
            fileList.push(fullPath);
        }
    }
    return fileList;
}

/**
 * Recursively strips comments and whitespace from all HTML files.
 */
function minifyHTML(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir, { withFileTypes: true });

    for (const file of files) {
        const fullPath = path.join(dir, file.name);
        
        if (file.isDirectory()) {
            minifyHTML(fullPath); 
        } else if (file.name.endsWith('.html')) {
            let content = fs.readFileSync(fullPath, 'utf8');

            // Regex removal of HTML comments and excessive spaces
            const commentPattern = new RegExp('<' + '!--[\\s\\S]*?--' + '>', 'g');
            content = content.replace(commentPattern, '');
            content = content.replace(/\r?\n|\r/g, ' ');
            content = content.replace(/\s{2,}/g, ' ');
            content = content.replace(/>\s+</g, '><');

            fs.writeFileSync(fullPath, content.trim(), 'utf8');
        }
    }
}

/**
 * Processes shell scripts (stripping comments/empty lines) while safely copying
 * complex encodings (like UTF-16LE XMLs) and binary files without corrupting them.
 */
function minifyScripts(inputFolder, outputFolder) {
    if (!fs.existsSync(outputFolder)) fs.mkdirSync(outputFolder, { recursive: true });
    const files = fs.readdirSync(inputFolder, { withFileTypes: true });

    for (const file of files) {
        const inputPath = path.join(inputFolder, file.name);
        const outputPath = path.join(outputFolder, file.name);

        if (file.isDirectory()) {
            minifyScripts(inputPath, outputPath);
        } else {
            // SAFE TEXT PROCESSING: Only run UTF-8 regex operations on known shell scripts.
            if (file.name.match(/\.(bat|cmd|ps1)$/i) || file.name.includes('.env')) {
                let content = fs.readFileSync(inputPath, 'utf8');
                const lines = content.split(/\r?\n/);
                let processedLines = [];

                if (file.name.endsWith('.bat') || file.name.endsWith('.cmd')) {
                    processedLines = lines.filter(line => {
                        const t = line.trim().toUpperCase();
                        return !(t.startsWith('REM') || t.startsWith('::'));
                    });
                } else if (file.name.includes('.env') || file.name.endsWith('.ps1')) {
                    processedLines = lines.filter(line => !line.trim().startsWith('#'));
                }

                // Compress multiple blank lines into a single newline and write back
                content = processedLines.join('\r\n').replace(/(?:\r?\n){2,}/g, '\r\n').trim();
                fs.writeFileSync(outputPath, content, 'utf8');
                
            } else {
                // EXEMPTION COPY: Raw binary transfer.
                // This prevents Node from accidentally corrupting UTF-16LE XMLs, executables, or images.
                fs.copyFileSync(inputPath, outputPath);
            }
        }
    }
}

// =============================================================================
// --- MAIN BUILD EXECUTION ---
// =============================================================================

async function build() {
    console.log('Starting Pulse Build Engine...');

    const commonOpts = { bundle: true, platform: 'node', target: 'node18', external: ['electron'], minify: true, sourcemap: false };

    // --- BUNDLE ELECTRON BACKEND ---
    // Compiles the main thread and preload scripts. Esbuild handles the "#cnf" package alias natively.
    await esbuild.build({ ...commonOpts, entryPoints: ['src/backend/main.js'], outfile: 'dist/main.js' });
    await esbuild.build({ ...commonOpts, entryPoints: ['src/preload/preload.js'], outfile: 'dist/preload.js' });

    // --- COPY STATIC ASSETS ---
    // Move all HTML views and images over before we start minifying and bundling the UI.
    console.log('Syncing static assets...');
    fs.cpSync('src/ui', 'dist/ui', { recursive: true });
    fs.cpSync('src/assets', 'dist/assets', { recursive: true });
    
    // --- COMPRESS HTML ---
    console.log('Compressing HTML views...');
    minifyHTML(path.join(__dirname, 'dist', 'ui'));

    // --- PROCESS RESOURCES ---
    // Minifies batch files but perfectly duplicates XMLs and bins to prevent UTF-16 corruption.
    console.log('Minifying Shell Scripts & Envs...');
    minifyScripts(path.join(__dirname, 'resources'), path.join(__dirname, 'dist', 'resources'));

    // --- BUNDLE FRONTEND JAVASCRIPT ---
    console.log('Bundling UI Modules into ONE file...');
    
    // Cleanup: Erase all the raw, unbundled JS files that fs.cpSync just copied over.
    // This stops individual component scripts from bloating the final production folder.
    const allRawJsFiles = getFiles(path.join(__dirname, 'dist/ui'), '.js');
    allRawJsFiles.forEach(file => fs.unlinkSync(file));

    // Compile the master UI controller
    await esbuild.build({
        entryPoints: ['src/ui/js/app.js'],
        bundle: true,          // Merge all imports, including ComponentRegistry!
        outfile: 'dist/ui/js/app.js',
        platform: 'browser',
        minify: true,
        sourcemap: false,
        alias: {
            '@jsui': path.resolve(__dirname, 'src/ui/js'),
            '@jsvw': path.resolve(__dirname, 'src/ui/views'),
            '@jspartials': path.resolve(__dirname, 'src/ui/partials'),
            '@jsutils': path.resolve(__dirname, 'src/ui/js/utils')
        }
    });

    // --- BUNDLE LANGUAGE DICTIONARY ---
    const langSource = path.join(__dirname, 'src/ui/js/lang/index.js');
    
    if (fs.existsSync(langSource)) {
        await esbuild.build({
            entryPoints: [langSource],
            outfile: 'dist/ui/js/lang/index.js',
            bundle: true, // Merges all exported language chunks into one file
            minify: true,
            sourcemap: false,
        });
    } else {
        console.warn('Warning: Could not find src/ui/js/lang/index.js');
    }

    // --- BUNDLE STYLESHEETS ---
    console.log('Bundling Bootstrap and Custom CSS into one file...');
    
    // Create a temporary orchestrator file so Bootstrap always loads before our custom CSS overrides.
    const tempCssPath = path.join(__dirname, 'src/ui/master-temp.css');
    const masterCssContent = `
        @import "bootstrap/dist/css/bootstrap.min.css";
        @import "./css/bundle.css";
    `;
    fs.writeFileSync(tempCssPath, masterCssContent);

    // Compile CSS into a single minified file
    await esbuild.build({
        entryPoints: [tempCssPath],
        outfile: 'dist/ui/style.bundle.css', // Matches the <link> in index.html
        bundle: true, 
        minify: true,
        sourcemap: false,
    });

    // Clean up temporary orchestrator and the raw CSS directory
    if (fs.existsSync(tempCssPath)) fs.unlinkSync(tempCssPath);
    
    const distUiCssFolder = path.join(__dirname, 'dist/ui/css');
    if (fs.existsSync(distUiCssFolder)) fs.rmSync(distUiCssFolder, { recursive: true, force: true });

    console.log('Build complete! App is ready in /dist');
}

build().catch((err) => {
    console.error(err);
    process.exit(1);
});