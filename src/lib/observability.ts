/**
 * Sistema de observabilidade unificado para frontend
 * Consolida métricas, logging e monitoramento em desenvolvimento e produção
 */

import { logger } from "@/lib/logger";

// Tipos para métricas
interface Metric {
  name: string;
  value: number;
  labels?: Record<string, string>;
  timestamp: Date;
}

interface PerformanceMetric extends Metric {
  type: "performance";
  duration: number;
}

interface ErrorMetric extends Metric {
  type: "error";
  error: string;
  category: string;
}

class ObservabilityManager {
  private metrics: Metric[] = [];
  private isProduction = import.meta.env.PROD;

  // Performance tracking
  startTiming(name: string, labels?: Record<string, string>) {
    const start = performance.now();

    return {
      end: () => {
        const duration = performance.now() - start;
        this.recordMetric({
          name,
          value: duration,
          labels: { ...labels, type: "timing" },
          timestamp: new Date(),
          type: "performance",
          duration,
        } as PerformanceMetric);

        // Log em desenvolvimento
        if (!this.isProduction) {
          logger.debug(
            `⏱️ ${name} completed`,
            { duration, labels },
            "Performance",
          );
        }
      },
    };
  }

  // Error tracking
  recordError(
    error: Error | string,
    category: string,
    labels?: Record<string, string>,
  ) {
    const errorMessage = typeof error === "string" ? error : error.message;

    this.recordMetric({
      name: "error_occurred",
      value: 1,
      labels: { ...labels, category },
      timestamp: new Date(),
      type: "error",
      error: errorMessage,
      category,
    } as ErrorMetric);

    logger.error(
      "Error tracked",
      {
        error: errorMessage,
        category,
        labels,
      },
      "Observability",
    );
  }

  // User action tracking
  recordUserAction(action: string, labels?: Record<string, string>) {
    this.recordMetric({
      name: "user_action",
      value: 1,
      labels: { ...labels, action },
      timestamp: new Date(),
    });

    logger.info("User action tracked", { action, labels }, "UserTracking");
  }

  // API call tracking
  trackApiCall(
    endpoint: string,
    method: string,
    status: number,
    duration: number,
  ) {
    this.recordMetric({
      name: "api_call",
      value: 1,
      labels: { endpoint, method, status: status.toString() },
      timestamp: new Date(),
    });

    this.recordMetric({
      name: "api_duration",
      value: duration,
      labels: { endpoint, method },
      timestamp: new Date(),
    });

    if (!this.isProduction) {
      logger.info(
        "API call tracked",
        { endpoint, method, status, duration },
        "API",
      );
    }
  }

  private recordMetric(metric: Metric) {
    this.metrics.push(metric);

    // Em produção, enviar para serviço externo se configurado
    if (this.isProduction) {
      this.sendToExternalService(metric);
    }

    // Limpar métricas antigas (manter apenas últimos 1000 registros)
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  private sendToExternalService(metric: Metric) {
    // Placeholder para integração com serviços de métricas
    // Ex: DataDog, NewRelic, Sentry, etc.
    // Esta implementação será expandida conforme necessário
  }

  // Obter estatísticas das métricas
  getMetricsSummary(timeWindow = 5 * 60 * 1000) {
    // 5 minutos por padrão
    const now = new Date();
    const windowStart = new Date(now.getTime() - timeWindow);

    const recentMetrics = this.metrics.filter(
      (m) => m.timestamp >= windowStart,
    );

    const summary = {
      totalMetrics: recentMetrics.length,
      errors: recentMetrics.filter((m) => m.name === "error_occurred").length,
      apiCalls: recentMetrics.filter((m) => m.name === "api_call").length,
      userActions: recentMetrics.filter((m) => m.name === "user_action").length,
      averageApiDuration: this.calculateAverageApiDuration(recentMetrics),
      topErrors: this.getTopErrors(recentMetrics),
    };

    return summary;
  }

  private calculateAverageApiDuration(metrics: Metric[]): number {
    const durations = metrics
      .filter((m) => m.name === "api_duration")
      .map((m) => m.value);

    return durations.length > 0
      ? durations.reduce((sum, d) => sum + d, 0) / durations.length
      : 0;
  }

  private getTopErrors(
    metrics: Metric[],
  ): Array<{ error: string; count: number }> {
    const errorCounts = new Map<string, number>();

    metrics
      .filter((m) => m.name === "error_occurred")
      .forEach((m) => {
        const errorKey = (m as ErrorMetric).error;
        errorCounts.set(errorKey, (errorCounts.get(errorKey) || 0) + 1);
      });

    return Array.from(errorCounts.entries())
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }
}

// Instância singleton
export const observability = new ObservabilityManager();

// Wrapper para instrumentação automática de funções
export function instrumented<T extends (...args: any[]) => any>(
  fn: T,
  name: string,
  category = "function",
): T {
  return ((...args: any[]) => {
    const timer = observability.startTiming(name, { category });

    try {
      const result = fn(...args);

      // Se é uma Promise, instrumentar async
      if (result instanceof Promise) {
        return result
          .then((res) => {
            timer.end();
            return res;
          })
          .catch((err) => {
            timer.end();
            observability.recordError(err, category);
            throw err;
          });
      }

      timer.end();
      return result;
    } catch (error) {
      timer.end();
      observability.recordError(error as Error, category);
      throw error;
    }
  }) as T;
}

// Hook para componentes React
export function useObservability(componentName: string) {
  const recordRender = () => {
    observability.recordUserAction("component_render", {
      component: componentName,
    });
  };

  const recordInteraction = (
    action: string,
    details?: Record<string, string>,
  ) => {
    observability.recordUserAction("user_interaction", {
      component: componentName,
      action,
      ...details,
    });
  };

  const recordError = (error: Error | string) => {
    observability.recordError(error, "component", { component: componentName });
  };

  return {
    recordRender,
    recordInteraction,
    recordError,
    getMetrics: () => observability.getMetricsSummary(),
  };
}
