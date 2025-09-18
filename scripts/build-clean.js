#!/usr/bin/env node

import { spawn } from 'child_process';
import { mkdir, writeFile, rm } from 'fs/promises';

console.log('🔧 AssistJur.IA - Clean Build Script');

async function cleanDist() {
  try {
    await rm('dist', { recursive: true, force: true });
    console.log('🧹 Cleaned dist directory');
  } catch (error) {
    console.log('📁 No previous dist directory found');
  }
}

async function runTypeCheck() {
  return new Promise(resolve => {
    console.log('🔍 Running type check...');
    const proc = spawn('npx', ['tsc', '--noEmit'], { stdio: 'inherit' });
    proc.on('close', code => {
      if (code === 0) {
        console.log('✅ Type check passed');
      } else {
        console.log('⚠️  Type check found issues (continuing anyway)');
      }
      resolve(code === 0);
    });
  });
}

async function runViteBuild() {
  return new Promise(resolve => {
    console.log('📦 Running Vite build...');
    const proc = spawn('npx', ['vite', 'build'], { stdio: 'inherit' });
    proc.on('close', code => {
      if (code === 0) {
        console.log('✅ Vite build completed');
      } else {
        console.log('❌ Vite build failed');
      }
      resolve(code === 0);
    });
  });
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
    await cleanDist();
    
    // Type check é opcional - não bloqueia o build
    await runTypeCheck();
    
    // Build principal
    const buildSuccess = await runViteBuild();
    await writeStatus(buildSuccess);
    
    if (buildSuccess) {
      console.log('🚀 Clean build completed successfully!');
      console.log('📁 Check dist/ directory for output files');
    } else {
      console.log('💥 Build failed - check logs above');
    }
    
    process.exit(buildSuccess ? 0 : 1);
  } catch (error) {
    console.error('💥 Build script error:', error);
    process.exit(1);
  }
})();