import { spawn } from 'child_process';
import { mkdir, writeFile } from 'fs/promises';

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
  const success = await runBuild();
  await writeStatus(success);
  process.exit(success ? 0 : 1);
})();
