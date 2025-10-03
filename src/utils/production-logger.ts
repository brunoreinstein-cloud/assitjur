/**
 * Utilitário para substituir console.log em produção - DEPRECADO
 * Use o sistema centralizado de logging em @/lib/logger
 * @deprecated Este arquivo está marcado para remoção. Use @/lib/error-handling e @/lib/logger
 */

import { logger } from "@/lib/logger";

const isDev = !import.meta.env.PROD;

// DEPRECADOS - usar logger centralizado
/** @deprecated Use logger.info() */
export const devLog = (...args: any[]) => {
  if (isDev) {
    logger.info("Legacy devLog usage", { args }, "DeprecatedLogger");
  }
};

/** @deprecated Use logger.warn() */
export const devWarn = (...args: any[]) => {
  if (isDev) {
    logger.warn("Legacy devWarn usage", { args }, "DeprecatedLogger");
  }
};

/** @deprecated Use logger.error() */
export const devError = (...args: any[]) => {
  if (isDev) {
    logger.error("Legacy devError usage", { args }, "DeprecatedLogger");
  }
};

// Mantém logs críticos mesmo em produção - MIGRAR PARA SISTEMA CENTRALIZADO
/** @deprecated Use logger.info() com contexto de produção */
export const prodLog = (...args: any[]) => {
  logger.info("Legacy prodLog usage", { args }, "DeprecatedProdLogger");
};

/** @deprecated Use logger.error() */
export const prodError = (...args: any[]) => {
  logger.error("Legacy prodError usage", { args }, "DeprecatedProdLogger");
};
