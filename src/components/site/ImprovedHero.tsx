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
                O Hub de IA Estratégica para Contencioso
              </span>
            </div>

            {/* Main Headline */}
            <div className="space-y-4">
              <h1
                id="main-heading"
                tabIndex={-1}
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight"
              >
                AssistJur.IA —{' '}
                <span className="relative">
                  <span className="text-primary">
                    Inteligência Artificial Estratégica
                  </span>
                </span>
                {' '}para Gestão do{' '}
                <span className="text-accent font-black">Contencioso</span>
              </h1>
              
              <div className="space-y-4">
                <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
                  Transforme sua carteira judicial com inteligência artificial especializada. 
                  Governança, eficiência e estratégia em uma única plataforma. Criado por Bianca Reinstein, 
                  especialista com mais de 20 anos em gestão de passivos judiciais complexos.
                </p>
                <p className="text-lg text-primary font-medium">
                  ✨ Acessível para advogados autônomos, pequenas, médias e grandes empresas e escritórios de advocacia — de fácil e rápida implantação.
                </p>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                onClick={scrollToForm}
                className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all duration-300 group"
              >
                🚀 Testar o Hub
                <ArrowDown className="ml-2 h-5 w-5 group-hover:translate-y-1 transition-transform" />
              </Button>
              
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => document.getElementById('diferenciais')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-lg px-8 py-6 transition-all duration-300"
              >
                🔎 Conhecer Diferenciais
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 border-t border-accent/20">
              {trustIndicators.map((item, index) => {
                return (
                  <div 
                    key={index} 
                    className="flex items-center space-x-3 p-4 rounded-lg bg-muted/30 border border-border/50 animate-slide-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                      {/* Geometric minimalist icons */}
                      {index === 0 && <div className="w-4 h-4 border-2 border-primary-foreground rounded-sm" />}
                      {index === 1 && <div className="w-3 h-3 bg-primary-foreground rounded-full" />}
                      {index === 2 && <div className="w-4 h-4 bg-primary-foreground transform rotate-45" />}
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

          {/* Right Column - Dashboard Jurídico */}
          <div className="relative animate-scale-in" style={{ animationDelay: '0.2s' }}>
            <div className="relative max-w-md mx-auto">
              {/* Dashboard Container */}
              <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-lg">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-foreground">Dashboard Jurídico</h3>
                  <div className="w-3 h-3 bg-accent rounded-full animate-pulse" />
                </div>

                {/* Stats Cards Grid */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {/* Card Processos */}
                  <div className="bg-muted/30 border border-border/30 rounded-lg p-3 animate-fade-in">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-primary rounded-sm" />
                      <span className="text-xs font-medium text-muted-foreground">PROCESSOS</span>
                    </div>
                    <div className="text-xl font-bold text-foreground">1.247</div>
                    <div className="text-xs text-success">+12%</div>
                  </div>

                  {/* Card Riscos */}
                  <div className="bg-muted/30 border border-border/30 rounded-lg p-3 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-warning rounded-sm" />
                      <span className="text-xs font-medium text-muted-foreground">ALTO RISCO</span>
                    </div>
                    <div className="text-xl font-bold text-foreground">43</div>
                    <div className="text-xs text-warning">Atenção</div>
                  </div>

                  {/* Card Insights */}
                  <div className="bg-muted/30 border border-border/30 rounded-lg p-3 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-accent rounded-sm" />
                      <span className="text-xs font-medium text-muted-foreground">INSIGHTS</span>
                    </div>
                    <div className="text-xl font-bold text-foreground">89</div>
                    <div className="text-xs text-accent">Ativos</div>
                  </div>

                  {/* Card Economia */}
                  <div className="bg-muted/30 border border-border/30 rounded-lg p-3 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-success rounded-sm" />
                      <span className="text-xs font-medium text-muted-foreground">ECONOMIA</span>
                    </div>
                    <div className="text-xl font-bold text-foreground">87%</div>
                    <div className="text-xs text-success">Tempo</div>
                  </div>
                </div>

                {/* Chart Area */}
                <div className="bg-muted/20 border border-border/20 rounded-lg p-4 mb-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-muted-foreground">ANÁLISE TENDENCIAL</span>
                    <div className="w-1 h-1 bg-accent rounded-full" />
                  </div>
                  
                  {/* Simplified Chart */}
                  <div className="flex items-end gap-1 h-16">
                    <div className="flex-1 bg-primary/40 rounded-sm h-8" />
                    <div className="flex-1 bg-primary/60 rounded-sm h-12" />
                    <div className="flex-1 bg-primary/80 rounded-sm h-10" />
                    <div className="flex-1 bg-primary rounded-sm h-16" />
                    <div className="flex-1 bg-accent/40 rounded-sm h-14" />
                    <div className="flex-1 bg-accent/60 rounded-sm h-11" />
                    <div className="flex-1 bg-accent rounded-sm h-13" />
                  </div>
                </div>

                {/* Action Items */}
                <div className="space-y-2 animate-fade-in" style={{ animationDelay: '0.5s' }}>
                  <div className="flex items-center gap-3 p-2 bg-muted/20 rounded-lg border border-accent/20">
                    <div className="w-1.5 h-1.5 bg-accent rounded-full" />
                    <span className="text-xs text-foreground">Revisar 3 processos críticos</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-muted/20 rounded-lg border border-primary/20">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                    <span className="text-xs text-foreground">Gerar relatório mensal</span>
                  </div>
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