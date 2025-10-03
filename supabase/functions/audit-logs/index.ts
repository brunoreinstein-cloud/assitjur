import { createClient } from "npm:@supabase/supabase-js@2.56.0";
import {
  corsHeaders,
  handlePreflight,
  parseAllowedOrigins,
} from "../_shared/cors.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

const origins = parseAllowedOrigins(Deno.env.get("ALLOWED_ORIGINS"));

Deno.serve(async (req) => {
  const cid = req.headers.get("x-correlation-id") ?? crypto.randomUUID();
  const ch = corsHeaders(req, origins);
  const pre = handlePreflight(req, origins, { "x-correlation-id": cid });
  if (pre) return pre;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: {
            ...ch,
            "Content-Type": "application/json",
            "x-correlation-id": cid,
          },
        },
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: {
          ...ch,
          "Content-Type": "application/json",
          "x-correlation-id": cid,
        },
      });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
        headers: {
          ...ch,
          "Content-Type": "application/json",
          "x-correlation-id": cid,
        },
      });
    }

    const url = new URL(req.url);
    const resource = url.searchParams.get("resource");
    const start = url.searchParams.get("start");
    const end = url.searchParams.get("end");
    const page = parseInt(url.searchParams.get("page") ?? "1", 10);
    const limit = parseInt(url.searchParams.get("limit") ?? "50", 10);

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from("audit_log")
      .select("*")
      .eq("org_id", profile.organization_id)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (resource) query = query.eq("resource", resource);
    if (start) query = query.gte("created_at", start);
    if (end) query = query.lte("created_at", end);

    const { data, error } = await query;
    if (error) throw error;

    return new Response(JSON.stringify({ logs: data ?? [], page, limit }), {
      status: 200,
      headers: {
        ...ch,
        "Content-Type": "application/json",
        "x-correlation-id": cid,
      },
    });
  } catch (err) {
    console.error("audit-logs error", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: {
        ...ch,
        "Content-Type": "application/json",
        "x-correlation-id": cid,
      },
    });
  }
});
