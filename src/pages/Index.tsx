import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/home/Header";
import { HeroDropzone } from "@/components/home/HeroDropzone";
import { FeatureCard } from "@/components/home/FeatureCard";
import { StatsSection } from "@/components/home/StatsSection";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { DataPreview } from "@/components/home/DataPreview";
import { CTASection } from "@/components/home/CTASection";
import { TrustBand } from "@/components/home/TrustBand";
import { UploadModal } from "@/components/home/UploadModal";
import { Bot, Shield, TrendingUp, Users, FileText, Scale } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/app/chat');
    }
  }, [user, navigate]);

  const features = [
    {
      icon: Bot,
      title: "Chat com IA Jurídica",
      description: "Converse com nossa IA especializada em análise de testemunhas e obtenha insights instantâneos.",
      linkTo: "/chat",
      highlight: true
    },
    {
      icon: FileText,
      title: "Análise por Processo",
      description: "Consulte por CNJ e visualize prazos, eventos e riscos processuais detalhados.",
      linkTo: "/dados/mapa?tab=por-processo",
      exampleLink: "/dados/mapa?tab=por-processo&cnj=0001234-56.2024.5.01.0001"
    },
    {
      icon: Users,
      title: "Mapa de Testemunhas",
      description: "Visualize vínculos entre testemunhas e identifique padrões de risco automaticamente.",
      linkTo: "/dados/mapa?tab=por-testemunha"
    },
    {
      icon: TrendingUp,
      title: "Análise de Riscos",
      description: "Detecte triangulações, trocas diretas e provas emprestadas com precisão.",
      linkTo: "/dados/mapa?tab=por-processo&filtro=triangulacao"
    },
    {
      icon: Shield,
      title: "Conformidade Total",
      description: "Proteção LGPD integrada com máscara automática de dados pessoais.",
      linkTo: "/admin/config"
    },
    {
      icon: Scale,
      title: "Relatórios Jurídicos",
      description: "Gere relatórios detalhados para fundamentar suas estratégias processuais.",
      linkTo: "/dados/mapa"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-20">
          {/* Hero Section */}
          <HeroDropzone />

          {/* Stats Section */}
          <StatsSection />

          {/* Feature Cards */}
          <section className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Funcionalidades Principais
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Descubra todas as ferramentas disponíveis para análise avançada de testemunhas e identificação de riscos processuais.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <FeatureCard
                  key={index}
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                  linkTo={feature.linkTo}
                  exampleLink={feature.exampleLink}
                  highlight={feature.highlight}
                />
              ))}
            </div>
          </section>

          {/* How It Works */}
          <HowItWorksSection />

          {/* Data Preview */}
          <DataPreview />

          {/* Testimonials */}
          <TestimonialsSection />

          {/* CTA Section */}
          <CTASection />

          {/* Trust Band */}
          <TrustBand />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Scale className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">Hubjuria</span>
            </div>
            
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="/privacidade" className="hover:text-foreground transition-colors">
                Política de Privacidade
              </a>
              <a href="/termos" className="hover:text-foreground transition-colors">
                Termos
              </a>
              <a href="/contato" className="hover:text-foreground transition-colors">
                Contato
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Upload Modal */}
      <UploadModal />
    </div>
  )
}

export default Index