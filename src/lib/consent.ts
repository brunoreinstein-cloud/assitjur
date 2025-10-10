/**
 * ✅ Unified Consent Management System
 * 
 * This module provides a single, consistent interface for managing user consent
 * across the entire application, with proper SSR safety and LGPD compliance.
 */

export const CONSENT_VERSION = "1.0.0";
const STORAGE_KEY = "assistjur_consent_v1";
const MAX_AGE_DAYS = 180;

export type Consent = {
  essential: true;
  measure?: boolean;
  marketing?: boolean;
  version?: string;
  ts?: string;
};

export interface ConsentPreferences {
  analytics: boolean;
  ads: boolean;
  version: string;
  ts: string;
}

export type ConsentFlags = Pick<ConsentPreferences, "analytics" | "ads">;

type Listener = (consent: Consent) => void;
let listeners: Listener[] = [];

const msInDay = 24 * 60 * 60 * 1000;

function isExpired(ts: string): boolean {
  const age = Date.now() - new Date(ts).getTime();
  return age > MAX_AGE_DAYS * msInDay;
}

/**
 * ✅ SSR-safe consent retrieval
 * Returns consent preferences with proper fallbacks for SSR
 */
export function getConsent(): Consent {
  if (typeof window === "undefined") {
    return { essential: true };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { essential: true };

    const data = JSON.parse(raw) as {
      measure?: boolean;
      marketing?: boolean;
      version?: string;
      ts?: string;
    };

    // ✅ Check version compatibility
    if (data.version && data.version !== CONSENT_VERSION) {
      return { essential: true };
    }

    // ✅ Check expiration
    if (data.ts && isExpired(data.ts)) {
      return { essential: true };
    }

    return {
      essential: true,
      measure: data.measure,
      marketing: data.marketing,
      version: data.version || CONSENT_VERSION,
      ts: data.ts,
    };
  } catch {
    return { essential: true };
  }
}

/**
 * ✅ SSR-safe consent storage
 * Stores consent preferences with version and timestamp
 */
export function setConsent(prefs: Omit<Consent, "essential">): void {
  if (typeof window === "undefined") return;

  try {
    const payload = {
      measure: prefs.measure,
      marketing: prefs.marketing,
      version: CONSENT_VERSION,
      ts: new Date().toISOString(),
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));

    // ✅ Notify listeners
    const consent: Consent = { essential: true, ...payload };
    listeners.forEach((cb) => cb(consent));
  } catch {
    // Silent fail for storage errors
  }
}

/**
 * ✅ Legacy compatibility: Get stored consent in old format
 */
export function getStoredConsent(): ConsentPreferences | null {
  if (typeof window === "undefined") return null;

  const consent = getConsent();
  if (!consent.measure && !consent.marketing) return null;

  return {
    analytics: consent.measure ?? false,
    ads: consent.marketing ?? false,
    version: consent.version || CONSENT_VERSION,
    ts: consent.ts || new Date().toISOString(),
  };
}

/**
 * ✅ Legacy compatibility: Store consent in old format
 */
export function storeConsent(prefs: ConsentFlags): ConsentPreferences {
  if (typeof window === "undefined") {
    throw new Error("window is undefined");
  }

  setConsent({
    measure: prefs.analytics,
    marketing: prefs.ads,
  });

  return {
    analytics: prefs.analytics,
    ads: prefs.ads,
    version: CONSENT_VERSION,
    ts: new Date().toISOString(),
  };
}

/**
 * ✅ Consent change listener system
 */
export function onConsentChange(cb: Listener): () => void {
  listeners.push(cb);
  return () => {
    listeners = listeners.filter((l) => l !== cb);
  };
}

/**
 * ✅ Google Consent Mode v2 integration
 */
export function applyDefaultConsent(): void {
  if (typeof window === "undefined" || !(window as any).gtag) return;

  (window as any).gtag("consent", "default", {
    ad_user_data: "denied",
    ad_personalization: "denied",
    ad_storage: "denied",
    analytics_storage: "denied",
  });
}

/**
 * ✅ Apply consent to Google Analytics
 */
export function applyConsentToGtag(prefs: ConsentFlags): void {
  if (typeof window === "undefined" || !(window as any).gtag) return;

  const consent = {
    ad_user_data: prefs.ads ? "granted" : "denied",
    ad_personalization: prefs.ads ? "granted" : "denied",
    ad_storage: prefs.ads ? "granted" : "denied",
    analytics_storage: prefs.analytics ? "granted" : "denied",
  };

  (window as any).gtag("consent", "update", consent);

  // ✅ Push to dataLayer for GTM
  (window as any).dataLayer = (window as any).dataLayer || [];
  (window as any).dataLayer.push({
    event: "consent_update",
    consent: {
      ...consent,
      version: CONSENT_VERSION,
      ts: new Date().toISOString(),
    },
  });
}

/**
 * ✅ Clear all consent data (for testing or user request)
 */
export function clearConsent(): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(STORAGE_KEY);
    
    // ✅ Notify listeners with default consent
    const defaultConsent: Consent = { essential: true };
    listeners.forEach((cb) => cb(defaultConsent));
  } catch {
    // Silent fail
  }
}

/**
 * ✅ Check if consent is valid and not expired
 */
export function isConsentValid(): boolean {
  const consent = getConsent();
  return !!(consent.measure !== undefined || consent.marketing !== undefined);
}

/**
 * ✅ Get consent age in days
 */
export function getConsentAge(): number | null {
  const consent = getConsent();
  if (!consent.ts) return null;

  const age = Date.now() - new Date(consent.ts).getTime();
  return Math.floor(age / msInDay);
}
