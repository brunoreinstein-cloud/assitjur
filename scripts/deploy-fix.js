#!/usr/bin/env node

/**
 * Emergency deploy script for Node 22 migration
 * Works around package.json JSON issues
 */

import { spawn } from 'child_process';
import { existsSync, writeFileSync, mkdirSync, copyFileSync } from 'fs';
import { join } from 'path';

const runCommand = (command, args = [], options = {}) => {
  return new Promise((resolve, reject) => {
    console.log(`🔧 Running: ${command} ${args.join(' ')}`);
    
    const proc = spawn(command, args, {
      stdio: 'inherit',
      shell: process.platform === 'win32',
      ...options
    });
    
    proc.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ Success: ${command}`);
        resolve(true);
      } else {
        console.log(`❌ Failed: ${command} (code ${code})`);
        resolve(false);
      }
    });
    
    proc.on('error', (error) => {
      console.error(`💥 Error: ${error.message}`);
      reject(error);
    });
  });
};

const ensureDistStructure = () => {
  try {
    if (!existsSync('dist')) {
      mkdirSync('dist', { recursive: true });
    }

    // Ensure 404.html exists for SPA fallback
    if (existsSync('dist/index.html') && !existsSync('dist/404.html')) {
      copyFileSync('dist/index.html', 'dist/404.html');
      console.log('✅ Created dist/404.html for SPA fallback');
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
  console.log('🚀 Starting emergency deploy process for Node 22...');
  
  try {
    // Step 1: Clean previous build
    console.log('\n📁 Step 1: Clean build');
    if (existsSync('dist')) {
      await runCommand('rm', ['-rf', 'dist']);
    }
    
    // Step 2: Type check (optional, don't fail if it errors)
    console.log('\n🔍 Step 2: Type check (optional)');
    await runCommand('npx', ['tsc', '--noEmit']);
    
    // Step 3: Main build
    console.log('\n🏗️  Step 3: Main build');
    const buildSuccess = await runCommand('npx', ['vite', 'build']);
    
    if (!buildSuccess) {
      console.error('❌ Main build failed - cannot proceed');
      process.exit(1);
    }
    
    // Step 4: Ensure proper dist structure
    console.log('\n📦 Step 4: Ensure dist structure');
    ensureDistStructure();
    
    // Step 5: Validate build
    console.log('\n✅ Step 5: Validate build');
    if (!validateBuild()) {
      process.exit(1);
    }
    
    console.log('\n🎉 Emergency build completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Fix package.json JSON syntax (remove lines 147-150, add proper engines field)');
    console.log('2. Set Node version to 22.x in Vercel Project Settings');
    console.log('3. Deploy with clean cache');
    
  } catch (error) {
    console.error('💥 Emergency deploy failed:', error.message);
    process.exit(1);
  }
}

main();