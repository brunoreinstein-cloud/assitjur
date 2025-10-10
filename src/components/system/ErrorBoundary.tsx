import React from 'react';

type Props = { children: React.ReactNode };
type State = { hasError: boolean; error?: any };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };
  
  static getDerivedStateFromError(error: any) { 
    return { hasError: true, error }; 
  }
  
  componentDidCatch(error: any, info: any) { 
    console.error('ErrorBoundary caught error:', error, info); 
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md mx-auto text-center p-6">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              ⚠️ Erro na Aplicação
            </h1>
            <p className="text-gray-700 mb-4">
              Algo deu errado. Verifique o console para mais detalhes.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
