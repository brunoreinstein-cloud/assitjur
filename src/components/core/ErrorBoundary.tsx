import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorHandler, createError } from '@/lib/error-handling';
import ServerError from '@/pages/ServerError';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Cria erro estruturado com contexto adicional
    const appError = createError.system('React component error', {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
      originalError: error.message,
      stack: error.stack
    });

    // Usa o handler centralizado
    const handledError = ErrorHandler.handle(appError, 'ErrorBoundary');
    
    this.setState({
      error: handledError,
      errorInfo
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <ServerError onRetry={this.handleReset} />;
    }

    return this.props.children;
  }
}

// Hook version for functional components
export function useErrorHandler() {
  return (error: Error, errorInfo?: ErrorInfo) => {
    const appError = createError.system('Component error', {
      ...errorInfo,
      originalError: error.message,
      stack: error.stack
    });

    ErrorHandler.handleAndNotify(appError, 'useErrorHandler');
  };
}