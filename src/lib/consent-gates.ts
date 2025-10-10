/**
 * ✅ Consent Gates for Third-Party Integrations
 * 
 * This module provides consent-aware wrappers for third-party services
 * to ensure LGPD compliance and proper user consent handling.
 */

import { getConsent, onConsentChange } from './consent';

export type ConsentType = 'analytics' | 'marketing' | 'essential';

/**
 * ✅ Check if a specific consent type is granted
 */
export function hasConsent(type: ConsentType): boolean {
  if (typeof window === "undefined") return false;
  
  const consent = getConsent();
  
  switch (type) {
    case 'essential':
      return true; // Essential cookies are always allowed
    case 'analytics':
      return consent.measure === true;
    case 'marketing':
      return consent.marketing === true;
    default:
      return false;
  }
}

/**
 * ✅ Consent-aware wrapper for functions
 */
export function withConsentGate<T extends any[]>(
  fn: (...args: T) => void,
  consentType: ConsentType
) {
  return (...args: T) => {
    if (hasConsent(consentType)) {
      fn(...args);
    }
  };
}

/**
 * ✅ Consent-aware wrapper for async functions
 */
export function withConsentGateAsync<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  consentType: ConsentType
) {
  return async (...args: T): Promise<R | null> => {
    if (hasConsent(consentType)) {
      return await fn(...args);
    }
    return null;
  };
}

/**
 * ✅ PostHog Analytics Gate
 */
export function initializePostHog(posthog: any) {
  if (!hasConsent('analytics')) {
    posthog?.opt_out_capturing?.();
    return;
  }

  posthog?.opt_in_capturing?.();
}

/**
 * ✅ Google Analytics Gate
 */
export function trackGoogleAnalytics(eventName: string, parameters?: Record<string, any>) {
  if (!hasConsent('analytics') || typeof window === "undefined") return;

  const gtag = (window as any).gtag;
  if (gtag) {
    gtag('event', eventName, parameters);
  }
}

/**
 * ✅ Facebook Pixel Gate
 */
export function trackFacebookPixel(eventName: string, parameters?: Record<string, any>) {
  if (!hasConsent('marketing') || typeof window === "undefined") return;

  const fbq = (window as any).fbq;
  if (fbq) {
    fbq('track', eventName, parameters);
  }
}

/**
 * ✅ Hotjar Gate
 */
export function initializeHotjar(hjid: string, hjsv: number) {
  if (!hasConsent('analytics') || typeof window === "undefined") return;

  const hotjar = (window as any).hj;
  if (hotjar) {
    hotjar('identify', hjid, hjsv);
  }
}

/**
 * ✅ Intercom Gate
 */
export function initializeIntercom(appId: string) {
  if (!hasConsent('analytics') || typeof window === "undefined") return;

  const Intercom = (window as any).Intercom;
  if (Intercom) {
    Intercom('boot', { app_id: appId });
  }
}

/**
 * ✅ Custom Analytics Gate
 */
export function trackCustomAnalytics(event: string, data?: Record<string, any>) {
  if (!hasConsent('analytics') || typeof window === "undefined") return;

  // Remove PII from data
  const sanitizedData = data ? Object.fromEntries(
    Object.entries(data).filter(([key]) => 
      !['email', 'name', 'phone', 'cpf', 'cnpj'].includes(key.toLowerCase())
    )
  ) : {};

  // Send to custom analytics endpoint
  fetch('/api/analytics', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      event,
      data: sanitizedData,
      timestamp: new Date().toISOString(),
    }),
  }).catch(() => {
    // Silent fail for analytics errors
  });
}

/**
 * ✅ Marketing Email Gate
 */
export function trackMarketingEmail(email: string, event: string, data?: Record<string, any>) {
  if (!hasConsent('marketing') || typeof window === "undefined") return;

  // Send to marketing platform
  fetch('/api/marketing', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      event,
      data,
      timestamp: new Date().toISOString(),
    }),
  }).catch(() => {
    // Silent fail for marketing errors
  });
}

/**
 * ✅ Consent Change Handler for Integrations
 */
export function setupConsentChangeHandlers() {
  if (typeof window === "undefined") return;

  onConsentChange((consent) => {
    // Handle PostHog
    const posthog = (window as any).posthog;
    if (posthog) {
      if (consent.measure) {
        posthog.opt_in_capturing();
      } else {
        posthog.opt_out_capturing();
      }
    }

    // Handle Google Analytics
    const gtag = (window as any).gtag;
    if (gtag) {
      gtag('consent', 'update', {
        analytics_storage: consent.measure ? 'granted' : 'denied',
        ad_storage: consent.marketing ? 'granted' : 'denied',
        ad_user_data: consent.marketing ? 'granted' : 'denied',
        ad_personalization: consent.marketing ? 'granted' : 'denied',
      });
    }

    // Handle Facebook Pixel
    const fbq = (window as any).fbq;
    if (fbq) {
      if (consent.marketing) {
        fbq('consent', 'grant');
      } else {
        fbq('consent', 'revoke');
      }
    }

    // Handle Hotjar
    const hotjar = (window as any).hj;
    if (hotjar) {
      if (consent.measure) {
        hotjar('stateChange', 'consent_granted');
      } else {
        hotjar('stateChange', 'consent_revoked');
      }
    }

    // Handle Intercom
    const Intercom = (window as any).Intercom;
    if (Intercom) {
      if (consent.measure) {
        Intercom('show');
      } else {
        Intercom('hide');
      }
    }
  });
}

/**
 * ✅ Initialize all consent-aware integrations
 */
export function initializeConsentAwareIntegrations() {
  if (typeof window === "undefined") return;

  setupConsentChangeHandlers();

  // Initialize integrations based on current consent
  const consent = getConsent();

  // PostHog
  const posthog = (window as any).posthog;
  if (posthog) {
    initializePostHog(posthog);
  }

  // Google Analytics (handled by main.tsx)
  // Sentry (handled by main.tsx)
  // Custom analytics
  if (consent.measure) {
    trackCustomAnalytics('page_view', {
      url: window.location.href,
      referrer: document.referrer,
    });
  }
}

/**
 * ✅ Utility to check if user has given any consent
 */
export function hasAnyConsent(): boolean {
  const consent = getConsent();
  return !!(consent.measure || consent.marketing);
}

/**
 * ✅ Utility to get consent summary for debugging
 */
export function getConsentSummary() {
  const consent = getConsent();
  return {
    essential: true,
    analytics: consent.measure || false,
    marketing: consent.marketing || false,
    version: consent.version || 'unknown',
    timestamp: consent.ts || 'unknown',
    age: consent.ts ? Math.floor((Date.now() - new Date(consent.ts).getTime()) / (1000 * 60 * 60 * 24)) : null,
  };
}
