import { Card, CardContent } from "@/components/ui/card";
import { FeatureCard } from "@/components/ui/feature-card";
import { Section, SectionHeader, SectionTitle, SectionDescription } from "@/components/ui/section";
import {
  CheckCircle,
  Target,
  TrendingUp,
  Shield,
  Award,
  Users,
  Brain,
} from "lucide-react";

export function ValueProps() {
  const diferentials = [
    {
      icon: Brain,
      variant: "primary" as const,
      title: "Especialização Jurídica",
      description: "Desenvolvido por especialista com mais de 20 anos de experiência em gestão de contencioso.",
    },
    {
      icon: Award,
      variant: "accent" as const,
      title: "Análise Jurídica Estratégica",
      description: "Estrutura pensada para interpretar dados jurídicos, decisões e padrões processuais de forma orientada à estratégia.",
    },
    {
      icon: TrendingUp,
      variant: "success" as const,
      title: "Integração com Bases Jurídicas",
      description: "Capacidade de cruzar dados internos com informações de tribunais e sistemas públicos.",
    },
  ];

  return (
    <Section id="diferenciais" variant="muted" size="lg">
      {/* Header */}
      <SectionHeader align="center" spacing="lg">
        <SectionTitle>Diferencial AssistJur.IA</SectionTitle>
        
        <div className="max-w-4xl mx-auto space-y-6">
          <SectionDescription>
            O AssistJur.IA não é apenas um catálogo de agentes de
            inteligência artificial. É a aplicação prática da experiência
            real em gestão de carteiras judiciais complexas, transformada em
            soluções seguras, estratégicas e orientadas a resultados.
          </SectionDescription>

          <div className="bg-primary/10 border border-primary/20 rounded-lg p-6">
            <h3 className="text-2xl font-bold text-primary mb-4">
              Tecnologia + Consultoria Estratégica
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              O AssistJur.IA une inteligência artificial com a experiência
              de uma consultoria especializada em gestão de contencioso. Não
              apenas tecnologia: entregamos resultado estratégico, como em
              um projeto de consultoria, mas com escala e velocidade de IA.
            </p>
          </div>
        </div>
      </SectionHeader>

      {/* Problema vs Solução */}
      <div className="grid md:grid-cols-2 gap-8 items-center mb-16">
        <FeatureCard
          icon={Target}
          title="Problema"
          description="Excesso de soluções genéricas, pouca efetividade no contencioso."
          iconVariant="destructive"
          className="border-destructive/20 bg-destructive/5"
        />
        
        <FeatureCard
          icon={CheckCircle}
          title="Solução"
          description="Hub único, testado em grandes carteiras, com foco em governança, eficiência e estratégia."
          iconVariant="primary"
          className="border-primary/20 bg-primary/5"
        />
      </div>

      {/* Principais Focos */}
      <div className="space-y-8 mb-16">
        <h3 className="text-2xl font-bold text-center text-foreground">
          Principais focos do Hub
        </h3>

        <div className="grid md:grid-cols-4 gap-6">
          <FeatureCard
            icon={Shield}
            title="Governança"
            description="Aumento da governança sobre a carteira judicial"
            iconVariant="accent"
            size="sm"
          />
          
          <FeatureCard
            icon={Target}
            title="Estratégia"
            description="Fortalecimento da estratégia jurídica e empresarial"
            iconVariant="primary"
            size="sm"
          />
          
          <FeatureCard
            icon={TrendingUp}
            title="Produtividade"
            description="Ganhos de produtividade para equipes e escritórios"
            iconVariant="success"
            size="sm"
          />
          
          <FeatureCard
            icon={Award}
            title="Qualidade"
            description="Melhoria na qualidade dos serviços jurídicos, com apoio em dados e IA"
            iconVariant="accent"
            size="sm"
          />
        </div>
      </div>

      {/* Exclusividade */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-accent/10 mb-12">
        <CardContent className="p-8 space-y-4 text-center">
          <h3 className="text-2xl font-bold text-primary">
            Exclusividade
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            Pensado e estruturado por Bianca Reinstein, referência nacional
            em gestão estratégica de passivos judiciais, com mais de 20 anos
            de atuação junto a grandes empresas e escritórios.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Clientes podem ter agentes customizados para suas bases, com uso
            exclusivo e privado.
          </p>
          <p className="text-lg font-semibold text-primary">
            Assistente inteligente, sempre aliado ao olhar humano do
            advogado.
          </p>
        </CardContent>
      </Card>

      {/* Supervisão Humana */}
      <FeatureCard
        icon={Users}
        title="⚖️ Supervisão Humana Obrigatória"
        description="O AssistJur.IA funciona como um assistente inteligente, mas a análise e decisão final sempre dependem do olhar humano do advogado. Inteligência artificial estratégica, com responsabilidade e segurança."
        iconVariant="primary"
        size="lg"
        className="border-primary/30 bg-primary/5 mb-12"
      />

      {/* Por que não ChatGPT */}
      <Card className="border-border bg-muted/50 mb-12">
        <CardContent className="p-8 space-y-4 text-center max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold text-foreground">
            Por que não ChatGPT ou outras IAs?
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            Ferramentas genéricas de inteligência artificial não foram
            criadas para lidar com a complexidade do contencioso judicial.
          </p>
          <p className="text-lg font-semibold text-primary">
            O AssistJur.IA nasceu da prática jurídica e é construído sob
            medida para esse contexto.
          </p>
        </CardContent>
      </Card>

      {/* Nossos Diferenciais */}
      <div className="space-y-8">
        <h3 className="text-2xl font-bold text-center text-foreground">
          Nossos Diferenciais
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {diferentials.map((diff, index) => (
            <FeatureCard
              key={index}
              icon={diff.icon}
              title={diff.title}
              description={diff.description}
              iconVariant={diff.variant}
            />
          ))}
        </div>
      </div>
    </Section>
  );
}
