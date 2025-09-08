import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.56.0";
import { corsHeaders, handlePreflight } from "../_shared/cors.ts";

console.log("[assistjur-processos] Function initialized");

serve(async (req) => {
  console.log(`[assistjur-processos] ${req.method} ${req.url}`);

  // Handle CORS preflight
  const preflightResponse = handlePreflight(req);
  if (preflightResponse) return preflightResponse;

  const headers = corsHeaders(req);
  
  // Health check
  if (req.method === "GET") {
    return new Response(JSON.stringify({ ok: true, service: "assistjur-processos" }), { 
      status: 200, 
      headers 
    });
  }

  // Auth
  const auth = req.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ")) {
    console.error("[assistjur-processos] Missing bearer token");
    return new Response(JSON.stringify({ error: "unauthorized", detail: "missing bearer token" }), { status: 401, headers });
  }

  // Body seguro
  let body: any = {};
  try {
    const text = await req.text();
    if (text.trim()) {
      body = JSON.parse(text);
    }
  } catch (e) {
    console.error("[assistjur-processos] Invalid JSON body:", e);
    return new Response(
      JSON.stringify({
        error: "bad_request",
        detail: "JSON inválido",
        example: { page: 1, limit: 20 }
      }),
      { status: 400, headers }
    );
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return new Response(
      JSON.stringify({
        error: 'invalid_payload',
        detail: 'Corpo deve ser um objeto JSON.',
        example: { page: 1, limit: 20 }
      }),
      { status: 400, headers }
    );
  }

  let filters: Record<string, any> = {};
  if (body.filters === undefined) {
    filters = {};
  } else if (typeof body.filters === 'object' && body.filters !== null && !Array.isArray(body.filters)) {
    filters = body.filters;
  } else {
    return new Response(
      JSON.stringify({
        error: 'bad_request',
        detail: 'Parâmetros inválidos',
        example: { page: 1, limit: 20 }
      }),
      { status: 400, headers }
    );
  }

  for (const [key, value] of Object.entries(filters)) {
    if (value === 'true') filters[key] = true;
    else if (value === 'false') filters[key] = false;
  }

  let page = Number(body.page ?? 1);
  if (!Number.isFinite(page) || page < 1) page = 1;

  let limit = Number(body.limit ?? 20);
  if (!Number.isFinite(limit) || limit < 1) limit = 20;
  if (limit > 200) limit = 200;

  const safePayload = { filters, page, limit };
  console.log('[fn] payload:', safePayload);

  // Supabase client com o mesmo Bearer do usuário (respeita RLS)
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: auth } } }
  );

  // Verificar usuário e organização
  let org_id;
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("[assistjur-processos] Auth error:", userError);
      return new Response(JSON.stringify({ error: "unauthorized", detail: "invalid user token" }), { status: 401, headers });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("organization_id, role")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile?.organization_id) {
      console.error("[assistjur-processos] Profile error:", profileError);
      return new Response(JSON.stringify({ error: "unauthorized", detail: "user profile or organization not found" }), { status: 401, headers });
    }
    org_id = profile.organization_id;
  } catch (e) {
    console.error("[assistjur-processos] User verification error:", e);
    return new Response(JSON.stringify({ error: "unauthorized", detail: "authentication failed" }), { status: 401, headers });
  }

  try {
    // Chamar RPC function de forma robusta
    console.log(`[assistjur-processos] Calling RPC with org_id: ${org_id}`);
    
    const { data: result, error } = await supabase.rpc('rpc_get_assistjur_processos', {
      p_org_id: org_id,
      p_filters: filters,
      p_page: page,
      p_limit: limit
    });

    if (error) {
      console.error("[assistjur-processos] RPC error:", JSON.stringify({
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      }));
      
      // Mapear códigos de erro específicos
      const code = (error as any).code ?? "rpc_error";
      let status = 500;
      let detail = error.message;
      
      if (code === "42501") {
        status = 403;
        detail = "Acesso negado. Verifique suas permissões.";
      } else if (code.startsWith("P0001")) {
        status = 400;
        detail = `Erro nos parâmetros: ${error.message}`;
      } else if (error.message?.includes("function") && error.message?.includes("does not exist")) {
        status = 500;
        detail = "Função do banco de dados não encontrada. Contate o suporte.";
      } else if (error.message?.includes("schema") && error.message?.includes("assistjur")) {
        status = 500;
        detail = "Schema assistjur não encontrado. Verifique se os dados foram importados.";
      }
      
      return new Response(
        JSON.stringify({ error: "rpc_error", code, detail }), 
        { status, headers }
      );
    }

    console.log(`[assistjur-processos] RPC result type:`, typeof result, Array.isArray(result));

    // Extrair dados do resultado RPC
    const processosData = result?.[0]?.data || [];
    const totalCount = result?.[0]?.total_count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    const response = {
      data: processosData,
      count: totalCount,
      totalPages,
      page
    };

    console.log(`[assistjur-processos] Success: ${processosData?.length || 0} records, total: ${totalCount}`);
    
    return new Response(JSON.stringify(response), { status: 200, headers });

  } catch (e) {
    console.error("[assistjur-processos] Unexpected error:", e);
    return new Response(
      JSON.stringify({ error: "internal_error", detail: String(e) }), 
      { status: 500, headers }
    );
  }
});