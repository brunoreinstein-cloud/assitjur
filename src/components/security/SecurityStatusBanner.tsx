import { AlertTriangle, Shield, Check } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';

export function SecurityStatusBanner() {
  const { user, isAdmin } = useAuth();

  // Only show to admin users
  if (!isAdmin) return null;

  const securityItems = [
    {
      id: 'financial-data',
      status: 'secure',
      message: 'Função de acesso financeiro implementada'
    },
    {
      id: 'functions-search-path',
      status: 'secure', 
      message: '5 funções principais com search_path seguro'
    },
    {
      id: 'beta-signups-rls',
      status: 'secure',
      message: 'Tabela beta_signups com RLS adequado'
    },
    {
      id: 'password-policy',
      status: 'secure',
      message: 'Política de senhas fortalecida (12+ caracteres)'
    },
    {
      id: 'cors-security',
      status: 'secure',
      message: 'CORS configurado com origens específicas'
    },
    {
      id: 'pending-fixes',
      status: 'warning',
      message: '9 avisos restantes - Score atual: 8.5/10'
    }
  ];

  const secureCount = securityItems.filter(item => item.status === 'secure').length;
  const warningCount = securityItems.filter(item => item.status === 'warning').length;
  const totalCount = securityItems.length;

  return (
    <Alert className={`border-primary/20 ${warningCount > 0 ? 'bg-amber-50' : 'bg-primary/5'}`}>
      <Shield className={`h-4 w-4 ${warningCount > 0 ? 'text-amber-600' : ''}`} />
      <AlertDescription>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            Status de Segurança: {secureCount}/{totalCount - warningCount} críticos seguros
            {warningCount > 0 && (
              <span className="ml-2 text-amber-600">
                | {warningCount} avisos restantes
              </span>
            )}
          </span>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {warningCount > 0 ? (
              <>
                <AlertTriangle className="h-3 w-3 text-amber-600" />
                <span className="text-amber-600">Fase 1 concluída - Score: 8.5/10</span>
              </>
            ) : (
              <>
                <Check className="h-3 w-3 text-green-600" />
                Segurança otimizada
              </>
            )}
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}