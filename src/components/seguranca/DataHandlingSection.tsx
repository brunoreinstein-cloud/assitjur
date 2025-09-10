import React from 'react';
import { EyeOff, History, Database, ShieldCheck } from 'lucide-react';

interface Practice {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  bullets: string[];
}

const practices: Practice[] = [
  {
    icon: EyeOff,
    title: 'Mascaramento de Dados',
    bullets: [
      'Informações sensíveis ocultas em telas e logs.',
      'Anonimização em ambientes de teste.',
    ],
  },
  {
    icon: History,
    title: 'Trilha de Auditoria',
    bullets: [
      'Registro de ações com timestamp e usuário.',
      'Monitoramento contínuo para segurança.',
    ],
  },
  {
    icon: Database,
    title: 'Minimização de Dados',
    bullets: [
      'Coletamos apenas o necessário para cada operação.',
      'Retenção limitada e descarte automático.',
    ],
  },
  {
    icon: ShieldCheck,
    title: 'Práticas de LGPD',
    bullets: [
      'Consentimento claro e revogável.',
      'Portal do Titular para controle dos dados.',
    ],
  },
];

export function DataHandlingSection() {
  return (
    <section className="py-12 bg-muted/20">
      <div className="container mx-auto px-6">
        <h2 className="text-2xl font-semibold mb-8 text-center">
          Como tratamos seus dados
        </h2>
        <ul className="space-y-8">
          {practices.map((p, i) => (
            <li key={i} className="flex gap-4">
              <div className="flex-shrink-0 mt-1">
                <p.icon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">{p.title}</h3>
                <ul className="list-disc ml-6 text-muted-foreground">
                  {p.bullets.map((b, idx) => (
                    <li key={idx}>{b}</li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-12 text-center">
          <a href="/portal-titular" className="text-primary underline">
            Acesse o Portal do Titular
          </a>
        </div>
      </div>
    </section>
  );
}
