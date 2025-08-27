import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Shield, Lock, Eye, UserCheck, ArrowRightLeft } from 'lucide-react';

export function SecurityAccordion() {
  const securityItems = [
    {
      id: 'encryption',
      icon: Lock,
      title: 'Criptografia ponta-a-ponta',
      content: 'Todos os dados são criptografados em trânsito e em repouso usando padrões AES-256. Chaves de criptografia gerenciadas com HSM (Hardware Security Module) certificado.',
    },
    {
      id: 'permissions',
      icon: UserCheck,
      title: 'Permissões granulares e 2FA',
      content: 'Sistema de controle de acesso baseado em roles (RBAC) com autenticação de dois fatores obrigatória. Permissões configuráveis por usuário, função e tipo de dado.',
    },
    {
      id: 'audit',
      icon: Eye,
      title: 'Trilha de auditoria completa',
      content: 'Registro detalhado de todas as ações realizadas na plataforma, incluindo visualizações, modificações e exportações. Logs imutáveis com timestamp e geolocalização.',
    },
    {
      id: 'human-review',
      icon: Shield,
      title: 'Revisão humana obrigatória',
      content: 'Todas as análises de IA passam por validação humana antes da entrega final. Especialistas jurídicos revisam recomendações críticas e insights estratégicos.',
    },
    {
      id: 'portability',
      icon: ArrowRightLeft,
      title: 'Portabilidade total',
      content: 'Seus dados podem ser exportados a qualquer momento em formatos padronizados. Não há lock-in tecnológico - você mantém controle total sobre suas informações.',
    },
  ];

  const certifications = [
    { label: 'ISO 27001', icon: '🔒' },
    { label: 'SOC 2', icon: '🛡️' },
    { label: 'LGPD', icon: '🇧🇷' },
  ];

  return (
    <section className="py-20 bg-muted/20">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Segurança & Conformidade
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Seus dados protegidos com os mais altos padrões de segurança
            </p>
          </div>

          {/* Accordion */}
          <div className="mb-12">
            <Accordion type="single" collapsible className="space-y-4">
              {securityItems.map((item) => (
                <AccordionItem 
                  key={item.id}
                  value={item.id}
                  className="border border-border/50 rounded-lg px-6 bg-card"
                >
                  <AccordionTrigger className="hover:no-underline py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <item.icon className="h-5 w-5 text-primary" />
                      </div>
                      <span className="font-semibold text-left">{item.title}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-6 pt-2">
                    <p className="text-muted-foreground leading-relaxed ml-13">
                      {item.content}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Selos de Certificação */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground mb-6">
              Certificações e Conformidades
            </h3>
            <div className="flex justify-center items-center gap-6 flex-wrap">
              {certifications.map((cert, index) => (
                <Badge 
                  key={index}
                  variant="outline"
                  className="px-4 py-2 text-sm font-medium border-primary/20 text-primary hover:bg-primary/10 transition-colors"
                >
                  <span className="mr-2 text-base">{cert.icon}</span>
                  {cert.label}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}