#!/usr/bin/env node

/**
 * Script para validar variáveis de ambiente antes do build
 * 
 * Uso:
 *   node scripts/validate-env.js
 * 
 * Exit codes:
 *   0 - Todas as variáveis válidas
 *   1 - Variáveis faltando ou inválidas
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

// Variáveis obrigatórias
const REQUIRED_VARS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
];

// Variáveis opcionais (apenas para documentação)
const OPTIONAL_VARS = [
  'VITE_SENTRY_DSN',
  'VITE_POSTHOG_KEY',
  'VITE_POSTHOG_HOST',
];

function loadEnvFile() {
  const envPath = join(process.cwd(), '.env');
  
  if (!existsSync(envPath)) {
    return {};
  }
  
  const envContent = readFileSync(envPath, 'utf-8');
  const env = {};
  
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key) {
        env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
      }
    }
  });
  
  return env;
}

function validateEnv() {
  console.log('🔍 Validando variáveis de ambiente...\n');
  
  // Carrega variáveis do .env (se existir)
  const envVars = loadEnvFile();
  
  // Combina com process.env
  const allVars = { ...envVars, ...process.env };
  
  const missing = [];
  const present = [];
  
  // Verifica obrigatórias
  REQUIRED_VARS.forEach(varName => {
    const value = allVars[varName];
    if (!value || value === '') {
      missing.push(varName);
    } else {
      present.push(varName);
    }
  });
  
  // Mostra resultado
  if (present.length > 0) {
    console.log('✅ Variáveis obrigatórias encontradas:');
    present.forEach(v => console.log(`   ${v}`));
    console.log();
  }
  
  if (missing.length > 0) {
    console.error('❌ Variáveis obrigatórias faltando:');
    missing.forEach(v => console.error(`   ${v}`));
    console.error();
    console.error('📝 Crie um arquivo .env na raiz do projeto com as variáveis necessárias.');
    console.error('📖 Consulte .env.example para referência.\n');
    process.exit(1);
  }
  
  // Mostra opcionais disponíveis
  const optionalPresent = OPTIONAL_VARS.filter(v => allVars[v]);
  if (optionalPresent.length > 0) {
    console.log('ℹ️  Variáveis opcionais configuradas:');
    optionalPresent.forEach(v => console.log(`   ${v}`));
    console.log();
  }
  
  console.log('✅ Todas as variáveis de ambiente válidas!\n');
}

// Executa validação
try {
  validateEnv();
} catch (error) {
  console.error('❌ Erro ao validar variáveis de ambiente:', error.message);
  process.exit(1);
}
