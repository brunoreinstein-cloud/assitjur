// supabase/functions/chat-legal/index.ts

import { serve } from "../_shared/observability.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { z } from "npm:zod@3.23.8";
import { getSystemPrompt } from "../_shared/prompt-registry.ts";
import { corsHeaders, handlePreflight } from "../_shared/cors.ts";
import { getAuth, adminClient } from "../_shared/auth.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { createLogger } from "../_shared/logger.ts";
import { json, jsonError } from "../_shared/http.ts";
import { toFieldErrors } from "../_shared/validation.ts";

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
const OPENAI_TIMEOUT_MS = Number(Deno.env.get("OPENAI_TIMEOUT_MS") ?? 30_000); // Aumentado para 30s
const MAX_RETRIES = 2;

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
  requestId,
}: {
  system: string;
  user: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  requestId: string;
}) {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY ausente");
  }

  const log = createLogger(requestId);

  const body = {
    model,
    max_completion_tokens: max_tokens,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    response_format: { type: "json_object" }
  };

  log.info(`Chamando OpenAI: model=${model}, max_tokens=${max_tokens}`);
  const startTime = Date.now();

  let lastError: Error | null = null;
  
  // Retry logic
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const elapsed = Date.now() - startTime;

      if (!res.ok) {
        const errText = await res.text();
        log.error(`OpenAI erro ${res.status} (tentativa ${attempt + 1}): ${errText}`);
        lastError = new Error(`OpenAI error: ${res.status} ${errText}`);
        
        // Retry on 5xx errors or rate limits
        if ((res.status >= 500 || res.status === 429) && attempt < MAX_RETRIES) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          log.warn(`Aguardando ${delay}ms antes de retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw lastError;
      }

      const json = await res.json();
      const content = json?.choices?.[0]?.message?.content ?? "";
      
      log.info(`OpenAI sucesso em ${elapsed}ms (tentativa ${attempt + 1}), chars=${content.length}`);
      
      // Validate JSON response
      try {
        JSON.parse(content);
        log.info(`✅ Resposta é JSON válido`);
      } catch {
        log.warn(`⚠️ Resposta NÃO é JSON válido: ${content.substring(0, 100)}`);
      }
      
      return content;
      
    } catch (err) {
      lastError = err as Error;
      log.error(`OpenAI tentativa ${attempt + 1} falhou: ${err.message}`);
      
      if (attempt < MAX_RETRIES) {
        const delay = Math.pow(2, attempt) * 1000;
        log.warn(`Aguardando ${delay}ms antes de retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error("OpenAI falhou após todas as tentativas");
}

/**
 * =========================
 * Manipulador
 * =========================
 */
export async function handler(request: Request) {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const pre = handlePreflight(request, requestId);
  if (pre) return pre;

  const log = createLogger(requestId);

  try {
    const { user, organization_id, supa, error } = await getAuth(request);
    if (error || !user || !organization_id) {
      return jsonError(401, "UNAUTHORIZED", { requestId }, { ...corsHeaders(request), "x-request-id": requestId });
    }

    const admin = adminClient();

    let payload: unknown = {};
    try {
      payload = await request.json();
    } catch (e) {
      log.error(`invalid json: ${e.message}`);
      return jsonError(400, "INVALID_JSON", { fieldErrors: {}, requestId }, { ...corsHeaders(request), "x-request-id": requestId });
    }

    const ChatLegalRequestSchema = z.object({
      message: z.string().min(1).max(MAX_MESSAGE_LENGTH),
      promptName: z.string().optional(),
    });
    const validation = ChatLegalRequestSchema.safeParse(payload);
    if (!validation.success) {
      log.error(`validation: ${validation.error.message}`);
      return jsonError(
        400,
        "INVALID_PAYLOAD",
        { fieldErrors: toFieldErrors(validation.error), requestId },
        { ...corsHeaders(request), "x-request-id": requestId },
      );
    }
    const { message, promptName } = validation.data;

    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const rlKey = `${ip}:${organization_id}:${user.id}:chat-legal`;
    const allowed = await checkRateLimit(admin, rlKey, undefined, undefined, requestId);
    if (!allowed) {
      return jsonError(429, "RATE_LIMIT", { requestId }, { ...corsHeaders(request), "x-request-id": requestId });
    }

    const wantedName = promptName ?? "System: Mapa de Testemunhas - v1";
    const { data: sysPromptRow, error: spErr } = await supa
      .from("prompts")
      .select("content")
      .eq("org_id", organization_id)
      .eq("template_type", "SYSTEM")
      .eq("label", wantedName)
      .maybeSingle();

    if (spErr) {
      log.warn(`erro na consulta de prompts: ${spErr.message}`);
    }
    const systemPrompt = sysPromptRow?.content ?? getSystemPrompt(wantedName);
    
    log.info(`📥 Input: kind=${wantedName}, msg_len=${message.length}, preview="${message.substring(0, 100)}..."`);
    log.info(`📋 System prompt length: ${systemPrompt.length} chars`);

    const completion = await withTimeout(
      openAIChat({ system: systemPrompt, user: message, requestId }),
      OPENAI_TIMEOUT_MS,
    );

    log.info(`📤 Response: len=${completion.length}, preview="${completion.substring(0, 200)}..."`);

    return json(200, { ok: true, data: completion, requestId }, { ...corsHeaders(request), "x-request-id": requestId });
  } catch (err) {
    log.error(`erro no chat-legal: ${err?.message ?? err}`);
    return jsonError(500, "INTERNAL_ERROR", { requestId }, { ...corsHeaders(request), "x-request-id": requestId });
  }
}

serve('chat-legal', handler);
