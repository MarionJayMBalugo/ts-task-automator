const esbuild = require('esbuild');
const fs = require('node:fs');
const path = require('node:path');

// =============================================================================
// 1. CLEAN ENVIRONMENT
// =============================================================================
const distDir = path.join(__dirname, 'dist');
if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir);

// =============================================================================
// --- UTILITY FUNCTIONS ---
// =============================================================================

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

function minifyHTML(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir, { withFileTypes: true });

    for (const file of files) {
        const fullPath = path.join(dir, file.name);
        
        if (file.isDirectory()) {
            minifyHTML(fullPath); 
        } else if (file.name.endsWith('.html')) {
            let content = fs.readFileSync(fullPath, 'utf8');

            const commentPattern = new RegExp('<' + '!--[\\s\\S]*?--' + '>', 'g');
            content = content.replace(commentPattern, '');
            content = content.replace(/\r?\n|\r/g, ' ');
            content = content.replace(/\s{2,}/g, ' ');
            content = content.replace(/>\s+</g, '><');

            fs.writeFileSync(fullPath, content.trim(), 'utf8');
        }
    }
}

function minifyScripts(inputFolder, outputFolder) {
    if (!fs.existsSync(outputFolder)) fs.mkdirSync(outputFolder, { recursive: true });
    const files = fs.readdirSync(inputFolder, { withFileTypes: true });

    for (const file of files) {
        const inputPath = path.join(inputFolder, file.name);
        const outputPath = path.join(outputFolder, file.name);

        if (file.isDirectory()) {
            minifyScripts(inputPath, outputPath);
        } else {
            let content = fs.readFileSync(inputPath, 'utf8');

            if (!file.name.endsWith('.conf')) {
                const lines = content.split(/\r?\n/);
                let processedLines = [];
                let isModified = false;

                if (file.name.endsWith('.bat') || file.name.endsWith('.cmd')) {
                    processedLines = lines.filter(line => {
                        const t = line.trim().toUpperCase();
                        return !(t.startsWith('REM') || t.startsWith('::'));
                    });
                    isModified = true;
                } 
                else if (file.name.includes('.env') || file.name.endsWith('.ps1')) {
                    processedLines = lines.filter(line => !line.trim().startsWith('#'));
                    isModified = true;
                }

                if (isModified) {
                    content = processedLines.join('\r\n').replace(/(?:\r?\n){2,}/g, '\r\n').trim();
                }
            }
            fs.writeFileSync(outputPath, content, 'utf8');
        }
    }
}

// =============================================================================
// --- MAIN BUILD EXECUTION ---
// =============================================================================

async function build() {
    console.log('🚀 Starting Pulse Build Engine...');

    const commonOpts = { bundle: true, platform: 'node', target: 'node18', external: ['electron'], minify: true, sourcemap: false };

    // 2. Bundle Main Process & Preload
    await esbuild.build({ ...commonOpts, entryPoints: ['src/main/main.js'], outfile: 'dist/main.js' });
    await esbuild.build({ ...commonOpts, entryPoints: ['src/preload/preload.js'], outfile: 'dist/preload.js' });

    // 3. Copy Static Assets (HTML views, images) FIRST
    console.log('📂 Syncing static assets...');
    fs.cpSync('src/ui', 'dist/ui', { recursive: true });
    fs.cpSync('src/assets', 'dist/assets', { recursive: true });
    
    // 4. Minify HTML files in the dist folder
    console.log('🗜️ Compressing HTML views...');
    minifyHTML(path.join(__dirname, 'dist', 'ui'));

    // 5. Minify Resources (Batch/Env)
    console.log('⚙️ Minifying Shell Scripts & Envs...');
    minifyScripts(path.join(__dirname, 'resources'), path.join(__dirname, 'dist', 'resources'));

    // 6. Bundle UI JavaScript (THE MAGIC HAPPENS HERE)
    console.log('📦 Bundling UI Modules into ONE file...');
    
    // 🚨 Clean up the raw JS files that were copied over in Step 3 so they don't bloat the dist folder
    fs.rmSync(path.join(__dirname, 'dist/ui/js'), { recursive: true, force: true });

    // Bundle the master controller (app.js) into a single file
    await esbuild.build({
        entryPoints: ['src/ui/js/app.js'],
        bundle: true,          // 👈 This tells esbuild to merge all imports!
        outfile: 'dist/ui/js/app.js',
        platform: 'browser',
        minify: true,
        sourcemap: false,      // Turns off the .map files
    });

    // If text.js exists, minify it in place
    const textJsPath = path.join(__dirname, 'dist/ui/text.js');
    if (fs.existsSync(textJsPath)) {
        await esbuild.build({
            entryPoints: ['src/ui/text.js'],
            outfile: textJsPath,
            allowOverwrite: true,
            minify: true,
            sourcemap: false,
        });
    }

    // 7. Bundle Custom App CSS
    console.log('🎨 Minifying Custom App CSS...');
    const cssFilesToMinify = getFiles(path.join(__dirname, 'src/assets/css/app'), '.css');
    if (fs.existsSync(path.join(__dirname, 'src/ui/style.css'))) cssFilesToMinify.push('src/ui/style.css');

    if (cssFilesToMinify.length > 0) {
        await esbuild.build({
            entryPoints: cssFilesToMinify,
            outdir: 'dist',
            outbase: 'src', 
            allowOverwrite: true, 
            minify: true,
            sourcemap: false,     // Turns off the .map files
        });
    }

    console.log('✅ Build complete! App is ready in /dist');
}

build().catch((err) => {
    console.error(err);
    process.exit(1);
});