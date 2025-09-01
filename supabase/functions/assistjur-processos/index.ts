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
    console.log('Processing assistjur-processos request...');
    
    const { user, organization_id, supa } = await getAuth(req);
    if (!user) {
      console.error('Authentication failed: No user found');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!organization_id) {
      console.error('Organization not found for user:', user.id);
      return new Response(
        JSON.stringify({ error: 'Organization not found' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Authenticated user for org:', organization_id);

    // Parse request body safely
    let requestData;
    try {
      const body = await req.text();
      requestData = body ? JSON.parse(body) : {};
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      requestData = {};
    }

    const { filters = {}, page = 1, limit = 50 } = requestData;
    
    console.log('Request params:', { filters, page, limit, org_id: organization_id });

    // Call RPC function to get processos data
    const { data: result, error } = await supa.rpc('rpc_get_assistjur_processos', {
      p_org_id: organization_id,
      p_filters: filters,
      p_page: page,
      p_limit: limit
    });

    if (error) {
      console.error('RPC error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return new Response(
        JSON.stringify({ 
          error: 'Database query failed',
          details: error.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('RPC result:', { resultType: typeof result, isArray: Array.isArray(result) });

    const processos = result?.[0]?.data || [];
    const totalCount = result?.[0]?.total_count || 0;

    console.log('Final data:', { processosCount: Array.isArray(processos) ? processos.length : 0, totalCount });

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
    console.error('Unexpected error in assistjur-processos:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message || 'Unknown error occurred'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});