import React from 'react';
import { Hero } from '@/components/site/Hero';
import { ValueProps } from '@/components/site/ValueProps';
import { Audience } from '@/components/site/Audience';
import { AgentsPreview } from '@/components/site/AgentsPreview';
import { ROI } from '@/components/site/ROI';
import { SecurityAccordion } from '@/components/site/SecurityAccordion';
import { Footer } from '@/components/site/Footer';
import { Toaster } from '@/components/ui/toaster';

export default function PublicHome() {
  const handleBetaSignup = (data: { email: string; needs: string[]; otherNeed?: string }) => {
    console.log('Beta signup data:', data);
    // Esta função será chamada quando o formulário for enviado com sucesso
  };

  return (
    <div className="min-h-screen bg-background">
      {/* SEO Metadata será adicionado via Helmet ou similar */}
      <head>
        <title>HubJUR.IA - O primeiro hub de agentes de IA para gestão estratégica do contencioso</title>
        <meta 
          name="description" 
          content="Gestão do contencioso com inovação e olhar estratégico. Hub único de agentes de IA especializados testado em grandes carteiras." 
        />
        <meta property="og:title" content="HubJUR.IA - Gestão do contencioso com IA" />
        <meta property="og:description" content="O primeiro hub de agentes de IA especializados em gestão estratégica do contencioso." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>

      <main className="overflow-x-hidden">
        {/* 1. Hero Section */}
        <Hero onSignup={handleBetaSignup} />

        {/* 2. Diferencial HubJUR.IA */}
        <ValueProps />

        {/* 3. Para Quem */}
        <Audience />

        {/* 4. Preview dos Agentes */}
        <AgentsPreview />

        {/* 5. ROI */}
        <ROI />

        {/* 6. Segurança & Conformidade */}
        <SecurityAccordion />

        {/* 7. Footer */}
        <Footer />
      </main>

      {/* Toast notifications */}
      <Toaster />
    </div>
  );
}