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

    // Build query for processos table
    let query = supabase
      .from('processos')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId)
      .is('deleted_at', null)

    // Apply filters
    if (filters.uf) {
      // Extract UF from comarca or tribunal field if available
      query = query.or(`comarca.ilike.%${filters.uf}%,tribunal.ilike.%${filters.uf}%`)
    }

    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    if (filters.fase) {
      query = query.eq('fase', filters.fase)
    }

    if (filters.search) {
      query = query.or(`cnj.ilike.%${filters.search}%,comarca.ilike.%${filters.search}%,reclamante_nome.ilike.%${filters.search}%`)
    }

    // For witness count filters, we'll filter based on array length
    if (filters.qtdDeposMin !== undefined || filters.qtdDeposMax !== undefined) {
      // This will be handled in post-processing since PostgreSQL array length filtering is complex
    }

    // Apply pagination - use proper count query first
    const { count } = await supabase
      .from('processos')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .is('deleted_at', null)

    // Get paginated data
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)
    
    // Order by
    query = query.order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) {
      console.error('Query error:', error)
      throw error
    }

    console.log(`Found ${data?.length || 0} processos out of ${count || 0} total`)

    // Transform processos data to match PorProcesso type
    const transformedData = (data || []).map(processo => ({
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
    }))

    // Apply post-processing filters
    let filteredData = transformedData
    if (filters.qtdDeposMin !== undefined) {
      filteredData = filteredData.filter(p => p.qtd_total_depos_unicos >= filters.qtdDeposMin)
    }
    if (filters.qtdDeposMax !== undefined) {
      filteredData = filteredData.filter(p => p.qtd_total_depos_unicos <= filters.qtdDeposMax)
    }

    return new Response(
      JSON.stringify({
        data: filteredData,
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

// Helper functions
function extractUFFromField(field) {
  if (!field) return null
  // Simple UF extraction - could be improved with better logic
  const ufMatch = field.match(/\b(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)\b/i)
  return ufMatch ? ufMatch[1].toUpperCase() : null
}

function calculateUniqueDepositions(testemunhasAtivo, testemunhasPassivo) {
  const allTestemunhas = [
    ...(testemunhasAtivo || []),
    ...(testemunhasPassivo || [])
  ]
  return new Set(allTestemunhas).size
}

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