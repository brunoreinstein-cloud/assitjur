import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.56.0";
import type { ZodSchema } from "npm:zod@4.1.3";
import { validateJWT } from "./jwt.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const PUBLISHABLE_KEY = Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
const RATE_LIMIT_MAX = Number(Deno.env.get("RATE_LIMIT_MAX") ?? "20");
const RATE_LIMIT_WINDOW_MS = Number(Deno.env.get("RATE_LIMIT_WINDOW_MS") ?? "60000");

// Enhanced CORS configuration for production security
const ALLOWED_ORIGINS = [
  'https://c19fd3c7-1955-4ba3-bf12-37fcb264235a.lovableproject.com',
  'http://localhost:3000',
  'http://localhost:5173'
];

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Will be replaced by secure CORS function
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-request-id",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
  "Access-Control-Max-Age": "86400",
  "Content-Type": "application/json",
  "Vary": "Origin",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin"
} as const;

export function getSecureCorsHeaders(origin?: string): Record<string, string> {
  const isAllowedOrigin = origin && ALLOWED_ORIGINS.includes(origin);
  
  return {
    ...corsHeaders,
    "Access-Control-Allow-Origin": isAllowedOrigin ? origin : ALLOWED_ORIGINS[0]
  };
}

export { validateJWT };

export function createSecureErrorResponse(message: string, status = 400): Response {
  const body = JSON.stringify({ error: message });
  return new Response(body, { status, headers: corsHeaders });
}

export function createAuthenticatedClient(jwt: string): SupabaseClient {
  return createClient(SUPABASE_URL, PUBLISHABLE_KEY, {
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

export { RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS };
