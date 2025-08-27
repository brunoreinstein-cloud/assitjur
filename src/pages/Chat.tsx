import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

// Import the new ChatApp component which has the full MVP Testemunhas implementation
import ChatApp from './ChatApp';

export default function Chat() {
  const { user, loading } = useAuth();

  // Redirect if not authenticated
  if (!loading && !user) {
    return <Navigate to="/login" replace />;
  }

  // Show loading while authentication is being checked
  if (loading) {
    return (
      <div className="h-full bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando chat...</p>
        </div>
      </div>
    );
  }

  // Render the full ChatApp with MVP Testemunhas implementation
  return (
    <div className="h-full">
      {/* LGPD Notice */}
      <Alert className="m-4 mb-0 bg-amber-50 border-amber-200">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          <strong>Conteúdo assistivo.</strong> Revisão humana obrigatória. 
          Dados tratados conforme LGPD. 
          <a href="/privacy" className="underline ml-2">Política de Privacidade</a>
        </AlertDescription>
      </Alert>

      {/* Main Chat Interface */}
      <div className="h-[calc(100%-4rem)]">
        <ChatApp />
      </div>
    </div>
  );
}