import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowDown, Sparkles, Users, Shield, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NeedsForm } from './NeedsForm';

interface ImprovedHeroProps {
  onSignup?: (data: { email: string; needs: string[]; otherNeed?: string }) => void;
}

const trustIndicators = [
  { icon: Users, label: '1000+ Empresas', desc: 'Confiaram em nossa expertise' },
  { icon: Shield, label: 'LGPD Compliant', desc: 'Máxima segurança de dados' },
  { icon: TrendingUp, label: '80% Redução', desc: 'Em tarefas operacionais' }
];

export function ImprovedHero({ onSignup }: ImprovedHeroProps) {
  const [formVisible, setFormVisible] = useState(false);
  const navigate = useNavigate();

  const scrollToForm = () => {
    setFormVisible(true);
    setTimeout(() => {
      const formElement = document.getElementById('needs-form');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  return (
    <section id="hero" className="relative min-h-screen flex flex-col justify-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/30" />
      <div className="absolute inset-0 bg-gradient-glow" />
      
      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="space-y-8 animate-fade-in">
            {/* Brand Badge */}
            <div className="inline-flex items-center space-x-3 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                AssistJur.IA - Gestão do contencioso com inovação
              </span>
            </div>

            {/* Main Headline */}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                O primeiro hub de{' '}
                <span className="relative">
                  <span className="absolute inset-0 bg-gradient-primary bg-clip-text text-transparent blur-sm opacity-50" />
                  <span className="relative bg-gradient-primary bg-clip-text text-transparent">
                    agentes de IA
                  </span>
                </span>
                {' '}especializados em gestão estratégica do contencioso
              </h1>
              
              <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
                Transforme sua carteira judicial com inteligência artificial especializada. 
                Governança, eficiência e estratégia em uma única plataforma.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                onClick={() => navigate('/beta')}
                className="bg-gradient-primary hover:bg-primary/90 text-lg px-8 py-6 shadow-lg hover:shadow-glow transition-all duration-300 group"
              >
                Testar o Hub
                <ArrowDown className="ml-2 h-5 w-5 group-hover:translate-y-1 transition-transform" />
              </Button>
              
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => document.getElementById('diferenciais')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-lg px-8 py-6 hover:bg-muted/50 transition-all duration-300"
              >
                Conhecer Diferenciais
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8">
              {trustIndicators.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div 
                    key={index} 
                    className="flex items-center space-x-3 p-4 rounded-lg bg-muted/30 border border-border/50 animate-slide-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0">
                      <Icon className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <div className="font-semibold text-foreground text-sm">
                        {item.label}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column - Visual */}
          <div className="relative animate-scale-in" style={{ animationDelay: '0.2s' }}>
            <div className="relative max-w-lg mx-auto">
              {/* Main Circle */}
              <div className="w-80 h-80 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-accent/20 border-2 border-primary/30 shadow-glow animate-glow-pulse">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center relative overflow-hidden">
                  {/* Network nodes */}
                  <div className="absolute inset-4 rounded-full border border-primary/40">
                    <div className="absolute top-2 left-1/2 w-3 h-3 bg-primary rounded-full -translate-x-1/2 animate-pulse" />
                    <div className="absolute bottom-2 left-1/4 w-2 h-2 bg-accent rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
                    <div className="absolute right-4 top-1/2 w-2 h-2 bg-primary/60 rounded-full -translate-y-1/2 animate-pulse" style={{ animationDelay: '1s' }} />
                    <div className="absolute left-4 bottom-1/3 w-2 h-2 bg-accent/60 rounded-full animate-pulse" style={{ animationDelay: '1.5s' }} />
                  </div>
                  
                  {/* Center Hub */}
                  <div className="w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center shadow-lg">
                    <div className="text-center">
                      <div className="text-lg font-bold text-primary-foreground">IA</div>
                      <div className="text-xs text-primary-foreground/80">Hub</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-accent rounded-lg flex items-center justify-center shadow-lg animate-bounce" style={{ animationDelay: '2s' }}>
                <Users className="h-8 w-8 text-accent-foreground" />
              </div>
              
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-primary rounded-lg flex items-center justify-center shadow-lg animate-bounce" style={{ animationDelay: '3s' }}>
                <Shield className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
          </div>
        </div>

        {/* Form Section */}
        {formVisible && (
          <div id="needs-form" className="mt-20 animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Seja o primeiro a experimentar
              </h2>
              <p className="text-muted-foreground">
                Entre na lista Beta e tenha acesso prioritário ao AssistJur.IA
              </p>
            </div>
            <NeedsForm onSubmit={onSignup} />
          </div>
        )}
      </div>
    </section>
  );
}