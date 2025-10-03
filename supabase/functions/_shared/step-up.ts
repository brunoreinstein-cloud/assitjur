import type { SupabaseClient } from "npm:@supabase/supabase-js@2.56.0";

/**
 * Ensures the current session has performed MFA verification recently.
 * Throws an error if MFA has not been verified within the provided window.
 *
 * This middleware is meant to be used in edge functions that perform sensitive
 * operations. After a successful step-up verification Supabase rotates the
 * session tokens so the caller must send the fresh token on subsequent
 * requests.
 */
export async function requireRecentMfa(
  client: SupabaseClient,
  windowMs = 5 * 60 * 1000,
) {
  const {
    data: { session },
  } = await client.auth.getSession();
  if (!session) throw new Error("Unauthorized");

  const aal = (session.user as any).aal as string | undefined;
  const verifiedAt = (session.user as any).last_sign_in_at;

  if (aal !== "aal2") {
    throw new Error("MFA verification required");
  }

  if (verifiedAt) {
    const last = new Date(verifiedAt).getTime();
    if (Date.now() - last > windowMs) {
      throw new Error("Recent MFA verification required");
    }
  }
}
