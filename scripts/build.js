import { spawn } from 'child_process';
import { mkdir, writeFile, rm } from 'fs/promises';

async function cleanDist() {
  try {
    await rm('dist', { recursive: true, force: true });
    console.log('🧹 Cleaned dist directory');
  } catch (error) {
    console.log('📁 No previous dist directory found');
  }
}

async function runCommand(command, args, description) {
  return new Promise(resolve => {
    console.log(`🔧 ${description}...`);
    const proc = spawn(command, args, { stdio: 'inherit' });
    proc.on('close', code => {
      if (code === 0) {
        console.log(`✅ ${description} completed`);
      } else {
        console.log(`⚠️  ${description} failed (code ${code})`);
      }
      resolve(code === 0);
    });
  });
}

async function runBuild() {
  return await runCommand('npx', ['vite', 'build'], 'Vite build');
}

async function runPrerender() {
  return await runCommand('node', ['scripts/prerender.mjs'], 'Prerender static pages');
}

async function runSitemap() {
  return await runCommand('node', ['scripts/generate-sitemap.mjs'], 'Generate sitemap');
}

async function writeStatus(success) {
  const timestamp = new Date().toISOString();
  await mkdir('dist', { recursive: true });
  await writeFile('dist/build-status.json', JSON.stringify({ timestamp, success }, null, 2));
}

(async () => {
  try {
    console.log('🚀 Starting complete build process...');
    
    // Step 1: Clean
    await cleanDist();
    
    // Step 2: Main build
    const buildSuccess = await runBuild();
    if (!buildSuccess) {
      await writeStatus(false);
      console.log('❌ Main build failed');
      process.exit(1);
    }
    
    // Step 3: Post-build steps (optional, won't fail main build)
    console.log('📦 Running post-build steps...');
    await runPrerender();
    await runSitemap();
    
    // Step 4: Write success status
    await writeStatus(true);
    console.log('🎉 Complete build process finished successfully!');
    
  } catch (error) {
    console.error('💥 Build process error:', error);
    await writeStatus(false);
    process.exit(1);
  }
})();
