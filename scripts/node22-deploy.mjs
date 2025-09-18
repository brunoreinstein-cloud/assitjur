#!/usr/bin/env node

/**
 * Node 22 Optimized Deploy Script
 * Complete build pipeline for AssistJur.IA
 */

import { spawn } from 'child_process';
import { existsSync, writeFileSync, mkdirSync, copyFileSync } from 'fs';
import { join } from 'path';

const runCommand = (command, args = [], options = {}) => {
  return new Promise((resolve, reject) => {
    console.log(`🔧 ${command} ${args.join(' ')}`);
    
    const proc = spawn(command, args, {
      stdio: 'inherit',
      shell: process.platform === 'win32',
      ...options
    });
    
    proc.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${command} completed`);
        resolve(true);
      } else {
        console.log(`❌ ${command} failed (code ${code})`);
        resolve(false);
      }
    });
    
    proc.on('error', (error) => {
      console.error(`💥 Error: ${error.message}`);
      reject(error);
    });
  });
};

const detectPackageManager = () => {
  if (existsSync('bun.lockb')) return 'bun';
  if (existsSync('pnpm-lock.yaml')) return 'pnpm';
  if (existsSync('yarn.lock')) return 'yarn';
  if (existsSync('package-lock.json')) return 'npm';
  return 'bun'; // Default for this project
};

const ensureDistStructure = () => {
  try {
    if (!existsSync('dist')) {
      mkdirSync('dist', { recursive: true });
    }

    // SPA fallback
    if (existsSync('dist/index.html') && !existsSync('dist/404.html')) {
      copyFileSync('dist/index.html', 'dist/404.html');
      console.log('✅ Created SPA fallback (404.html)');
    }

    return true;
  } catch (error) {
    console.error('❌ Error ensuring dist structure:', error.message);
    return false;
  }
};

const validateBuild = () => {
  const required = ['dist/index.html'];
  const missing = required.filter(file => !existsSync(file));
  
  if (missing.length > 0) {
    console.error('❌ Build validation failed. Missing files:', missing);
    return false;
  }
  
  console.log('✅ Build validation passed');
  return true;
};

async function main() {
  console.log('🚀 Node 22 Optimized Deploy Process...\n');
  
  try {
    const pm = detectPackageManager();
    console.log(`📦 Package manager: ${pm}`);
    
    // Step 1: Clean install
    console.log('\n📁 Step 1: Clean dependencies');
    if (existsSync('dist')) {
      await runCommand('rm', ['-rf', 'dist']);
    }
    
    if (pm === 'bun') {
      await runCommand('bun', ['install', '--force']);
    } else if (pm === 'npm') {
      await runCommand('npm', ['ci']);
    } else if (pm === 'pnpm') {
      await runCommand('pnpm', ['install', '--frozen-lockfile']);
    } else if (pm === 'yarn') {
      await runCommand('yarn', ['install', '--frozen-lockfile']);
    }
    
    // Step 2: TypeScript check
    console.log('\n🔍 Step 2: Type check');
    await runCommand('npx', ['tsc', '--noEmit']);
    
    // Step 3: Main build
    console.log('\n🏗️  Step 3: Vite build');
    const buildSuccess = await runCommand('npx', ['vite', 'build']);
    
    if (!buildSuccess) {
      console.error('❌ Main build failed');
      process.exit(1);
    }
    
    // Step 4: Post-build
    console.log('\n📦 Step 4: Post-build tasks');
    ensureDistStructure();
    
    // Step 5: Validation
    console.log('\n✅ Step 5: Validation');
    if (!validateBuild()) {
      process.exit(1);
    }
    
    console.log('\n🎉 Node 22 deploy process completed!');
    console.log('📁 Ready for deployment from dist/ directory');
    
  } catch (error) {
    console.error('💥 Deploy failed:', error.message);
    process.exit(1);
  }
}

main();