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

    // Query all processos to aggregate testemunha data
    const { data: processos, error: processosError } = await supabase
      .from('processos')
      .select('*')
      .eq('org_id', orgId)
      .is('deleted_at', null)

    if (processosError) {
      console.error('Query error:', processosError)
      throw processosError
    }

    // Aggregate testemunha data from processos
    const testemunhaMap = new Map()
    
    processos?.forEach(processo => {
      const allTestemunhas = [
        ...(processo.testemunhas_ativo || []),
        ...(processo.testemunhas_passivo || [])
      ]
      
      allTestemunhas.forEach(nomeTestemunha => {
        if (!nomeTestemunha?.trim()) return
        
        if (!testemunhaMap.has(nomeTestemunha)) {
          testemunhaMap.set(nomeTestemunha, {
            nome_testemunha: nomeTestemunha,
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
            classificacao: 'Testemunha',
            classificacao_estrategica: 'Normal',
            org_id: orgId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
        }
        
        const testemunha = testemunhaMap.get(nomeTestemunha)
        testemunha.qtd_depoimentos++
        testemunha.cnjs_como_testemunha.push(processo.cnj)
        
        // Check if was witness in ativo polo
        if (processo.testemunhas_ativo?.includes(nomeTestemunha)) {
          testemunha.foi_testemunha_ativo = true
          testemunha.cnjs_ativo.push(processo.cnj)
        }
        
        // Check if was witness in passivo polo
        if (processo.testemunhas_passivo?.includes(nomeTestemunha)) {
          testemunha.foi_testemunha_passivo = true
          testemunha.cnjs_passivo.push(processo.cnj)
        }
        
        // Check if was witness in both poles
        if (testemunha.foi_testemunha_ativo && testemunha.foi_testemunha_passivo) {
          testemunha.foi_testemunha_em_ambos_polos = true
        }
        
        // Check if participated in triangulation
        if (processo.triangulacao_confirmada) {
          testemunha.participou_triangulacao = true
          testemunha.cnjs_triangulacao.push(processo.cnj)
        }
        
        // Check if participated in direct exchange
        if (processo.troca_direta) {
          testemunha.participou_troca_favor = true
          testemunha.cnjs_troca_favor.push(processo.cnj)
        }
        
        // Check if is borrowed evidence
        if (processo.prova_emprestada) {
          testemunha.e_prova_emprestada = true
        }
        
        // Check if was ever a claimant (reclamante)
        if (processo.reclamante_nome === nomeTestemunha) {
          testemunha.ja_foi_reclamante = true
          testemunha.cnjs_como_reclamante.push(processo.cnj)
        }
      })
    })
    
    // Convert map to array and calculate strategic classification
    let testemunhasData = Array.from(testemunhaMap.values()).map(testemunha => {
      // Calculate strategic classification based on patterns
      if (testemunha.qtd_depoimentos >= 5) {
        testemunha.classificacao_estrategica = 'Crítico'
      } else if (testemunha.foi_testemunha_em_ambos_polos || testemunha.participou_triangulacao) {
        testemunha.classificacao_estrategica = 'Atenção'
      } else if (testemunha.ja_foi_reclamante) {
        testemunha.classificacao_estrategica = 'Observação'
      }
      
      return testemunha
    })

    // Apply filters
    if (filters.ambosPolos !== undefined) {
      testemunhasData = testemunhasData.filter(t => t.foi_testemunha_em_ambos_polos === filters.ambosPolos)
    }

    if (filters.jaFoiReclamante !== undefined) {
      testemunhasData = testemunhasData.filter(t => t.ja_foi_reclamante === filters.jaFoiReclamante)
    }

    if (filters.temTriangulacao !== undefined) {
      testemunhasData = testemunhasData.filter(t => t.participou_triangulacao === filters.temTriangulacao)
    }

    if (filters.temTroca !== undefined) {
      testemunhasData = testemunhasData.filter(t => t.participou_troca_favor === filters.temTroca)
    }

    if (filters.search) {
      testemunhasData = testemunhasData.filter(t => 
        t.nome_testemunha.toLowerCase().includes(filters.search.toLowerCase())
      )
    }

    if (filters.qtdDeposMin !== undefined) {
      testemunhasData = testemunhasData.filter(t => t.qtd_depoimentos >= filters.qtdDeposMin)
    }

    if (filters.qtdDeposMax !== undefined) {
      testemunhasData = testemunhasData.filter(t => t.qtd_depoimentos <= filters.qtdDeposMax)
    }

    // Order by qtd_depoimentos descending
    testemunhasData.sort((a, b) => b.qtd_depoimentos - a.qtd_depoimentos)

    // Apply pagination
    const offset = (page - 1) * limit
    const paginatedData = testemunhasData.slice(offset, offset + limit)

    return new Response(
      JSON.stringify({
        data: paginatedData,
        count: testemunhasData.length,
        page,
        limit,
        totalPages: Math.ceil(testemunhasData.length / limit)
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