/**
 * ✅ Legacy compatibility layer for privacy consent
 * 
 * This module provides backward compatibility for the old privacy consent system
 * while using the unified consent management system under the hood.
 */

// Re-export types and constants from unified system
export { 
  CONSENT_VERSION,
  type ConsentPreferences,
  type ConsentFlags,
  getStoredConsent,
  storeConsent,
  applyDefaultConsent,
  applyConsentToGtag
} from "@/lib/consent";

// All functions are now re-exported from the unified system above
