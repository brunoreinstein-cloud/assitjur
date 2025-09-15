/**
 * Sistema de diagnósticos para desenvolvimento
 * Detecta e alerta sobre problemas em tempo real durante desenvolvimento
 */

import { logger } from '@/lib/logger';
import { observability } from '@/lib/observability';
import { regressionDetector, TestUtils } from '@/lib/testing-utilities';

// Diagnósticos específicos do AssistJur.IA
export class DevDiagnostics {
  private isEnabled = import.meta.env.DEV;
  private diagnosticsEnabled = false;

  enable() {
    if (!this.isEnabled || this.diagnosticsEnabled) return;
    
    this.diagnosticsEnabled = true;
    this.setupConsolePatching();
    this.setupPerformanceMonitoring();
    this.setupHealthChecks();
    
    logger.info('Development diagnostics enabled', {
      features: ['console_patching', 'performance_monitoring', 'health_checks']
    }, 'DevDiagnostics');
  }

  // Intercepta e analisa calls de console.error/warn deprecados
  private setupConsolePatching() {
    const originalError = console.error;
    const originalWarn = console.warn;

    console.error = (...args) => {
      // Detectar uso direto de console.error (deve usar sistema centralizado)
      const stack = new Error().stack;
      if (stack && !stack.includes('logger.ts') && !stack.includes('error-handling.ts')) {
        logger.warn('Direct console.error usage detected', {
          args: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)),
          stack: stack.split('\n').slice(0, 3)
        }, 'DevDiagnostics');
      }
      
      originalError.apply(console, args);
    };

    console.warn = (...args) => {
      // Detectar uso direto de console.warn
      const stack = new Error().stack;
      if (stack && !stack.includes('logger.ts') && !stack.includes('error-handling.ts')) {
        logger.info('Direct console.warn usage detected - consider using logger.warn', {
          args: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg))
        }, 'DevDiagnostics');
      }
      
      originalWarn.apply(console, args);
    };
  }

  // Monitor de performance em tempo real
  private setupPerformanceMonitoring() {
    // Monitor de re-renders excessivos
    let renderCount = 0;
    const renderThreshold = 10; // Máximo de renders por segundo
    
    setInterval(() => {
      if (renderCount > renderThreshold) {
        logger.warn('Excessive component re-renders detected', {
          rendersPerSecond: renderCount,
          threshold: renderThreshold,
          suggestion: 'Check for unnecessary state updates or missing dependencies'
        }, 'DevDiagnostics');
      }
      renderCount = 0;
    }, 1000);

    // Hook para contar renders (seria usado em componentes)
    (window as any).__RENDER_COUNTER__ = () => renderCount++;
  }

  // Health checks automáticos
  private setupHealthChecks() {
    // Verificação a cada 2 minutos em desenvolvimento
    setInterval(async () => {
      try {
        const healthCheck = await TestUtils.healthCheck();
        
        if (!healthCheck.overall) {
          logger.warn('Health check failed', {
            failedTests: healthCheck.tests.filter(t => !t.passed).length,
            memoryWarning: healthCheck.memory.warning,
            totalMetrics: healthCheck.metrics.totalMetrics
          }, 'DevDiagnostics');
        }
        
        // Alertar sobre testes críticos falhando
        const criticalFailures = healthCheck.tests.filter(t => 
          !t.passed && t.category === 'validation'
        );
        
        if (criticalFailures.length > 0) {
          logger.error('Critical validation tests failing', {
            failures: criticalFailures.map(f => ({ name: f.name, error: f.error }))
          }, 'DevDiagnostics');
        }
        
      } catch (error) {
        logger.error('Health check system failure', { error }, 'DevDiagnostics');
      }
    }, 120000); // 2 minutos
  }

  // Análise de bundle e dependências
  analyzeBundle() {
    if (!this.isEnabled) return;
    
    const performanceTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (performanceTiming) {
      const loadTime = performanceTiming.loadEventEnd - performanceTiming.fetchStart;
      const domReady = performanceTiming.domContentLoadedEventEnd - performanceTiming.fetchStart;
      
      logger.info('Bundle analysis', {
        totalLoadTime: Math.round(loadTime),
        domReadyTime: Math.round(domReady),
        isSlowLoad: loadTime > 3000,
        suggestion: loadTime > 3000 ? 'Consider code splitting or lazy loading' : null
      }, 'DevDiagnostics');
    }
  }

  // Detector de memory leaks
  detectMemoryLeaks() {
    if (!this.isEnabled) return;
    
    // Type guard para performance.memory (disponível apenas no Chrome)
    const performanceWithMemory = performance as Performance & {
      memory?: {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
      }
    };
    
    if (!performanceWithMemory.memory) {
      logger.info('Memory API not available (Chrome only feature)', {}, 'DevDiagnostics');
      return;
    }
    
    const initial = performanceWithMemory.memory.usedJSHeapSize;
    
    setTimeout(() => {
      const current = performanceWithMemory.memory!.usedJSHeapSize;
      const growth = current - initial;
      const growthMB = Math.round(growth / 1024 / 1024);
      
      if (growthMB > 10) { // Crescimento de mais de 10MB
        logger.warn('Potential memory leak detected', {
          initialMB: Math.round(initial / 1024 / 1024),
          currentMB: Math.round(current / 1024 / 1024),
          growthMB,
          suggestion: 'Check for uncleaned event listeners or large object references'
        }, 'DevDiagnostics');
      }
    }, 30000); // Verificar após 30 segundos
  }

  // Validator de props e estado
  validateComponentState(componentName: string, state: any, expectedSchema?: any) {
    if (!this.isEnabled) return;
    
    // Verificações básicas
    const issues: string[] = [];
    
    // Detectar objetos muito grandes no estado
    const stateSize = JSON.stringify(state).length;
    if (stateSize > 50000) { // 50KB
      issues.push(`Large state object (${Math.round(stateSize / 1024)}KB)`);
    }
    
    // Detectar arrays muito grandes
    Object.entries(state).forEach(([key, value]) => {
      if (Array.isArray(value) && value.length > 1000) {
        issues.push(`Large array in ${key} (${value.length} items)`);
      }
    });
    
    // Detectar funções no estado (bad practice)
    Object.entries(state).forEach(([key, value]) => {
      if (typeof value === 'function') {
        issues.push(`Function stored in state: ${key}`);
      }
    });
    
    if (issues.length > 0) {
      logger.warn('Component state issues detected', {
        component: componentName,
        issues,
        suggestions: [
          'Consider breaking down large objects',
          'Use pagination for large arrays',
          'Move functions outside of state'
        ]
      }, 'DevDiagnostics');
    }
  }

  // API para uso em componentes
  createComponentValidator(componentName: string) {
    return {
      validateState: (state: any, schema?: any) => 
        this.validateComponentState(componentName, state, schema),
      
      trackRender: () => {
        if ((window as any).__RENDER_COUNTER__) {
          (window as any).__RENDER_COUNTER__();
        }
        
        observability.recordUserAction('component_render', { component: componentName });
      },
      
      validateProps: (props: any, required: string[] = []) => {
        const missing = required.filter(key => !props.hasOwnProperty(key));
        if (missing.length > 0) {
          logger.warn('Missing required props', {
            component: componentName,
            missing,
            received: Object.keys(props)
          }, 'DevDiagnostics');
        }
      }
    };
  }
}

// Instância singleton
export const devDiagnostics = new DevDiagnostics();

// Auto-habilitar em desenvolvimento
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  devDiagnostics.enable();
  
  // Análise inicial do bundle
  window.addEventListener('load', () => {
    setTimeout(() => {
      devDiagnostics.analyzeBundle();
      devDiagnostics.detectMemoryLeaks();
    }, 1000);
  });
  
  // Disponibilizar para debug no console
  (window as any).__DEV_DIAGNOSTICS__ = {
    runHealthCheck: TestUtils.healthCheck,
    runRegressionTests: () => regressionDetector.runAllTests(),
    getMetrics: () => observability.getMetricsSummary(),
    analyzeBundle: () => devDiagnostics.analyzeBundle()
  };
}

// Hook para componentes React
export function useDevDiagnostics(componentName: string) {
  const validator = devDiagnostics.createComponentValidator(componentName);
  
  return {
    validateState: validator.validateState,
    validateProps: validator.validateProps,
    trackRender: validator.trackRender
  };
}