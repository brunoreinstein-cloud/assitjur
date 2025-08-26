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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { filters = {}, page = 1, limit = 10 } = await req.json()

    // Get user's org_id from JWT
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      throw new Error('Invalid user token')
    }

    // Get user's organization
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile?.organization_id) {
      throw new Error('User organization not found')
    }

    const orgId = profile.organization_id

    // Build query
    let query = supabase
      .from('hubjuria.por_processo')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId)

    // Apply filters
    if (filters.uf) {
      query = query.eq('uf', filters.uf)
    }

    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    if (filters.fase) {
      query = query.eq('fase', filters.fase)
    }

    if (filters.search) {
      query = query.or(`cnj.ilike.%${filters.search}%,comarca.ilike.%${filters.search}%,reclamante_limpo.ilike.%${filters.search}%`)
    }

    if (filters.qtdDeposMin !== undefined) {
      query = query.gte('qtd_total_depos_unicos', filters.qtdDeposMin)
    }

    if (filters.qtdDeposMax !== undefined) {
      query = query.lte('qtd_total_depos_unicos', filters.qtdDeposMax)
    }

    // Apply pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    // Order by
    query = query.order('created_at', { ascending: false })

    const { data, error, count } = await query

    if (error) {
      console.error('Query error:', error)
      throw error
    }

    return new Response(
      JSON.stringify({
        data: data || [],
        count: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})