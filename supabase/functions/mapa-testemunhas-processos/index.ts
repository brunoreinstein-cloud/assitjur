import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.56.0";
import { corsHeaders, handlePreflight } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logger.ts";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

const PayloadSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(20),
  filters: z.record(z.any()).default({})
}).partial().transform((p) => ({
  page: Math.max(1, Number(p.page ?? 1) || 1),
  limit: Math.min(200, Math.max(1, Number(p.limit ?? 20) || 20)),
  filters: (p.filters && typeof p.filters === 'object' && !Array.isArray(p.filters)) ? p.filters : {}
}));

serve(async (req) => {
  const cid = req.headers.get('x-correlation-id') ?? crypto.randomUUID();
  const logger = createLogger(cid);

  // Preflight
  const pre = handlePreflight(req, cid);
  if (pre) return pre;

  const headers = corsHeaders(req, cid);

  try {
    // Parse JSON tolerante (text->JSON para logs mais úteis)
    let bodyText = "";
    try {
      if (req.method === "POST") {
        bodyText = await req.text();
      }
    } catch { /* ignore */ }

    let payload: unknown = {};
    if (bodyText && bodyText.trim().length) {
      try {
        payload = JSON.parse(bodyText);
      } catch (e) {
        logger.error(`invalid JSON: ${e.message}`);
        return new Response(JSON.stringify({ error:"invalid_json", message:"Corpo deve ser JSON válido", correlationId: cid }), { status: 400, headers: { ...headers, "Content-Type":"application/json" }});
      }
    }

    // Zod + normalização de booleans em filters
    const parsed = PayloadSchema.safeParse(payload);
    if (!parsed.success) {
      logger.error(`payload validation: ${parsed.error.message}`);
      return new Response(JSON.stringify({ error:"invalid_payload", message:"Parâmetros inválidos", details: parsed.error.issues, correlationId: cid }), { status: 400, headers: { ...headers, "Content-Type":"application/json" }});
    }
    const { page, limit } = parsed.data;
    const filters = Object.fromEntries(Object.entries(parsed.data.filters).flatMap(([k,v]) => {
      if (v === "" || v === undefined || v === null) return [];
      if (v === "true") return [[k,true]];
      if (v === "false") return [[k,false]];
      if (v === "null") return [[k,null]];
      return [[k,v]];
    }));

    // Auth
    const authHeader = req.headers.get("authorization") ?? "";
    if (!/^Bearer\s+.+/i.test(authHeader)) {
      logger.error("missing bearer");
      return new Response(JSON.stringify({ error:"unauthorized", message:"Token de autorização obrigatório", correlationId: cid }), { status: 401, headers: { ...headers, "Content-Type":"application/json" }});
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } }, auth: { autoRefreshToken:false, persistSession:false } }
    );

    // Usuário & organização
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      logger.error(`auth.getUser: ${userError?.message || "no user"}`);
      return new Response(JSON.stringify({ error:"unauthorized", message:"Token inválido ou expirado", correlationId: cid }), { status: 401, headers: { ...headers, "Content-Type":"application/json" }});
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles").select("organization_id, role").eq("user_id", user.id).single();

    if (profileError || !profile?.organization_id) {
      logger.error(`profile: ${profileError?.message || "no org"}`);
      return new Response(JSON.stringify({ error:"forbidden", message:"Perfil/organização não encontrados", correlationId: cid }), { status: 403, headers: { ...headers, "Content-Type":"application/json" }});
    }

    const orgId = profile.organization_id;

    // RPC
    const { data: result, error: rpcError } = await supabase.rpc("rpc_get_assistjur_processos", {
      p_org_id: orgId,
      p_filters: filters,
      p_page: page,
      p_limit: limit
    });

    if (rpcError) {
      const info = { message: rpcError.message, details: rpcError.details, hint: rpcError.hint, code: rpcError.code };
      logger.error(`rpc error: ${JSON.stringify(info)}`);
      let status = 500, userMessage = "Erro interno do servidor";
      switch (rpcError.code) {
        case "42501": status = 403; userMessage = "Acesso negado."; break;
        case "P0001": status = 400; userMessage = "Erro nos parâmetros da consulta."; break;
        case "42883": status = 500; userMessage = "Função do banco não encontrada."; break;
        case "42P01": status = 500; userMessage = "Tabela não encontrada."; break;
        default:
          if (rpcError.message?.toLowerCase().includes("timeout")) { status = 504; userMessage = "Timeout na consulta. Use filtros mais específicos."; }
      }
      return new Response(JSON.stringify({ error:"database_error", message:userMessage, code:rpcError.code, correlationId: cid }), { status, headers: { ...headers, "Content-Type":"application/json" }});
    }

    // Normalize result
    const first = Array.isArray(result) ? result[0] : null;
    const data = (first?.data && Array.isArray(first.data)) ? first.data : [];
    const totalCount = Number(first?.total_count || 0);
    const totalPages = totalCount > 0 ? Math.ceil(totalCount / limit) : 0;

    return new Response(JSON.stringify({ data, count: totalCount, totalPages, page }), {
      status: 200,
      headers: { ...headers, "Content-Type":"application/json" }
    });
  } catch (e: any) {
    const msg = e?.message || "Erro";
    return new Response(JSON.stringify({ error:"server_error", message: msg, correlationId: cid }), {
      status: 500,
      headers: { ...headers, "Content-Type":"application/json" }
    });
  }
});
