import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handlePreflight } from "../_shared/cors.ts";

serve(async (req) => {
  console.log(`[mapa-testemunhas-processos] ${req.method} ${req.url}`);

  // Handle CORS preflight
  const preflightResponse = handlePreflight(req);
  if (preflightResponse) return preflightResponse;

  const headers = corsHeaders(req);
  
  // Health check
  if (req.method === "GET") {
    return new Response(JSON.stringify({ ok: true, service: "mapa-testemunhas-processos" }), { 
      status: 200, 
      headers 
    });
  }

  // Auth
  const auth = req.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ")) {
    console.error("[mapa-testemunhas-processos] Missing bearer token");
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
    console.error("[mapa-testemunhas-processos] Invalid JSON body:", e);
    return new Response(JSON.stringify({ error: "bad_request", detail: "invalid JSON body" }), { status: 400, headers });
  }

  console.log("[mapa-testemunhas-processos] Request body:", JSON.stringify(body));

  const filters = body?.filters ?? {};
  const page = Number(body?.page ?? 1);
  const limit = Math.min(Number(body?.limit ?? 10), 200);
  const offset = (page - 1) * limit;

  // Supabase client com o mesmo Bearer do usuário (respeita RLS)
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: auth } } }
  );

  // Verificar usuário e organização
  let profile;
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("[mapa-testemunhas-processos] Auth error:", userError);
      return new Response(JSON.stringify({ error: "unauthorized", detail: "invalid user token" }), { status: 401, headers });
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("organization_id, role")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profileData?.organization_id) {
      console.error("[mapa-testemunhas-processos] Profile error:", profileError);
      return new Response(JSON.stringify({ error: "unauthorized", detail: "user profile or organization not found" }), { status: 401, headers });
    }
    profile = profileData;
  } catch (e) {
    console.error("[mapa-testemunhas-processos] User verification error:", e);
    return new Response(JSON.stringify({ error: "unauthorized", detail: "authentication failed" }), { status: 401, headers });
  }

  try {
    // Usar tabela processos (substituindo processos_live que foi removida)
    let query = supabase
      .from("assistjur.processos")
      .select(`
        id,
        cnj,
        status,
        comarca,
        tribunal,
        fase,
        reclamante_nome,
        advogados_ativo,
        testemunhas_ativo,
        testemunhas_passivo,
        reclamante_foi_testemunha,
        troca_direta,
        triangulacao_confirmada,
        prova_emprestada,
        classificacao_final,
        tenant_id,
        created_at,
        updated_at
      `, { count: 'exact' })
      .eq('tenant_id', profile.organization_id)
      .is('deleted_at', null) // Não incluir soft deleted
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Aplicar filtros
    if (filters?.uf) {
      query = query.or(`comarca.ilike.%${filters.uf}%,tribunal.ilike.%${filters.uf}%`);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.fase) {
      query = query.eq('fase', filters.fase);
    }
    if (filters?.search) {
      query = query.or(`cnj.ilike.%${filters.search}%,comarca.ilike.%${filters.search}%,reclamante_nome.ilike.%${filters.search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("[mapa-testemunhas-processos] Database error:", error);
      // Mapear códigos de erro específicos
      const code = (error as any).code ?? "db_error";
      let status = 500;
      let detail = error.message;
      
      if (code === "42501") {
        status = 403;
        detail = "Acesso negado. Verifique suas permissões.";
      } else if (code.startsWith("PGRST")) {
        status = 400;
        detail = `Erro na consulta: ${error.message}`;
      }
      
      return new Response(
        JSON.stringify({ error: "db_error", code, detail }), 
        { status, headers }
      );
    }

    // Transform processos data para o formato esperado
    const transformedData = (data || []).map(processo => {
      const extractUF = (field: string | null) => {
        if (!field) return null;
        const ufMatch = field.match(/\b(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)\b/i);
        return ufMatch ? ufMatch[1].toUpperCase() : null;
      };

      const calculateUniqueDepositions = (ativo: any[], passivo: any[]) => {
        const all = [...(ativo || []), ...(passivo || [])];
        return new Set(all).size;
      };

      return {
        cnj: processo.cnj,
        status: processo.status,
        uf: extractUF(processo.comarca) || extractUF(processo.tribunal),
        comarca: processo.comarca,
        fase: processo.fase,
        reclamante_limpo: processo.reclamante_nome,
        advogados_parte_ativa: processo.advogados_ativo || [],
        testemunhas_ativo_limpo: processo.testemunhas_ativo || [],
        testemunhas_passivo_limpo: processo.testemunhas_passivo || [],
        todas_testemunhas: [
          ...(processo.testemunhas_ativo || []),
          ...(processo.testemunhas_passivo || [])
        ].filter((name, index, arr) => arr.indexOf(name) === index),
        reclamante_foi_testemunha: processo.reclamante_foi_testemunha || false,
        qtd_vezes_reclamante_foi_testemunha: 0,
        cnjs_em_que_reclamante_foi_testemunha: [],
        reclamante_testemunha_polo_passivo: false,
        cnjs_passivo: [],
        troca_direta: processo.troca_direta || false,
        desenho_troca_direta: null,
        cnjs_troca_direta: [],
        triangulacao_confirmada: processo.triangulacao_confirmada || false,
        desenho_triangulacao: null,
        cnjs_triangulacao: [],
        testemunha_do_reclamante_ja_foi_testemunha_antes: false,
        qtd_total_depos_unicos: calculateUniqueDepositions(processo.testemunhas_ativo, processo.testemunhas_passivo),
        cnjs_depos_unicos: [],
        contem_prova_emprestada: processo.prova_emprestada || false,
        testemunhas_prova_emprestada: [],
        classificacao_final: processo.classificacao_final || 'Não Classificado',
        insight_estrategico: null,
        org_id: processo.tenant_id,
        created_at: processo.created_at,
        updated_at: processo.updated_at,
      };
    });

    // Aplicar filtros pós-processamento
    let filteredData = transformedData;
    if (filters?.qtdDeposMin !== undefined) {
      filteredData = filteredData.filter(p => p.qtd_total_depos_unicos >= filters.qtdDeposMin);
    }
    if (filters?.qtdDeposMax !== undefined) {
      filteredData = filteredData.filter(p => p.qtd_total_depos_unicos <= filters.qtdDeposMax);
    }
    if (filters?.temTriangulacao !== undefined) {
      filteredData = filteredData.filter(p => p.triangulacao_confirmada === filters.temTriangulacao);
    }
    if (filters?.temTroca !== undefined) {
      filteredData = filteredData.filter(p => p.troca_direta === filters.temTroca);
    }
    if (filters?.temProvaEmprestada !== undefined) {
      filteredData = filteredData.filter(p => p.contem_prova_emprestada === filters.temProvaEmprestada);
    }

    const result = {
      data: filteredData,
      count: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
      total_filtered: filteredData.length
    };

    console.log(`[mapa-testemunhas-processos] Success: ${filteredData.length} filtered records, total: ${count}`);
    
    return new Response(JSON.stringify(result), { status: 200, headers });

  } catch (e) {
    console.error("[mapa-testemunhas-processos] Unexpected error:", e);
    return new Response(
      JSON.stringify({ error: "internal_error", detail: String(e) }), 
      { status: 500, headers }
    );
  }
});