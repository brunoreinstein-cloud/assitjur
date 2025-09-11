import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Lock,
  Eye,
  UserCheck,
  ArrowRightLeft,
  FileText,
} from "lucide-react";

export function SecurityAccordion() {
  const securityItems = [
    {
      id: "dpa",
      icon: FileText,
      title: "DPA e Termos Claros",
      content:
        "Acordo de Processamento de Dados assinado com regras transparentes.",
    },
    {
      id: "encryption",
      icon: Lock,
      title: "Criptografia Ponta-a-Ponta",
      content: "Dados em trânsito e em repouso com padrão bancário.",
    },
    {
      id: "permissions",
      icon: UserCheck,
      title: "Controle de Acesso",
      content: "Permissões granulares, autenticação 2FA e logs completos.",
    },
    {
      id: "audit",
      icon: Eye,
      title: "Trilha de Auditoria",
      content: "Registro de todas as ações com timestamp e usuário.",
    },
    {
      id: "human-review",
      icon: Shield,
      title: "Revisão Humana",
      content: "Outputs de IA sempre validados por especialista jurídico.",
    },
    {
      id: "portability",
      icon: ArrowRightLeft,
      title: "Portabilidade Total",
      content: "Seus dados exportáveis a qualquer momento.",
    },
  ];

  const certifications = [
    { label: "ISO 27001", icon: "🔒" },
    { label: "SOC 2 Type II", icon: "🛡️" },
    { label: "LGPD Compliant", icon: "🇧🇷" },
    { label: "Marco Civil", icon: "⚖️" },
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
              Proteção máxima de dados com transparência total. Todos os
              requisitos da LGPD atendidos desde o primeiro dia.
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
                      <span className="font-semibold text-left">
                        {item.title}
                      </span>
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

          {/* Certificações */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground mb-6">
              Certificações destacadas
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
