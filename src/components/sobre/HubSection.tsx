import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart3, Zap, Shield, Target } from 'lucide-react';

const pillars = [
  {
    icon: BarChart3,
    title: 'Governança',
    description: 'Controle total sobre passivos judiciais'
  },
  {
    icon: Zap,
    title: 'Eficiência',
    description: 'Até 80% menos tempo operacional'
  },
  {
    icon: Shield,
    title: 'Segurança',
    description: 'Conformidade total e auditoria'
  },
  {
    icon: Target,
    title: 'Estratégia',
    description: 'Insights acionáveis para diretoria'
  }
];

export function HubSection() {
  return (
    <section id="hub-section" className="py-16 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Content Column */}
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Sobre o AssistJur.IA
              </h2>
              
              <div className="space-y-6 text-muted-foreground leading-relaxed">
                <p>
                  <strong>O que é:</strong> O AssistJur.IA nasce como um hub de agentes de inteligência artificial especializados na gestão estratégica do contencioso. Diferente de ferramentas jurídicas genéricas, sua proposta é oferecer profundidade técnica, governança e previsibilidade para empresas e escritórios que lidam com grandes carteiras de processos.
                </p>
                
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-4">
                    Principais Diferenciais
                  </h3>
                  <ul className="space-y-3">
                    <li><strong>Governança:</strong> aumenta o controle sobre o passivo judicial com dashboards e relatórios executivos.</li>
                    <li><strong>Eficiência:</strong> até 80% de redução no tempo gasto em tarefas operacionais repetitivas.</li>
                    <li><strong>Estratégia:</strong> transforma dados processuais em insights acionáveis para diretoria e comitês.</li>
                    <li><strong>Segurança & Conformidade:</strong> criptografia ponta-a-ponta, autenticação 2FA, trilhas de auditoria, revisão humana obrigatória e conformidade com LGPD/ISO/SOC2.</li>
                  </ul>
                </div>

                <p>
                  <strong>Evolução planejada:</strong> MVP com Mapeamento de Testemunhas, seguido por Catálogo de Agentes, Workspace colaborativo e, na fase 2, Marketplace de parceiros com revenue share e selo de curadoria.
                </p>
              </div>
            </div>
          </div>

          {/* Cards Column */}
          <div className="grid grid-cols-2 gap-4">
            {pillars.map((pillar, index) => {
              const Icon = pillar.icon;
              return (
                <Card key={index} className="group hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6 text-center space-y-4">
                    <div className="w-12 h-12 mx-auto bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Icon className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <h3 className="font-semibold text-foreground">
                      {pillar.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {pillar.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}