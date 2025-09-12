import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logError } from '@/lib/logger';
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
    logError('ErrorBoundary caught an error', { 
      error: error.message || error,
      stack: error.stack,
      errorInfo: errorInfo.componentStack 
    }, 'ErrorBoundary');
    
    this.setState({
      error,
      errorInfo
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

      // Log to external service in production
      if (import.meta.env.PROD) {
      // Example: Sentry, LogRocket, etc.
      logError('Production error', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      }, 'ErrorBoundary-Production');
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
    logError('Component error', { 
      error: error.message || error,
      stack: error.stack,
      ...errorInfo 
    }, 'useErrorHandler');
    
      // Log to external service
      if (import.meta.env.PROD) {
      logError('Production component error', {
        error: error.message,
        stack: error.stack,
        ...errorInfo
      }, 'useErrorHandler-Production');
    }
  };
}