import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building, Award, TrendingUp } from 'lucide-react';

const timeline = [
  {
    icon: Building,
    period: 'Machado Meyer (Banca)',
    description: 'Liderou a área trabalhista no Sul, estruturando estratégias de alto desempenho para multinacionais.'
  },
  {
    icon: Award,
    period: 'Cogna Educação (Empresa)',
    description: 'Comandou um dos maiores contenciosos do país. Prêmios: Melhor Departamento Jurídico Trabalhista e Melhor Departamento Jurídico do Brasil – Setor Educacional (2021–2023).'
  },
  {
    icon: TrendingUp,
    period: 'BT Solutions/Prisma Capital (Consultoria/Startup)',
    description: 'Criou área dedicada à gestão de passivos trabalhistas com tecnologia e inovação, unindo expertise jurídica ao mercado financeiro.'
  }
];

const awards = [
  'Melhor Departamento Jurídico Trabalhista',
  'Melhor Departamento Jurídico - Setor Educacional',
  'Liderança em Inovação Jurídica',
  'Excelência em Gestão de Passivos'
];

export function BiancaSection() {
  return (
    <section className="py-16 bg-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-32 h-32 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center shadow-glow border-4 border-accent/30">
                <span className="text-3xl font-bold text-primary-foreground">BR</span>
              </div>
            </div>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Sobre Bianca Reinstein
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            Especialista em gestão estratégica de passivos judiciais e inovação jurídica.
          </p>
          
          <div className="mt-6 max-w-4xl mx-auto">
            <p className="text-muted-foreground leading-relaxed">
              A criadora do HubJUR.IA, Bianca Reinstein, é referência nacional em gestão estratégica de passivos judiciais e inovação jurídica. Sua trajetória de mais de 20 anos combina advocacia de banca, liderança corporativa e consultoria estratégica.
            </p>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-8 mb-12">
          <h3 className="text-2xl font-semibold text-foreground text-center mb-8">
            Trajetória Profissional
          </h3>
          
          <div className="space-y-6">
            {timeline.map((item, index) => {
              const Icon = item.icon;
              return (
                <Card key={index} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                          <Icon className="h-6 w-6 text-primary-foreground" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-foreground mb-2">
                          {item.period}
                        </h4>
                        <p className="text-muted-foreground leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Awards */}
        <div className="text-center">
          <h3 className="text-2xl font-semibold text-foreground mb-6">
            Prêmios e Reconhecimentos
          </h3>
          
          <div className="flex flex-wrap justify-center gap-3">
            {awards.map((award, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="px-4 py-2 text-sm bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20"
              >
                {award}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}