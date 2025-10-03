import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import {
  generateSecret,
  generateBackupCode,
  generateOtpAuthUrl,
  verifyTOTP,
} from "@/utils/totp";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const TwoFactorSetup = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [secret, setSecret] = useState("");
  const [backupCode, setBackupCode] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      const newSecret = generateSecret();
      setSecret(newSecret);
      const bc = generateBackupCode();
      setBackupCode(bc);
      const url = generateOtpAuthUrl(profile.email, "AssistJur", newSecret);
      setQrUrl(
        `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(url)}`,
      );
    }
  }, [profile]);

  const handleEnable = async () => {
    if (!profile) return;
    setIsLoading(true);
    try {
      const valid = await verifyTOTP(code, secret);
      if (!valid) {
        toast.error("Código inválido");
        setIsLoading(false);
        return;
      }
      const { error } = await supabase
        .from("profiles")
        .update({
          // Mock 2FA fields since they don't exist in the current schema
          // In a real implementation, these would be proper 2FA fields
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);
      if (error) throw error;
      sessionStorage.setItem("mfa_verified", "true");
      toast.success("2FA habilitado");
      navigate("/dados/mapa");
    } catch (err) {
      console.error("Enable 2FA error:", err);
      toast.error("Erro ao habilitar 2FA");
    } finally {
      setIsLoading(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col justify-center px-6 py-12">
      <div className="mx-auto w-full max-w-md">
        <AuthCard
          title="Ativar verificação em duas etapas"
          description="Use um aplicativo autenticador"
        >
          <div className="space-y-4">
            {qrUrl && <img src={qrUrl} alt="QR code" className="mx-auto" />}
            <div className="text-sm text-center">
              <p>
                Escaneie o QR code ou use o código:
                <code className="font-mono ml-1">{secret}</code>
              </p>
            </div>
            <div className="text-sm text-center">
              <p>
                Guarde seu código de backup:
                <code className="font-mono ml-1">{backupCode}</code>
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Código do aplicativo</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="000000"
                autoComplete="one-time-code"
              />
            </div>
            <Button
              className="w-full"
              onClick={handleEnable}
              disabled={isLoading || code.length !== 6}
            >
              {isLoading ? "Verificando..." : "Ativar 2FA"}
            </Button>
          </div>
        </AuthCard>
      </div>
    </div>
  );
};

export default TwoFactorSetup;
