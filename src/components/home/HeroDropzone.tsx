import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Upload, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useHomeStore } from "@/lib/store/home";
import { heroImageJpg, heroImageWebp, heroImageAvif } from "@/assets/heroImages";

export const HeroDropzone = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setUploadOpen } = useHomeStore();

  const steps = [
    { number: 1, text: "Envie planilha" },
    { number: 2, text: "Sistema cruza vínculos" },
    { number: 3, text: "Receba alertas de risco" }
  ];

  const handleStartAnalysis = () => {
    if (user) {
      navigate('/dados/mapa');
    } else {
      navigate('/login');
    }
  };

  return (
    <section className="relative mb-20">
      {/* Hero Background */}
      <div 
        className="relative bg-cover bg-center rounded-3xl shadow-premium overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, hsl(var(--primary) / 0.95), hsl(var(--primary-light) / 0.85)), image-set(url(${heroImageAvif}) type('image/avif'), url(${heroImageWebp}) type('image/webp'), url(${heroImageJpg}) type('image/jpeg'))`,
          minHeight: '600px'
        }}
      >
        <div className="relative p-16 text-center text-primary-foreground">
          <h1 className="text-6xl md:text-7xl font-bold mb-8 leading-tight">
            Análise Inteligente de
            <span className="block bg-gradient-to-r from-primary-foreground to-primary-foreground/80 bg-clip-text text-transparent">
              Testemunhas
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl mb-12 max-w-4xl mx-auto opacity-95 leading-relaxed">
            Detecte automaticamente <strong>triangulações</strong>, <strong>trocas diretas</strong> e <strong>provas emprestadas</strong> 
            com precisão e velocidade incomparáveis.
          </p>
          
          {/* Primary CTA */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <Button 
              size="lg"
              onClick={handleStartAnalysis}
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-xl text-xl px-12 py-4 font-semibold"
            >
              <ArrowRight className="w-6 h-6 mr-3" />
              Começar Análise Grátis
            </Button>
            
            <Button 
              variant="outline"
              size="lg"
              onClick={() => setUploadOpen(true)}
              className="bg-background/10 text-primary-foreground border-primary-foreground/30 hover:bg-background/20 backdrop-blur-sm text-xl px-12 py-4 font-semibold"
            >
              <Upload className="w-6 h-6 mr-3" />
              Upload Rápido
            </Button>
          </div>
          
          {/* How it works steps */}
          <div className="flex flex-col lg:flex-row gap-6 justify-center items-center max-w-4xl mx-auto">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center gap-3">
                <div className="flex items-center gap-3 bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 rounded-full px-6 py-3">
                  <div className="w-8 h-8 bg-primary-foreground text-primary rounded-full flex items-center justify-center text-sm font-bold">
                    {step.number}
                  </div>
                  <span className="text-primary-foreground font-medium text-lg">
                    {step.text}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <ArrowRight className="w-5 h-5 opacity-60 hidden lg:block text-primary-foreground" />
                )}
              </div>
            ))}
          </div>
          
          {/* Additional info */}
          <div className="mt-12 text-sm opacity-90">
            <div className="flex flex-wrap justify-center gap-8">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Sem necessidade de cartão</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Resultados em minutos</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>LGPD compliant</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};