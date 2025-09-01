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

    // Buscar estatísticas
    const { data, error } = await supa
      .from('assistjur.por_processo_staging')
      .select('classificacao_final')
      .eq('org_id', organization_id);

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    const total = data.length;
    const criticos = data.filter(p => p.classificacao_final?.toLowerCase() === 'crítico').length;
    const atencao = data.filter(p => p.classificacao_final?.toLowerCase() === 'atenção').length;
    const observacao = data.filter(p => p.classificacao_final?.toLowerCase() === 'observação').length;
    const normais = total - criticos - atencao - observacao;

    const stats = {
      total,
      criticos,
      atencao,
      observacao,
      normais,
      percentualCritico: total > 0 ? (criticos / total * 100).toFixed(1) : '0'
    };

    return new Response(
      JSON.stringify(stats),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in assistjur-stats:', error);
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