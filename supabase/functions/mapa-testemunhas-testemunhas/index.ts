import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handlePreflight } from "../_shared/cors.ts"

serve(async (req) => {
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  const headers = corsHeaders(req)

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers }
    );
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers }
      );
    }

    // Buscar perfil do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { status: 404, headers }
      );
    }

    let filters;
    try {
      filters = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON payload' }),
        { status: 400, headers }
      );
    }

    const tenantId = profile.organization_id;

    // Buscar vínculos de processos e testemunhas no esquema assistjur
    const { data: vinculos, error: vinculosError } = await supabase
      .from('assistjur.processos_testemunhas')
      .select(`
        id,
        processo_id,
        status_oitiva,
        relevancia,
        risco,
        proxima_movimentacao,
        tags,
        processo:assistjur.processos!inner (
          id,
          numero
        ),
        testemunha:assistjur.testemunhas!inner (
          id,
          nome
        )
      `)
      .eq('tenant_id', tenantId);

    if (vinculosError) {
      console.error('Error fetching processos_testemunhas:', vinculosError);

      const { code } = vinculosError as { code?: string };
      let status = 500;

      if (code === '42501') {
        status = 403;
      } else if (code?.startsWith('PGRST')) {
        status = 400;
      }

      return new Response(
        JSON.stringify({ error: vinculosError.message }),
        { status, headers }
      );
    }

    if (!vinculos || vinculos.length === 0) {
      return new Response(
        JSON.stringify({
          data: [],
          count: 0,
          page: filters.page || 1,
          limit: filters.limit || 50
        }),
        { headers }
      );
    }

    // Agregação de dados por testemunha
    const testemunhaMap = new Map<string, any>();

    vinculos.forEach(v => {
      const witness = v.testemunha;
      const process = v.processo;
      if (!witness?.nome) return;

      const key = witness.id;
      if (!testemunhaMap.has(key)) {
        testemunhaMap.set(key, {
          testemunha_id: witness.id,
          nome_testemunha: witness.nome.trim(),
          qtd_depoimentos: 0,
          cnjs_como_testemunha: [],
          processos: [],
          ja_foi_reclamante: false,
          cnjs_como_reclamante: [],
          foi_testemunha_ativo: false,
          cnjs_ativo: [],
          foi_testemunha_passivo: false,
          cnjs_passivo: [],
          foi_testemunha_em_ambos_polos: false,
          participou_troca_favor: false,
          cnjs_troca_favor: [],
          participou_triangulacao: false,
          cnjs_triangulacao: [],
          e_prova_emprestada: false,
          classificacao: 'Normal',
          classificacao_estrategica: 'Normal',
          org_id: tenantId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }

      const agg = testemunhaMap.get(key);
      agg.qtd_depoimentos += 1;

      if (process?.numero) {
        agg.cnjs_como_testemunha.push(process.numero);
        agg.processos.push({
          vinculo_id: v.id,
          processo_id: v.processo_id,
          processo_numero: process.numero,
          status_oitiva: v.status_oitiva,
          relevancia: v.relevancia,
          risco: v.risco,
          proxima_movimentacao: v.proxima_movimentacao,
          tags: v.tags || []
        });
      }
    });

    // Converter para array e aplicar filtros
    let testemunhasArray = Array.from(testemunhaMap.values());
    
    // Aplicar filtros
    if (filters.ambosPolos !== undefined) {
      testemunhasArray = testemunhasArray.filter(t => t.foi_testemunha_em_ambos_polos === filters.ambosPolos);
    }
    if (filters.jaFoiReclamante !== undefined) {
      testemunhasArray = testemunhasArray.filter(t => t.ja_foi_reclamante === filters.jaFoiReclamante);
    }
    if (filters.qtdDeposMin !== undefined) {
      testemunhasArray = testemunhasArray.filter(t => t.qtd_depoimentos >= filters.qtdDeposMin);
    }
    if (filters.qtdDeposMax !== undefined) {
      testemunhasArray = testemunhasArray.filter(t => t.qtd_depoimentos <= filters.qtdDeposMax);
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      testemunhasArray = testemunhasArray.filter(t => 
        t.nome_testemunha.toLowerCase().includes(searchLower)
      );
    }
    if (filters.temTriangulacao !== undefined) {
      testemunhasArray = testemunhasArray.filter(t => t.participou_triangulacao === filters.temTriangulacao);
    }
    if (filters.temTroca !== undefined) {
      testemunhasArray = testemunhasArray.filter(t => t.participou_troca_favor === filters.temTroca);
    }

    // Ordenação por quantidade de depoimentos (decrescente)
    testemunhasArray.sort((a, b) => b.qtd_depoimentos - a.qtd_depoimentos);
    
    // Paginação
    const currentPage = filters.page || 1;
    const currentLimit = filters.limit || 50;
    const offset = (currentPage - 1) * currentLimit;
    const paginatedData = testemunhasArray.slice(offset, offset + currentLimit);

    const totalProcessos = new Set(vinculos.map(v => v.processo_id)).size;
    console.log(`Aggregated ${testemunhasArray.length} unique witnesses from ${totalProcessos} processos`);

    return new Response(
      JSON.stringify({
        data: paginatedData,
        count: testemunhasArray.length,
        page: currentPage,
        limit: currentLimit,
        total_witnesses: testemunhasArray.length,
        total_processos: totalProcessos,
      }),
      { headers }
    );

  } catch (error) {
    console.error('Error in mapa-testemunhas-testemunhas:', error);
    const { code, message } = error as { code?: string; message?: string };
    return new Response(
      JSON.stringify({ error: { code, message } }),
      { status: 500, headers }
    );
  }
})
