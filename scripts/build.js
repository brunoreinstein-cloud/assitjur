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

async function runBuild() {
  return await new Promise(resolve => {
    const proc = spawn('npx', ['vite', 'build'], { stdio: 'inherit' });
    proc.on('close', code => resolve(code === 0));
  });
}

async function writeStatus(success) {
  const timestamp = new Date().toISOString();
  await mkdir('dist', { recursive: true });
  await writeFile('dist/build-status.json', JSON.stringify({ timestamp, success }, null, 2));
}

(async () => {
  console.log('🚀 Starting clean build process...');
  await cleanDist();
  const success = await runBuild();
  await writeStatus(success);
  
  if (success) {
    console.log('✅ Build completed successfully');
  } else {
    console.log('❌ Build failed');
  }
  
  process.exit(success ? 0 : 1);
})();
