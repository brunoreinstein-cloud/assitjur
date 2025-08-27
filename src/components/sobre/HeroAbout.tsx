import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowDown } from 'lucide-react';

export function HeroAbout() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="pt-24 pb-16 bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              HubJUR.IA: o futuro do contencioso jurídico, com inovação e experiência real
            </h1>
            
            <p className="text-xl text-muted-foreground leading-relaxed">
              Criado por Bianca Reinstein, especialista com mais de 20 anos de atuação em grandes carteiras judiciais.
            </p>

            <Button 
              variant="outline"
              onClick={() => scrollToSection('hub-section')}
              className="group"
            >
              Ver proposta de valor
              <ArrowDown className="ml-2 h-4 w-4 group-hover:translate-y-1 transition-transform" />
            </Button>
          </div>

          {/* Image/Illustration */}
          <div className="relative">
            <div className="aspect-square max-w-md mx-auto bg-gradient-to-br from-primary/10 to-accent/10 rounded-full p-8 border-2 border-accent/20">
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-32 h-32 mx-auto bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center shadow-glow">
                    <span className="text-2xl font-bold text-primary-foreground">BR</span>
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">
                    Bianca Reinstein
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}