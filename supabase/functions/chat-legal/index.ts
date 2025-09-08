// supabase/functions/chat-legal/index.ts

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.56.0";
import { getSystemPrompt } from "../_shared/prompt-registry.ts";
import { corsHeaders, handlePreflight } from "../_shared/cors.ts";

/**
 * =========================
 * Configuração e Constantes
 * =========================
 */
const DEFAULT_ALLOWED_ORIGINS = [
  "https://app.assistjur.ia",
  "https://staging.assistjur.ia",
  "http://localhost:5173",
];
const ALLOWED_ORIGINS = [
  ...DEFAULT_ALLOWED_ORIGINS,
  ...(Deno.env.get("ALLOWED_ORIGINS")?.split(",").map(s => s.trim()).filter(Boolean) ?? []),
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
  console.error("❌ Variáveis do Supabase ausentes (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)");
}

function isOriginAllowed(req: Request, cors: Record<string, string>) {
  const origin = req.headers.get("origin") ?? "";
  return (
    ALLOWED_ORIGINS.includes(origin) ||
    cors["Access-Control-Allow-Origin"] === origin ||
    cors["Access-Control-Allow-Origin"] === "*"
  );
}

/**
 * =========================
 * Limitador de taxa (ingênuo)
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
 * Utilitários de JWT
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
    if (!p) throw new Error("JWT inválido");
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
    throw new Error("OPENAI_API_KEY ausente");
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
 * Manipulador
 * =========================
 */
serve(async (request: Request) => {
  const preflight = handlePreflight(request);
  if (preflight) return preflight;

  const cors = corsHeaders(request);
  const originAllowed = isOriginAllowed(request, cors);

  if (!originAllowed) {
    return new Response(JSON.stringify({ error: "Origem não permitida" }), {
      status: 403,
      headers: { ...cors },
    });
  }

  try {
    const token = getBearerToken(request);
    if (!token) {
      return new Response(JSON.stringify({ error: "Autenticação obrigatória" }), {
        status: 401,
        headers: { ...cors },
      });
    }

    const jwt = decodeJWT(token);
    const userId = jwt?.sub;
    if (!userId) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { ...cors },
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
      return new Response(JSON.stringify({ error: "Payload inválido" }), {
        status: 400,
        headers: { ...cors },
      });
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      return new Response(JSON.stringify({ error: "Mensagem muito longa" }), {
        status: 400,
        headers: { ...cors },
      });
    }

    // Buscar profile e organização
    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("user_id, organization_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (profileErr || !profile?.organization_id) {
      return new Response(JSON.stringify({ error: "Perfil do usuário não encontrado" }), {
        status: 403,
        headers: { ...cors },
      });
    }

    const orgId = profile.organization_id;

    // Rate limit (20 req/min por usuário+org)
    const rlKey = `${orgId}:${userId}:chat-legal`;
    if (!rateLimit(rlKey)) {
      return new Response(JSON.stringify({ error: "Limite de requisições excedido" }), {
        status: 429,
        headers: { ...cors },
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
      console.warn("⚠️ erro na consulta de prompts:", spErr);
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
      headers: { ...cors },
    });
  } catch (err) {
    console.error("erro no chat-legal:", err);
    return new Response(JSON.stringify({ error: String(err?.message ?? err) }), {
      status: 500,
      headers: { ...cors },
    });
  }
});
