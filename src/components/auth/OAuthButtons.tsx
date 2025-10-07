import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AUTH_CONFIG } from "@/config/auth";
import { getEnv } from "@/lib/getEnv";

interface OAuthButtonsProps {
  disabled?: boolean;
  next?: string | null;
}

export const OAuthButtons = ({ disabled, next }: OAuthButtonsProps) => {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<Record<string, number>>({});

  const handleOAuthSignIn = async (provider: "google", isRetry = false) => {
    if (!isRetry) {
      setLoadingProvider(provider);
    }

    try {
      // Check if provider is enabled
      if (!AUTH_CONFIG.FEATURES.GOOGLE_OAUTH_ENABLED) {
        toast.error("OAuth não disponível", {
          description: "Login com Google não está habilitado no momento.",
        });
        return;
      }

      // Check if Supabase is configured
      if (!supabase) {
        toast.error("OAuth não configurado", {
          description:
            "Login com provedores externos não está disponível no momento.",
        });
        return;
      }

      // Determine redirect URL based on configuration
      const { siteUrl } = getEnv();
      const redirectTo = next ? `${siteUrl}${next}` : `${siteUrl}/dados/mapa`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
        },
      });

      if (error) {
        throw error;
      }

      // Show success feedback while redirecting
      toast.success("Redirecionando...", {
        description: `Conectando com ${provider === "google" ? "Google" : provider}`,
        duration: 2000,
      });
    } catch (error: unknown) {
      console.error(`${provider} OAuth error:`, error);

      // Handle network errors with retry
      const errorMessage = error instanceof Error ? error.message : "";
      if (
        errorMessage?.includes("network") ||
        errorMessage?.includes("fetch")
      ) {
        const currentRetries = retryCount[provider] || 0;
        if (currentRetries < 2) {
          setRetryCount((prev) => ({
            ...prev,
            [provider]: currentRetries + 1,
          }));
          toast.info("Tentando novamente...", {
            description: `Erro de conexão. Tentativa ${currentRetries + 2}/3`,
          });

          setTimeout(() => {
            handleOAuthSignIn(provider, true);
          }, 1500);
        } else {
          toast.error("Erro de conexão", {
            description:
              "Verifique sua conexão com a internet e tente novamente.",
          });
        }
        return;
      }

      // Handle provider configuration errors
      if (
        errorMessage?.includes("Provider") ||
        errorMessage?.includes("client_id")
      ) {
        toast.error("Configuração OAuth", {
          description:
            "Google OAuth não está configurado corretamente. Entre em contato com o suporte.",
        });
      } else if (!supabase) {
        // Development fallback
        toast.info("Demo Mode", {
          description: `OAuth ${provider} simulado. Use o usuário demo para testar.`,
        });
      } else {
        toast.error("Erro no login", {
          description: `Não foi possível fazer login com ${provider === "google" ? "Google" : provider}. Tente novamente.`,
        });
      }
    } finally {
      setLoadingProvider(null);
    }
  };

  // Filter enabled providers
  const enabledProviders = AUTH_CONFIG.OAUTH_PROVIDERS.filter((p) => p.enabled);

  if (enabledProviders.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Ou continue com
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {AUTH_CONFIG.FEATURES.GOOGLE_OAUTH_ENABLED && (
          <Button
            variant="outline"
            onClick={() => handleOAuthSignIn("google")}
            disabled={disabled || loadingProvider !== null}
            className="w-full transition-all duration-200 hover:shadow-md"
            aria-label="Acessar área segura com Google"
          >
            {loadingProvider === "google" ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Conectando...</span>
              </div>
            ) : retryCount.google > 0 ? (
              <div className="flex items-center space-x-2">
                <RefreshCw className="h-4 w-4" />
                <span>Tentando novamente...</span>
              </div>
            ) : (
              <>
                <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="ml-2">Continuar com Google</span>
              </>
            )}
          </Button>
        )}

        {AUTH_CONFIG.FEATURES.MICROSOFT_OAUTH_ENABLED && (
          <Button
            variant="outline"
            onClick={() =>
              toast.info("Em breve", {
                description: "Microsoft SSO será habilitado em breve",
              })
            }
            disabled={true}
            className="w-full opacity-50"
            aria-label="Microsoft OAuth (em breve)"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#f25022" d="M1 1h10v10H1z" />
              <path fill="#00a4ef" d="M13 1h10v10H13z" />
              <path fill="#7fba00" d="M1 13h10v10H1z" />
              <path fill="#ffb900" d="M13 13h10v10H13z" />
            </svg>
            <span className="ml-2">Microsoft (em breve)</span>
          </Button>
        )}
      </div>
    </div>
  );
};
