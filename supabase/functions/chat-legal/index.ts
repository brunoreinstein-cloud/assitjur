// supabase/functions/chat-legal/index.ts

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";
import { getSystemPrompt } from "../_shared/prompt-registry.ts";

/**
 * =========================
 * Config & Constantes
 * =========================
 */
const ALLOWED_ORIGINS = [
  "https://app.assistjur.ia",
  "https://staging.assistjur.ia",
];
const DEFAULT_MODEL =
  Deno.env.get("OPENAI_DEFAULT_MODEL") ?? "gpt-4o-mini";
const DEFAULT_TEMPERATURE = Number(Deno.env.get("OPENAI_TEMPERATURE") ?? 0.2);
const MAX_MESSAGE_LENGTH = Number(Deno.env.get("OPENAI_MAX_MSG_LEN") ?? 2000);
const MAX_TOKENS = Number(Deno.env.get("OPENAI_MAX_TOKENS") ?? 1500);
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ Missing Supabase env (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)");
}

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGINS.join(","),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};

function isOriginAllowed(req: Request) {
  const origin = req.headers.get("origin") ?? "";
  return ALLOWED_ORIGINS.includes(origin);
}

/**
 * =========================
 * Rate Limiter (naïve)
 * =========================
 */
const buckets = new Map<string, number[]>();
function rateLimit(key: string, limit = 20, windowMs = 60_000) {
  const now = Date.now();
  const arr = buckets.get(key) ?? [];
  const recent = arr.filter((ts) => now - ts < windowMs);
  recent.push(now);
  buckets.set(key, recent);
  return recent.length <= limit;
}

/**
 * =========================
 * JWT utils
 * =========================
 */
function getBearerToken(req: Request): string | null {
  const h = req.headers.get("authorization");
  if (!h) return null;
  const [type, token] = h.split(" ");
  if (type?.toLowerCase() !== "bearer") return null;
  return token || null;
}

function decodeJWT(token: string) {
  try {
    const [h, p] = token.split(".");
    if (!p) throw new Error("Invalid JWT");
    const payload = JSON.parse(atob(p.replace(/-/g, "+").replace(/_/g, "/")));
    return payload;
  } catch {
    return null;
  }
}

/**
 * =========================
 * OpenAI (via fetch)
 * =========================
 */
async function openAIChat({
  system,
  user,
  model = DEFAULT_MODEL,
  temperature = DEFAULT_TEMPERATURE,
  max_tokens = MAX_TOKENS,
}: {
  system: string;
  user: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
}) {
  if (!OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  const body = {
    model,
    temperature,
    max_tokens,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI error: ${res.status} ${errText}`);
  }

  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content ?? "";
  return content;
}

/**
 * =========================
 * Handler
 * =========================
 */
serve(async (request: Request) => {
  // Preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  // CORS
  if (!isOriginAllowed(request)) {
    return new Response(JSON.stringify({ error: "Origin not allowed" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const token = getBearerToken(request);
    if (!token) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const jwt = decodeJWT(token);
    const userId = jwt?.sub;
    if (!userId) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Supabase client (service role) para operações de BD
    const supabase = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`, // mantém contexto de auditoria
        },
      },
    });

    // Corpo da requisição
    const { message, promptName } = await request.json();
    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      return new Response(JSON.stringify({ error: "Message too long" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Buscar profile e organização
    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("user_id, organization_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (profileErr || !profile?.organization_id) {
      return new Response(JSON.stringify({ error: "User profile not found" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const orgId = profile.organization_id;

    // Rate limit (20 req/min por usuário+org)
    const rlKey = `${orgId}:${userId}:chat-legal`;
    if (!rateLimit(rlKey)) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Tentar buscar system prompt da tabela (por nome e org)
    let systemPrompt = "";
    const wantedName = promptName ?? "System: Mapa de Testemunhas - v1";
    const { data: sysPromptRow, error: spErr } = await supabase
      .from("prompts")
      .select("content")
      .eq("org_id", orgId)
      .eq("type", "SYSTEM")
      .eq("name", wantedName)
      .maybeSingle();

    if (spErr) {
      console.warn("⚠️ prompts query error:", spErr);
    }
    systemPrompt = sysPromptRow?.content ?? getSystemPrompt(wantedName);

    // OpenAI
    const completion = await openAIChat({
      system: systemPrompt,
      user: message,
    });

    // Retornar JSON
    return new Response(JSON.stringify({ ok: true, data: completion }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("chat-legal error:", err);
    return new Response(JSON.stringify({ error: String(err?.message ?? err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
