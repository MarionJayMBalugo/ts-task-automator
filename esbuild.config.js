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
    console.log('Starting Pulse Build Engine...');

    const commonOpts = { bundle: true, platform: 'node', target: 'node18', external: ['electron'], minify: true, sourcemap: false };

    // 2. Bundle Main Process & Preload 
    // (esbuild natively respects your package.json "#cnf" imports!)
    await esbuild.build({ ...commonOpts, entryPoints: ['src/backend/main.js'], outfile: 'dist/main.js' });
    await esbuild.build({ ...commonOpts, entryPoints: ['src/preload/preload.js'], outfile: 'dist/preload.js' });

    // 3. Copy Static Assets (HTML views, images) FIRST
    console.log('Syncing static assets...');
    fs.cpSync('src/ui', 'dist/ui', { recursive: true });
    fs.cpSync('src/assets', 'dist/assets', { recursive: true });
    
    // 4. Minify HTML files in the dist folder
    console.log('Compressing HTML views...');
    minifyHTML(path.join(__dirname, 'dist', 'ui'));

    // 5. Minify Resources (Batch/Env)
    console.log('Minifying Shell Scripts & Envs...');
    minifyScripts(path.join(__dirname, 'resources'), path.join(__dirname, 'dist', 'resources'));

    // 6. Bundle UI JavaScript
    console.log('Bundling UI Modules into ONE file...');
    
    // 🚨 CRITICAL FIX: Aggressively delete ALL raw .js files that were just copied into /dist/ui
    // This ensures your new views/**/index.js components don't accidentally get left behind and bloat the app.
    const allRawJsFiles = getFiles(path.join(__dirname, 'dist/ui'), '.js');
    allRawJsFiles.forEach(file => fs.unlinkSync(file));

    // Bundle the master controller (app.js) into a single file
    await esbuild.build({
        entryPoints: ['src/ui/js/core/app.js'],
        bundle: true,          // Merge all imports, including ComponentRegistry!
        outfile: 'dist/ui/js/core/app.js',
        platform: 'browser',
        minify: true,
        sourcemap: false,
        alias: {
            '@jsui': path.resolve(__dirname, 'src/ui/js'),
            '@jsvw': path.resolve(__dirname, 'src/ui/views'),
            '@jspartials': path.resolve(__dirname, 'src/ui/js/partials'),
        }
    });

    // Standalone language dictionary
    const textJsSource = path.join(__dirname, 'src/ui/js/lang/text.js');
    if (fs.existsSync(textJsSource)) {
        await esbuild.build({
            entryPoints: [textJsSource],
            outfile: 'dist/ui/js/lang/text.js', 
            minify: true,
            sourcemap: false,
        });
    } else {
        console.warn('Warning: Could not find src/ui/js/lang/text.js');
    }

    // 7. Bundle ALL CSS (Bootstrap + Custom) into ONE file
    console.log('Bundling Bootstrap and Custom CSS into one file...');
    
    // 🚨 CRITICAL FIX: Generate a master temp file that correctly points to Bootstrap and your central bundle.css
    const tempCssPath = path.join(__dirname, 'src/ui/master-temp.css');
    
    const bootstrapPath = path.join(__dirname, 'node_modules/bootstrap/dist/css/bootstrap.min.css').replace(/\\/g, '/');
    const localBundlePath = path.join(__dirname, 'src/ui/css/bundle.css').replace(/\\/g, '/');
    
    // We orchestrate the imports so Bootstrap is always loaded first
    const masterCssContent = `
        @import "${bootstrapPath}";
        @import "${localBundlePath}";
    `;
    
    fs.writeFileSync(tempCssPath, masterCssContent);

    // Bundle it all into one final file
    await esbuild.build({
        entryPoints: [tempCssPath],
        outfile: 'dist/ui/style.bundle.css', // Matches the <link> in your index.html
        bundle: true, 
        minify: true,
        sourcemap: false,
    });

    // Clean up the temporary file and unbundled CSS directories
    if (fs.existsSync(tempCssPath)) fs.unlinkSync(tempCssPath);
    
    const distUiCssFolder = path.join(__dirname, 'dist/ui/css');
    if (fs.existsSync(distUiCssFolder)) fs.rmSync(distUiCssFolder, { recursive: true, force: true });

    console.log('Build complete! App is ready in /dist');
}

build().catch((err) => {
    console.error(err);
    process.exit(1);
});