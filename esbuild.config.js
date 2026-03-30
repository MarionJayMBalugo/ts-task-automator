const esbuild = require('esbuild');
const fs = require('node:fs');
const path = require('node:path');

// 1. Clean the dist folder before building
const distDir = path.join(__dirname, 'dist');
if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir);

/**
 * Safely minifies scripts by removing comments and crushing multiple empty newlines.
 * EXCLUDES .conf files from minification.
 */
function minifyScripts(inputFolder, outputFolder) {
    if (!fs.existsSync(outputFolder)) {
        fs.mkdirSync(outputFolder, { recursive: true });
    }

    const files = fs.readdirSync(inputFolder, { withFileTypes: true });

    for (const file of files) {
        const inputPath = path.join(inputFolder, file.name);
        const outputPath = path.join(outputFolder, file.name);

        if (file.isDirectory()) {
            minifyScripts(inputPath, outputPath);
        } else {
            let content = fs.readFileSync(inputPath, 'utf8');

            // Skip minification entirely if it's a .conf file
            if (!file.name.endsWith('.conf')) {
                const lines = content.split(/\r?\n/);
                let processedLines = [];
                let isModified = false;

                // Rule 1: Batch Files (REM and ::)
                if (file.name.endsWith('.bat') || file.name.endsWith('.cmd')) {
                    processedLines = lines.filter(line => {
                        const t = line.trim().toUpperCase();
                        return !(t.startsWith('REM') || t.startsWith('::'));
                    });
                    isModified = true;
                } 
                // Rule 2: Env and PowerShell files (#)
                else if (file.name.includes('.env') || file.name.endsWith('.ps1')) {
                    processedLines = lines.filter(line => {
                        return !line.trim().startsWith('#');
                    });
                    isModified = true;
                }

                if (isModified) {
                    // Rejoin the remaining lines
                    content = processedLines.join('\r\n');
                    
                    // Rule 3: Crush 2 or more consecutive newlines into exactly 1 newline
                    content = content.replace(/(?:\r?\n){2,}/g, '\r\n');
                    
                    // Trim any lingering whitespace at the very start or end of the file
                    content = content.trim();
                }
            }

            // Write the file (either the minified version or the raw .conf version)
            fs.writeFileSync(outputPath, content, 'utf8');
        }
    }
}

async function build() {
    console.log('🚀 Starting esbuild...');

    // 2. Bundle Main Process (Backend)
    await esbuild.build({
        entryPoints: ['src/main/main.js'],
        bundle: true,
        platform: 'node',
        target: 'node18',
        external: ['electron'], 
        outfile: 'dist/main.js',
        minify: true,
    });

    // 3. Bundle Preload Script
    await esbuild.build({
        entryPoints: ['src/preload/preload.js'],
        bundle: true,
        platform: 'node',
        external: ['electron'],
        outfile: 'dist/preload.js',
        minify: true,
    });

    // 4. Copy Static Assets (HTML, Vendor Bootstrap CSS/JS) FIRST
    console.log('📂 Copying static assets...');
    fs.cpSync('src/ui', 'dist/ui', { recursive: true });
    fs.cpSync('src/assets', 'dist/assets', { recursive: true });
    
    // Process Resources (Custom Minifier)
    console.log('⚙️ Minifying Shell Scripts & Envs...');
    minifyScripts(path.join(__dirname, 'resources'), path.join(__dirname, 'dist', 'resources'));

    // 5. Bundle UI JavaScript
    console.log('📦 Bundling UI JavaScript...');
    const uiJsDir = path.join(__dirname, 'src/ui/js');
    const uiJsFiles = fs.readdirSync(uiJsDir)
        .filter(file => file.endsWith('.js'))
        .map(file => path.join('src/ui/js', file));

    if (fs.existsSync(path.join(__dirname, 'src/ui/text.js'))) {
        uiJsFiles.push('src/ui/text.js');
    }

    await esbuild.build({
        entryPoints: uiJsFiles,
        outdir: 'dist',
        outbase: 'src',
        platform: 'browser',
        allowOverwrite: true,
        minify: true,
    });

    // 6. Bundle Custom App CSS
    console.log('🎨 Minifying Custom App CSS...');
    const appCssDir = path.join(__dirname, 'src/assets/css/app');
    let cssFilesToMinify = [];
    
    if (fs.existsSync(appCssDir)) {
        cssFilesToMinify = fs.readdirSync(appCssDir)
            .filter(file => file.endsWith('.css'))
            .map(file => path.join('src/assets/css/app', file));
    }

    if (fs.existsSync(path.join(__dirname, 'src/ui/style.css'))) {
        cssFilesToMinify.push('src/ui/style.css');
    }

    if (cssFilesToMinify.length > 0) {
        await esbuild.build({
            entryPoints: cssFilesToMinify,
            outdir: 'dist',
            outbase: 'src',
            allowOverwrite: true, 
            minify: true,
        });
    }

    console.log('✅ Build complete! App is ready in /dist');
}

build().catch((err) => {
    console.error(err);
    process.exit(1);
});