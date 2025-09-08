import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.56.0";
import { buildCorsHeaders, handlePreflight } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logger.ts";
import { TestemunhasRequestSchema, ListaResponseSchema } from "../_shared/mapa-contracts.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

serve(async (req) => {
  const cid = req.headers.get("x-correlation-id") ?? crypto.randomUUID();
  const logger = createLogger(cid);

  const pre = handlePreflight(req, cid);
  if (pre) return pre;

  const headers = { ...buildCorsHeaders(req), "x-correlation-id": cid, "content-type": "application/json; charset=utf-8" };

  let payload: unknown = {};
  if (req.method === "POST") {
    try {
      payload = await req.json();
    } catch (e) {
      logger.error(`invalid json: ${e.message}`);
      return new Response(
        JSON.stringify({ error: "INVALID_JSON", message: "Corpo deve ser JSON válido", cid }),
        { status: 400, headers },
      );
    }
  }

  const validation = TestemunhasRequestSchema.safeParse(payload);
  if (!validation.success) {
    logger.error(`validation: ${validation.error.message}`);
    return new Response(
      JSON.stringify({ 
        error: "VALIDATION_ERROR", 
        details: validation.error.issues, 
        cid 
      }),
      { status: 422, headers },
    );
  }

  const params = validation.data;

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
    .from("assistjur_testemunhas_view")
    .select("*", { count: "exact" })
    .range(from, to);

  if (filtros.nome) {
    query = query.ilike("nome", `%${filtros.nome}%`);
  }
  if (filtros.documento) {
    query = query.eq("documento", filtros.documento);
  }
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
      JSON.stringify({ 
        error: "DB_ERROR", 
        message: error.message,
        cid 
      }),
      { status: 500, headers },
    );
  }

  const result = { items: data ?? [], page, limit, total: count ?? 0 };
  const resultValidation = ListaResponseSchema.safeParse(result);
  if (!resultValidation.success) {
    logger.error(`response validation: ${resultValidation.error.message}`);
    return new Response(
      JSON.stringify({ 
        error: "INCONSISTENT_RESPONSE",
        cid 
      }),
      { status: 500, headers },
    );
  }

  logger.info(`success: ${result.items.length} items returned`);
  return new Response(JSON.stringify(result), { status: 200, headers });
});
