import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.56.0";
import { handlePreflight } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logger.ts";
import { ProcessosRequestSchema, ListaResponseSchema } from "../_shared/mapa-contracts.ts";
import { jres } from "../_shared/jres.ts";

serve(async (req) => {
  const cid = req.headers.get("x-correlation-id") ?? crypto.randomUUID();
  const logger = createLogger(cid);

  const pre = handlePreflight(req, cid);
  if (pre) return pre;

  let payload: unknown = {};
  if (req.method === "POST") {
    try {
      payload = await req.json();
    } catch (e) {
      logger.error(`invalid json: ${e.message}`);
      return jres(req, { error: "INVALID_JSON", message: "Corpo deve ser JSON válido", cid }, 400);
    }
  }

  const validation = ProcessosRequestSchema.safeParse(payload);
  if (!validation.success) {
    logger.error(`validation: ${validation.error.message}`);
    return jres(req, {
      error: "VALIDATION_ERROR",
      details: validation.error.issues,
      cid,
    }, 422);
  }

  const params = validation.data;

  const {
    paginacao: { page, limit },
    filtros,
  } = params;

  const authHeader = req.headers.get("authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return jres(req, { error: "unauthorized", cid }, 401);
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
    .select("*")
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

  const { data, error } = await query;
  if (error) {
    logger.error(`database: ${error.message}`);
    return jres(req, {
      error: "DB_ERROR",
      message: error.message,
      cid,
    }, 500);
  }

  const result = { items: data ?? [], page, limit, next_cursor: null, cid };
  const resultValidation = ListaResponseSchema.safeParse(result);
  if (!resultValidation.success) {
    logger.error(`response validation: ${resultValidation.error.message}`);
    return jres(req, {
      error: "INCONSISTENT_RESPONSE",
      cid,
    }, 500);
  }

  logger.info(`success: ${result.items.length} items returned`);
  return jres(req, result);
});
