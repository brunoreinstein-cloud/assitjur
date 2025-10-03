import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AuthCard } from "@/components/auth/AuthCard";
import { TwoFactorForm } from "@/components/auth/TwoFactorForm";
import { AlertBox } from "@/components/auth/AlertBox";
import { useAuth } from "@/hooks/useAuth";
import { BrandHeader } from "@/components/brand/BrandHeader";

const VerifyOtp = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, profile } = useAuth();
  const [userEmail, setUserEmail] = useState<string>("");

  const next = searchParams.get("next");
  const email = searchParams.get("email");

  // Redirect if user is authenticated and 2FA not required
  useEffect(() => {
    if (user && profile && !profile.two_factor_enabled) {
      const redirectTo = next ? decodeURIComponent(next) : "/dados/mapa";
      navigate(redirectTo);
    }
  }, [user, profile, navigate, next]);

  // Set email from params or session
  useEffect(() => {
    if (email) {
      setUserEmail(email);
    } else if (user?.email) {
      setUserEmail(user.email);
    }
  }, [email, user]);

  useEffect(() => {
    if (profile && !profile.two_factor_enabled) {
      const redirectTo = next ? decodeURIComponent(next) : "/dados/mapa";
      navigate(redirectTo);
    }
  }, [profile, navigate, next]);

  const handleVerificationSuccess = () => {
    sessionStorage.setItem("mfa_verified", "true");
    const redirectTo = next ? decodeURIComponent(next) : "/dados/mapa";
    navigate(redirectTo);
  };

  const handleBack = () => {
    navigate("/login");
  };

  if (!profile?.two_factor_enabled || !profile.two_factor_secret) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col justify-center px-6 py-12">
      <div className="mx-auto w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <BrandHeader size="lg" className="gap-3" />
        </div>

        {/* MFA Info */}
        <div className="mb-6">
          <AlertBox variant="info" title="Verificação adicional necessária">
            Sua conta possui verificação em duas etapas ativada para maior
            segurança.
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
            secret={profile.two_factor_secret}
            backupCode={profile.two_factor_backup_code ?? undefined}
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
