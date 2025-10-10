import { supabase } from "@/integrations/supabase/client";
import { hasConsent, hasAnyConsent, getConsentSummary } from "@/lib/consent-gates";

/** Check if current user allowed analytics */
export const analyticsAllowed = async (): Promise<boolean> => {
  // ✅ SSR safety
  if (typeof window === "undefined") return false;
  
  // Check browser consent first
  if (!hasConsent('analytics')) return false;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  // TODO: Check user-specific consent in database when lgpd_consent table exists
  // For now, rely on browser consent
  return true;
};

/** Check if current user allowed marketing */
export const marketingAllowed = async (): Promise<boolean> => {
  // ✅ SSR safety
  if (typeof window === "undefined") return false;
  
  // Check browser consent first
  if (!hasConsent('marketing')) return false;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  // TODO: Check user-specific consent in database when lgpd_consent table exists
  // For now, rely on browser consent
  return true;
};

/** Check if user has given any consent */
export const hasUserConsent = async (): Promise<boolean> => {
  if (typeof window === "undefined") return false;
  return hasAnyConsent();
};

/** Get consent summary for debugging/logging */
export const getConsentDebugInfo = () => {
  if (typeof window === "undefined") return null;
  return getConsentSummary();
};
