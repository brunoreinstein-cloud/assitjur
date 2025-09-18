#!/usr/bin/env node

import { spawn } from 'child_process';
import { mkdir, writeFile, rm } from 'fs/promises';

console.log('🔧 AssistJur.IA - Complete Build & Validation Script');

async function cleanDist() {
  try {
    await rm('dist', { recursive: true, force: true });
    console.log('🧹 Cleaned dist directory');
  } catch (error) {
    console.log('📁 No previous dist directory found');
  }
}

async function runCommand(command, args, description, optional = false) {
  return new Promise(resolve => {
    console.log(`🔧 ${description}...`);
    const proc = spawn(command, args, { stdio: 'inherit' });
    proc.on('close', code => {
      if (code === 0) {
        console.log(`✅ ${description} completed`);
        resolve(true);
      } else {
        const level = optional ? '⚠️ ' : '❌';
        console.log(`${level} ${description} failed (code ${code})`);
        resolve(optional ? true : false);
      }
    });
  });
}

async function runTypeCheck() {
  return await runCommand('npx', ['tsc', '--noEmit'], 'Type check', true);
}

async function runViteBuild() {
  return await runCommand('npx', ['vite', 'build'], 'Vite build');
}

async function runPrerender() {
  return await runCommand('node', ['scripts/prerender.mjs'], 'Prerender static pages', true);
}

async function runSitemap() {
  return await runCommand('node', ['scripts/generate-sitemap.mjs'], 'Generate sitemap', true);
}

async function runValidation() {
  return await runCommand('node', ['scripts/validate-build.mjs'], 'Validate build output', true);
}

async function writeStatus(success) {
  const timestamp = new Date().toISOString();
  await mkdir('dist', { recursive: true });
  await writeFile('dist/build-status.json', JSON.stringify({ 
    timestamp, 
    success, 
    method: 'clean-build-script' 
  }, null, 2));
}

(async () => {
  try {
    console.log('🚀 Starting complete build & validation process...\n');
    
    // Step 1: Clean
    await cleanDist();
    
    // Step 2: Type check (optional)
    await runTypeCheck();
    
    // Step 3: Main build (critical)
    const buildSuccess = await runViteBuild();
    if (!buildSuccess) {
      await writeStatus(false);
      console.log('\n💥 Main build failed - stopping process');
      process.exit(1);
    }
    
    // Step 4: Post-build enhancements (optional)
    console.log('\n📦 Running post-build enhancements...');
    await runPrerender();
    await runSitemap();
    
    // Step 5: Validation
    console.log('\n🔍 Validating build output...');
    await runValidation();
    
    // Step 6: Final status
    await writeStatus(true);
    console.log('\n🎉 Complete build & validation process finished successfully!');
    console.log('📁 Check dist/ directory for all generated files');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n💥 Build process error:', error);
    await writeStatus(false);
    process.exit(1);
  }
})();