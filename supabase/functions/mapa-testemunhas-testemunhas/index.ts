// supabase/functions/<slug>/index.ts
import { createClient } from "npm:@supabase/supabase-js@2.56.0";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-client-info, x-supabase-auth",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

Deno.serve(async (req) => {
  // 0) Preflight
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const isDevDebug = new URL(req.url).searchParams.get("debug") === "1";

  // 1) Token do usuário
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return json({ error: "Missing token (Authorization: Bearer ...)" }, 401);

  // 2) Cliente Supabase com JWT do caller (RLS)
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    {
      auth: {
        persistSession: false,
        client: {
          fetch: (input, init) => {
            const initWithAuth: RequestInit = {
              ...init,
              headers: {
                ...(init?.headers ?? {}),
                Authorization: `Bearer ${token}`,
                apikey: Deno.env.get("SUPABASE_ANON_KEY")!,
              },
            };
            return fetch(input, initWithAuth);
          },
        },
      },
    }
  );

  try {
    // 3) Body seguro + defaults
    let body: any = {};
    if (req.method !== "GET") {
      const ct = req.headers.get("Content-Type") || "";
      if (!ct.toLowerCase().includes("application/json")) {
        return json({ error: "Content-Type must be application/json" }, 400);
      }
      body = await req.json().catch(() => ({}));
    }

    const pageRaw = body?.page ?? 1;
    const limitRaw = body?.limit ?? 20;
    const page = Number(pageRaw);
    const limit = Math.min(Number(limitRaw), 100);

    if (!Number.isFinite(page) || page < 1) {
      return json({ error: "Invalid 'page' (must be integer >= 1)", got: pageRaw }, 400);
    }
    if (!Number.isFinite(limit) || limit < 1) {
      return json({ error: "Invalid 'limit' (must be integer >= 1)", got: limitRaw }, 400);
    }

    // 4) SUA QUERY REAL AQUI (troque o placeholder)
    // Exemplo (testemunhas):
    // const { data, error } = await supabase
    //   .from("testemunhas_view")  // se usar VIEW, ative security_invoker
    //   .select("id, nome, processo_id, parte, created_at")
    //   .order("created_at", { ascending: false })
    //   .range((page - 1) * limit, page * limit - 1);

    const { data, error } = await supabase // placeholder
      .from("profiles")
      .select("id, full_name")
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      // Se o Postgres/RLS falhar, mostre mensagem clara em DEV
      return json(
        {
          error: "Query failed",
          message: error.message,
          hint:
            isDevDebug
              ? "Verifique RLS/policies, view com security_invoker, grants, e filtros."
              : undefined,
        },
        400
      );
    }

    return json({ page, limit, data }, 200);
  } catch (e) {
    return json(
      {
        error: "Unhandled error",
        message: String(e),
        hint: isDevDebug ? "Cheque logs da Edge Function." : undefined,
      },
      500
    );
  }
});
