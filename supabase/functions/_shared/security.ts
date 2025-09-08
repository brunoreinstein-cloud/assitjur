import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.56.0";
import type { ZodSchema } from "npm:zod@4.1.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Content-Type": "application/json",
  Vary: "Origin"
} as const;

export function validateJWT(token: string | null): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  try {
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
    );
    if (typeof payload.exp === "number") {
      return Math.floor(Date.now() / 1000) < payload.exp;
    }
    return true;
  } catch {
    return false;
  }
}

export function createSecureErrorResponse(message: string, status = 400): Response {
  const body = JSON.stringify({ error: message });
  return new Response(body, { status, headers: corsHeaders });
}

export function createAuthenticatedClient(jwt: string): SupabaseClient {
  return createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

const rateLimitStore = new Map<string, { count: number; start: number }>();

export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  if (!entry || now - entry.start > windowMs) {
    rateLimitStore.set(key, { count: 1, start: now });
    return true;
  }
  if (entry.count >= limit) {
    return false;
  }
  entry.count += 1;
  return true;
}

export function sanitizeAndValidate<T>(data: unknown, schema: ZodSchema<T>): T {
  const sanitized = typeof data === "string" ? data.trim() : data;
  return schema.parse(sanitized);
}

export async function processFileSecurely(file: File, maxSize = 1024 * 1024): Promise<string> {
  if (file.size > maxSize) {
    throw new Error("File too large");
  }
  const buffer = await file.arrayBuffer();
  return new TextDecoder().decode(buffer);
}

export interface ProcessoNormalizado {
  numero: string;
  classe?: string;
  assunto?: string;
  tribunal?: string;
  uf?: string;
  comarca?: string;
  vara?: string;
  dataDistribuicao?: string;
}

export function normalizeProcessoFields(input: Record<string, unknown>): ProcessoNormalizado {
  return {
    numero: String(input.numero ?? ""),
    classe: input.classe ? String(input.classe) : undefined,
    assunto: input.assunto ? String(input.assunto) : undefined,
    tribunal: input.tribunal ? String(input.tribunal) : undefined,
    uf: input.uf ? String(input.uf) : undefined,
    comarca: input.comarca ? String(input.comarca) : undefined,
    vara: input.vara ? String(input.vara) : undefined,
    dataDistribuicao: input.dataDistribuicao ? String(input.dataDistribuicao) : undefined
  };
}

function redact(value: string): string {
  return value.replace(/./g, "*");
}

function safeStringify(obj: unknown, keys: string[]): string {
  return JSON.stringify(obj, (key, value) => {
    if (keys.includes(key)) {
      return typeof value === "string" ? redact(value) : "[REDACTED]";
    }
    return value;
  });
}

export function secureLog(message: string, data?: Record<string, unknown>, keysToRedact: string[] = []): void {
  const payload = data ? safeStringify(data, keysToRedact) : "";
  console.log(message + (payload ? ` ${payload}` : ""));
}

export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => reject(new Error("Timeout")), ms);
    promise
      .then((value) => {
        clearTimeout(id);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(id);
        reject(err);
      });
  });
}
