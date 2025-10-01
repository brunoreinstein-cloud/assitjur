#!/usr/bin/env node

/**
 * Clear Vite build cache to fix initialization errors
 */

import { existsSync, rmSync } from 'fs';
import { join } from 'path';

const cacheDirs = [
  'node_modules/.vite',
  'node_modules/.cache',
  '.vite',
  'dist'
];

console.log('🧹 Limpando cache do Vite...\n');

cacheDirs.forEach(dir => {
  const fullPath = join(process.cwd(), dir);
  if (existsSync(fullPath)) {
    try {
      rmSync(fullPath, { recursive: true, force: true });
      console.log(`✅ Removido: ${dir}`);
    } catch (error) {
      console.log(`⚠️  Erro ao remover ${dir}:`, error.message);
    }
  } else {
    console.log(`ℹ️  Não encontrado: ${dir}`);
  }
});

console.log('\n✨ Cache limpo! Execute `npm run dev` ou `npm run build` para reconstruir.');
