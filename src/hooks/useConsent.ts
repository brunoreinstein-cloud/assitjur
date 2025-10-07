"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
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

export function ConsentProvider({ children }: { children: React.ReactNode }) {
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

  return React.createElement(
    ConsentContext.Provider,
    { value: { preferences, open, setOpen, save } },
    children,
  );
}

export function useConsent(): ConsentContextValue {
  // SSR-safe: check if we're in SSR/prerender environment
  if (typeof window === "undefined" || process.env.PRERENDER === "1") {
    return {
      preferences: null,
      open: false,
      setOpen: () => {}, // No-op during SSR
      save: () => {},    // No-op during SSR
    };
  }

  const ctx = useContext(ConsentContext);
  
  // Return safe defaults if no provider (during build/SSR/prerender)
  if (!ctx) {
    if (process.env.NODE_ENV === "development") {
      console.warn("useConsent: No ConsentProvider found, returning defaults");
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
