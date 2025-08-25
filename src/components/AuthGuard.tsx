import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, UserRole } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  redirectTo?: string;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  requiredRole,
  redirectTo = '/login' 
}) => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      // Not authenticated
      if (!user || !profile) {
        navigate(redirectTo);
        return;
      }

      // Account not active
      if (!profile.is_active) {
        toast({
          variant: "destructive",
          title: "Acesso negado",
          description: "Sua conta está desativada. Contate o Administrador."
        });
        navigate(redirectTo);
        return;
      }

      // Role requirement not met
      if (requiredRole && profile.role !== requiredRole) {
        toast({
          variant: "destructive",
          title: "Acesso restrito",
          description: "Recurso disponível somente para administradores."
        });
        navigate('/app/chat'); // Redirect to main app instead of login
        return;
      }
    }
  }, [user, profile, loading, requiredRole, redirectTo, navigate]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Not authenticated or insufficient role
  if (!user || !profile || !profile.is_active || (requiredRole && profile.role !== requiredRole)) {
    return null; // Let useEffect handle the redirect
  }

  return <>{children}</>;
};

export default AuthGuard;