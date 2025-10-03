export const CONSENT_VERSION = "1.0.0";
const STORAGE_VERSION_KEY = "assistjur_consent_v";
const STORAGE_PAYLOAD_KEY = "assistjur_consent_payload";
const MAX_AGE_DAYS = 180;

export interface ConsentPreferences {
  analytics: boolean;
  ads: boolean;
  version: string;
  ts: string;
}

export type ConsentFlags = Pick<ConsentPreferences, "analytics" | "ads">;

const msInDay = 24 * 60 * 60 * 1000;

function isExpired(ts: string) {
  const age = Date.now() - new Date(ts).getTime();
  return age > MAX_AGE_DAYS * msInDay;
}

export function getStoredConsent(): ConsentPreferences | null {
  if (typeof window === "undefined") return null;
  try {
    const version = localStorage.getItem(STORAGE_VERSION_KEY);
    if (version !== CONSENT_VERSION) return null;
    const raw = localStorage.getItem(STORAGE_PAYLOAD_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as {
      analytics: boolean;
      ads: boolean;
      ts: string;
    };
    if (isExpired(data.ts)) return null;
    return { ...data, version: CONSENT_VERSION };
  } catch {
    return null;
  }
}

export function storeConsent(prefs: ConsentFlags): ConsentPreferences {
  if (typeof window === "undefined") throw new Error("window is undefined");
  const payload = {
    analytics: prefs.analytics,
    ads: prefs.ads,
    ts: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_VERSION_KEY, CONSENT_VERSION);
  localStorage.setItem(STORAGE_PAYLOAD_KEY, JSON.stringify(payload));
  return { ...payload, version: CONSENT_VERSION };
}

export function applyDefaultConsent() {
  if (typeof window === "undefined" || !(window as any).gtag) return;
  (window as any).gtag("consent", "default", {
    ad_user_data: "denied",
    ad_personalization: "denied",
    ad_storage: "denied",
    analytics_storage: "denied",
  });
}

export function applyConsentToGtag(prefs: ConsentFlags) {
  if (typeof window === "undefined" || !(window as any).gtag) return;
  const consent = {
    ad_user_data: prefs.ads ? "granted" : "denied",
    ad_personalization: prefs.ads ? "granted" : "denied",
    ad_storage: prefs.ads ? "granted" : "denied",
    analytics_storage: prefs.analytics ? "granted" : "denied",
  };
  (window as any).gtag("consent", "update", consent);
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
