import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.56.0";
import { corsHeaders, handlePreflight } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logger.ts";
import { parseProcessosRequest, ListaResponseSchema } from "../_shared/mapa-contracts.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

serve(async (req) => {
  const cid = req.headers.get("x-correlation-id") ?? crypto.randomUUID();
  const logger = createLogger(cid);

  const preflight = handlePreflight(req, cid);
  if (preflight) return preflight;

  const headers = { ...corsHeaders(req, cid), "Content-Type": "application/json" };

  let payload: unknown = {};
  if (req.method === "POST") {
    try {
      payload = await req.json();
    } catch (e) {
      logger.error(`invalid json: ${e.message}`);
      return new Response(
        JSON.stringify({ error: "INVALID_JSON", message: "Corpo deve ser JSON válido" }),
        { status: 400, headers },
      );
    }
  }

  let params;
  try {
    params = parseProcessosRequest(payload);
  } catch (e) {
    const issues = e instanceof z.ZodError ? e.issues : undefined;
    logger.error(`validation: ${e}`);
    return new Response(
      JSON.stringify({ error: "VALIDATION_ERROR", details: issues }),
      { status: 422, headers },
    );
  }

  const {
    paginacao: { page, limit },
    filtros,
  } = params;

  const authHeader = req.headers.get("authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } }, auth: { autoRefreshToken: false, persistSession: false } },
  );

  const from = (page - 1) * limit;
  const to = from + limit - 1;
  let query = supabase
    .from("assistjur_processos_view")
    .select("*", { count: "exact" })
    .range(from, to);

  if (filtros.search) {
    query = query.ilike("search", `%${filtros.search}%`);
  }
  if (filtros.data_inicio) {
    query = query.gte("data", filtros.data_inicio);
  }
  if (filtros.data_fim) {
    query = query.lte("data", filtros.data_fim);
  }

  const { data, count, error } = await query;
  if (error) {
    logger.error(`database: ${error.message}`);
    return new Response(
      JSON.stringify({ error: "DATABASE_ERROR", message: error.message }),
      { status: 500, headers },
    );
  }

  const result = { items: data ?? [], page, limit, total: count ?? 0 };
  const valid = ListaResponseSchema.safeParse(result);
  if (!valid.success) {
    logger.error(`response validation: ${valid.error.message}`);
    return new Response(
      JSON.stringify({ error: "INCONSISTENT_RESPONSE" }),
      { status: 500, headers },
    );
  }

  return new Response(JSON.stringify(result), { status: 200, headers });
});
