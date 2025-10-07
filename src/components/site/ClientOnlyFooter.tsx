"use client";

import { useEffect, useState } from "react";
import Footer from "./Footer";

/**
 * ClientOnlyFooter - Wrapper que garante que o Footer só renderiza no cliente
 * 
 * Previne erros de SSR/prerender ao evitar que useConsent seja chamado
 * durante o server-side rendering.
 */
export function ClientOnlyFooter() {
  // ✅ Guard SSR/prerender ANTES de qualquer hook
  if (typeof window === "undefined") {
    return null;
  }

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Durante SSR/prerender, não renderiza nada
  if (!isMounted) {
    return null;
  }

  // Após hidratar, renderiza o Footer real
  return <Footer />;
}
