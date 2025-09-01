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

    // Call RPC function to get processos data
    const { data: result, error } = await supa.rpc('rpc_get_assistjur_processos', {
      p_org_id: organization_id,
      p_filters: filters,
      p_page: page,
      p_limit: limit
    });

    if (error) {
      console.error('RPC error:', error);
      throw error;
    }

    const processos = result?.[0]?.data || [];
    const totalCount = result?.[0]?.total_count || 0;

    return new Response(
      JSON.stringify({
        data: processos,
        count: totalCount,
        page,
        totalPages: Math.ceil(totalCount / limit)
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