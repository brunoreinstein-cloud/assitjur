import React from 'react';
import { CheckCircle, Zap, Shield, Users, TrendingUp, Clock, Star, Sparkles } from 'lucide-react';

const benefits = [
  {
    icon: Zap,
    title: 'Acesso antecipado',
    description: 'Experimente todas as funcionalidades antes do lançamento oficial',
    highlight: 'Exclusivo'
  },
  {
    icon: Users,
    title: 'Influencie o desenvolvimento',
    description: 'Seu feedback ajudará a moldar as próximas funcionalidades',
    highlight: 'Impacto direto'
  },
  {
    icon: Star,
    title: 'Suporte personalizado',
    description: 'Atendimento dedicado da equipe de desenvolvimento',
    highlight: 'Premium'
  },
  {
    icon: Shield,
    title: 'Garantia de continuidade',
    description: 'Migração automática para a versão premium quando disponível',
    highlight: 'Sem interrupção'
  },
  {
    icon: TrendingUp,
    title: 'Resultados comprovados',
    description: 'Reduza até 80% do tempo em tarefas operacionais',
    highlight: 'ROI imediato'
  },
  {
    icon: Clock,
    title: 'Sem compromisso',
    description: 'Cancele a qualquer momento, sem taxas ou penalidades',
    highlight: 'Flexibilidade total'
  }
];

export function BetaBenefits() {
  return (
    <section className="py-20 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-primary" aria-hidden="true" focusable="false" />
            <span className="text-sm font-medium text-primary">Vantagens exclusivas</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Por que participar do programa Beta?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Mais do que acesso antecipado, você terá a oportunidade de moldar 
            o futuro da gestão do contencioso com IA.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div 
                key={index}
                className="group p-6 bg-card border rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6 text-primary-foreground" aria-hidden="true" focusable="false" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-foreground">
                        {benefit.title}
                      </h3>
                      <span className="text-xs px-2 py-1 bg-accent/20 text-accent rounded-full font-medium">
                        {benefit.highlight}
                      </span>
                    </div>
                    
                    <p className="text-muted-foreground leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Trust Elements */}
        <div className="mt-16 p-8 bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20 rounded-2xl">
          <div className="text-center">
            <div className="flex justify-center items-center space-x-2 mb-4">
              <CheckCircle className="w-5 h-5 text-green-500" aria-hidden="true" focusable="false" />
              <span className="font-semibold text-foreground">Programa Beta Limitado</span>
            </div>
            
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Aceitamos apenas <strong>100 participantes</strong> para garantir 
              qualidade no feedback e suporte personalizado para cada beta tester.
            </p>
            
            <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-green-500" aria-hidden="true" focusable="false" />
                <span>LGPD Compliant</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-blue-500" aria-hidden="true" focusable="false" />
                <span>Comunidade Exclusiva</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-purple-500" aria-hidden="true" focusable="false" />
                <span>Suporte 24/7</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}