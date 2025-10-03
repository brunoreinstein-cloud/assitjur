import { supabase } from "@/integrations/supabase/client";

/** Check if current user allowed analytics */
export const analyticsAllowed = async (): Promise<boolean> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  // Mock data since lgpd_consent table doesn't exist yet
  // In a real implementation, this would check user consent preferences
  return true; // Default to allow for now
};
