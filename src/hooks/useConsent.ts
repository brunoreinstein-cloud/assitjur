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
  const [preferences, setPreferences] = useState<ConsentPrefs | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const stored = getConsent();
    if (stored.measure !== undefined || stored.marketing !== undefined) {
      setPreferences({
        analytics: stored.measure ?? false,
        ads: stored.marketing ?? false,
      });
    } else {
      setOpen(true);
    }
  }, []);

  const save = (prefs: ConsentPrefs) => {
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
  // ✅ SSR/Prerender safety: return fallback when window is undefined OR during prerender
  if (typeof window === "undefined" || import.meta.env.PRERENDER) {
    return FALLBACK_VALUE;
  }

  const ctx = useContext(ConsentContext);

  if (!ctx) {
    if (import.meta.env.DEV) {
      console.warn("useConsent: No ConsentProvider found, returning defaults");
    }

    return FALLBACK_VALUE;
  }

  return ctx;
}
