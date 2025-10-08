import { useState, lazy, Suspense } from "react";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { ImprovedHero } from "@/components/site/ImprovedHero";
import { BetaModal } from "@/components/sobre/BetaModal";
import { Toaster } from "@/components/ui/toaster";
import { Skeleton } from "@/components/ui/skeleton";

const ValueProps = lazy(() =>
  import("@/components/site/ValueProps").then((m) => ({
    default: m.ValueProps,
  })),
);
const Audience = lazy(() =>
  import("@/components/site/Audience").then((m) => ({ default: m.Audience })),
);
const AgentsPreview = lazy(() =>
  import("@/components/site/AgentsPreview").then((m) => ({
    default: m.AgentsPreview,
  })),
);
const ROI = lazy(() =>
  import("@/components/site/ROI").then((m) => ({ default: m.ROI })),
);
const SecurityAccordion = lazy(() =>
  import("@/components/site/SecurityAccordion").then((m) => ({
    default: m.SecurityAccordion,
  })),
);
const AboutAssistJur = lazy(() =>
  import("@/components/site/AboutAssistJur").then((m) => ({
    default: m.AboutAssistJur,
  })),
);
const AboutBianca = lazy(() =>
  import("@/components/site/AboutBianca").then((m) => ({
    default: m.AboutBianca,
  })),
);

const SectionSkeleton = () => <Skeleton className="h-64 w-full" />;

export default function PublicHome({ skipFooter = false }: { skipFooter?: boolean }) {
  const [isBetaModalOpen, setIsBetaModalOpen] = useState(false);

  const handleBetaSignup = (data: {
    email: string;
    needs: string[];
    otherNeed?: string;
  }) => {
    console.log("Beta signup data:", data);
    // Esta função será chamada quando o formulário for enviado com sucesso
  };

  const openBetaModal = () => setIsBetaModalOpen(true);
  const closeBetaModal = () => setIsBetaModalOpen(false);

  return (
    <PublicLayout
      title="AssistJur.IA - O primeiro hub de agentes de IA para gestão estratégica do contencioso"
      description="Gestão do contencioso com inovação e olhar estratégico. Hub único de agentes de IA especializados testado em grandes carteiras."
      onBetaClick={openBetaModal}
      skipFooter={skipFooter}
    >
      {/* 1. Hero Section */}
      <ImprovedHero onSignup={handleBetaSignup} />

      {/* 2. Diferencial AssistJur.IA */}
      <Suspense fallback={<SectionSkeleton />}>
        <ValueProps />
      </Suspense>

      {/* 3. Para Quem */}
      <section id="publico">
        <Suspense fallback={<SectionSkeleton />}>
          <Audience />
        </Suspense>
      </section>

      {/* 4. Preview dos Agentes */}
      <section id="agentes">
        <Suspense fallback={<SectionSkeleton />}>
          <AgentsPreview />
        </Suspense>
      </section>

      {/* 5. ROI */}
      <section id="roi">
        <Suspense fallback={<SectionSkeleton />}>
          <ROI onSignup={handleBetaSignup} />
        </Suspense>
      </section>

      {/* 6. Segurança & Conformidade */}
      <section id="seguranca">
        <Suspense fallback={<SectionSkeleton />}>
          <SecurityAccordion />
        </Suspense>
      </section>

      {/* 7. Sobre o AssistJur.IA */}
      <section id="sobre">
        <Suspense fallback={<SectionSkeleton />}>
          <AboutAssistJur />
        </Suspense>
      </section>

      {/* 8. Sobre Bianca Reinstein */}
      <section id="bianca">
        <Suspense fallback={<SectionSkeleton />}>
          <AboutBianca />
        </Suspense>
      </section>

      {/* Beta Modal */}
      <BetaModal isOpen={isBetaModalOpen} onClose={closeBetaModal} />

      {/* Toast notifications */}
      <Toaster />
    </PublicLayout>
  );
}
