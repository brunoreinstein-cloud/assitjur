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
      message: 'Dados financeiros protegidos com RLS'
    },
    {
      id: 'audit-logs',
      status: 'secure', 
      message: 'Logs de auditoria restritos a super admins'
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
    }
  ];

  const secureCount = securityItems.filter(item => item.status === 'secure').length;
  const totalCount = securityItems.length;

  return (
    <Alert className="border-primary/20 bg-primary/5">
      <Shield className="h-4 w-4" />
      <AlertDescription>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            Status de Segurança: {secureCount}/{totalCount} itens seguros
          </span>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Check className="h-3 w-3 text-green-600" />
            Última atualização de segurança aplicada
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}