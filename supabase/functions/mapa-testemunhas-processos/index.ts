import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.56.0";
import { buildCorsHeaders, handlePreflight } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logger.ts";
import { ProcessosRequestSchema, ListaResponseSchema } from "../_shared/mapa-contracts.ts";
import { json, jsonError } from "../_shared/http.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

serve(async (req) => {
  const cid = crypto.randomUUID();
  const logger = createLogger(cid);

  const pre = handlePreflight(req, cid);
  if (pre) return pre;

  const headers = { ...buildCorsHeaders(req), "x-correlation-id": cid };

  let payload: unknown = {};
  if (req.method === "POST") {
    try {
      payload = await req.json();
    } catch (e) {
      logger.error(`invalid json: ${e.message}`);
      return jsonError(400, "INVALID_JSON", { message: "Corpo deve ser JSON válido" }, headers);
    }
  }

  const validation = ProcessosRequestSchema.safeParse(payload);
  if (!validation.success) {
    logger.error(`validation: ${validation.error.message}`);
    const fieldErrors = validation.error.flatten().fieldErrors;
    return jsonError(400, "INVALID_PAYLOAD", fieldErrors, headers);
  }

  const params = validation.data;

  const {
    paginacao: { page, limit },
    filtros,
  } = params;

  const authHeader = req.headers.get("authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return jsonError(401, "UNAUTHORIZED", {}, headers);
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
    return jsonError(500, "DB_ERROR", { message: error.message }, headers);
  }

  const result = { items: data ?? [], page, limit, total: count ?? 0 };
  const resultValidation = ListaResponseSchema.safeParse(result);
  if (!resultValidation.success) {
    logger.error(`response validation: ${resultValidation.error.message}`);
    return jsonError(500, "INCONSISTENT_RESPONSE", {}, headers);
  }

  logger.info(`success: ${result.items.length} items returned`);
  return json(200, result, headers);
});
