import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { MIN_PASSWORD_LENGTH } from "@/utils/security/passwordPolicy";
import { ErrorBanner } from "@/components/common/ErrorBanner";
import { useStatus } from "@/hooks/useStatus";
import { ERROR_MESSAGES } from "@/utils/errorMessages";
import { ErrorHandler } from "@/lib/error-handling";

const loginSchema = z.object({
  email: z.string().email(ERROR_MESSAGES.INVALID_EMAIL),
  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH, `Mínimo de ${MIN_PASSWORD_LENGTH} caracteres`),
  rememberMe: z.boolean().optional(),
});

const signupSchema = z
  .object({
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").optional(),
    email: z.string().email(ERROR_MESSAGES.INVALID_EMAIL),
    password: z
      .string()
      .min(MIN_PASSWORD_LENGTH, `Mínimo de ${MIN_PASSWORD_LENGTH} caracteres`),
    confirmPassword: z.string(),
    acceptTerms: z
      .boolean()
      .refine((val) => val, "Você deve aceitar os termos"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Senhas não conferem",
    path: ["confirmPassword"],
  });

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;

interface EmailPasswordFormProps {
  mode: "signin" | "signup";
  onModeChange: (mode: "signin" | "signup") => void;
}

export const EmailPasswordForm = ({
  mode,
  onModeChange,
}: EmailPasswordFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { signIn, signUp } = useAuth();
  const status = useStatus({
    loading: isLoading,
    error: formError,
    data: null,
  });

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  const handleSignIn = async (data: LoginFormData) => {
    setIsLoading(true);
    setFormError(null);

    try {
      // Passa o valor de "Lembrar-me" para controlar a persistência da sessão
      const { error } = await signIn(
        data.email,
        data.password,
        "OFFICE",
        data.rememberMe,
      );

      if (error) {
        if (error?.status === 429) {
          const msg = ERROR_MESSAGES.RATE_LIMIT;
          setFormError(msg);
          toast.error("Muitas tentativas", { description: msg });
          return;
        }
        if (
          error.message?.toLowerCase().includes("invalid login credentials")
        ) {
          const msg = ERROR_MESSAGES.INCORRECT_PASSWORD;
          loginForm.setError("password", { type: "manual", message: msg });
          setFormError(msg);
          return;
        }
        setFormError(error.message || ERROR_MESSAGES.NOT_FOUND);
        return;
      }

      toast.success("Login realizado!", {
        description: "Bem-vindo ao AssistJur.IA",
      });

      // Redirect will be handled by auth state change
    } catch (error: unknown) {
      const handledError = ErrorHandler.handleAndNotify(
        error,
        "EmailPasswordForm.handleSignIn",
      );
      const msg = handledError.userMessage || ERROR_MESSAGES.NOT_FOUND;
      setFormError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (data: SignupFormData) => {
    setIsLoading(true);
    setFormError(null);

    try {
      const { error } = await signUp(data.email, data.password, data.name);

      if (error) {
        if (error?.status === 429) {
          const msg = ERROR_MESSAGES.RATE_LIMIT;
          setFormError(msg);
          toast.error("Muitas tentativas", { description: msg });
          return;
        }
        const msg = error.message || ERROR_MESSAGES.NOT_FOUND;
        setFormError(msg);
        toast.error("Erro no cadastro", { description: msg });
        return;
      }

      toast.success("Conta criada!", {
        description: "Verifique seu e-mail para confirmar o cadastro.",
      });

      onModeChange("signin");
    } catch (error: unknown) {
      const msg = (error as Error)?.message || ERROR_MESSAGES.NOT_FOUND;
      setFormError(msg);
      toast.error("Erro no cadastro", { description: msg });
    } finally {
      setIsLoading(false);
    }
  };

  if (mode === "signup") {
    return (
      <form
        onSubmit={signupForm.handleSubmit(handleSignUp)}
        className="space-y-4"
      >
        {status === "offline" && (
          <ErrorBanner
            message={ERROR_MESSAGES.NETWORK}
            onRetry={() => window.location.reload()}
          />
        )}
        {status === "error" && formError && (
          <ErrorBanner message={formError} onRetry={() => setFormError(null)} />
        )}
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Nome (opcional)</Label>
          <Input
            id="name"
            placeholder="Seu nome completo"
            {...signupForm.register("name")}
            className={
              signupForm.formState.errors.name ? "border-destructive" : ""
            }
          />
          {signupForm.formState.errors.name && (
            <p
              className="text-sm text-destructive"
              role="alert"
              aria-live="polite"
            >
              {signupForm.formState.errors.name.message}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            {...signupForm.register("email")}
            className={
              signupForm.formState.errors.email ? "border-destructive" : ""
            }
          />
          {signupForm.formState.errors.email && (
            <p
              className="text-sm text-destructive"
              role="alert"
              aria-live="polite"
            >
              {signupForm.formState.errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              aria-invalid={!!signupForm.formState.errors.password}
              aria-describedby="signup-password-error"
              {...signupForm.register("password")}
              className={
                signupForm.formState.errors.password
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
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
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
          {signupForm.formState.errors.password && (
            <p
              id="signup-password-error"
              className="text-sm text-destructive"
              role="alert"
              aria-live="polite"
            >
              {signupForm.formState.errors.password.message}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmar Senha</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              aria-invalid={!!signupForm.formState.errors.confirmPassword}
              aria-describedby="signup-confirm-password-error"
              {...signupForm.register("confirmPassword")}
              className={
                signupForm.formState.errors.confirmPassword
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
          {signupForm.formState.errors.confirmPassword && (
            <p
              id="signup-confirm-password-error"
              className="text-sm text-destructive"
              role="alert"
              aria-live="polite"
            >
              {signupForm.formState.errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Accept Terms */}
        <div className="flex items-start space-x-3 pt-2">
          <Checkbox
            id="acceptTerms"
            checked={signupForm.watch("acceptTerms")}
            onCheckedChange={(checked) =>
              signupForm.setValue("acceptTerms", !!checked)
            }
            className={
              signupForm.formState.errors.acceptTerms
                ? "border-destructive"
                : ""
            }
          />
          <Label
            htmlFor="acceptTerms"
            className="text-sm leading-relaxed cursor-pointer"
          >
            Li e aceito os{" "}
            <Link to="/termos" className="text-primary hover:underline">
              Termos de Uso
            </Link>{" "}
            e a{" "}
            <Link to="/privacidade" className="text-primary hover:underline">
              Política de Privacidade
            </Link>
          </Label>
        </div>
        {signupForm.formState.errors.acceptTerms && (
          <p
            className="text-sm text-destructive"
            role="alert"
            aria-live="polite"
          >
            {signupForm.formState.errors.acceptTerms.message}
          </p>
        )}

        {/* Submit Button */}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Criando conta...
            </>
          ) : (
            "Criar conta"
          )}
        </Button>

        {/* Switch to Sign In */}
        <div className="text-center text-sm">
          <span className="text-muted-foreground">Já tem uma conta? </span>
          <button
            type="button"
            onClick={() => onModeChange("signin")}
            className="text-primary hover:underline font-medium"
          >
            Acessar área segura
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={loginForm.handleSubmit(handleSignIn)} className="space-y-4">
      {status === "offline" && (
        <ErrorBanner
          message={ERROR_MESSAGES.NETWORK}
          onRetry={() => window.location.reload()}
        />
      )}
      {status === "error" && formError && (
        <ErrorBanner message={formError} onRetry={() => setFormError(null)} />
      )}
      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          placeholder="seu@email.com"
          {...loginForm.register("email")}
          className={
            loginForm.formState.errors.email ? "border-destructive" : ""
          }
        />
        {loginForm.formState.errors.email && (
          <p
            className="text-sm text-destructive"
            role="alert"
            aria-live="polite"
          >
            {loginForm.formState.errors.email.message}
          </p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <div className="relative flex-1">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              aria-invalid={!!loginForm.formState.errors.password}
              aria-describedby={
                loginForm.formState.errors.password
                  ? "password-help"
                  : undefined
              }
              {...loginForm.register("password")}
              className={
                loginForm.formState.errors.password
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
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
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
          {loginForm.formState.errors.password && (
            <span
              id="password-help"
              role="alert"
              className="text-sm text-destructive whitespace-nowrap"
            >
              {loginForm.formState.errors.password.message}
            </span>
          )}
        </div>
      </div>

      {/* Remember Me */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="rememberMe"
            checked={loginForm.watch("rememberMe")}
            onCheckedChange={(checked) =>
              loginForm.setValue("rememberMe", !!checked)
            }
          />
          <Label htmlFor="rememberMe" className="text-sm cursor-pointer">
            Lembrar de mim
          </Label>
        </div>

        <Link to="/reset" className="text-sm text-primary hover:underline">
          Esqueci minha senha
        </Link>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full"
        disabled={isLoading || !loginForm.formState.isValid}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Acessando...
          </>
        ) : (
          "Acessar área segura"
        )}
      </Button>

      {/* Switch to Sign Up */}
      <div className="text-center text-sm">
        <span className="text-muted-foreground">Não tem uma conta? </span>
        <button
          type="button"
          onClick={() => onModeChange("signup")}
          className="text-primary hover:underline font-medium"
        >
          Criar conta
        </button>
      </div>
    </form>
  );
};
