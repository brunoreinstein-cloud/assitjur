import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface FinalCTAProps {
  onOpenBetaModal?: () => void;
}

export function FinalCTA({ onOpenBetaModal }: FinalCTAProps) {
  return (
    <section id="cta-final" className="py-16 bg-gradient-to-br from-primary/10 to-accent/10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-background/80 backdrop-blur-sm rounded-2xl p-8 md:p-12 shadow-glow border border-primary/20">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Experimente o futuro da gestão do contencioso
            </h2>
            
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Seja um dos primeiros a acessar o HubJUR.IA e transforme a forma como sua empresa ou escritório gerencia passivos judiciais.
            </p>
            
            <Button 
              size="lg"
              onClick={onOpenBetaModal}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg group shadow-lg"
            >
              Entrar na Lista Beta
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            
            <p className="text-sm text-muted-foreground mt-4">
              Acesso prioritário • Sem compromisso • Suporte especializado
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}