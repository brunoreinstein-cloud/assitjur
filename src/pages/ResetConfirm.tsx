import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";
import { BRAND } from "@/branding/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthCard } from "@/components/auth/AuthCard";
import { AlertBox } from "@/components/auth/AlertBox";
import { PasswordStrength } from "@/components/auth/PasswordStrength";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MIN_PASSWORD_LENGTH } from "@/utils/security/passwordPolicy";

const confirmResetSchema = z
  .object({
    password: z
      .string()
      .min(MIN_PASSWORD_LENGTH, `Mínimo de ${MIN_PASSWORD_LENGTH} caracteres`),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Senhas não conferem",
    path: ["confirmPassword"],
  });

type ConfirmResetFormData = z.infer<typeof confirmResetSchema>;

const ResetConfirm = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);

  // Get token from URL fragments (Supabase auth uses hash fragments)
  const params = new URLSearchParams(window.location.hash.slice(1));
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");

  useEffect(() => {
    if (window.location.hash.includes("access_token")) {
      window.location.hash = "";
    }
  }, []);

  const form = useForm<ConfirmResetFormData>({
    resolver: zodResolver(confirmResetSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const watchPassword = form.watch("password");

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      if (!accessToken || !refreshToken) {
        setIsValidToken(false);
        return;
      }

      if (!supabase) {
        // Mock validation for development
        setIsValidToken(true);
        return;
      }

      try {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        setIsValidToken(!error);
      } catch (error) {
        console.error("Token validation error:", error);
        setIsValidToken(false);
      }
    };

    validateToken();
  }, [accessToken, refreshToken]);

  const handleUpdatePassword = async (data: ConfirmResetFormData) => {
    setIsLoading(true);

    try {
      if (!supabase) {
        // Mock password update for development
        toast.success("Senha atualizada!", {
          description: "Sua senha foi redefinida com sucesso (modo demo).",
        });
        navigate("/login");
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) {
        throw error;
      }

      toast.success("Senha atualizada!", {
        description:
          "Sua senha foi redefinida com sucesso. Faça login com a nova senha.",
      });

      // Rotate refresh token and sign out
      try {
        await supabase.auth.refreshSession();
      } catch {}
      await supabase.auth.signOut();
      navigate("/login");
    } catch (error: unknown) {
      console.error("Password update error:", error);
      toast.error("Erro ao atualizar senha", {
        description: "Não foi possível atualizar a senha. Tente novamente.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state while validating token
  if (isValidToken === null) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex flex-col justify-center px-6 py-12">
        <div className="mx-auto w-full max-w-md">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">
              Validando link de redefinição...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Invalid token
  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex flex-col justify-center px-6 py-12">
        <div className="mx-auto w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-3">
              <img
                src={BRAND.logo.mark}
                alt={BRAND.name}
                className="w-10 h-10 object-contain"
                loading="lazy"
              />
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {BRAND.name}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Assistente de Testemunhas
                </p>
              </div>
            </div>
          </div>

          <AuthCard
            title="Link inválido"
            description="O link de redefinição não é válido"
          >
            <div className="text-center space-y-6">
              <AlertBox variant="error" title="Link expirado ou inválido">
                <div className="space-y-2 text-sm">
                  <p>Este link pode ter expirado ou já foi usado.</p>
                  <ul className="list-disc list-inside space-y-1 text-left">
                    <li>Links de redefinição expiram em 1 hora</li>
                    <li>Cada link só pode ser usado uma vez</li>
                    <li>Certifique-se de usar o link mais recente</li>
                  </ul>
                </div>
              </AlertBox>

              <div className="space-y-3">
                <Button onClick={() => navigate("/reset")} className="w-full">
                  Solicitar novo link
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => navigate("/login")}
                  className="w-full"
                >
                  Voltar ao login
                </Button>
              </div>
            </div>
          </AuthCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col justify-center px-6 py-12">
      <div className="mx-auto w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-3">
            <img
              src={BRAND.logo.mark}
              alt={BRAND.name}
              className="w-10 h-10 object-contain"
              loading="lazy"
            />
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {BRAND.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                Assistente de Testemunhas
              </p>
            </div>
          </div>
        </div>

        <AuthCard
          title="Nova senha"
          description="Defina uma senha segura para sua conta"
        >
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto p-3 bg-primary/10 rounded-full w-fit mb-4">
                <CheckCircle className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">
                Link válido. Defina sua nova senha abaixo.
              </p>
            </div>

            <form
              onSubmit={form.handleSubmit(handleUpdatePassword)}
              className="space-y-4"
            >
              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Nova senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    aria-invalid={!!form.formState.errors.password}
                    aria-describedby="reset-password-error"
                    {...form.register("password")}
                    className={
                      form.formState.errors.password
                        ? "border-destructive pr-10"
                        : "pr-10"
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? "Ocultar senha" : "Mostrar senha"
                    }
                    aria-pressed={showPassword}
                  >
                    {showPassword ? (
                      <EyeOff
                        className="h-4 w-4 text-muted-foreground"
                        aria-hidden="true"
                        focusable="false"
                      />
                    ) : (
                      <Eye
                        className="h-4 w-4 text-muted-foreground"
                        aria-hidden="true"
                        focusable="false"
                      />
                    )}
                  </Button>
                </div>
                {form.formState.errors.password && (
                  <p
                    id="reset-password-error"
                    className="text-sm text-destructive"
                    role="alert"
                    aria-live="polite"
                  >
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>

              {/* Password Strength */}
              {watchPassword && <PasswordStrength password={watchPassword} />}

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    aria-invalid={!!form.formState.errors.confirmPassword}
                    aria-describedby="reset-confirm-password-error"
                    {...form.register("confirmPassword")}
                    className={
                      form.formState.errors.confirmPassword
                        ? "border-destructive pr-10"
                        : "pr-10"
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={
                      showConfirmPassword ? "Ocultar senha" : "Mostrar senha"
                    }
                    aria-pressed={showConfirmPassword}
                  >
                    {showConfirmPassword ? (
                      <EyeOff
                        className="h-4 w-4 text-muted-foreground"
                        aria-hidden="true"
                        focusable="false"
                      />
                    ) : (
                      <Eye
                        className="h-4 w-4 text-muted-foreground"
                        aria-hidden="true"
                        focusable="false"
                      />
                    )}
                  </Button>
                </div>
                {form.formState.errors.confirmPassword && (
                  <p
                    id="reset-confirm-password-error"
                    className="text-sm text-destructive"
                    role="alert"
                    aria-live="polite"
                  >
                    {form.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Atualizando senha...
                  </>
                ) : (
                  "Atualizar senha"
                )}
              </Button>
            </form>
          </div>
        </AuthCard>
      </div>
    </div>
  );
};

export default ResetConfirm;
