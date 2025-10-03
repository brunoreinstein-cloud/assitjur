/**
 * Sistema de limpeza de console.logs para produção
 * Remove logs desnecessários e substitui por logger estruturado
 */

import { logger } from "@/lib/logger";

type ConsoleMethod = "log" | "warn" | "info" | "debug";

interface LogCleanerConfig {
  enabledMethods: ConsoleMethod[];
  preserveErrors: boolean;
  structuredLogging: boolean;
}

class LogCleaner {
  private originalConsole: Record<ConsoleMethod, typeof console.log> = {
    log: console.log,
    warn: console.warn,
    info: console.info,
    debug: console.debug,
  };

  private config: LogCleanerConfig = {
    enabledMethods: [],
    preserveErrors: true,
    structuredLogging: true,
  };

  constructor(config?: Partial<LogCleanerConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  /**
   * Remove console.logs em produção, mantendo apenas logs estruturados
   */
  cleanProductionLogs() {
    if (!import.meta.env.PROD) {
      return; // Não limpa em desenvolvimento
    }

    // Substitui console.log por logger estruturado ou silencia
    console.log = (...args: any[]) => {
      if (this.config.structuredLogging) {
        logger.info("Legacy console.log usage", { args }, "LogCleaner");
      }
      // Silencia em produção
    };

    console.warn = (...args: any[]) => {
      if (this.config.structuredLogging) {
        logger.warn("Legacy console.warn usage", { args }, "LogCleaner");
      }
      // Silencia em produção
    };

    console.info = (...args: any[]) => {
      if (this.config.structuredLogging) {
        logger.info("Legacy console.info usage", { args }, "LogCleaner");
      }
      // Silencia em produção
    };

    console.debug = (...args: any[]) => {
      if (this.config.structuredLogging) {
        logger.debug("Legacy console.debug usage", { args }, "LogCleaner");
      }
      // Silencia em produção
    };

    // Mantém console.error sempre ativo para logs críticos
    // console.error permanece inalterado
  }

  /**
   * Restaura console original (útil para desenvolvimento)
   */
  restoreConsole() {
    Object.assign(console, this.originalConsole);
  }

  /**
   * Intercepta e estrutura logs legados
   */
  interceptLegacyLogs() {
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalInfo = console.info;

    console.log = (...args: any[]) => {
      if (import.meta.env.PROD) {
        logger.info("Intercepted console.log", { args }, "LegacyInterceptor");
      } else {
        originalLog(...args);
      }
    };

    console.warn = (...args: any[]) => {
      if (import.meta.env.PROD) {
        logger.warn("Intercepted console.warn", { args }, "LegacyInterceptor");
      } else {
        originalWarn(...args);
      }
    };

    console.info = (...args: any[]) => {
      if (import.meta.env.PROD) {
        logger.info("Intercepted console.info", { args }, "LegacyInterceptor");
      } else {
        originalInfo(...args);
      }
    };
  }
}

// Instância singleton
export const logCleaner = new LogCleaner({
  enabledMethods: [],
  preserveErrors: true,
  structuredLogging: true,
});

// Utilitários para migração gradual
export const cleanConsoleInProduction = () => {
  logCleaner.cleanProductionLogs();
};

export const interceptLegacyLogs = () => {
  logCleaner.interceptLegacyLogs();
};
