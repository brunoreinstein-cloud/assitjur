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
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
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

    const { page, limit, ...filters } = await req.json();
    
    // Buscar todos os processos da organização
    const { data: processos, error: processosError } = await supabase
      .from('processos')
      .select('testemunhas_ativo, testemunhas_passivo, cnj, reclamante_nome, reu_nome, triangulacao_confirmada, troca_direta, prova_emprestada')
      .eq('org_id', profile.organization_id)
      .is('deleted_at', null);

    if (processosError) {
      console.error('Error fetching processos:', processosError);
      throw processosError;
    }

    if (!processos || processos.length === 0) {
      return new Response(
        JSON.stringify({ 
          data: [],
          count: 0,
          page: page || 1,
          limit: limit || 50
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Agregação de dados por testemunha
    const testemunhaMap = new Map();

    processos.forEach(processo => {
      const allWitnesses = [
        ...(processo.testemunhas_ativo || []),
        ...(processo.testemunhas_passivo || [])
      ];

      allWitnesses.forEach(witnessName => {
        if (!witnessName || witnessName.trim() === '') return;

        const cleanName = witnessName.trim();
        
        if (!testemunhaMap.has(cleanName)) {
          testemunhaMap.set(cleanName, {
            nome_testemunha: cleanName,
            qtd_depoimentos: 0,
            cnjs_como_testemunha: [],
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
            org_id: profile.organization_id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }

        const testemunha = testemunhaMap.get(cleanName);
        testemunha.qtd_depoimentos += 1;
        testemunha.cnjs_como_testemunha.push(processo.cnj);

        // Verificar se foi reclamante
        if (processo.reclamante_nome && processo.reclamante_nome.toLowerCase().includes(cleanName.toLowerCase())) {
          testemunha.ja_foi_reclamante = true;
          testemunha.cnjs_como_reclamante.push(processo.cnj);
        }

        // Verificar polo ativo/passivo
        if (processo.testemunhas_ativo?.includes(witnessName)) {
          testemunha.foi_testemunha_ativo = true;
          testemunha.cnjs_ativo.push(processo.cnj);
        }
        
        if (processo.testemunhas_passivo?.includes(witnessName)) {
          testemunha.foi_testemunha_passivo = true;
          testemunha.cnjs_passivo.push(processo.cnj);
        }

        // Verificar se foi em ambos os polos
        if (testemunha.foi_testemunha_ativo && testemunha.foi_testemunha_passivo) {
          testemunha.foi_testemunha_em_ambos_polos = true;
        }

        // Verificar participação em padrões
        if (processo.troca_direta) {
          testemunha.participou_troca_favor = true;
          testemunha.cnjs_troca_favor.push(processo.cnj);
        }
        
        if (processo.triangulacao_confirmada) {
          testemunha.participou_triangulacao = true;
          testemunha.cnjs_triangulacao.push(processo.cnj);
        }
        
        if (processo.prova_emprestada) {
          testemunha.e_prova_emprestada = true;
        }

        // Classificação estratégica baseada nos padrões
        if (testemunha.qtd_depoimentos > 10) {
          testemunha.classificacao = 'Profissional';
          testemunha.classificacao_estrategica = 'Crítico';
        } else if (testemunha.participou_triangulacao || testemunha.participou_troca_favor) {
          testemunha.classificacao = 'Suspeita';
          testemunha.classificacao_estrategica = 'Atenção';
        } else if (testemunha.foi_testemunha_em_ambos_polos) {
          testemunha.classificacao = 'Observação';
          testemunha.classificacao_estrategica = 'Observação';
        }
      });
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
    const currentPage = page || 1;
    const currentLimit = limit || 50;
    const offset = (currentPage - 1) * currentLimit;
    const paginatedData = testemunhasArray.slice(offset, offset + currentLimit);

    console.log(`Aggregated ${testemunhasArray.length} unique witnesses from ${processos.length} processos`);

    return new Response(
      JSON.stringify({
        data: paginatedData,
        count: testemunhasArray.length,
        page: currentPage,
        limit: currentLimit,
        total_witnesses: testemunhasArray.length,
        total_processos: processos.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in mapa-testemunhas-testemunhas:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})
