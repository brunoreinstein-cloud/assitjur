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

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { filters = {}, page = 1, limit = 10 } = await req.json();

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

    // Build query for processos_live (only published versions)
    let query = supabase
      .from('processos_live')
      .select('*', { count: 'exact' })
      .eq('org_id', profile.organization_id);

    // Apply filters
    if (filters.uf) {
      query = query.or(`comarca.ilike.%${filters.uf}%,tribunal.ilike.%${filters.uf}%`);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.fase) {
      query = query.eq('fase', filters.fase);
    }
    if (filters.search) {
      query = query.or(`cnj.ilike.%${filters.search}%,comarca.ilike.%${filters.search}%,reclamante_nome.ilike.%${filters.search}%`);
    }

    // Get total count first from processos_live
    const { count } = await supabase
      .from('processos_live')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', profile.organization_id);

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);
    query = query.order('created_at', { ascending: false });

    const { data: processos, error: processosError } = await query;

    if (processosError) {
      console.error('Error fetching processos:', processosError);
      throw processosError;
    }

    console.log(`Found ${count || 0} processos out of ${processos?.length || 0} returned`);

    if (!processos || processos.length === 0) {
      return new Response(
        JSON.stringify({ 
          data: [],
          count: count || 0,
          page,
          limit,
          totalPages: Math.ceil((count || 0) / limit)
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Transform processos data to match PorProcesso type
    let transformedData = processos.map(processo => ({
      cnj: processo.cnj,
      status: processo.status,
      uf: extractUFFromField(processo.comarca) || extractUFFromField(processo.tribunal),
      comarca: processo.comarca,
      fase: processo.fase,
      reclamante_limpo: processo.reclamante_nome,
      advogados_parte_ativa: processo.advogados_ativo || [],
      testemunhas_ativo_limpo: processo.testemunhas_ativo || [],
      testemunhas_passivo_limpo: processo.testemunhas_passivo || [],
      todas_testemunhas: [
        ...(processo.testemunhas_ativo || []),
        ...(processo.testemunhas_passivo || [])
      ].filter((name, index, arr) => arr.indexOf(name) === index), // Remove duplicates
      reclamante_foi_testemunha: processo.reclamante_foi_testemunha || false,
      qtd_vezes_reclamante_foi_testemunha: 0, // Would need cross-reference calculation
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
      org_id: processo.org_id,
      created_at: processo.created_at,
      updated_at: processo.updated_at,
    }));

    // Apply post-processing filters
    if (filters.qtdDeposMin !== undefined) {
      transformedData = transformedData.filter(p => p.qtd_total_depos_unicos >= filters.qtdDeposMin);
    }
    if (filters.qtdDeposMax !== undefined) {
      transformedData = transformedData.filter(p => p.qtd_total_depos_unicos <= filters.qtdDeposMax);
    }
    if (filters.temTriangulacao !== undefined) {
      transformedData = transformedData.filter(p => p.triangulacao_confirmada === filters.temTriangulacao);
    }
    if (filters.temTroca !== undefined) {
      transformedData = transformedData.filter(p => p.troca_direta === filters.temTroca);
    }
    if (filters.temProvaEmprestada !== undefined) {
      transformedData = transformedData.filter(p => p.contem_prova_emprestada === filters.temProvaEmprestada);
    }

    return new Response(
      JSON.stringify({
        data: transformedData,
        count: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
        total_filtered: transformedData.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});

// Helper functions
function extractUFFromField(field) {
  if (!field) return null;
  // Simple UF extraction - could be improved with better logic
  const ufMatch = field.match(/\b(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)\b/i);
  return ufMatch ? ufMatch[1].toUpperCase() : null;
}

function calculateUniqueDepositions(testemunhasAtivo, testemunhasPassivo) {
  const allTestemunhas = [
    ...(testemunhasAtivo || []),
    ...(testemunhasPassivo || [])
  ];
  return new Set(allTestemunhas).size;
}