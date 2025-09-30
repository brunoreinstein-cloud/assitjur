import React from 'react';
import { useMultiTenantLoading } from '@/hooks/useMultiTenantLoading';
import { Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export const MultiTenantLoadingScreen: React.FC = () => {
  const { isLoading, progress, message, phase } = useMultiTenantLoading();

  if (!isLoading) return null;

  const phaseColors = {
    auth: 'text-primary',
    profile: 'text-blue-500',
    organization: 'text-purple-500',
    complete: 'text-green-500'
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full px-6 space-y-6">
        <div className="text-center space-y-4">
          <Loader2 className={`h-12 w-12 animate-spin mx-auto ${phaseColors[phase]}`} />
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">
              {message}
            </h2>
            <p className="text-sm text-muted-foreground">
              {phase === 'auth' && 'Verificando credenciais...'}
              {phase === 'profile' && 'Carregando suas informações...'}
              {phase === 'organization' && 'Configurando ambiente...'}
              {phase === 'complete' && 'Finalizando...'}
            </p>
          </div>
        </div>
        
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-center text-muted-foreground">
            {Math.round(progress)}%
          </p>
        </div>
      </div>
    </div>
  );
};
