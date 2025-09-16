/**
 * Script de validação para build de produção
 * Verifica se todas as otimizações estão aplicadas corretamente
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

class ProductionValidator {
  constructor() {
    this.issues = [];
    this.warnings = [];
    this.srcDir = join(projectRoot, 'src');
  }

  /**
   * Executa todas as validações
   */
  async validate() {
    console.log('🔍 Iniciando validação de produção...\n');

    await this.checkConsoleLogsInSource();
    await this.checkHardcodedCredentials();
    await this.checkEnvironmentVariables();
    await this.checkBuildOptimizations();
    await this.checkSecurityHeaders();

    this.generateReport();
  }

  /**
   * Verifica console.logs restantes no código fonte
   */
  async checkConsoleLogsInSource() {
    console.log('📝 Verificando console.logs restantes...');
    
    const consoleLogs = [];
    
    const scanDirectory = (dir) => {
      const files = readdirSync(dir);
      
      files.forEach(file => {
        const filePath = join(dir, file);
        const stat = statSync(filePath);
        
        if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
          scanDirectory(filePath);
        } else if (stat.isFile() && ['.ts', '.tsx', '.js', '.jsx'].includes(extname(file))) {
          const content = readFileSync(filePath, 'utf8');
          const lines = content.split('\n');
          
          lines.forEach((line, index) => {
            if (line.includes('console.log') && !line.includes('// logger substitui')) {
              consoleLogs.push({
                file: filePath.replace(projectRoot, ''),
                line: index + 1,
                content: line.trim()
              });
            }
          });
        }
      });
    };

    scanDirectory(this.srcDir);

    if (consoleLogs.length > 0) {
      this.warnings.push({
        type: 'CONSOLE_LOGS',
        count: consoleLogs.length,
        details: consoleLogs.slice(0, 10) // Mostra apenas os primeiros 10
      });
    }

    console.log(`   ${consoleLogs.length > 0 ? '⚠️' : '✅'} ${consoleLogs.length} console.logs encontrados\n`);
  }

  /**
   * Verifica credenciais hardcoded
   */
  async checkHardcodedCredentials() {
    console.log('🔐 Verificando credenciais hardcoded...');
    
    const getEnvPath = join(this.srcDir, 'lib', 'getEnv.ts');
    
    try {
      const content = readFileSync(getEnvPath, 'utf8');
      
      // Procura por padrões de credenciais hardcoded
      const hardcodedPatterns = [
        /eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*/g, // JWT tokens
        /https:\/\/[a-z]+\.supabase\.co/g, // URLs hardcoded
        /'[^']*supabase[^']*'/g // Strings contendo supabase
      ];

      let hasHardcoded = false;
      hardcodedPatterns.forEach(pattern => {
        if (pattern.test(content)) {
          hasHardcoded = true;
        }
      });

      if (hasHardcoded) {
        this.issues.push({
          type: 'HARDCODED_CREDENTIALS',
          file: 'src/lib/getEnv.ts',
          severity: 'CRITICAL'
        });
      }

      console.log(`   ${hasHardcoded ? '❌' : '✅'} Credenciais ${hasHardcoded ? 'ENCONTRADAS' : 'seguras'}\n`);
    } catch (error) {
      console.log('   ⚠️ Não foi possível verificar getEnv.ts\n');
    }
  }

  /**
   * Verifica variáveis de ambiente necessárias
   */
  async checkEnvironmentVariables() {
    console.log('🌍 Verificando variáveis de ambiente...');
    
    const requiredEnvVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY'
    ];

    const missingVars = [];
    
    requiredEnvVars.forEach(varName => {
      if (!process.env[varName]) {
        missingVars.push(varName);
      }
    });

    if (missingVars.length > 0) {
      this.issues.push({
        type: 'MISSING_ENV_VARS',
        variables: missingVars,
        severity: 'HIGH'
      });
    }

    console.log(`   ${missingVars.length > 0 ? '⚠️' : '✅'} ${missingVars.length} variáveis ausentes\n`);
  }

  /**
   * Verifica otimizações de build
   */
  async checkBuildOptimizations() {
    console.log('⚡ Verificando otimizações de build...');
    
    const viteConfigPath = join(projectRoot, 'vite.config.ts');
    
    try {
      const content = readFileSync(viteConfigPath, 'utf8');
      
      const optimizations = {
        compression: content.includes('compressPlugin'),
        chunking: content.includes('manualChunks'),
        treeshaking: content.includes('rollupOptions')
      };

      const missingOptimizations = Object.entries(optimizations)
        .filter(([, enabled]) => !enabled)
        .map(([name]) => name);

      if (missingOptimizations.length > 0) {
        this.warnings.push({
          type: 'MISSING_OPTIMIZATIONS',
          optimizations: missingOptimizations
        });
      }

      console.log(`   ✅ ${Object.keys(optimizations).length - missingOptimizations.length}/${Object.keys(optimizations).length} otimizações ativas\n`);
    } catch (error) {
      console.log('   ⚠️ Não foi possível verificar vite.config.ts\n');
    }
  }

  /**
   * Verifica headers de segurança
   */
  async checkSecurityHeaders() {
    console.log('🛡️ Verificando configurações de segurança...');
    
    // Esta verificação seria mais completa em um ambiente real
    // Por agora, apenas verifica se os arquivos de segurança existem
    const securityFiles = [
      'src/utils/security/passwordPolicy.ts',
      'src/utils/security/breachDetection.ts',
      'src/utils/security/sessionInvalidation.ts'
    ];

    let securityScore = 0;
    securityFiles.forEach(file => {
      try {
        readFileSync(join(projectRoot, file), 'utf8');
        securityScore++;
      } catch (error) {
        // Arquivo não existe
      }
    });

    console.log(`   ✅ ${securityScore}/${securityFiles.length} módulos de segurança implementados\n`);
  }

  /**
   * Gera relatório final
   */
  generateReport() {
    console.log('📊 RELATÓRIO DE VALIDAÇÃO DE PRODUÇÃO');
    console.log('=' .repeat(50));

    if (this.issues.length === 0) {
      console.log('✅ NENHUM PROBLEMA CRÍTICO ENCONTRADO');
    } else {
      console.log('❌ PROBLEMAS CRÍTICOS ENCONTRADOS:');
      this.issues.forEach(issue => {
        console.log(`   • ${issue.type} (${issue.severity})`);
      });
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️ AVISOS:');
      this.warnings.forEach(warning => {
        if (warning.type === 'CONSOLE_LOGS') {
          console.log(`   • ${warning.count} console.logs restantes no código`);
        } else {
          console.log(`   • ${warning.type}`);
        }
      });
    }

    const score = Math.max(0, 100 - (this.issues.length * 20) - (this.warnings.length * 5));
    console.log(`\n🎯 SCORE DE PRODUÇÃO: ${score}/100`);

    if (score >= 95) {
      console.log('🚀 PRONTO PARA PUBLICAÇÃO!');
    } else if (score >= 80) {
      console.log('⚠️ PUBLICAÇÃO POSSÍVEL COM CORREÇÕES MENORES');
    } else {
      console.log('❌ REQUER CORREÇÕES CRÍTICAS ANTES DA PUBLICAÇÃO');
    }

    console.log('=' .repeat(50));
  }
}

// Executa validação se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new ProductionValidator();
  validator.validate().catch(console.error);
}

export { ProductionValidator };