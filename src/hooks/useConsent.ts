"use client";

import { createContext, useContext, useEffect, useState, createElement } from "react";
import type { ReactNode } from "react";
import { getConsent, setConsent } from "@/lib/consent";

type ConsentPrefs = { analytics: boolean; ads: boolean };

interface ConsentContextValue {
  preferences: ConsentPrefs | null;
  open: boolean;
  setOpen: (open: boolean) => void;
  save: (prefs: ConsentPrefs) => void;
}

const ConsentContext = createContext<ConsentContextValue | undefined>(
  undefined,
);

export function ConsentProvider({ children }: { children: ReactNode }) {
  // ✅ SSR safety: Detect server-side rendering
  const isSSR = typeof window === "undefined";

  const [preferences, setPreferences] = useState<ConsentPrefs | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // ✅ Guard: Only run on client-side
    if (isSSR) return;

    const stored = getConsent();
    if (stored.measure !== undefined || stored.marketing !== undefined) {
      setPreferences({
        analytics: stored.measure ?? false,
        ads: stored.marketing ?? false,
      });
    } else {
      setOpen(true);
    }
  }, [isSSR]);

  const save = (prefs: ConsentPrefs) => {
    // ✅ Guard: Only save on client-side
    if (isSSR) return;

    setConsent({ measure: prefs.analytics, marketing: prefs.ads });
    setPreferences(prefs);
  };

  return createElement(
    ConsentContext.Provider,
    { value: { preferences, open, setOpen, save } },
    children
  );
}

const FALLBACK_VALUE: ConsentContextValue = {
  preferences: null,
  open: false,
  setOpen: () => {},
  save: () => {},
};

export function useConsent(): ConsentContextValue {
  // ✅ SSR/Prerender safety: return fallback when window is undefined
  if (typeof window === "undefined") {
    return FALLBACK_VALUE;
  }

  const ctx = useContext(ConsentContext);

  if (!ctx) {
    if (import.meta.env.DEV) {
      console.warn("useConsent: No ConsentProvider found, returning defaults");
    }
    // ✅ Não lança erro - retorna fallback seguro
    return FALLBACK_VALUE;
  }

  return ctx;
}
