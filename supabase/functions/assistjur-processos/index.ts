import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getAuth } from "../_shared/auth.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user, organization_id, supa } = await getAuth(req);
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!organization_id) {
      return new Response(
        JSON.stringify({ error: 'Organization not found' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { filters = {}, page = 1, limit = 50 } = await req.json();

    // Base query
    let query = supa
      .from('assistjur.por_processo_staging')
      .select(`
        cnj,
        reclamante_limpo,
        reu_nome,
        testemunhas_ativo_limpo,
        testemunhas_passivo_limpo,
        classificacao_final,
        insight_estrategico,
        created_at
      `, { count: 'exact' })
      .eq('org_id', organization_id);

    // Aplicar filtros
    if (filters.search) {
      query = query.or(`cnj.ilike.%${filters.search}%,reclamante_limpo.ilike.%${filters.search}%,reu_nome.ilike.%${filters.search}%`);
    }

    if (filters.classificacao && filters.classificacao.length > 0) {
      query = query.in('classificacao_final', filters.classificacao);
    }

    // Paginação
    const offset = (page - 1) * limit;
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: processos, error, count } = await query;

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    // Transformar dados para o formato esperado
    const processosTransformados = (processos || []).map((processo: any) => {
      const testemunhasAtivas = Array.isArray(processo.testemunhas_ativo_limpo) 
        ? processo.testemunhas_ativo_limpo.filter((t: string) => t && t !== 'nan' && t.trim() !== '')
        : [];
      
      const testemunhasPassivas = Array.isArray(processo.testemunhas_passivo_limpo)
        ? processo.testemunhas_passivo_limpo.filter((t: string) => t && t !== 'nan' && t.trim() !== '')
        : [];

      return {
        cnj: processo.cnj || '',
        reclamante: processo.reclamante_limpo || '',
        reclamada: processo.reu_nome || '',
        testemunhas_ativas: testemunhasAtivas,
        testemunhas_passivas: testemunhasPassivas,
        qtd_testemunhas: testemunhasAtivas.length + testemunhasPassivas.length,
        classificacao: processo.classificacao_final || 'Normal',
        classificacao_estrategica: processo.insight_estrategico || 'Normal',
        created_at: processo.created_at || new Date().toISOString()
      };
    });

    return new Response(
      JSON.stringify({
        data: processosTransformados,
        count: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit)
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in assistjur-processos:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});