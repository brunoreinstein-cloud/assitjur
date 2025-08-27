import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface FinalCTAProps {
  onOpenBetaModal?: () => void;
}

export function FinalCTA({ onOpenBetaModal }: FinalCTAProps) {
  return (
    <section id="cta-final" className="py-20 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary))_0%,transparent_50%)] opacity-10"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,hsl(var(--accent))_0%,transparent_50%)] opacity-10"></div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-br from-background/90 to-background/70 backdrop-blur-sm rounded-3xl p-8 md:p-16 shadow-glow border-2 border-primary/20 relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-full -translate-x-16 -translate-y-16"></div>
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-br from-accent/20 to-transparent rounded-full translate-x-12 translate-y-12"></div>
            
            <div className="relative">
              {/* Urgency Badge */}
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/30 rounded-full px-4 py-2 mb-6 animate-pulse">
                <div className="w-2 h-2 bg-primary rounded-full animate-ping"></div>
                <span className="text-sm font-medium text-primary">Vagas limitadas para acesso Beta</span>
              </div>
              
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
                Experimente o futuro da gestão do contencioso
                <span className="block text-3xl md:text-4xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mt-2">
                  com Bianca Reinstein
                </span>
              </h2>
              
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed max-w-2xl mx-auto">
                Seja um dos primeiros a acessar o HubJUR.IA e transforme a forma como sua empresa ou escritório gerencia passivos judiciais com a experiência de duas décadas no mercado.
              </p>
              
              {/* Benefits List */}
              <div className="grid md:grid-cols-3 gap-4 mb-10 text-sm">
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  Acesso prioritário
                </div>
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <div className="w-2 h-2 bg-accent rounded-full"></div>
                  Sem compromisso
                </div>
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  Suporte especializado
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button 
                  size="lg"
                  onClick={onOpenBetaModal}
                  className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground px-10 py-4 text-lg group shadow-lg hover:shadow-xl transition-all"
                >
                  Entrar na Lista Beta
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                
                <p className="text-sm text-muted-foreground">
                  <strong>Apenas 100 vagas</strong> • Inscrições encerram em breve
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}