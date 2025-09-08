import { createClient } from "npm:@supabase/supabase-js@2.56.0";
import {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_ANON_KEY,
} from "./env.ts";

export function clientRLS(req: Request) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

export function adminClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

export async function getAuth(req: Request) {
  const supa = clientRLS(req);
  const { data: { user }, error } = await supa.auth.getUser();
  if (error || !user) return { user: null, supa, error: "unauthorized" } as const;

  // Get user profile with correct column names
  const { data: profile } = await supa
    .from("profiles")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .single();

  return {
    user,
    organization_id: profile?.organization_id ?? null,
    role: profile?.role ?? null,
    supa
  } as const;
}