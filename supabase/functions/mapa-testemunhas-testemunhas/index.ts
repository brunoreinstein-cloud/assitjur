import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let filters;
    try {
      filters = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tenantId = profile.organization_id;

    // Paginação e filtros diretamente na consulta
    const currentPage = filters.page || 1;
    const currentLimit = filters.limit || 50;
    const from = (currentPage - 1) * currentLimit;
    const to = from + currentLimit - 1;

    let query = supabase
      .from('assistjur.processos_testemunhas')
      .select(
        `
        id,
        processo_id,
        status_oitiva,
        relevancia,
        risco,
        proxima_movimentacao,
        tags,
        foi_testemunha_em_ambos_polos,
        ja_foi_reclamante,
        participou_triangulacao,
        participou_troca_favor,
        qtd_depoimentos,
        processo:assistjur.processos!inner (
          id,
          numero
        ),
        testemunha:assistjur.testemunhas!inner (
          id,
          nome
        )
      `,
        { count: 'exact' }
      )
      .eq('tenant_id', tenantId);

    if (filters.ambosPolos !== undefined) {
      query = query.eq('foi_testemunha_em_ambos_polos', filters.ambosPolos);
    }
    if (filters.jaFoiReclamante !== undefined) {
      query = query.eq('ja_foi_reclamante', filters.jaFoiReclamante);
    }
    if (filters.qtdDeposMin !== undefined) {
      query = query.gte('qtd_depoimentos', filters.qtdDeposMin);
    }
    if (filters.qtdDeposMax !== undefined) {
      query = query.lte('qtd_depoimentos', filters.qtdDeposMax);
    }
    if (filters.temTriangulacao !== undefined) {
      query = query.eq('participou_triangulacao', filters.temTriangulacao);
    }
    if (filters.temTroca !== undefined) {
      query = query.eq('participou_troca_favor', filters.temTroca);
    }
    if (filters.search) {
      query = query.ilike('testemunha.nome', `%${filters.search}%`);
    }

    const { data: vinculos, error: vinculosError, count } = await query.range(from, to);

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
        { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!vinculos || vinculos.length === 0) {
      return new Response(
        JSON.stringify({
          data: [],
          count: 0,
          page: currentPage,
          limit: currentLimit
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

    // Converter para array e ordenar por quantidade de depoimentos (decrescente)
    const testemunhasArray = Array.from(testemunhaMap.values()).sort(
      (a, b) => b.qtd_depoimentos - a.qtd_depoimentos
    );

    const totalProcessos = new Set(vinculos.map(v => v.processo_id)).size;
    console.log(
      `Aggregated ${testemunhasArray.length} unique witnesses from ${totalProcessos} processos`
    );

    return new Response(
      JSON.stringify({
        data: testemunhasArray,
        count: count ?? testemunhasArray.length,
        page: currentPage,
        limit: currentLimit,
        total_witnesses: testemunhasArray.length,
        total_processos: totalProcessos,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in mapa-testemunhas-testemunhas:', error);
    const { code, message } = error as { code?: string; message?: string };
    return new Response(
      JSON.stringify({ error: { code, message } }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})
