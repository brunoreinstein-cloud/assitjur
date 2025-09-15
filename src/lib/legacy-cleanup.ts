/**
 * Sistema de limpeza de código legacy e otimização para produção
 * Consolida funcionalidades de limpeza e remove código desnecessário
 */

import { logger } from '@/lib/logger';

// Lista de funções e padrões deprecados para alertar desenvolvedores
const DEPRECATED_PATTERNS = [
  'console.log',
  'console.warn', 
  'console.error',
  'devLog',
  'devWarn',
  'devError'
];

// Remove logs de desenvolvimento em produção
export class ProductionOptimizer {
  private isProduction = import.meta.env.PROD;
  
  constructor() {
    if (this.isProduction) {
      this.optimizeForProduction();
    }
  }

  private optimizeForProduction() {
    // Preserva apenas logs críticos através do sistema centralizado
    const originalConsole = {
      log: console.log,
      warn: console.warn,
      info: console.info,
      debug: console.debug
    };

    // Remove logs não críticos em produção
    console.log = () => {};
    console.warn = () => {};
    console.info = () => {};
    console.debug = () => {};
    
    // Mantém console.error para erros críticos (será capturado pelo sistema centralizado)
    // console.error permanece ativo para emergências
    
    logger.info('Production optimization applied', {
      logsRemoved: ['log', 'warn', 'info', 'debug'],
      systemPreserved: ['error', 'centralizedLogger']
    }, 'ProductionOptimizer');
  }

  // Detecta uso de padrões deprecados (apenas em desenvolvimento)
  static checkDeprecatedUsage(codeString: string): string[] {
    if (import.meta.env.PROD) return [];
    
    const issues: string[] = [];
    
    DEPRECATED_PATTERNS.forEach(pattern => {
      const regex = new RegExp(`\\b${pattern}\\b`, 'g');
      const matches = codeString.match(regex);
      if (matches) {
        issues.push(`Uso deprecado de '${pattern}' encontrado ${matches.length} vezes`);
      }
    });
    
    return issues;
  }
}

// Wrapper para migrations graduais
export function migrateToNewErrorSystem(legacyErrorHandler: Function) {
  logger.warn('Legacy error handler detected, migrating to new system', {
    handlerName: legacyErrorHandler.name
  }, 'LegacyCleanup');
  
  // Retorna função que usa o novo sistema
  return (error: unknown, context?: string) => {
    logger.error('Legacy error migrated', {
      originalError: error,
      context,
      migration: true
    }, context || 'LegacyMigration');
  };
}

// Remove formatters duplicados e consolida em um local
export const UNIFIED_FORMATTERS = {
  // CNJ formatting
  formatCNJ: (cnj: string | null | undefined): string => {
    if (!cnj) return '';
    const clean = cnj.replace(/\D/g, '');
    if (clean.length !== 20) return cnj;
    return clean.replace(/(\d{7})(\d{2})(\d{4})(\d{1})(\d{2})(\d{4})/, '$1-$2.$3.$4.$5.$6');
  },

  // Currency formatting
  formatCurrency: (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  },

  // Date formatting
  formatDate: (date: string | Date): string => {
    return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
  },

  // File size formatting
  formatFileSize: (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
};

// Inicializar otimização em produção
if (typeof window !== 'undefined') {
  new ProductionOptimizer();
}