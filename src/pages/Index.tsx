import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/home/Header";
import { HeroDropzone } from "@/components/home/HeroDropzone";
import { FeatureCard } from "@/components/home/FeatureCard";
import { DataPreview } from "@/components/home/DataPreview";
import { TrustBand } from "@/components/home/TrustBand";
import { UploadModal } from "@/components/home/UploadModal";
import { FileText, Scale, Shield } from "lucide-react";

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
      icon: FileText,
      title: "Análise CNJ",
      description: "Consulte por CNJ e visualize prazos, eventos e riscos.",
      linkTo: "/dados/mapa?tab=por-processo",
      exampleLink: "/dados/mapa?tab=por-processo&cnj=0001234-56.2024.5.01.0001"
    },
    {
      icon: Scale,
      title: "Padrões de Risco",
      description: "Identifique triangulações, trocas diretas e provas emprestadas.",
      linkTo: "/dados/mapa?tab=por-processo&filtro=triangulacao"
    },
    {
      icon: Shield,
      title: "Conformidade LGPD",
      description: "Máscara de PII e trilha de auditoria.",
      linkTo: "/config/privacidade"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-16">
          {/* Hero with Dropzone */}
          <HeroDropzone />

          {/* Feature Cards */}
          <section className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                linkTo={feature.linkTo}
                exampleLink={feature.exampleLink}
              />
            ))}
          </section>

          {/* Data Preview */}
          <DataPreview />

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