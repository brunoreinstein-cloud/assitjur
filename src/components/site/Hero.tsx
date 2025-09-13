import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowDown } from 'lucide-react';
import { NeedsForm } from './NeedsForm';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { track } from '@/lib/track';

interface HeroProps {
  onSignup?: (data: { email: string; needs: string[]; otherNeed?: string }) => void;
}

export function Hero({ onSignup }: HeroProps) {
  const [showForm, setShowForm] = useState(false);

  const scrollToForm = () => {
    track('cta_click', { id: 'hero-testar-hub' });
    setShowForm(true);
    setTimeout(() => {
      const formElement = document.getElementById('needs-form');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  return (
    <section className="relative min-h-screen flex flex-col justify-center bg-gradient-to-br from-background via-background to-muted/30">
      {/* Gradient glow effect */}
      <div className="absolute inset-0 bg-gradient-glow pointer-events-none" />
      
      <div className="container mx-auto px-6 py-20 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Logo e Tagline */}
          <div className="space-y-4">
            <div className="inline-flex items-center space-x-3 mb-4">
              <BrandLogo size="lg" className="h-16 md:h-20" />
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Gestão do contencioso com inovação e olhar estratégico
            </p>
          </div>

          {/* H1 Principal */}
          <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
            O primeiro hub de agentes de IA especializados em{' '}
            <span className="text-transparent bg-gradient-primary bg-clip-text">
              gestão estratégica do contencioso
            </span>
          </h1>

          {/* CTA Principal */}
          <div className="space-y-4">
            <Button 
              size="lg" 
              onClick={scrollToForm}
              className="bg-gradient-primary hover:shadow-glow text-lg px-8 py-6 transition-all duration-300"
            >
              Testar o Hub
              <ArrowDown className="ml-2 h-5 w-5" />
            </Button>
            <p className="text-muted-foreground">
              Seja o primeiro a experimentar. Entre na lista Beta.
            </p>
          </div>

          {/* Hero Image Placeholder */}
          <div className="mt-16 relative">
            <div className="w-full max-w-3xl mx-auto h-64 rounded-2xl bg-gradient-card border border-border/50 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-primary flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-accent animate-pulse" />
                </div>
                <p className="text-muted-foreground">Ilustração da rede neural/hub digital</p>
              </div>
            </div>
          </div>
        </div>

        {/* Mini-formulário */}
        {showForm && (
          <div id="needs-form" className="mt-20 max-w-2xl mx-auto">
            <NeedsForm onSubmit={onSignup} />
          </div>
        )}
      </div>
    </section>
  );
}