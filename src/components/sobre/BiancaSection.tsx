import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building, Award, TrendingUp, ChevronDown, ChevronUp, Users, Calendar, Briefcase } from 'lucide-react';

const timeline = [
  {
    icon: Building,
    period: '2005-2015',
    title: 'Machado Meyer (Banca)',
    description: 'Liderou a área trabalhista no Sul, estruturando estratégias de alto desempenho para multinacionais.',
    impact: 'Liderou equipes de 15-30 pessoas',
    results: 'Redução 50% custos processuais'
  },
  {
    icon: Award,
    period: '2015-2023',
    title: 'Cogna Educação (Empresa)',
    description: 'Comandou um dos maiores contenciosos do país. Prêmios: Melhor Departamento Jurídico Trabalhista e Melhor Departamento Jurídico do Brasil – Setor Educacional (2021–2023).',
    impact: 'Gerenciou carteira R$ 1.8Bi+',
    results: 'Prêmios nacionais consecutivos'
  },
  {
    icon: TrendingUp,
    period: '2023-Atual',
    title: 'BT Solutions/Prisma Capital (Consultoria/Startup)',
    description: 'Criou área dedicada à gestão de passivos trabalhistas com tecnologia e inovação, unindo expertise jurídica ao mercado financeiro.',
    impact: 'Inovação em LegalTech',
    results: 'AssistJur.IA - Plataforma pioneira'
  }
];

const awards = [
  'Melhor Departamento Jurídico Trabalhista',
  'Melhor Departamento Jurídico - Setor Educacional',
  'Liderança em Inovação Jurídica',
  'Excelência em Gestão de Passivos'
];

export function BiancaSection() {
  const [expandedItem, setExpandedItem] = useState<number | null>(null);

  const toggleExpand = (index: number) => {
    setExpandedItem(expandedItem === index ? null : index);
  };

  return (
    <section id="bianca-section" className="py-20 bg-gradient-to-br from-muted/10 to-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,hsl(var(--primary))_0%,transparent_50%)] opacity-5"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,hsl(var(--accent))_0%,transparent_50%)] opacity-5"></div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-6xl mx-auto">
          {/* Enhanced Header */}
          <div className="text-center mb-16">
            <div className="relative inline-block mb-8">
              <div className="w-40 h-40 mx-auto bg-gradient-to-br from-primary via-accent to-primary rounded-full p-1 shadow-glow animate-pulse">
                <div className="w-full h-full bg-gradient-to-br from-background/20 to-background/40 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/20">
                  <span className="text-3xl font-bold bg-gradient-to-br from-primary-foreground to-accent-foreground bg-clip-text text-transparent">BR</span>
                </div>
              </div>
              
              {/* Floating Achievement Badges */}
              <div className="absolute -top-2 -right-8 animate-bounce delay-1000">
                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 shadow-lg">
                  <Award className="h-3 w-3 mr-1" />
                  Top Expert
                </Badge>
              </div>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Bianca Reinstein
            </h2>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              Mais de duas décadas transformando a gestão do contencioso jurídico em grandes corporações através de 
              <span className="text-primary font-semibold"> inovação e liderança estratégica</span>
            </p>
            
            {/* Key Metrics */}
            <div className="grid grid-cols-3 gap-6 max-w-md mx-auto mb-8">
              <div className="text-center animate-fade-in" style={{ animationDelay: '100ms' }}>
                <div className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">20+</div>
                <div className="text-sm text-muted-foreground">Anos</div>
              </div>
              <div className="text-center animate-fade-in" style={{ animationDelay: '200ms' }}>
                <div className="text-3xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">50+</div>
                <div className="text-sm text-muted-foreground">Equipes</div>
              </div>
              <div className="text-center animate-fade-in" style={{ animationDelay: '300ms' }}>
                <div className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">R$ 2Bi+</div>
                <div className="text-sm text-muted-foreground">Gerenciado</div>
              </div>
            </div>
            
            <p className="text-muted-foreground leading-relaxed max-w-4xl mx-auto">
              A criadora do AssistJur.IA é referência nacional em gestão estratégica de passivos judiciais e inovação jurídica. 
              Sua trajetória combina advocacia de banca, liderança corporativa e consultoria estratégica, sempre com foco em 
              resultados mensuráveis e transformação digital.
            </p>
          </div>

          {/* Interactive Timeline */}
          <div className="mb-16">
            <h3 className="text-3xl font-semibold text-foreground mb-12 text-center">
              Trajetória Profissional
            </h3>
            
            <div className="relative">
              {/* Timeline Line */}
              <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 w-1 bg-gradient-to-b from-primary via-accent to-primary h-full rounded-full opacity-20"></div>
              
              <div className="space-y-8">
                {timeline.map((item, index) => {
                  const Icon = item.icon;
                  const isExpanded = expandedItem === index;
                  const isLeft = index % 2 === 0;
                  
                  return (
                    <div key={index} className={`relative flex items-center ${isLeft ? 'md:flex-row' : 'md:flex-row-reverse'} animate-fade-in`} style={{ animationDelay: `${index * 100}ms` }}>
                      {/* Timeline Node */}
                      <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 w-6 h-6 bg-gradient-to-br from-primary to-accent rounded-full border-4 border-background shadow-glow z-10">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-full animate-ping opacity-20"></div>
                      </div>
                      
                      {/* Content Card */}
                      <div className={`w-full md:w-5/12 ${isLeft ? 'md:pr-8' : 'md:pl-8'}`}>
                        <Card className="group hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 border-transparent hover:border-primary/30 cursor-pointer" onClick={() => toggleExpand(index)}>
                          <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                              <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center group-hover:from-primary/30 group-hover:to-accent/30 transition-all flex-shrink-0 shadow-lg">
                                <Icon className="h-7 w-7 text-primary" />
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-3">
                                  <Badge variant="outline" className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30 text-primary text-xs">
                                    {item.period}
                                  </Badge>
                                  {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground transition-transform" /> : <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform" />}
                                </div>
                                
                                <h4 className="font-semibold text-foreground mb-2 text-lg">{item.title}</h4>
                                
                                <p className="text-muted-foreground text-sm leading-relaxed">
                                  {item.description}
                                </p>
                                
                                {isExpanded && (
                                  <div className="mt-4 pt-4 border-t border-border animate-fade-in">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                      <div className="bg-gradient-to-r from-primary/5 to-accent/5 p-3 rounded-lg">
                                        <div className="font-medium text-foreground mb-1 flex items-center gap-2">
                                          <Users className="h-3 w-3 text-primary" />
                                          Impacto
                                        </div>
                                        <div className="text-muted-foreground">{item.impact}</div>
                                      </div>
                                      <div className="bg-gradient-to-r from-accent/5 to-primary/5 p-3 rounded-lg">
                                        <div className="font-medium text-foreground mb-1 flex items-center gap-2">
                                          <TrendingUp className="h-3 w-3 text-accent" />
                                          Resultados
                                        </div>
                                        <div className="text-muted-foreground">{item.results}</div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Enhanced Awards */}
          <div className="text-center">
            <h3 className="text-3xl font-semibold text-foreground mb-8">
              Prêmios e Reconhecimentos
            </h3>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {awards.map((award, index) => (
                <Card key={index} className="hover:shadow-lg transition-all hover:scale-105 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                  <CardContent className="p-4 text-center">
                    <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-full flex items-center justify-center">
                      <Award className="h-6 w-6 text-yellow-600" />
                    </div>
                    <p className="text-sm font-medium text-foreground leading-snug">{award}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}