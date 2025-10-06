import { FeatureCard } from "@/components/ui/feature-card";
import { Section, SectionHeader, SectionTitle } from "@/components/ui/section";
import { Building2, Briefcase, TrendingUp, Users } from "lucide-react";

export function Audience() {
  const audiences = [
    {
      icon: Building2,
      variant: "primary" as const,
      title: "Empresas",
      description: "Empresas com volume de processos judiciais, que buscam aumentar a governança, mapear seu passivo, reduzir riscos, otimizar provisões e transformar dados em insights estratégicos.",
    },
    {
      icon: Briefcase,
      variant: "accent" as const,
      title: "Escritórios de Advocacia",
      description: "Escritórios de advocacia que desejam aumentar eficiência, fortalecer a governança e aplicar inteligência na condução do contencioso.",
    },
    {
      icon: TrendingUp,
      variant: "success" as const,
      title: "Investidores",
      description: "Investidores que precisam de informações confiáveis, transparência e previsibilidade para avaliar e estruturar oportunidades.",
    },
    {
      icon: Users,
      variant: "primary" as const,
      title: "Advogados Autônomos",
      description: "Profissionais que atuam individualmente e desejam ganhar escala, reduzir tempo operacional, competir com bancas maiores e entregar mais valor aos clientes.",
    },
  ];

  return (
    <Section variant="default" size="lg">
      <SectionHeader align="center" spacing="lg">
        <SectionTitle>Para Quem</SectionTitle>
      </SectionHeader>

      <div className="grid md:grid-cols-4 gap-6">
        {audiences.map((audience, index) => (
          <FeatureCard
            key={index}
            icon={audience.icon}
            title={audience.title}
            description={audience.description}
            iconVariant={audience.variant}
            size="lg"
          />
        ))}
      </div>
    </Section>
  );
}
