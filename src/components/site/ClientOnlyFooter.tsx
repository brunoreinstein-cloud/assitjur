"use client";

import { useEffect, useState, lazy, Suspense } from "react";

// ✅ Lazy import - módulo só é carregado no cliente
const Footer = lazy(() => import("./Footer"));

/**
 * ClientOnlyFooter - Wrapper que garante que o Footer só renderiza no cliente
 * 
 * Previne erros de SSR/prerender ao evitar que useConsent seja chamado
 * durante o server-side rendering.
 */
export function ClientOnlyFooter() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // ✅ Only run on client-side
    if (typeof window !== "undefined") {
      setIsMounted(true);
    }
  }, []);

  // ✅ Guard SSR/prerender - return null during server-side rendering
  if (typeof window === "undefined" || !isMounted) {
    return null;
  }

  // ✅ Suspense para lazy loading - Footer só carrega após hidratação
  return (
    <Suspense fallback={null}>
      <Footer />
    </Suspense>
  );
}
