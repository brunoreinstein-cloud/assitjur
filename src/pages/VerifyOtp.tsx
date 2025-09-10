import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Scale } from 'lucide-react';
import { AuthCard } from '@/components/auth/AuthCard';
import { TwoFactorForm } from '@/components/auth/TwoFactorForm';
import { AlertBox } from '@/components/auth/AlertBox';
import { useAuth } from '@/hooks/useAuth';
import { BrandLogo } from '@/components/brand/BrandLogo';

const VerifyOtp = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [userEmail, setUserEmail] = useState<string>('');

  const next = searchParams.get('next');
  const email = searchParams.get('email');

  // Check if user is already fully authenticated
  useEffect(() => {
    if (user) {
      const redirectTo = next ? decodeURIComponent(next) : '/dados/mapa';
      navigate(redirectTo);
    }
  }, [user, navigate, next]);

  // Set email from params or session
  useEffect(() => {
    if (email) {
      setUserEmail(email);
    } else if (user?.email) {
      setUserEmail(user.email);
    }
  }, [email, user]);

  // Check if MFA is enabled (mock check)
  const isMfaEnabled = () => {
    // In production, this would check user's MFA settings
    // For now, we'll check localStorage or environment
    return localStorage.getItem('mfa_enabled') === 'true' || 
           import.meta.env.VITE_MFA_ENABLED === 'true';
  };

  // Redirect if MFA is not enabled
  useEffect(() => {
    if (!isMfaEnabled()) {
      const redirectTo = next ? decodeURIComponent(next) : '/dados/mapa';
      navigate(redirectTo);
    }
  }, [navigate, next]);

  const handleVerificationSuccess = () => {
    const redirectTo = next ? decodeURIComponent(next) : '/dados/mapa';
    navigate(redirectTo);
  };

  const handleBack = () => {
    navigate('/login');
  };

  // Don't render if MFA is not enabled
  if (!isMfaEnabled()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col justify-center px-6 py-12">
      <div className="mx-auto w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-3">
            <BrandLogo size="md" className="w-10 h-10" />
            <div>
            <h1 className="text-2xl font-bold text-foreground">AssistJur.IA</h1>
            <p className="text-sm text-muted-foreground">Assistente de Testemunhas</p>
            </div>
          </div>
        </div>

        {/* MFA Info */}
        <div className="mb-6">
          <AlertBox variant="info" title="Verificação adicional necessária">
            Sua conta possui verificação em duas etapas ativada para maior segurança.
          </AlertBox>
        </div>

        <AuthCard
          title="Verificação em duas etapas"
          description="Confirme sua identidade para continuar"
        >
          <TwoFactorForm
            onBack={handleBack}
            onSuccess={handleVerificationSuccess}
            userEmail={userEmail}
          />
        </AuthCard>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            Esta verificação adicional protege sua conta e dados sensíveis.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtp;