/**
 * ✅ Consent Metrics and Analytics
 * 
 * This module provides comprehensive metrics and analytics for consent management,
 * helping track user behavior and compliance metrics.
 */

import { getConsent, getConsentAge, isConsentValid } from './consent';
import { hasConsent, getConsentSummary } from './consent-gates';

export interface ConsentMetrics {
  // User consent status
  hasAnalyticsConsent: boolean;
  hasMarketingConsent: boolean;
  hasAnyConsent: boolean;
  isConsentValid: boolean;
  
  // Consent age and version
  consentAge: number | null;
  consentVersion: string;
  
  // User behavior
  totalConsentChanges: number;
  lastConsentChange: string | null;
  
  // Compliance metrics
  consentComplianceScore: number; // 0-100
  privacyScore: number; // 0-100
}

export interface ConsentEvent {
  event: 'consent_granted' | 'consent_revoked' | 'consent_changed' | 'consent_expired' | 'consent_banner_shown' | 'consent_banner_dismissed';
  category: 'analytics' | 'marketing' | 'essential';
  timestamp: string;
  userAgent?: string;
  sessionId?: string;
  previousConsent?: boolean;
  newConsent?: boolean;
}

/**
 * ✅ Get comprehensive consent metrics
 */
export function getConsentMetrics(): ConsentMetrics {
  if (typeof window === "undefined") {
    return {
      hasAnalyticsConsent: false,
      hasMarketingConsent: false,
      hasAnyConsent: false,
      isConsentValid: false,
      consentAge: null,
      consentVersion: 'unknown',
      totalConsentChanges: 0,
      lastConsentChange: null,
      consentComplianceScore: 0,
      privacyScore: 0,
    };
  }

  const consent = getConsent();
  const summary = getConsentSummary();
  
  return {
    hasAnalyticsConsent: hasConsent('analytics'),
    hasMarketingConsent: hasConsent('marketing'),
    hasAnyConsent: hasConsent('analytics') || hasConsent('marketing'),
    isConsentValid: isConsentValid(),
    consentAge: getConsentAge(),
    consentVersion: consent.version || 'unknown',
    totalConsentChanges: getTotalConsentChanges(),
    lastConsentChange: getLastConsentChange(),
    consentComplianceScore: calculateComplianceScore(),
    privacyScore: calculatePrivacyScore(),
  };
}

/**
 * ✅ Track consent events for analytics
 */
export function trackConsentEvent(event: ConsentEvent): void {
  if (typeof window === "undefined") return;

  // Store event locally for metrics
  storeConsentEvent(event);

  // Send to analytics if consent is given
  if (hasConsent('analytics')) {
    sendConsentEventToAnalytics(event);
  }

  // Send to dataLayer for GTM
  sendConsentEventToDataLayer(event);
}

/**
 * ✅ Track consent banner interactions
 */
export function trackConsentBannerShown(): void {
  trackConsentEvent({
    event: 'consent_banner_shown',
    category: 'essential',
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    sessionId: getSessionId(),
  });
}

/**
 * ✅ Track consent banner dismissal
 */
export function trackConsentBannerDismissed(): void {
  trackConsentEvent({
    event: 'consent_banner_dismissed',
    category: 'essential',
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    sessionId: getSessionId(),
  });
}

/**
 * ✅ Track consent changes
 */
export function trackConsentChange(
  category: 'analytics' | 'marketing',
  previousConsent: boolean,
  newConsent: boolean
): void {
  const eventType = newConsent ? 'consent_granted' : 'consent_revoked';
  
  trackConsentEvent({
    event: eventType,
    category,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    sessionId: getSessionId(),
    previousConsent,
    newConsent,
  });
}

/**
 * ✅ Get consent analytics dashboard data
 */
export function getConsentAnalytics(): {
  totalUsers: number;
  consentRate: number;
  analyticsConsentRate: number;
  marketingConsentRate: number;
  averageConsentAge: number;
  complianceScore: number;
} {
  if (typeof window === "undefined") {
    return {
      totalUsers: 0,
      consentRate: 0,
      analyticsConsentRate: 0,
      marketingConsentRate: 0,
      averageConsentAge: 0,
      complianceScore: 0,
    };
  }

  const events = getStoredConsentEvents();
  const metrics = getConsentMetrics();

  const totalUsers = events.length;
  const consentGranted = events.filter(e => e.event === 'consent_granted').length;
  const analyticsGranted = events.filter(e => e.event === 'consent_granted' && e.category === 'analytics').length;
  const marketingGranted = events.filter(e => e.event === 'consent_granted' && e.category === 'marketing').length;

  return {
    totalUsers,
    consentRate: totalUsers > 0 ? (consentGranted / totalUsers) * 100 : 0,
    analyticsConsentRate: totalUsers > 0 ? (analyticsGranted / totalUsers) * 100 : 0,
    marketingConsentRate: totalUsers > 0 ? (marketingGranted / totalUsers) * 100 : 0,
    averageConsentAge: metrics.consentAge || 0,
    complianceScore: metrics.consentComplianceScore,
  };
}

/**
 * ✅ Export consent data for compliance reporting
 */
export function exportConsentData(): {
  userConsent: any;
  consentEvents: ConsentEvent[];
  metrics: ConsentMetrics;
  analytics: any;
} {
  if (typeof window === "undefined") {
    return {
      userConsent: null,
      consentEvents: [],
      metrics: getConsentMetrics(),
      analytics: null,
    };
  }

  return {
    userConsent: getConsent(),
    consentEvents: getStoredConsentEvents(),
    metrics: getConsentMetrics(),
    analytics: getConsentAnalytics(),
  };
}

// Private helper functions

function storeConsentEvent(event: ConsentEvent): void {
  try {
    const events = getStoredConsentEvents();
    events.push(event);
    
    // Keep only last 100 events to prevent storage bloat
    if (events.length > 100) {
      events.splice(0, events.length - 100);
    }
    
    localStorage.setItem('assistjur_consent_events', JSON.stringify(events));
  } catch {
    // Silent fail for storage errors
  }
}

function getStoredConsentEvents(): ConsentEvent[] {
  try {
    const stored = localStorage.getItem('assistjur_consent_events');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function getTotalConsentChanges(): number {
  const events = getStoredConsentEvents();
  return events.filter(e => 
    e.event === 'consent_granted' || 
    e.event === 'consent_revoked' || 
    e.event === 'consent_changed'
  ).length;
}

function getLastConsentChange(): string | null {
  const events = getStoredConsentEvents();
  const consentEvents = events.filter(e => 
    e.event === 'consent_granted' || 
    e.event === 'consent_revoked' || 
    e.event === 'consent_changed'
  );
  
  return consentEvents.length > 0 ? consentEvents[consentEvents.length - 1].timestamp : null;
}

function calculateComplianceScore(): number {
  const consent = getConsent();
  let score = 0;
  
  // Base score for having consent system
  score += 20;
  
  // Score for version management
  if (consent.version) score += 20;
  
  // Score for timestamp
  if (consent.ts) score += 20;
  
  // Score for expiration handling
  if (consent.ts && getConsentAge() !== null && getConsentAge()! < 180) score += 20;
  
  // Score for proper categorization
  if (consent.measure !== undefined || consent.marketing !== undefined) score += 20;
  
  return Math.min(score, 100);
}

function calculatePrivacyScore(): number {
  const consent = getConsent();
  let score = 100; // Start with perfect score
  
  // Deduct points for unnecessary consent
  if (consent.marketing) score -= 10;
  
  // Deduct points for analytics without user benefit
  if (consent.measure && !consent.marketing) score -= 5;
  
  // Bonus points for minimal consent
  if (!consent.measure && !consent.marketing) score += 10;
  
  return Math.max(0, Math.min(score, 100));
}

function sendConsentEventToAnalytics(event: ConsentEvent): void {
  // Send to Google Analytics
  if ((window as any).gtag) {
    (window as any).gtag('event', 'consent_event', {
      event_type: event.event,
      category: event.category,
      timestamp: event.timestamp,
    });
  }
  
  // Send to custom analytics
  fetch('/api/consent-events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  }).catch(() => {
    // Silent fail for analytics errors
  });
}

function sendConsentEventToDataLayer(event: ConsentEvent): void {
  (window as any).dataLayer = (window as any).dataLayer || [];
  (window as any).dataLayer.push({
    event: 'consent_analytics',
    consent_event: event,
  });
}

function getSessionId(): string {
  try {
    let sessionId = sessionStorage.getItem('assistjur_session_id');
    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem('assistjur_session_id', sessionId);
    }
    return sessionId;
  } catch {
    return 'unknown';
  }
}

/**
 * ✅ Clear all consent metrics (for testing)
 */
export function clearConsentMetrics(): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.removeItem('assistjur_consent_events');
    sessionStorage.removeItem('assistjur_session_id');
  } catch {
    // Silent fail
  }
}
