import { AboutHeader } from '@/components/sobre/AboutHeader';
import { HeroAbout } from '@/components/sobre/HeroAbout';
import { HubSection } from '@/components/sobre/HubSection';
import { BiancaSection } from '@/components/sobre/BiancaSection';
import { TrustBlock } from '@/components/sobre/TrustBlock';
import { SecuritySection } from '@/components/sobre/SecuritySection';
import { FinalCTA } from '@/components/sobre/FinalCTA';
import { Footer } from '@/components/site/Footer';

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <AboutHeader />
      <main>
        <HeroAbout />
        <HubSection />
        <BiancaSection />
        <TrustBlock />
        <SecuritySection />
        <FinalCTA />
      </main>
      <div id="contato">
        <Footer />
      </div>
    </div>
  );
}