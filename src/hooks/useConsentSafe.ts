"use client";

import { useContext } from "react";
import { ConsentContext } from "@/hooks/useConsent";

/**
 * Hook seguro para consent que funciona tanto no cliente quanto no servidor
 * Evita erros de SSR ao usar useConsent em componentes que podem ser renderizados no servidor
 */
export function useConsentSafe() {
  // ✅ Guard 1: Server-side rendering
  if (typeof window === "undefined") {
    return {
      preferences: null,
      open: false,
      setOpen: () => {},
      save: () => {},
    };
  }

  // ✅ Guard 2: Prerender mode
  if (process.env.PRERENDER === "1") {
    return {
      preferences: null,
      open: false,
      setOpen: () => {},
      save: () => {},
    };
  }

  const ctx = useContext(ConsentContext);

  // ✅ Guard 3: No provider found - return fallback instead of throwing
  if (!ctx) {
    if (import.meta.env.DEV) {
      console.warn("useConsentSafe: No ConsentProvider found, returning fallback");
    }
    return {
      preferences: null,
      open: false,
      setOpen: () => {},
      save: () => {},
    };
  }

  return ctx;
}
