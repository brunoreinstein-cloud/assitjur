import React, { Component, ErrorInfo, ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { logger } from "@/lib/logger";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
}

export class MapaErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    errorCount: 0,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorCount = this.state.errorCount + 1;

    // Log detalhado para debug
    logger.error("🔴 [MapaErrorBoundary] Erro capturado", {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorCount,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      online: navigator.onLine,
    });

    this.setState({
      error,
      errorInfo,
      errorCount,
    });

    // Detectar loop infinito de erros
    if (errorCount > 3) {
      logger.error("⛔ [MapaErrorBoundary] Loop de erros detectado", {
        errorCount,
        lastError: error.message,
      });
    }
  }

  private handleReset = () => {
    logger.info("🔄 [MapaErrorBoundary] Resetando estado de erro");
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    });
  };

  private handleGoHome = () => {
    logger.info("🏠 [MapaErrorBoundary] Navegando para home");
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      const { error, errorInfo, errorCount } = this.state;

      return (
        <div className="flex items-center justify-center min-h-screen p-4 bg-background">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-destructive" />
                <div>
                  <CardTitle className="text-2xl">
                    Erro no Mapa de Testemunhas
                  </CardTitle>
                  <CardDescription>
                    {errorCount > 1
                      ? `Ocorreram ${errorCount} erros consecutivos`
                      : "Ocorreu um erro inesperado"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Mensagem de erro principal */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-muted-foreground">
                  Mensagem de Erro
                </h3>
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <p className="text-sm text-destructive font-mono">
                    {error?.message || "Erro desconhecido"}
                  </p>
                </div>
              </div>

              {/* Detalhes técnicos (debug) */}
              {process.env.NODE_ENV === "development" && errorInfo && (
                <details className="space-y-2">
                  <summary className="cursor-pointer font-semibold text-sm text-muted-foreground hover:text-foreground">
                    Detalhes Técnicos (Dev)
                  </summary>
                  <div className="p-3 bg-muted rounded-md overflow-x-auto">
                    <pre className="text-xs font-mono whitespace-pre-wrap">
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                </details>
              )}

              {/* Possíveis causas e soluções */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-muted-foreground">
                  Possíveis Causas
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Problemas de conexão com o servidor</li>
                  <li>Dados inconsistentes ou mal formatados</li>
                  <li>Erro na Edge Function do backend</li>
                  <li>Sessão expirada ou inválida</li>
                </ul>
              </div>

              {/* Ações do usuário */}
              <div className="flex gap-3">
                {errorCount <= 3 && (
                  <Button onClick={this.handleReset} className="flex-1">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Tentar Novamente
                  </Button>
                )}
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex-1"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Voltar ao Início
                </Button>
              </div>

              {errorCount > 3 && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    ⚠️ Múltiplas tentativas falharam. Por favor, entre em
                    contato com o suporte.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
