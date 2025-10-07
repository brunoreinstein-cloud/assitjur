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

const ConsentContext = createContext<ConsentContextValue | undefined>(undefined);

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
    } else if (!isServer && !isPrerender && !isTestEnv) {
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

const FALLBACK_VALUE: ConsentContextValue = Object.freeze({
  preferences: null,
  open: false,
  setOpen: () => {},
  save: () => {},
});

const isServer = typeof window === "undefined";
const isPrerender = typeof process !== "undefined" && process.env?.PRERENDER === "1";
const isTestEnv = typeof process !== "undefined" && process.env?.NODE_ENV === "test";

export function useConsent(): ConsentContextValue {
  const ctx = useContext(ConsentContext);

  if (isServer || isPrerender) {
    return FALLBACK_VALUE;
  }

  if (!ctx) {
    if (typeof process !== "undefined" && process.env?.NODE_ENV === "development") {
      console.warn("useConsent: No ConsentProvider found, returning defaults");
    }

    return FALLBACK_VALUE;
  }

  return ctx;
}
