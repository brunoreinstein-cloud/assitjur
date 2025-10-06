import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuthCard } from "@/components/auth/AuthCard";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { EmailPasswordForm } from "@/components/auth/EmailPasswordForm";
import { MagicLinkForm } from "@/components/auth/MagicLinkForm";
import { AlertBox } from "@/components/auth/AlertBox";
import { ErrorBanner } from "@/components/common/ErrorBanner";
import { ERROR_MESSAGES } from "@/utils/errorMessages";
import { useAuth } from "@/hooks/useAuth";
import { getDefaultRedirect, AUTH_CONFIG, UserRole } from "@/config/auth";
import { BrandHeader } from "@/components/brand/BrandHeader";
import { BackToTopFAB } from "@/components/site/BackToTopFAB";

const heroImageAvif =
  "https://placehold.co/1600x900/000000/FFFFFF.avif?text=AssistJur";
const heroImageWebp =
  "https://placehold.co/1600x900/000000/FFFFFF.webp?text=AssistJur";
const heroImageJpg =
  "https://placehold.co/1600x900/000000/FFFFFF.jpg?text=AssistJur";

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [showMagicLink, setShowMagicLink] = useState(false);

  useEffect(() => {
    if (window.location.hash.includes("access_token")) {
      const cleanUrl = window.location.pathname + window.location.search;
      window.history.replaceState(null, "", cleanUrl);
    }
  }, []);

  // Check for URL parameters
  const next = searchParams.get("next");
  const confirm = searchParams.get("confirm");
  const error = searchParams.get("error");

  // Redirect if already authenticated
  useEffect(() => {
    if (user && profile) {
      if (
        profile.two_factor_enabled &&
        sessionStorage.getItem("mfa_verified") !== "true"
      ) {
        const params = new URLSearchParams();
        params.set("email", user.email ?? "");
        if (next) params.set("next", next);
        navigate(`/verify-otp?${params.toString()}`);
      } else {
        const redirectTo = getDefaultRedirect(profile.roles?.[0]?.role as UserRole || null, next);
        navigate(redirectTo);
      }
    }
  }, [user, profile, navigate, next]);

  const handleMagicLinkToggle = () => {
    setShowMagicLink(!showMagicLink);
  };

  const handleModeChange = (mode: "signin" | "signup") => {
    setActiveTab(mode);
    setShowMagicLink(false);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle lg:grid lg:grid-cols-2">
      {/* SEO and Accessibility */}
      <div className="sr-only">
        <h1 id="main-heading" tabIndex={-1}>
          Login - AssistJur.IA
        </h1>
        <p>
          Acesse sua conta do AssistJur.IA para análise avançada de testemunhas
          com conformidade LGPD
        </p>
      </div>

      {/* Left side - Form */}
      <div className="flex flex-col justify-center px-6 py-12 lg:px-8">
        <div className="mx-auto w-full max-w-md">
          <nav aria-label="breadcrumb" className="mb-4 text-sm">
            <ol className="flex items-center text-muted-foreground">
              <li>
                <Link
                  to="/"
                  className="text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm"
                >
                  AssistJur IA
                </Link>
              </li>
              <li aria-hidden="true" className="mx-2">
                ›
              </li>
              <li>
                <Link
                  to="/login"
                  aria-current="page"
                  className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm"
                >
                  Login
                </Link>
              </li>
            </ol>
          </nav>

          {/* Logo */}
          <div className="flex items-center justify-center mb-8 lg:hidden">
            <BrandHeader size="lg" className="gap-3" />
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-6">
              <ErrorBanner
                message={
                  error === "access_denied"
                    ? ERROR_MESSAGES.INCORRECT_PASSWORD
                    : ERROR_MESSAGES.NOT_FOUND
                }
                onRetry={() => window.location.reload()}
              />
            </div>
          )}

          {/* Confirmation Banner */}
          {confirm === "1" && (
            <div className="mb-6">
              <AlertBox variant="info" title="Confirme seu cadastro">
                Verifique seu e-mail e clique no link de confirmação para ativar
                sua conta.
              </AlertBox>
            </div>
          )}

          {/* Magic Link Form or Auth Form */}
          {showMagicLink && AUTH_CONFIG.FEATURES.MAGIC_LINK_ENABLED ? (
            <AuthCard
              title="Acessar área segura com link"
              description="Acesso seguro sem senha"
            >
              <MagicLinkForm onBack={() => setShowMagicLink(false)} />
            </AuthCard>
          ) : (
            <AuthCard
              title={
                activeTab === "signin"
                  ? "Acesse sua conta"
                  : "Comece gratuitamente"
              }
              description="Acesso seguro e conformidade LGPD"
            >
              <div className="space-y-6">
                {/* OAuth Buttons */}
                <OAuthButtons next={next} />

                {/* Tabs */}
                <Tabs
                  value={activeTab}
                  onValueChange={(value) =>
                    setActiveTab(value as "signin" | "signup")
                  }
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2" role="tablist">
                    <TabsTrigger
                      value="signin"
                      role="tab"
                      aria-selected={activeTab === "signin"}
                      aria-controls="signin-panel"
                    >
                      Acessar área segura
                    </TabsTrigger>
                    <TabsTrigger
                      value="signup"
                      role="tab"
                      aria-selected={activeTab === "signup"}
                      aria-controls="signup-panel"
                    >
                      Criar conta
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent
                    value="signin"
                    className="mt-6"
                    role="tabpanel"
                    id="signin-panel"
                    aria-labelledby="signin-tab"
                  >
                    <EmailPasswordForm
                      mode="signin"
                      onModeChange={handleModeChange}
                    />

                    {/* Magic Link Toggle */}
                    {AUTH_CONFIG.FEATURES.MAGIC_LINK_ENABLED && (
                      <div className="mt-4 text-center">
                        <button
                          type="button"
                          onClick={handleMagicLinkToggle}
                          className="text-sm text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm px-1 py-0.5"
                          aria-label="Alternar para acesso com link de e-mail"
                        >
                          Acessar área segura com link de e-mail
                        </button>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent
                    value="signup"
                    className="mt-6"
                    role="tabpanel"
                    id="signup-panel"
                    aria-labelledby="signup-tab"
                  >
                    <EmailPasswordForm
                      mode="signup"
                      onModeChange={handleModeChange}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </AuthCard>
          )}

          {/* Footer */}
          <footer className="mt-8 text-center">
            <p className="text-xs text-muted-foreground">
              Dados tratados conforme{" "}
              <Link
                to="/lgpd"
                className="text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm px-1"
              >
                LGPD
              </Link>
              {" • "}
              <Link
                to="/privacidade"
                className="text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm px-1"
              >
                Política de Privacidade
              </Link>
              {" • "}
              <Link
                to="/termos"
                className="text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm px-1"
              >
                Termos
              </Link>
            </p>
          </footer>
        </div>
      </div>

      <BackToTopFAB className="bottom-24" />

      {/* Right side - Hero (hidden on mobile) */}
      <aside className="hidden lg:block relative" role="complementary">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(135deg, hsl(var(--primary) / 0.9), hsl(var(--primary-light) / 0.8)), image-set(url(${heroImageAvif}) type('image/avif'), url(${heroImageWebp}) type('image/webp'), url(${heroImageJpg}) type('image/jpeg'))`,
          }}
          role="img"
          aria-label="Imagem de fundo mostrando tecnologia jurídica"
        >
          <div className="absolute inset-0 flex flex-col justify-center p-12 text-primary-foreground">
            {/* Logo */}
            <BrandHeader size="lg" className="mb-12 gap-3" />

            {/* Headline */}
            <div className="space-y-6">
              <h4 className="text-4xl font-bold leading-tight">
                Análise avançada de testemunhas com LGPD by design
              </h4>
              <p className="text-xl opacity-90 leading-relaxed">
                Detecte padrões suspeitos, triangulações e provas emprestadas
                com total conformidade às normas de proteção de dados.
              </p>

              {/* Features */}
              <ul className="space-y-3 pt-8" role="list">
                <li className="flex items-center space-x-3">
                  <div
                    className="w-2 h-2 bg-primary-foreground rounded-full"
                    aria-hidden="true"
                  ></div>
                  <span>Mascaramento automático de PII</span>
                </li>
                <li className="flex items-center space-x-3">
                  <div
                    className="w-2 h-2 bg-primary-foreground rounded-full"
                    aria-hidden="true"
                  ></div>
                  <span>Trilha de auditoria completa</span>
                </li>
                <li className="flex items-center space-x-3">
                  <div
                    className="w-2 h-2 bg-primary-foreground rounded-full"
                    aria-hidden="true"
                  ></div>
                  <span>Criptografia end-to-end</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default Login;
