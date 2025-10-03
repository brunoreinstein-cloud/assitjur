/**
 * Componente de otimização para produção
 * Aplica otimizações críticas e limpeza de logs
 */

import { useEffect } from "react";
import { cleanConsoleInProduction } from "@/utils/production/logCleaner";
import { applyProductionOptimizations } from "@/utils/production/performanceOptimizer";
import { logger } from "@/lib/logger";

export const ProductionOptimizer = () => {
  useEffect(() => {
    if (import.meta.env.PROD) {
      try {
        // Aplica limpeza de console.logs
        cleanConsoleInProduction();

        // Aplica otimizações de performance
        applyProductionOptimizations();

        // Remove React DevTools em produção
        if (typeof window !== "undefined") {
          (
            window as unknown as { [key: string]: unknown }
          ).__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
            ...((window as unknown as { [key: string]: unknown })
              .__REACT_DEVTOOLS_GLOBAL_HOOK__ || {}),
            onCommitFiberRoot: () => {},
            onCommitFiberUnmount: () => {},
            isDisabled: true,
          };
        }

        // Remove Redux DevTools
        delete (window as unknown as { [key: string]: unknown })
          .__REDUX_DEVTOOLS_EXTENSION_COMPOSE__;
        delete (window as unknown as { [key: string]: unknown })
          .__REDUX_DEVTOOLS_EXTENSION__;

        logger.info(
          "Production optimizations initialized",
          {},
          "ProductionOptimizer",
        );
      } catch (error) {
        // Usa console.error diretamente para erros críticos
        console.error("Failed to initialize production optimizations:", error);
      }
    }
  }, []);

  return null;
};
