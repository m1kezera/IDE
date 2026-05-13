const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'frontend-ts', 'public');

console.log('🚀 [Identity Fix] Aligning branding assets...');

// Check for source logo
const sourceFiles = ['LuminaLogo256.png', 'favicon.svg'];
const source = sourceFiles.map(f => path.join(PUBLIC_DIR, f)).find(f => fs.existsSync(f));

if (!source) {
    console.warn('⚠️ No source logo found in frontend-ts/public/, skipping asset fix...');
    process.exit(0); // Don't fail the build
}

console.log(`   Source: ${path.relative(ROOT, source)}`);

// Ensure common names exist
const targets = [
    path.join(PUBLIC_DIR, 'favicon.ico'),
    path.join(PUBLIC_DIR, 'logo.png'),
];

targets.forEach(target => {
    try {
        if (!fs.existsSync(target)) {
            fs.copyFileSync(source, target);
            console.log(`   ✅ Created: ${path.relative(ROOT, target)}`);
        } else {
            console.log(`   ⏭ Exists: ${path.relative(ROOT, target)}`);
        }
    } catch (err) {
        console.error(`   ⚠️ Failed: ${target}: ${err.message}`);
    }
});

console.log('✅ [Identity Fix] Assets check complete.');
