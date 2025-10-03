/**
 * Otimizações de performance para produção
 * Implementa melhorias críticas para build de produção
 */

import { logger } from "@/lib/logger";

interface PerformanceConfig {
  enableResourceHints: boolean;
  enableServiceWorker: boolean;
  enableCriticalResourcePrefetch: boolean;
  enableMemoryOptimization: boolean;
}

class PerformanceOptimizer {
  private config: PerformanceConfig = {
    enableResourceHints: true,
    enableServiceWorker: true,
    enableCriticalResourcePrefetch: true,
    enableMemoryOptimization: true,
  };

  constructor(config?: Partial<PerformanceConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  /**
   * Aplica otimizações de performance para produção
   */
  optimize() {
    if (!import.meta.env.PROD) {
      return; // Apenas em produção
    }

    try {
      this.addResourceHints();
      this.enableCriticalResourcePrefetch();
      this.setupMemoryOptimization();
      this.registerServiceWorker();

      logger.info(
        "Performance optimizations applied successfully",
        {},
        "PerformanceOptimizer",
      );
    } catch (error) {
      logger.error(
        "Failed to apply performance optimizations",
        { error },
        "PerformanceOptimizer",
      );
    }
  }

  /**
   * Adiciona resource hints para melhor carregamento
   */
  private addResourceHints() {
    if (!this.config.enableResourceHints) return;

    const head = document.head;

    // DNS prefetch para domínios críticos
    const dnsPrefetchDomains = [
      "https://fgjypmlszuzkgvhuszxn.supabase.co",
      "https://fonts.googleapis.com",
      "https://fonts.gstatic.com",
    ];

    dnsPrefetchDomains.forEach((domain) => {
      const link = document.createElement("link");
      link.rel = "dns-prefetch";
      link.href = domain;
      head.appendChild(link);
    });

    // Preconnect para recursos críticos
    const preconnectUrls = ["https://fgjypmlszuzkgvhuszxn.supabase.co"];

    preconnectUrls.forEach((url) => {
      const link = document.createElement("link");
      link.rel = "preconnect";
      link.href = url;
      link.crossOrigin = "anonymous";
      head.appendChild(link);
    });
  }

  /**
   * Prefetch de recursos críticos
   */
  private enableCriticalResourcePrefetch() {
    if (!this.config.enableCriticalResourcePrefetch) return;

    // Prefetch de rotas críticas em idle time
    if ("requestIdleCallback" in window) {
      requestIdleCallback(() => {
        const criticalRoutes = ["/mapa", "/admin", "/dashboard"];

        criticalRoutes.forEach((route) => {
          const link = document.createElement("link");
          link.rel = "prefetch";
          link.href = route;
          document.head.appendChild(link);
        });
      });
    }
  }

  /**
   * Configurações de otimização de memória
   */
  private setupMemoryOptimization() {
    if (!this.config.enableMemoryOptimization) return;

    // Garbage collection agressivo em produção
    if ("gc" in window && typeof (window as any).gc === "function") {
      // Executa GC em idle time
      if ("requestIdleCallback" in window) {
        requestIdleCallback(() => {
          try {
            (window as any).gc();
          } catch (e) {
            // Silently handle GC failures
          }
        });
      }
    }

    // Cleanup de event listeners não utilizados
    window.addEventListener("beforeunload", () => {
      // Remove todos os event listeners de performance monitoring
      performance.clearMarks();
      performance.clearMeasures();
    });
  }

  /**
   * Registra Service Worker para cache
   */
  private registerServiceWorker() {
    if (!this.config.enableServiceWorker || !("serviceWorker" in navigator)) {
      return;
    }

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        logger.info(
          "Service Worker registered successfully",
          {
            scope: registration.scope,
          },
          "PerformanceOptimizer",
        );
      })
      .catch((error) => {
        logger.warn(
          "Service Worker registration failed",
          { error },
          "PerformanceOptimizer",
        );
      });
  }

  /**
   * Monitora performance crítica
   */
  monitorCriticalMetrics() {
    if (!import.meta.env.PROD) return;

    // Performance monitoring básico e seguro
    try {
      // Monitora métricas básicas de performance
      window.addEventListener("load", () => {
        // Performance timing básico
        const perfData = performance.timing;
        if (perfData) {
          const loadTime = perfData.loadEventEnd - perfData.navigationStart;
          const domContentLoaded =
            perfData.domContentLoadedEventEnd - perfData.navigationStart;
          const firstByte = perfData.responseStart - perfData.navigationStart;

          logger.info(
            "Performance metrics",
            {
              loadTime,
              domContentLoaded,
              firstByte,
            },
            "WebVitals",
          );
        }

        // Resource timing
        const resources = performance.getEntriesByType("resource");
        const slowResources = resources.filter(
          (resource: any) => resource.duration > 1000,
        );

        if (slowResources.length > 0) {
          logger.warn(
            "Slow resources detected",
            {
              count: slowResources.length,
              resources: slowResources.slice(0, 5).map((r: any) => ({
                name: r.name,
                duration: r.duration,
              })),
            },
            "WebVitals",
          );
        }
      });

      // Performance observer para entrada do usuário (quando disponível)
      if ("PerformanceObserver" in window) {
        try {
          const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
              if (entry.entryType === "measure") {
                logger.info(
                  "Custom performance measure",
                  {
                    name: entry.name,
                    duration: entry.duration,
                  },
                  "WebVitals",
                );
              }
            });
          });

          observer.observe({ entryTypes: ["measure"] });
        } catch (error) {
          // Performance Observer não suportado ou falhou
        }
      }
    } catch (error) {
      logger.warn(
        "Performance monitoring setup failed",
        { error },
        "PerformanceOptimizer",
      );
    }
  }
}

// Instância singleton
export const performanceOptimizer = new PerformanceOptimizer();

// Utilitários para aplicação imediata
export const applyProductionOptimizations = () => {
  performanceOptimizer.optimize();
  performanceOptimizer.monitorCriticalMetrics();
};
