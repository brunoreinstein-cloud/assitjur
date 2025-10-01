#!/usr/bin/env node

/**
 * Limpeza agressiva de cache para forçar rebuild completo
 * Inclui: Vite, TypeScript, Node modules, Edge Functions
 */

import { existsSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const cacheDirs = [
  'node_modules/.vite',
  'node_modules/.cache',
  'node_modules/.tmp',
  '.vite',
  'dist',
  '.turbo',
  '.next',
  '.swc',
  'tsconfig.tsbuildinfo',
];

console.log('🔥 LIMPEZA AGRESSIVA DE CACHE INICIADA...\n');
console.log('Esta operação vai limpar TODOS os caches do projeto.\n');

// 1. Limpar diretórios de cache
console.log('📁 Limpando diretórios de cache...');
cacheDirs.forEach(dir => {
  const fullPath = join(process.cwd(), dir);
  if (existsSync(fullPath)) {
    try {
      rmSync(fullPath, { recursive: true, force: true });
      console.log(`  ✅ Removido: ${dir}`);
    } catch (error) {
      console.log(`  ⚠️  Erro ao remover ${dir}:`, error.message);
    }
  } else {
    console.log(`  ⏭️  Não encontrado: ${dir}`);
  }
});

// 2. Limpar cache do npm/pnpm/yarn
console.log('\n📦 Limpando cache de gerenciadores de pacotes...');
try {
  execSync('npm cache clean --force', { stdio: 'inherit' });
  console.log('  ✅ Cache do npm limpo');
} catch (error) {
  console.log('  ⚠️  Erro ao limpar cache do npm');
}

// 3. Criar marker file para forçar rebuild de Edge Functions
console.log('\n⚡ Criando marker para rebuild de Edge Functions...');
const markerPath = join(process.cwd(), 'supabase', 'functions', '.force-rebuild');
try {
  writeFileSync(markerPath, `Rebuild forçado em: ${new Date().toISOString()}`);
  console.log('  ✅ Marker criado para forçar rebuild');
} catch (error) {
  console.log('  ⚠️  Erro ao criar marker:', error.message);
}

// 4. Instruções finais
console.log('\n✨ LIMPEZA CONCLUÍDA!\n');
console.log('📋 PRÓXIMOS PASSOS:');
console.log('  1. Execute: npm install (para garantir integridade dos pacotes)');
console.log('  2. Execute: npm run dev (para rebuild completo)');
console.log('  3. Aguarde o build finalizar antes de testar');
console.log('\n🔍 VERIFICAÇÃO:');
console.log('  - Console de dev: verifique se há logs "[DEBUG]" nas Edge Functions');
console.log('  - Network tab: verifique se as RPCs retornam dados com "confidence"');
console.log('  - UI: busque por "FABIANO CELESTINO" e verifique os campos\n');
