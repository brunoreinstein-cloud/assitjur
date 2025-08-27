import React, { useState } from 'react';
import { AboutHeader } from '@/components/sobre/AboutHeader';
import { HeroAbout } from '@/components/sobre/HeroAbout';
import { HubSection } from '@/components/sobre/HubSection';
import { BiancaSection } from '@/components/sobre/BiancaSection';
import { TrustBlock } from '@/components/sobre/TrustBlock';
import { SecuritySection } from '@/components/sobre/SecuritySection';
import { FinalCTA } from '@/components/sobre/FinalCTA';
import { Footer } from '@/components/site/Footer';
import { BetaModal } from '@/components/sobre/BetaModal';

export default function About() {
  const [isBetaModalOpen, setIsBetaModalOpen] = useState(false);

  const openBetaModal = () => setIsBetaModalOpen(true);
  const closeBetaModal = () => setIsBetaModalOpen(false);

  return (
    <div className="min-h-screen bg-background">
      <AboutHeader onOpenBetaModal={openBetaModal} />
      <main>
        <HeroAbout />
        <HubSection />
        <BiancaSection />
        <TrustBlock />
        <SecuritySection />
        <FinalCTA onOpenBetaModal={openBetaModal} />
      </main>
      <div id="contato">
        <Footer />
      </div>
      <BetaModal isOpen={isBetaModalOpen} onClose={closeBetaModal} />
    </div>
  );
}