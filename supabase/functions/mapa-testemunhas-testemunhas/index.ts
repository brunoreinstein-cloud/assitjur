import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";
import { createClient } from "npm:@supabase/supabase-js@2.56.0";
import { corsHeaders, handlePreflight } from '../_shared/cors.ts';
import { createLogger } from '../_shared/logger.ts';

const PayloadSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  filters: z.record(z.any()).default({})
}).partial();

Deno.serve(async (req) => {
  const cid = req.headers.get('x-correlation-id') ?? crypto.randomUUID();
  const logger = createLogger(cid);

  const pre = handlePreflight(req, cid);
  if (pre) return pre;

  const headers = corsHeaders(req, cid);

  try {
    let bodyText = "";
    if (req.method === "POST") {
      try { bodyText = await req.text(); } catch { /* ignore */ }
    }

    let payload: unknown = {};
    if (bodyText && bodyText.trim()) {
      try { payload = JSON.parse(bodyText); } catch (e) { logger.warn(`json parse: ${e.message}`); }
    }

    const parsed = PayloadSchema.safeParse(payload);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error:"invalid_payload", details: parsed.error.issues, correlationId: cid }), { status: 400, headers: { ...headers, "Content-Type":"application/json" }});
    }

    const page  = Math.max(1, Number(parsed.data.page ?? 1) || 1);
    const limit = Math.min(100, Math.max(1, Number(parsed.data.limit ?? 20) || 20));
    const filtersRaw = parsed.data.filters ?? {};
    const filters = Object.fromEntries(Object.entries(filtersRaw).flatMap(([k,v]) => {
      if (v === "" || v === undefined || v === null) return [];
      if (v === "true") return [[k,true]];
      if (v === "false") return [[k,false]];
      return [[k,v]];
    }));

    const authHeader = req.headers.get("authorization") ?? "";
    if (!/^Bearer\s+.+/i.test(authHeader)) {
      return new Response(JSON.stringify({ error:"unauthorized", message:"Token de autorização obrigatório", correlationId: cid }), { status: 401, headers: { ...headers, "Content-Type":"application/json" }});
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { auth: { persistSession:false, autoRefreshToken:false }, global: { headers: { Authorization: authHeader } } }
    );

    const isProd = (Deno.env.get("ENVIRONMENT") ?? "production") === "production";

    // MOCK apenas fora de produção
    if (!isProd) {
      let mock = [
        { nome_testemunha:"João Silva",  qtd_testemunhos:3, polo_ativo_autor:1, polo_ativo_testemunha:2, polo_passivo_reu:0, polo_passivo_testemunha:0, troca_favor:false, triangulacao:false, created_at:new Date().toISOString() },
        { nome_testemunha:"Maria Santos", qtd_testemunhos:5, polo_ativo_autor:2, polo_ativo_testemunha:3, polo_passivo_reu:1, polo_passivo_testemunha:1, troca_favor:true,  triangulacao:false, created_at:new Date().toISOString() },
        { nome_testemunha:"Pedro Oliveira", qtd_testemunhos:8, polo_ativo_autor:0, polo_ativo_testemunha:6, polo_passivo_reu:0, polo_passivo_testemunha:2, troca_favor:false, triangulacao:true,  created_at:new Date().toISOString() }
      ];

      if (typeof filters.search === "string" && filters.search.trim()) {
        const q = filters.search.toLowerCase();
        mock = mock.filter(i => i.nome_testemunha.toLowerCase().includes(q));
      }
      if (filters.troca_favor === true) mock = mock.filter(i => i.troca_favor);
      if (filters.triangulacao === true) mock = mock.filter(i => i.triangulacao);

      const start = (page - 1) * limit;
      const end   = start + limit;
      const data  = mock.slice(start, end);
      const count = mock.length;
      const totalPages = Math.ceil(count / limit);

      return new Response(JSON.stringify({ data, count, totalPages, page, limit }), {
        status: 200, headers: { ...headers, "Content-Type":"application/json" }
      });
    }

    // TODO: produção → chame sua RPC/tabela real aqui
    // const { data, error } = await supabase.rpc("rpc_get_assistjur_testemunhas", { ... });
    // if (error) { /* mapear erros como na outra função */ }

    return new Response(JSON.stringify({ data:[], count:0, totalPages:0, page, limit }), {
      status: 200, headers: { ...headers, "Content-Type":"application/json" }
    });

  } catch (e: any) {
    return new Response(JSON.stringify({ error:"server_error", message: e?.message || "Erro", correlationId: cid }), {
      status: 500, headers: { ...headers, "Content-Type":"application/json" }
    });
  }
});

