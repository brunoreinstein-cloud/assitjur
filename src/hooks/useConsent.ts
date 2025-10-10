"use client";

import { createContext, useContext, useEffect, useState, createElement } from "react";
import type { ReactNode } from "react";
import { getConsent, setConsent } from "@/lib/consent";
import { trackConsentChange, trackConsentBannerShown } from "@/lib/consent-metrics";

type ConsentPrefs = { analytics: boolean; ads: boolean };

interface ConsentContextValue {
  preferences: ConsentPrefs | null;
  open: boolean;
  setOpen: (open: boolean) => void;
  save: (prefs: ConsentPrefs) => void;
}

export const ConsentContext = createContext<ConsentContextValue | undefined>(
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
      // ✅ Track banner shown
      trackConsentBannerShown();
    }
  }, [isSSR]);

  const save = (prefs: ConsentPrefs) => {
    // ✅ Guard: Only save on client-side
    if (isSSR) return;

    // ✅ Track consent changes
    const currentConsent = getConsent();
    if (currentConsent.measure !== prefs.analytics) {
      trackConsentChange('analytics', currentConsent.measure ?? false, prefs.analytics);
    }
    if (currentConsent.marketing !== prefs.ads) {
      trackConsentChange('marketing', currentConsent.marketing ?? false, prefs.ads);
    }

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
  // ✅ CRITICAL: Call useContext unconditionally to follow rules of hooks
  const ctx = useContext(ConsentContext);
  
  // ✅ CRITICAL: NEVER throw during SSR/prerender
  // This hook may be called by components during server-side rendering
  
  // Guard 1: Server-side rendering
  if (typeof window === "undefined") {
    return FALLBACK_VALUE;
  }

  // Guard 2: Prerender mode (set by scripts/prerender.tsx)
  if (process.env.PRERENDER === "1") {
    return FALLBACK_VALUE;
  }

  // Guard 3: No provider found - return fallback instead of throwing
  if (!ctx) {
    if (import.meta.env.DEV) {
      console.warn("useConsent: No ConsentProvider found, returning fallback");
    }
    return FALLBACK_VALUE;
  }

  return ctx;
}
