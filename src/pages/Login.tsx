import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Scale } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AuthCard } from '@/components/auth/AuthCard';
import { OAuthButtons } from '@/components/auth/OAuthButtons';
import { EmailPasswordForm } from '@/components/auth/EmailPasswordForm';
import { MagicLinkForm } from '@/components/auth/MagicLinkForm';
import { AlertBox } from '@/components/auth/AlertBox';
import { useAuth } from '@/hooks/useAuth';
import heroImage from "@/assets/hero-legal-tech.jpg";

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [showMagicLink, setShowMagicLink] = useState(false);

  // Check for URL parameters
  const next = searchParams.get('next');
  const confirm = searchParams.get('confirm');

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      const redirectTo = next ? decodeURIComponent(next) : '/dados/mapa';
      navigate(redirectTo);
    }
  }, [user, navigate, next]);

  const handleForgotPassword = () => {
    navigate('/reset');
  };

  const handleMagicLinkToggle = () => {
    setShowMagicLink(!showMagicLink);
  };

  const handleModeChange = (mode: 'signin' | 'signup') => {
    setActiveTab(mode);
    setShowMagicLink(false);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle lg:grid lg:grid-cols-2">
      {/* Left side - Form */}
      <div className="flex flex-col justify-center px-6 py-12 lg:px-8">
        <div className="mx-auto w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center justify-center mb-8 lg:hidden">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-md">
                <Scale className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Hubjuria</h1>
                <p className="text-sm text-muted-foreground">Assistente de Testemunhas</p>
              </div>
            </div>
          </div>

          {/* Confirmation Banner */}
          {confirm === '1' && (
            <div className="mb-6">
              <AlertBox variant="info" title="Confirme seu cadastro">
                Verifique seu e-mail e clique no link de confirmação para ativar sua conta.
              </AlertBox>
            </div>
          )}

          {/* Magic Link Form or Auth Form */}
          {showMagicLink ? (
            <AuthCard
              title="Entrar com link"
              description="Acesso seguro"
            >
              <MagicLinkForm onBack={() => setShowMagicLink(false)} />
            </AuthCard>
          ) : (
            <AuthCard
              title={activeTab === 'signin' ? 'Acesse sua conta' : 'Comece gratuitamente'}
              description="Acesso seguro"
            >
              <div className="space-y-6">
                {/* OAuth Buttons */}
                <OAuthButtons />

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'signin' | 'signup')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="signin">Entrar</TabsTrigger>
                    <TabsTrigger value="signup">Criar conta</TabsTrigger>
                  </TabsList>

                  <TabsContent value="signin" className="mt-6">
                    <EmailPasswordForm
                      mode="signin"
                      onModeChange={handleModeChange}
                      onForgotPassword={handleForgotPassword}
                    />
                    
                    {/* Magic Link Toggle */}
                    <div className="mt-4 text-center">
                      <button
                        type="button"
                        onClick={handleMagicLinkToggle}
                        className="text-sm text-primary hover:underline"
                      >
                        Entrar com link de e-mail
                      </button>
                    </div>
                  </TabsContent>

                  <TabsContent value="signup" className="mt-6">
                    <EmailPasswordForm
                      mode="signup"
                      onModeChange={handleModeChange}
                      onForgotPassword={handleForgotPassword}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </AuthCard>
          )}

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-muted-foreground">
              Dados tratados conforme{' '}
              <button className="text-primary hover:underline">LGPD</button>
              {' • '}
              <button className="text-primary hover:underline">Política de Privacidade</button>
              {' • '}
              <button className="text-primary hover:underline">Termos</button>
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Hero (hidden on mobile) */}
      <div className="hidden lg:block relative">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(135deg, hsl(var(--primary) / 0.9), hsl(var(--primary-light) / 0.8)), url(${heroImage})`
          }}
        >
          <div className="absolute inset-0 flex flex-col justify-center p-12 text-primary-foreground">
            {/* Logo */}
            <div className="flex items-center space-x-3 mb-12">
              <div className="w-12 h-12 bg-primary-foreground/20 rounded-xl flex items-center justify-center">
                <Scale className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Hubjuria</h1>
                <p className="text-sm opacity-80">Assistente de Testemunhas</p>
              </div>
            </div>

            {/* Headline */}
            <div className="space-y-6">
              <h2 className="text-4xl font-bold leading-tight">
                Análise avançada de testemunhas com LGPD by design
              </h2>
              <p className="text-xl opacity-90 leading-relaxed">
                Detecte padrões suspeitos, triangulações e provas emprestadas com total conformidade às normas de proteção de dados.
              </p>
              
              {/* Features */}
              <div className="space-y-3 pt-8">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary-foreground rounded-full"></div>
                  <span>Mascaramento automático de PII</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary-foreground rounded-full"></div>
                  <span>Trilha de auditoria completa</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary-foreground rounded-full"></div>
                  <span>Criptografia end-to-end</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;