import React, { Component, ErrorInfo, ReactNode } from "react";
import { logError } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { ShieldAlert, LogIn } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  isAuthError: boolean;
}

export class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, isAuthError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    const isAuthError =
      error.message.includes("auth") ||
      error.message.includes("unauthorized") ||
      error.message.includes("session") ||
      error.message.includes("token");

    return { hasError: true, error, isAuthError };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logError(
      "Auth context error",
      {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        isAuthError: this.state.isAuthError,
      },
      "AuthErrorBoundary",
    );
  }

  handleLogin = () => {
    window.location.href = "/login";
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, isAuthError: false });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full bg-card rounded-lg shadow-lg p-6 text-center space-y-4">
            <div className="flex justify-center">
              <ShieldAlert className="h-16 w-16 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">
              {this.state.isAuthError ? "Erro de Autenticação" : "Erro Crítico"}
            </h2>
            <p className="text-muted-foreground">
              {this.state.isAuthError
                ? "Sua sessão expirou ou há um problema com sua autenticação. Por favor, faça login novamente."
                : "Ocorreu um erro crítico na aplicação. Tente recarregar a página."}
            </p>
            {this.state.error && (
              <details className="text-xs text-muted-foreground text-left bg-muted p-2 rounded">
                <summary className="cursor-pointer font-medium">
                  Detalhes técnicos
                </summary>
                <pre className="mt-2 whitespace-pre-wrap break-all">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <div className="flex gap-2">
              {this.state.isAuthError ? (
                <Button onClick={this.handleLogin} className="flex-1 gap-2">
                  <LogIn className="h-4 w-4" />
                  Fazer Login
                </Button>
              ) : (
                <Button onClick={this.handleRetry} className="flex-1">
                  Tentar Novamente
                </Button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
