import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowDown, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NeedsForm } from '@/components/site/NeedsForm';
import { track } from '@/lib/track';
const heroAssistJurCustom = '/assets/hero-assistjur-custom.png';

interface ImprovedHeroProps {
  onSignup?: (data: { email: string; needs: string[]; otherNeed?: string }) => void;
}

// Trust indicators removed

export function ImprovedHero({ onSignup }: ImprovedHeroProps) {
  const [formVisible, setFormVisible] = useState(false);
  const navigate = useNavigate();

  const scrollToForm = () => {
    track('cta_click', { id: 'hero-testar-hub' });
    setFormVisible(true);
    setTimeout(() => {
      const formElement = document.getElementById('needs-form');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

    return (
      <section
        id="hero"
        className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-hero-gradient text-aj-text-high"
      >
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-glow" />
      
      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="space-y-8 animate-fade-in">
            {/* Brand Badge */}
              <div className="badge-gold inline-flex items-center space-x-4 shadow-md">
                <Sparkles className="h-5 w-5 text-aj-bg-deep" />
                <span className="text-base font-semibold">
                  O Hub de IA Estratégica para Contencioso
                </span>
              </div>

            {/* Main Headline */}
            <div className="space-y-4">
                <h1
                  id="main-heading"
                  tabIndex={-1}
                  className="text-4xl md:text-5xl lg:text-6xl font-bold text-aj-text-high leading-tight"
                >
                AssistJur.IA —{' '}
                <span className="relative">
                    <span className="text-aj-gold">
                    Inteligência Artificial Estratégica
                  </span>
                </span>
                {' '}para Gestão do{' '}
                  <span className="text-aj-gold font-black">Contencioso</span>
              </h1>
              
              <div className="space-y-4">
                  <p className="text-xl text-aj-text-high/80 leading-relaxed max-w-2xl">
                    Transforme sua carteira judicial com inteligência artificial especializada.
                    Governança, eficiência e estratégia em uma única plataforma. Criado por Bianca Reinstein,
                    especialista com mais de 20 anos em gestão de passivos judiciais complexos.
                  </p>
                  <p className="text-lg text-aj-gold font-medium">
                  ✨ Acessível para advogados autônomos, pequenas, médias e grandes empresas e escritórios de advocacia — de fácil e rápida implantação.
                </p>
              </div>
            </div>

            {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  onClick={scrollToForm}
                  className="btn-primary text-lg px-8 py-6 group"
                >
                  🚀 Testar o Hub
                  <ArrowDown className="ml-2 h-5 w-5 group-hover:translate-y-1 transition-transform" />
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => document.getElementById('diferenciais')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-lg px-8 py-6 transition-all duration-300 border-aj-gold text-aj-gold"
                >
                  🔎 Conhecer Diferenciais
                </Button>
              </div>

            {/* Trust Indicators section removed */}
          </div>

          {/* Right Column - Dashboard Jurídico */}
          <div className="relative animate-scale-in" style={{ animationDelay: '0.2s' }}>
            <div className="relative max-w-md mx-auto">
              {/* Main Dashboard Image */}
              <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                <img 
                  src={heroAssistJurCustom} 
                  alt="AssistJur.IA - Inteligência Artificial Estratégica para Gestão do Contencioso"
                  className="w-full h-auto object-cover"
                  loading="lazy"
                />
                
                {/* Overlay with real-time indicators */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                
                {/* Live indicator */}
                <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/20 backdrop-blur-sm rounded-full px-3 py-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-white text-xs font-medium">AO VIVO</span>
                </div>
              </div>

              {/* Floating Indicators */}
              <div className="absolute -top-3 -right-3 w-12 h-12 bg-accent/10 border-2 border-accent/30 rounded-xl flex items-center justify-center shadow-lg animate-bounce" style={{ animationDelay: '2s' }}>
                <div className="w-4 h-4 bg-accent rounded-sm rotate-45" />
              </div>
              
              <div className="absolute -bottom-3 -left-3 w-12 h-12 bg-primary/10 border-2 border-primary/30 rounded-xl flex items-center justify-center shadow-lg animate-bounce" style={{ animationDelay: '3s' }}>
                <div className="w-3 h-3 border-2 border-primary rounded-sm" />
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