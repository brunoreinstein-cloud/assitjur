import { createClient } from "npm:@supabase/supabase-js@2.56.0";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info, x-supabase-auth",
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders() });
  const headers = { "Content-Type": "application/json", ...corsHeaders() };

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return new Response(JSON.stringify({ error: "Missing token" }), { status: 401, headers });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!,
    {
      auth: {
        persistSession: false,
        client: {
          fetch: (input, init) => {
            const initWithAuth: RequestInit = {
              ...init,
              headers: { ...(init?.headers ?? {}), Authorization: `Bearer ${token}`, apikey: Deno.env.get("SUPABASE_ANON_KEY")! },
            };
            return fetch(input, initWithAuth);
          },
        },
      },
    }
  );

  try {
    const body = req.method === "GET" ? {} : await req.json().catch(() => ({}));
    const page = Number(body.page ?? 1);
    const limit = Math.min(Number(body.limit ?? 20), 100);
    if (!Number.isFinite(page) || !Number.isFinite(limit)) {
      return new Response(JSON.stringify({ error: "Invalid page/limit" }), { status: 400, headers });
    }

    const { data, error } = await supabase
      .from("assistjur.por_testemunha")
      .select("*")
      .order("qtd_depoimentos", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers });
    return new Response(JSON.stringify({ page, limit, data }), { status: 200, headers });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers });
  }
});

