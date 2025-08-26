import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Upload, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useHomeStore } from "@/lib/store/home";
import heroImage from "@/assets/hero-legal-tech.jpg";

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
    <section className="relative mb-16">
      {/* Hero Background */}
      <div 
        className="relative bg-cover bg-center rounded-2xl shadow-premium overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, hsl(var(--primary) / 0.9), hsl(var(--primary-light) / 0.8)), url(${heroImage})`,
          minHeight: '500px'
        }}
      >
        <div className="relative p-12 text-center text-primary-foreground">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Análise Avançada de Testemunhas
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 max-w-4xl mx-auto opacity-95 leading-relaxed">
            Detecte triangulações, trocas diretas e provas emprestadas 
            a partir de planilhas CSV/XLSX.
          </p>
          
          {/* Primary CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button 
              size="lg"
              onClick={handleStartAnalysis}
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-lg text-lg px-8 py-3"
            >
              <ArrowRight className="w-5 h-5 mr-2" />
              Começar Análise
            </Button>
            
            <Button 
              variant="secondary"
              size="lg"
              onClick={() => setUploadOpen(true)}
              className="bg-background/10 text-primary-foreground border-primary-foreground/20 hover:bg-background/20 backdrop-blur-sm text-lg px-8 py-3"
            >
              <Upload className="w-5 h-5 mr-2" />
              Enviar Planilha
            </Button>
          </div>
          
          {/* How it works */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center gap-2">
                <Badge 
                  variant="secondary" 
                  className="bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30 backdrop-blur-sm"
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {step.number}. {step.text}
                </Badge>
                {index < steps.length - 1 && (
                  <ArrowRight className="w-4 h-4 opacity-60 hidden sm:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};