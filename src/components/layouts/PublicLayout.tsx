import { ReactNode } from "react";
import { PublicHeader } from "@/components/site/PublicHeader";
import { ClientOnlyFooter } from "@/components/site/ClientOnlyFooter";
import { BackToTopFAB } from "@/components/site/BackToTopFAB";
import { SEO } from "@/seo/SEO";

interface PublicLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  ogImage?: string;
  onBetaClick?: () => void;
  skipFooter?: boolean;
}

/**
 * PublicLayout - Layout raiz para páginas públicas
 * 
 * Features:
 * - Header de navegação
 * - Footer padronizado
 * - SEO configurável
 * - Botão "Voltar ao topo"
 * - Background e espaçamento consistentes
 */
export function PublicLayout({
  children,
  title = "AssistJur.IA - Hub de IA para Gestão Estratégica do Contencioso",
  description = "Gestão do contencioso com inovação e olhar estratégico. Hub único de agentes de IA especializados testado em grandes carteiras.",
  ogImage = "/brand/og-assistjur.png",
  onBetaClick,
  skipFooter = false,
}: PublicLayoutProps) {
  // ✅ SSR safety: Footer só renderiza no cliente
  const isSSR = typeof window === "undefined";

  return (
    <div className="min-h-screen bg-background">
      <SEO title={title} description={description} ogImage={ogImage} />
      
      <PublicHeader onBetaClick={onBetaClick} />
      
      <main className="overflow-x-hidden">
        {children}
      </main>
      
      {!skipFooter && !isSSR && <ClientOnlyFooter />}
      
      <BackToTopFAB />
    </div>
  );
}
