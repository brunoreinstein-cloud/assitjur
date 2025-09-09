import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.56.0";
import { buildCorsHeaders, handlePreflight } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logger.ts";
import { ProcessosRequestSchema, ListaResponseSchema } from "../_shared/mapa-contracts.ts";
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

  const validation = ProcessosRequestSchema.safeParse(payload);
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
    paginacao: { cursor, limit },
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

  let query = supabase
    .from("assistjur_processos_view")
    .select("*")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (cursor) {
    query = query
      .lt("created_at", cursor.created_at)
      .or(`created_at.eq.${cursor.created_at}.and(id.lt.${cursor.id})`);
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

  const { data, error } = await query.limit(limit + 1);
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

  let items = data ?? [];
  let next_cursor: { created_at: string; id: string } | undefined;
  if (items.length > limit) {
    const last = items.pop()!;
    next_cursor = { created_at: last.created_at, id: last.id };
  }

  const result = { items, limit, next_cursor };
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
