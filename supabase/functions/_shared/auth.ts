import { createClient } from "npm:@supabase/supabase-js@2.56.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PUBLISHABLE_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

export function clientRLS(req: Request) {
  return createClient(SUPABASE_URL, PUBLISHABLE_KEY, {
    global: {
      headers: { Authorization: req.headers.get("Authorization") ?? "" },
    },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function adminClient() {
  return createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function getAuth(req: Request) {
  const supa = clientRLS(req);
  const {
    data: { user },
    error,
  } = await supa.auth.getUser();
  if (error || !user)
    return { user: null, supa, error: "unauthorized" } as const;

  // Get user profile organization
  const { data: profile } = await supa
    .from("profiles")
    .select("organization_id")
    .eq("user_id", user.id)
    .single();

  // Get role from members table (source of truth)
  const { data: memberRole } = await supa
    .from("members")
    .select("role")
    .eq("user_id", user.id)
    .eq("org_id", profile?.organization_id)
    .eq("status", "active")
    .single();

  return {
    user,
    organization_id: profile?.organization_id ?? null,
    role: memberRole?.role ?? null,
    supa,
  } as const;
}
