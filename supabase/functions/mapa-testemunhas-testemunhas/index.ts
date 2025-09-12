import { serve } from '../_shared/observability.ts';
import { corsHeaders, handlePreflight, parseAllowedOrigins } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logger.ts";
import { ListaResponseSchema, TestemunhasRequestSchema } from "../_shared/mapa-contracts.ts";
import { applyTestemunhasFilters } from "../_shared/mapa-filters.ts";
import { json, jsonError } from "../_shared/http.ts";
import { toFieldErrors } from "../_shared/validation.ts";

const origins = parseAllowedOrigins(Deno.env.get("ALLOWED_ORIGINS"));

serve('mapa-testemunhas-testemunhas', async (req) => {
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
  const logger = createLogger(requestId);
  const ch = corsHeaders(req, origins);
  const pf = handlePreflight(req, origins, { "x-request-id": requestId });
  if (pf) return pf;

  let payload: unknown = {};
  if (req.method === "POST") {
    try {
      payload = await req.json();
    } catch (e) {
      logger.error(`invalid json: ${e.message}`);
      return jsonError(400, "INVALID_JSON", { fieldErrors: {}, requestId }, { ...ch, "x-request-id": requestId });
    }
  }

  const validation = TestemunhasRequestSchema.safeParse(payload);
  if (!validation.success) {
    logger.error(`validation: ${validation.error.message}`);
    return jsonError(
      400,
      "INVALID_PAYLOAD",
      { fieldErrors: toFieldErrors(validation.error), requestId },
      { ...ch, "x-request-id": requestId },
    );
  }

  const {
    paginacao: { page, limit },
    filtros,
  } = validation.data;

  const authHeader = req.headers.get("authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return jsonError(401, "UNAUTHORIZED", { requestId }, { ...ch, "x-request-id": requestId });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!,
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
    return jsonError(500, "DB_ERROR", { message: error.message, requestId }, { ...ch, "x-request-id": requestId });
  }

  const result = { items: data ?? [], page, limit, total: count ?? 0, next_cursor: null, requestId };
  const resultValidation = ListaResponseSchema.safeParse(result);
  if (!resultValidation.success) {
    logger.error(`response validation: ${resultValidation.error.message}`);
    return jsonError(500, "INCONSISTENT_RESPONSE", { issues: resultValidation.error.issues, expected: { items: [], page: 1, limit: 20, next_cursor: null, requestId }, requestId }, { ...ch, "x-request-id": requestId });
  }

  logger.info(`success: ${result.items.length} items returned`);
  return json(200, result, { ...ch, "x-request-id": requestId });
});

