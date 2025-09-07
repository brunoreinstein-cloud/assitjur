import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getAuth } from "../_shared/auth.ts"
import { createLogger } from "../_shared/logger.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-correlation-id',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
}

serve(async (req) => {
  const correlationId = req.headers.get('x-correlation-id') ?? crypto.randomUUID();
  const log = createLogger(correlationId);
  const url = new URL(req.url);

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: { ...corsHeaders, 'x-correlation-id': correlationId } });
  }

  if (req.method === 'GET' && url.pathname === '/health') {
    return new Response('ok', { status: 200, headers: { ...corsHeaders, 'x-correlation-id': correlationId } });
  }

  if (req.method !== 'POST') {
    return new Response('Not Found', { status: 404, headers: { ...corsHeaders, 'x-correlation-id': correlationId } });
  }

  try {
    log.info('Processing assistjur-processos request...');

    const { user, organization_id, supa } = await getAuth(req);
    if (!user) {
      log.error('Authentication failed: No user found');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-correlation-id': correlationId }
        }
      );
    }

    if (!organization_id) {
      log.error(`Organization not found for user: ${user.id}`);
      return new Response(
        JSON.stringify({ error: 'Organization not found' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-correlation-id': correlationId }
        }
      );
    }

    log.info(`Authenticated user for org: ${organization_id}`);

    // Parse request body safely
    let requestData;
    try {
      const body = await req.text();
      requestData = body ? JSON.parse(body) : {};
    } catch (parseError) {
      log.error(`Failed to parse request body: ${parseError}`);
      requestData = {};
    }

    const { filters = {}, page = 1, limit = 50 } = requestData;
    log.info(`Request params: ${JSON.stringify({ filters, page, limit, org_id: organization_id })}`);

    // Call RPC function to get processos data
    const { data: result, error } = await supa.rpc('rpc_get_assistjur_processos', {
      p_org_id: organization_id,
      p_filters: filters,
      p_page: page,
      p_limit: limit
    });

    if (error) {
      log.error(`RPC error details: ${JSON.stringify({
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })}`);

      const status = error.code === '42501' ? 403 : 500
      const body = error.code === '42501'
        ? { error: 'Forbidden', details: error.message }
        : { error: 'Database query failed', details: error.message }

      return new Response(
        JSON.stringify(body),
        {
          status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-correlation-id': correlationId }
        }
      );
    }

    log.info(`RPC result: ${JSON.stringify({ resultType: typeof result, isArray: Array.isArray(result) })}`);

    const processos = result?.[0]?.data || [];
    const totalCount = result?.[0]?.total_count || 0;

    log.info(`Final data: ${JSON.stringify({ processosCount: Array.isArray(processos) ? processos.length : 0, totalCount })}`);

    return new Response(
      JSON.stringify({
        data: processos,
        count: totalCount,
        page,
        totalPages: Math.ceil(totalCount / limit)
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-correlation-id': correlationId }
      }
    );

  } catch (error) {
    log.error(`Unexpected error in assistjur-processos: ${JSON.stringify({
      message: error.message,
      stack: error.stack,
      name: error.name
    })}`);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message || 'Unknown error occurred'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-correlation-id': correlationId }
      }
    );
  }
});