import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Shield, Lock, Eye, UserCheck, Download } from "lucide-react";

const securityItems = [
  {
    id: "encryption",
    icon: Lock,
    title: "Criptografia ponta-a-ponta",
    content:
      "Todos os dados são protegidos com criptografia AES-256 em trânsito e em repouso, garantindo que apenas usuários autorizados tenham acesso às informações sensíveis.",
  },
  {
    id: "permissions",
    icon: UserCheck,
    title: "Permissões granulares e 2FA",
    content:
      "Sistema de permissões baseado em funções (RBAC) com autenticação de dois fatores obrigatória para todos os usuários, garantindo acesso controlado e seguro.",
  },
  {
    id: "audit",
    icon: Eye,
    title: "Trilha de auditoria completa",
    content:
      "Registro detalhado de todas as ações realizadas na plataforma, incluindo timestamps, usuários responsáveis e alterações realizadas, para total rastreabilidade.",
  },
  {
    id: "review",
    icon: Shield,
    title: "Revisão humana obrigatória",
    content:
      "Todas as análises e recomendações da IA passam por validação humana especializada antes da disponibilização, garantindo precisão e responsabilidade.",
  },
  {
    id: "portability",
    icon: Download,
    title: "Portabilidade total",
    content:
      "Exportação completa de dados a qualquer momento em formatos padrão, garantindo que você mantenha total controle sobre suas informações.",
  },
];

export function SecuritySection() {
  return (
    <section id="seguranca" className="py-16 bg-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Segurança & Conformidade
            </h2>
            <p className="text-xl text-muted-foreground">
              Proteção empresarial com os mais altos padrões de segurança
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {securityItems.map((item) => {
              const Icon = item.icon;
              return (
                <AccordionItem
                  key={item.id}
                  value={item.id}
                  className="border rounded-lg px-6 bg-background shadow-sm"
                >
                  <AccordionTrigger className="hover:no-underline py-6">
                    <div className="flex items-center space-x-4 text-left">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <span className="text-lg font-semibold text-foreground">
                        {item.title}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-6 pt-2">
                    <p className="text-muted-foreground leading-relaxed ml-14">
                      {item.content}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground italic">
              Validação nos autos é obrigatória.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
