// supabase/functions/chat-legal/index.ts

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { z } from "npm:zod@3.23.8";
import { getSystemPrompt } from "../_shared/prompt-registry.ts";
import { corsHeaders, handlePreflight } from "../_shared/cors.ts";
import { getAuth, adminClient } from "../_shared/auth.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { createLogger } from "../_shared/logger.ts";

/**
 * =========================
 * Configuração e Constantes
 * =========================
 */
const DEFAULT_MODEL =
  Deno.env.get("OPENAI_DEFAULT_MODEL") ?? "gpt-4o-mini";
const DEFAULT_TEMPERATURE = Number(Deno.env.get("OPENAI_TEMPERATURE") ?? 0.2);
const MAX_MESSAGE_LENGTH = Number(Deno.env.get("OPENAI_MAX_MSG_LEN") ?? 2000);
const MAX_TOKENS = Number(Deno.env.get("OPENAI_MAX_TOKENS") ?? 1500);
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const OPENAI_TIMEOUT_MS = Number(Deno.env.get("OPENAI_TIMEOUT_MS") ?? 10_000);

function withTimeout<T>(p: Promise<T>, ms: number) {
  return Promise.race([
    p,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), ms)
    ),
  ]);
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
export async function handler(request: Request) {
  const cid = request.headers.get("x-correlation-id") ?? crypto.randomUUID();
  const preflight = handlePreflight(request, cid);
  if (preflight) return preflight;

  const cors = corsHeaders(request, cid);
  const origin = request.headers.get("Origin") || "";
  if (
    cors["Access-Control-Allow-Origin"] !== "*" &&
    cors["Access-Control-Allow-Origin"] !== origin
  ) {
    return new Response(JSON.stringify({ error: "Origem não permitida" }), {
      status: 403,
      headers: { ...cors, "x-correlation-id": cid },
    });
  }

  const log = createLogger(cid);

  try {
    const { user, organization_id, supa, error } = await getAuth(request);
    if (error || !user || !organization_id) {
      return new Response(JSON.stringify({ error: "Autenticação obrigatória" }), {
        status: 401,
        headers: { ...cors, "x-correlation-id": cid },
      });
    }

    const admin = adminClient();

    const body = await request.json().catch(() => ({}));
    const schema = z.object({
      message: z.string().min(1).max(MAX_MESSAGE_LENGTH),
      promptName: z.string().optional(),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Payload inválido" }), {
        status: 400,
        headers: { ...cors, "x-correlation-id": cid },
      });
    }
    const { message, promptName } = parsed.data;

    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const rlKey = `${ip}:${organization_id}:${user.id}:chat-legal`;
    const allowed = await checkRateLimit(admin, rlKey, undefined, undefined, cid);
    if (!allowed) {
      return new Response(JSON.stringify({ error: "Limite de requisições excedido" }), {
        status: 429,
        headers: { ...cors, "x-correlation-id": cid },
      });
    }

    const wantedName = promptName ?? "System: Mapa de Testemunhas - v1";
    const { data: sysPromptRow, error: spErr } = await supa
      .from("prompts")
      .select("content")
      .eq("org_id", organization_id)
      .eq("type", "SYSTEM")
      .eq("name", wantedName)
      .maybeSingle();

    if (spErr) {
      log.warn(`erro na consulta de prompts: ${spErr.message}`);
    }
    const systemPrompt = sysPromptRow?.content ?? getSystemPrompt(wantedName);

    const completion = await withTimeout(
      openAIChat({ system: systemPrompt, user: message }),
      OPENAI_TIMEOUT_MS,
    );

    return new Response(JSON.stringify({ ok: true, data: completion }), {
      status: 200,
      headers: { ...cors, "x-correlation-id": cid },
    });
  } catch (err) {
    log.error(`erro no chat-legal: ${err?.message ?? err}`);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...cors, "x-correlation-id": cid },
    });
  }
}

serve(handler);
