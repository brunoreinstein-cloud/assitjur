import { createClient } from "npm:@supabase/supabase-js@2.56.0";
import { corsHeaders, handlePreflight } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logger.ts";
import { ListaResponseSchema, TestemunhasRequestSchema } from "../_shared/mapa-contracts.ts";
import { applyTestemunhasFilters } from "../_shared/mapa-filters.ts";
import { json, jsonError } from "../_shared/http.ts";
import { z } from "npm:zod@3.23.8";

Deno.serve(async (req) => {
  const cid = req.headers.get("x-correlation-id") ?? crypto.randomUUID();
  const logger = createLogger(cid);
  const ch = corsHeaders(req);
  const pf = handlePreflight(req, cid);
  if (pf) return pf;

  const EXPECTED: z.infer<typeof TestemunhasRequestSchema> = {
    paginacao: { page: 1, limit: 20 },
    filtros: { search: "term" },
  };

  let payload: unknown = {};
  if (req.method === "POST") {
    try {
      payload = await req.json();
    } catch (e) {
      logger.error(`invalid json: ${e.message}`);
      return jsonError(400, "INVALID_JSON", { message: "Corpo deve ser JSON válido", cid }, { ...ch, "x-correlation-id": cid });
    }
  }

  const validation = TestemunhasRequestSchema.safeParse(payload);
  if (!validation.success) {
    logger.error(`validation: ${validation.error.message}`);
    return jsonError(400, "INVALID_PAYLOAD", { issues: validation.error.issues, expected: EXPECTED, cid }, { ...ch, "x-correlation-id": cid });
  }

  const {
    paginacao: { page, limit },
    filtros,
  } = validation.data;

  const authHeader = req.headers.get("authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return jsonError(401, "UNAUTHORIZED", { cid }, { ...ch, "x-correlation-id": cid });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } }, auth: { autoRefreshToken: false, persistSession: false } },
  );

  const from = (page - 1) * limit;
  const to = from + limit - 1;
  let query = supabase
    .from("assistjur_testemunhas_view")
    .select("*", { count: "exact" })
    .range(from, to);

  query = applyTestemunhasFilters(query, filtros);

  const { data, count, error } = await query;
  if (error) {
    logger.error(`database: ${error.message}`);
    return jsonError(500, "DB_ERROR", { message: error.message, cid }, { ...ch, "x-correlation-id": cid });
  }

  const result = { items: data ?? [], page, limit, total: count ?? 0, next_cursor: null, cid };
  const resultValidation = ListaResponseSchema.safeParse(result);
  if (!resultValidation.success) {
    logger.error(`response validation: ${resultValidation.error.message}`);
    return jsonError(500, "INCONSISTENT_RESPONSE", { issues: resultValidation.error.issues, expected: { items: [], page: 1, limit: 20, next_cursor: null, cid }, cid }, { ...ch, "x-correlation-id": cid });
  }

  logger.info(`success: ${result.items.length} items returned`);
  return json(200, result, { ...ch, "x-correlation-id": cid });
});

