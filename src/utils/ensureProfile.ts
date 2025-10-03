import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { UserRole, UserProfile } from "@/hooks/useAuth";

/**
 * Ensures a profile exists for the given user using the safe database function.
 */
export async function ensureProfile(
  user: User,
  role: UserRole = "VIEWER",
  organizationId?: string,
): Promise<UserProfile | null> {
  try {
    // Use the new safe database function to create/get profile
    const { data: profile, error } = await supabase.rpc("ensure_user_profile", {
      user_uuid: user.id,
      user_email: user.email ?? "",
      user_role: role,
      org_id: organizationId || null,
    });

    if (error) {
      console.error("Error ensuring profile with RPC:", error);
      return null;
    }

    return profile as UserProfile;
  } catch (err) {
    console.error("ensureProfile error:", err);
    return null;
  }
}
