import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  BarChart3,
  Bug,
  Zap,
} from "lucide-react";
import { TestUtils } from "@/lib/testing-utilities";
import type { HealthCheckResult } from "@/lib/testing-utilities";
import { useDevDiagnostics } from "@/lib/dev-diagnostics";
import { logger } from "@/lib/logger";

interface HealthStatus extends HealthCheckResult {
  lastCheck: Date;
}

/**
 * Monitor de saúde do sistema - apenas em desenvolvimento
 * Exibe métricas em tempo real e status dos testes automáticos
 */
export function HealthMonitor() {
  const isDevelopment = import.meta.env.MODE === "development";
  const [isVisible, setIsVisible] = useState(false);
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { trackRender } = useDevDiagnostics("HealthMonitor");

  const runHealthCheck = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await TestUtils.healthCheck();
      setHealthStatus({
        ...result,
        lastCheck: new Date(),
      });
    } catch (error) {
      console.error("Health check failed:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isDevelopment) {
      return;
    }

    trackRender();
    // Check inicial
    runHealthCheck();

    // Auto-refresh a cada 30 segundos
    const interval = setInterval(runHealthCheck, 30000);
    return () => clearInterval(interval);
  }, [isDevelopment, runHealthCheck, trackRender]);

  // Apenas renderizar em desenvolvimento
  if (!isDevelopment) {
    return null;
  }

  const getSeverityBadge = (severity: "ok" | "warning" | "error") => {
    const variants = {
      ok: { variant: "default" as const, icon: CheckCircle, text: "OK" },
      warning: {
        variant: "secondary" as const,
        icon: AlertTriangle,
        text: "Aviso",
      },
      error: {
        variant: "destructive" as const,
        icon: AlertTriangle,
        text: "Erro",
      },
    };

    const config = variants[severity];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.text}
      </Badge>
    );
  };

  const getOverallStatus = (): "ok" | "warning" | "error" => {
    if (!healthStatus) return "warning";

    const criticalFailures = healthStatus.tests.filter(
      (t) => !t.passed && t.category === "validation",
    );

    if (criticalFailures.length > 0) return "error";
    if (healthStatus.memory.warning || !healthStatus.overall) return "warning";
    return "ok";
  };

  // Toggle de visibilidade - botão flutuante
  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsVisible(true)}
          className="shadow-lg bg-background border-2"
          title="Abrir Health Monitor"
        >
          <Activity className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 z-50">
      <Card className="shadow-xl border-2 bg-background">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Activity className="h-4 w-4" />
              Health Monitor
              {getSeverityBadge(getOverallStatus())}
            </CardTitle>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={runHealthCheck}
                disabled={isLoading}
                title="Atualizar status"
              >
                <RefreshCw
                  className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`}
                />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(false)}
                title="Minimizar"
              >
                ×
              </Button>
            </div>
          </div>
          {healthStatus?.lastCheck && (
            <p className="text-xs text-muted-foreground">
              Última verificação: {healthStatus.lastCheck.toLocaleTimeString()}
            </p>
          )}
        </CardHeader>

        <CardContent className="space-y-3 text-sm">
          {/* Status geral */}
          {healthStatus && (
            <>
              {/* Testes */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Bug className="h-3 w-3" />
                  <span className="font-medium">Testes Automatizados</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-muted p-2 rounded">
                    <div className="font-medium text-green-600">
                      {healthStatus.tests.filter((t) => t.passed).length}
                    </div>
                    <div>Passaram</div>
                  </div>
                  <div className="bg-muted p-2 rounded">
                    <div className="font-medium text-red-600">
                      {healthStatus.tests.filter((t) => !t.passed).length}
                    </div>
                    <div>Falharam</div>
                  </div>
                </div>
              </div>

              {/* Memória */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="h-3 w-3" />
                  <span className="font-medium">Uso de Memória</span>
                  {healthStatus.memory.warning && (
                    <Badge variant="secondary" className="text-xs">
                      Alto
                    </Badge>
                  )}
                </div>
                <div className="bg-muted p-2 rounded text-xs">
                  <div className="font-medium">
                    {Math.round(healthStatus.memory.usage / 1024 / 1024)} MB
                  </div>
                  <div>Heap utilizada</div>
                </div>
              </div>

              {/* Métricas */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-3 w-3" />
                  <span className="font-medium">Métricas (5min)</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-muted p-2 rounded">
                    <div className="font-medium">
                      {healthStatus.metrics.errors}
                    </div>
                    <div>Erros</div>
                  </div>
                  <div className="bg-muted p-2 rounded">
                    <div className="font-medium">
                      {healthStatus.metrics.apiCalls}
                    </div>
                    <div>API Calls</div>
                  </div>
                </div>
              </div>

              {/* Alertas */}
              {getOverallStatus() !== "ok" && (
                <Alert
                  variant={
                    getOverallStatus() === "error" ? "destructive" : "default"
                  }
                >
                  <AlertTriangle className="h-3 w-3" />
                  <AlertDescription className="text-xs">
                    {getOverallStatus() === "error"
                      ? "Testes críticos falhando. Verifique validações."
                      : "Alguns avisos detectados. Sistema funcional."}
                  </AlertDescription>
                </Alert>
              )}

              {/* Controles */}
              <div className="pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Abrir console com comandos disponíveis
                    logger.info("Dev Diagnostics Commands disponíveis", {
                      healthCheck: "__DEV_DIAGNOSTICS__.runHealthCheck()",
                      regressionTests:
                        "__DEV_DIAGNOSTICS__.runRegressionTests()",
                      metrics: "__DEV_DIAGNOSTICS__.getMetrics()",
                      bundleAnalysis: "__DEV_DIAGNOSTICS__.analyzeBundle()",
                    }, "HealthMonitor");
                  }}
                  className="w-full"
                >
                  Ver comandos no console
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
