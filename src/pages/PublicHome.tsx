import React, { useState } from 'react';
import { PublicHeader } from '@/components/site/PublicHeader';
import { ImprovedHero } from '@/components/site/ImprovedHero';
import { ValueProps } from '@/components/site/ValueProps';
import { Audience } from '@/components/site/Audience';
import { AgentsPreview } from '@/components/site/AgentsPreview';
import { ROI } from '@/components/site/ROI';
import { SecurityAccordion } from '@/components/site/SecurityAccordion';
import { AboutAssistJur } from '@/components/site/AboutAssistJur';
import { AboutBianca } from '@/components/site/AboutBianca';
import { Footer } from '@/components/site/Footer';
import { BetaModal } from '@/components/sobre/BetaModal';
import { Toaster } from '@/components/ui/toaster';
import { BackToTopFAB } from '@/components/site/BackToTopFAB';

export default function PublicHome() {
  const [isBetaModalOpen, setIsBetaModalOpen] = useState(false);

  const handleBetaSignup = (data: { email: string; needs: string[]; otherNeed?: string }) => {
    console.log('Beta signup data:', data);
    // Esta função será chamada quando o formulário for enviado com sucesso
  };

  const openBetaModal = () => setIsBetaModalOpen(true);
  const closeBetaModal = () => setIsBetaModalOpen(false);

  return (
    <div className="min-h-screen bg-background">
      {/* SEO Metadata será adicionado via Helmet ou similar */}
      <head>
        <title>AssistJur.IA - O primeiro hub de agentes de IA para gestão estratégica do contencioso</title>
        <meta 
          name="description" 
          content="Gestão do contencioso com inovação e olhar estratégico. Hub único de agentes de IA especializados testado em grandes carteiras." 
        />
        <meta property="og:title" content="AssistJur.IA - Gestão do contencioso com IA" />
        <meta property="og:description" content="O primeiro hub de agentes de IA especializados em gestão estratégica do contencioso." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>

      {/* Header Navigation */}
      <PublicHeader onBetaClick={openBetaModal} />

      <main className="overflow-x-hidden">
        {/* 1. Hero Section */}
        <ImprovedHero onSignup={handleBetaSignup} />

        {/* 2. Diferencial AssistJur.IA */}
        <ValueProps />

        {/* 3. Para Quem */}
        <section id="publico">
          <Audience />
        </section>

        {/* 4. Preview dos Agentes */}
        <section id="agentes">
          <AgentsPreview />
        </section>

        {/* 5. ROI */}
        <section id="roi">
          <ROI onSignup={handleBetaSignup} />
        </section>

        {/* 6. Segurança & Conformidade */}
        <section id="seguranca">
          <SecurityAccordion />
        </section>

        {/* 7. Sobre o AssistJur.IA */}
        <section id="sobre">
          <AboutAssistJur />
        </section>

        {/* 8. Sobre Bianca Reinstein */}
        <section id="bianca">
          <AboutBianca />
        </section>

        {/* 9. Footer */}
        <Footer />
      </main>

      {/* Beta Modal */}
      <BetaModal isOpen={isBetaModalOpen} onClose={closeBetaModal} />

      {/* Toast notifications */}
      <Toaster />

      <BackToTopFAB />
    </div>
  );
}