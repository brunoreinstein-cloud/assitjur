/**
 * Utilities de teste e prevenção de regressões
 * Sistema automatizado para detectar problemas em desenvolvimento
 */

import { logger } from "@/lib/logger";
import { ErrorHandler, createError } from "@/lib/error-handling";
import { observability } from "@/lib/observability";
import {
  ObservabilityMetrics,
  isObservabilityMetrics,
} from "@/types/observability";

// Tipos para testes automatizados
interface TestCase {
  name: string;
  test: () => Promise<boolean> | boolean;
  category: "validation" | "api" | "ui" | "business";
  critical?: boolean;
}

export interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
  category: string;
}

// Sistema de detecção de regressões
export class RegressionDetector {
  private testCases: TestCase[] = [];
  private isDev = !import.meta.env.PROD;

  // Registrar casos de teste automáticos
  registerTest(testCase: TestCase) {
    if (!this.isDev) return; // Apenas em desenvolvimento

    this.testCases.push(testCase);
    logger.info(
      "Test case registered",
      {
        name: testCase.name,
        category: testCase.category,
      },
      "RegressionDetector",
    );
  }

  // Executar todos os testes
  async runAllTests(): Promise<TestResult[]> {
    if (!this.isDev) return [];

    logger.info(
      "Running regression tests",
      {
        totalTests: this.testCases.length,
      },
      "RegressionDetector",
    );

    const results: TestResult[] = [];

    for (const testCase of this.testCases) {
      const timer = observability.startTiming("regression_test", {
        testName: testCase.name,
        category: testCase.category,
      });

      try {
        const start = performance.now();
        const passed = await testCase.test();
        const duration = performance.now() - start;

        results.push({
          name: testCase.name,
          passed,
          duration,
          category: testCase.category,
        });

        if (!passed && testCase.critical) {
          logger.error(
            "Critical test failed",
            {
              testName: testCase.name,
              category: testCase.category,
            },
            "RegressionDetector",
          );
        }
      } catch (error) {
        const duration = performance.now();
        results.push({
          name: testCase.name,
          passed: false,
          error: error instanceof Error ? error.message : String(error),
          duration,
          category: testCase.category,
        });

        observability.recordError(error as Error, "test_execution");
      } finally {
        timer.end();
      }
    }

    // Relatório de resultados
    const summary = this.generateTestSummary(results);
    logger.info("Regression tests completed", summary, "RegressionDetector");

    return results;
  }

  private generateTestSummary(results: TestResult[]) {
    const total = results.length;
    const passed = results.filter((r) => r.passed).length;
    const failed = total - passed;
    const criticalFailures = results.filter(
      (r) =>
        !r.passed && this.testCases.find((t) => t.name === r.name)?.critical,
    ).length;

    return {
      total,
      passed,
      failed,
      criticalFailures,
      categories: results.reduce(
        (acc, r) => {
          acc[r.category] = (acc[r.category] || 0) + (r.passed ? 1 : 0);
          return acc;
        },
        {} as Record<string, number>,
      ),
    };
  }
}

// Validadores automáticos específicos do domínio
export const DomainValidators = {
  // Validação de CNJ
  validateCNJFormat: (cnj: string): boolean => {
    const cleaned = cnj.replace(/\D/g, "");
    return cleaned.length === 20 && /^\d{20}$/.test(cleaned);
  },

  // Validação de organização
  validateOrgId: (orgId: string | null | undefined): boolean => {
    return typeof orgId === "string" && orgId.length > 0;
  },

  // Validação de dados de processo
  validateProcessoData: (processo: unknown): boolean => {
    if (!processo || typeof processo !== "object") {
      return false;
    }

    const candidate = processo as Record<string, unknown>;

    return (
      typeof candidate.cnj === "string" &&
      typeof candidate.reclamante_nome === "string" &&
      typeof candidate.reu_nome === "string" &&
      DomainValidators.validateCNJFormat(candidate.cnj)
    );
  },

  // Validação de resposta de API
  validateApiResponse: (
    response: unknown,
    expectedFields: string[],
  ): boolean => {
    if (!response || typeof response !== "object") return false;

    const data = response as Record<string, unknown>;

    return expectedFields.every(
      (field) =>
        Object.prototype.hasOwnProperty.call(data, field) &&
        data[field] !== undefined,
    );
  },
};

// Monitor de performance em tempo real
export class PerformanceMonitor {
  private thresholds = {
    apiCallDuration: 5000, // 5s
    componentRenderTime: 100, // 100ms
    memoryUsage: 50 * 1024 * 1024, // 50MB
    errorRate: 0.05, // 5%
  };

  // Monitorar chamada de API
  monitorApiCall<T>(
    operation: () => Promise<T>,
    endpoint: string,
    options?: { timeout?: number },
  ): Promise<T> {
    const timeout = options?.timeout || this.thresholds.apiCallDuration;

    return new Promise((resolve, reject) => {
      const timer = observability.startTiming("api_call_monitored", {
        endpoint,
      });
      const timeoutId = setTimeout(() => {
        timer.end();
        observability.recordError("API timeout", "performance");
        reject(createError.network(`API timeout: ${endpoint}`, false));
      }, timeout);

      operation()
        .then((result) => {
          clearTimeout(timeoutId);
          timer.end();
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          timer.end();
          observability.recordError(error, "api");
          reject(error);
        });
    });
  }

  // Monitorar uso de memória
  checkMemoryUsage(): { usage: number; warning: boolean } {
    // Type guard para performance.memory (disponível apenas no Chrome)
    const performanceWithMemory = performance as Performance & {
      memory?: {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
      };
    };

    if (!performanceWithMemory.memory) {
      return { usage: 0, warning: false };
    }

    const usage = performanceWithMemory.memory.usedJSHeapSize;
    const warning = usage > this.thresholds.memoryUsage;

    if (warning) {
      logger.warn(
        "High memory usage detected",
        {
          usage: Math.round(usage / 1024 / 1024) + "MB",
          threshold:
            Math.round(this.thresholds.memoryUsage / 1024 / 1024) + "MB",
        },
        "PerformanceMonitor",
      );
    }

    return { usage, warning };
  }

  // Alertas automáticos para desenvolvedores
  setupDevelopmentAlerts() {
    if (!import.meta.env.DEV) return;

    // Verificação periódica de memória
    setInterval(() => {
      this.checkMemoryUsage();
    }, 30000); // A cada 30 segundos

    // Monitor de erros em tempo real
    window.addEventListener("error", (event) => {
      observability.recordError(event.error, "runtime");
      logger.error(
        "Runtime error detected",
        {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
        "PerformanceMonitor",
      );
    });

    // Monitor de promises rejeitadas
    window.addEventListener("unhandledrejection", (event) => {
      observability.recordError(event.reason, "promise_rejection");
      logger.error(
        "Unhandled promise rejection",
        {
          reason: event.reason,
        },
        "PerformanceMonitor",
      );
    });
  }
}

// Instâncias singleton
export const regressionDetector = new RegressionDetector();
export const performanceMonitor = new PerformanceMonitor();

// Registrar testes automáticos comuns
regressionDetector.registerTest({
  name: "CNJ Validation Function",
  category: "validation",
  critical: true,
  test: () => {
    const validCNJ = "12345678901234567890";
    const invalidCNJ = "123456789";

    return (
      DomainValidators.validateCNJFormat(validCNJ) === true &&
      DomainValidators.validateCNJFormat(invalidCNJ) === false
    );
  },
});

regressionDetector.registerTest({
  name: "Error Handler System",
  category: "business",
  critical: true,
  test: () => {
    try {
      const error = createError.validation("Test error");
      const handled = ErrorHandler.handle(error);
      return (
        handled.category === "validation" && handled.message === "Test error"
      );
    } catch {
      return false;
    }
  },
});

// Configurar alertas em desenvolvimento
if (typeof window !== "undefined") {
  performanceMonitor.setupDevelopmentAlerts();
}

// Utilitários para testes manuais
export const TestUtils = {
  // Simular erro para teste
  simulateError: (type: "network" | "validation" | "business") => {
    switch (type) {
      case "network":
        throw createError.network("Simulated network error");
      case "validation":
        throw createError.validation("Simulated validation error");
      case "business":
        throw createError.business("Simulated business error");
    }
  },

  // Verificar integridade do sistema
  healthCheck: async () => {
    const results = await regressionDetector.runAllTests();
    const memoryCheck = performanceMonitor.checkMemoryUsage();
    const rawMetrics = observability.getMetricsSummary();
    const metrics: ObservabilityMetrics = isObservabilityMetrics(rawMetrics)
      ? rawMetrics
      : {
          totalMetrics: 0,
          errors: 0,
          apiCalls: 0,
          userActions: 0,
          averageApiDuration: 0,
          topErrors: [],
        };

    if (!isObservabilityMetrics(rawMetrics)) {
      logger.warn(
        "Unexpected metrics summary format",
        { rawMetrics },
        "TestUtils",
      );
    }

    return {
      tests: results,
      memory: memoryCheck,
      metrics,
      overall: results.every((r) => r.passed) && !memoryCheck.warning,
    };
  },
};
