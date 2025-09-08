import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, Award, Briefcase, Users } from 'lucide-react';

export function AboutBianca() {
  const experiences = [
    {
      icon: Briefcase,
      company: 'Machado Meyer Advogados',
      role: 'Liderou área trabalhista no Sul por mais de uma década, estruturando estratégias de alto desempenho.',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      icon: Building2,
      company: 'Cogna Educação S.A.',
      role: 'Executiva Jurídica responsável por um dos maiores contenciosos do país por quase uma década, tendo recebido diversos prêmios.',
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      icon: Users,
      company: 'BT Solutions | BT Créditos',
      role: 'Estruturou área dedicada à gestão de passivos trabalhistas com foco em tecnologia e inovação.',
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
  ];

  const expertise = [
    'Banca — grande escritório de advocacia',
    'Empresa — departamento jurídico de companhia listada',
    'Consultoria/Startup — soluções estratégicas e tecnológicas',
  ];

  return (
    <section className="py-20 bg-muted/20">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              👉 Sobre Bianca Reinstein
            </h2>
          </div>

          <div className="space-y-12">
            {/* Inquietação */}
            <div className="max-w-4xl mx-auto space-y-6 text-center">
              <p className="text-xl font-semibold text-primary">
                O AssistJur.IA nasceu de uma inquietação.
              </p>
              
              <p className="text-lg text-muted-foreground leading-relaxed">
                Durante mais de 20 anos à frente da gestão de grandes carteiras judiciais, 
                Bianca Reinstein viu de perto um problema recorrente: o mercado jurídico está cheio de promessas de tecnologia, 
                mas quase sempre sem profundidade real no contencioso.
              </p>
              
              <p className="text-lg text-muted-foreground leading-relaxed">
                Foi dessa experiência que surgiu o AssistJur.IA — um hub integrado de agentes de inteligência artificial 
                construído a partir da prática real.
              </p>
            </div>

            {/* Trajetória */}
            <div className="bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-lg p-8">
              <h3 className="text-2xl font-bold text-center text-primary mb-6">
                Trajetória que legitima o Hub:
              </h3>
              <p className="text-lg text-muted-foreground text-center leading-relaxed">
                👉 Bianca Reinstein é referência nacional em gestão estratégica de passivos judiciais. 
                Com mais de 20 anos de experiência em escritórios, empresas e consultorias, 
                construiu soluções premiadas que unem prática jurídica e tecnologia.
              </p>
            </div>

            {/* Experiências Marcantes */}
            <div className="space-y-8">
              <h3 className="text-2xl font-bold text-center text-foreground">
                Experiências marcantes:
              </h3>
              
              <div className="grid md:grid-cols-3 gap-8">
                {experiences.map((exp, index) => (
                  <Card key={index} className="border-border/50 hover:shadow-lg transition-all duration-300 group h-full">
                    <CardContent className="p-6 flex flex-col h-full">
                      <div className={`w-16 h-16 mb-4 rounded-2xl ${exp.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <exp.icon className={`h-8 w-8 ${exp.color}`} />
                      </div>
                      
                      <h4 className={`text-lg font-bold ${exp.color} mb-3`}>
                        {exp.company}
                      </h4>
                      
                      <p className="text-muted-foreground text-sm leading-relaxed flex-1">
                        {exp.role}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Experiência 360º */}
            <div className="space-y-8">
              <h3 className="text-2xl font-bold text-center text-foreground">
                Experiência 360º:
              </h3>
              
              <div className="grid md:grid-cols-3 gap-6">
                {expertise.map((item, index) => (
                  <Card key={index} className="border-border/50 hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                        <Award className="h-6 w-6 text-primary" />
                      </div>
                      <p className="text-foreground font-medium">
                        {item}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}