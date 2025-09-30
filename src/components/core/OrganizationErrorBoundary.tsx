import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logError } from '@/lib/logger';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  onRetry?: () => void;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorType: 'organization' | 'data' | 'unknown';
}

export class OrganizationErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorType: 'unknown' };
  }

  static getDerivedStateFromError(error: Error): State {
    // Classify error type
    const errorType = error.message.includes('organization')
      ? 'organization'
      : error.message.includes('data') || error.message.includes('fetch')
      ? 'data'
      : 'unknown';

    return { hasError: true, error, errorType };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logError('Organization context error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorType: this.state.errorType
    }, 'OrganizationErrorBoundary');
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorType: 'unknown' });
    if (this.props.onRetry) {
      this.props.onRetry();
    } else {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const messages = {
        organization: {
          title: 'Erro ao Carregar Organização',
          description: 'Não foi possível carregar os dados da sua organização. Verifique sua conexão e tente novamente.'
        },
        data: {
          title: 'Erro ao Carregar Dados',
          description: 'Houve um problema ao carregar os dados. Isso pode ser temporário.'
        },
        unknown: {
          title: 'Erro Inesperado',
          description: 'Algo deu errado. Tente recarregar a página.'
        }
      };

      const { title, description } = messages[this.state.errorType];

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full bg-card rounded-lg shadow-lg p-6 text-center space-y-4">
            <div className="flex justify-center">
              <AlertTriangle className="h-16 w-16 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">{title}</h2>
            <p className="text-muted-foreground">{description}</p>
            {this.state.error && (
              <details className="text-xs text-muted-foreground text-left bg-muted p-2 rounded">
                <summary className="cursor-pointer font-medium">Detalhes técnicos</summary>
                <pre className="mt-2 whitespace-pre-wrap break-all">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <Button onClick={this.handleRetry} className="w-full gap-2">
              <RefreshCw className="h-4 w-4" />
              Tentar Novamente
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
