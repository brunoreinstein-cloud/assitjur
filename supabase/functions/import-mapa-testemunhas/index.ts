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

    const { processos } = await req.json()

    if (!processos || !Array.isArray(processos)) {
      throw new Error('Missing required data: processos array')
    }

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

    console.log(`Processing import for org ${orgId}`)
    console.log(`Processos: ${processos.length} rows`)

    // Transform and validate data
    const processedData = processos.map((row: any) => {
      // Normalize CNJ
      const cnjDigits = String(row.cnj || '').replace(/[^\d]/g, '')
      
      return {
        org_id: orgId,
        cnj: row.cnj,
        cnj_digits: cnjDigits.length === 20 ? cnjDigits : null,
        cnj_normalizado: cnjDigits,
        reclamante_nome: row.reclamante_nome || row.Reclamante || row['Nome do Reclamante'],
        reu_nome: row.reu_nome || row.Reu || row['Nome do Réu'] || row.Reclamado,
        comarca: row.comarca || row.Comarca,
        tribunal: row.tribunal || row.Tribunal,
        vara: row.vara || row.Vara,
        fase: row.fase || row.Fase,
        status: row.status || row.Status,
        reclamante_cpf_mask: row.reclamante_cpf_mask || row['CPF Reclamante'],
        data_audiencia: row.data_audiencia || row['Data Audiência'],
        advogados_ativo: Array.isArray(row.advogados_ativo) ? row.advogados_ativo : 
          typeof row.advogados_ativo === 'string' ? row.advogados_ativo.split(',').map((s: string) => s.trim()) : null,
        advogados_passivo: Array.isArray(row.advogados_passivo) ? row.advogados_passivo : 
          typeof row.advogados_passivo === 'string' ? row.advogados_passivo.split(',').map((s: string) => s.trim()) : null,
        testemunhas_ativo: Array.isArray(row.testemunhas_ativo) ? row.testemunhas_ativo : 
          typeof row.testemunhas_ativo === 'string' ? row.testemunhas_ativo.split(',').map((s: string) => s.trim()) : null,
        testemunhas_passivo: Array.isArray(row.testemunhas_passivo) ? row.testemunhas_passivo : 
          typeof row.testemunhas_passivo === 'string' ? row.testemunhas_passivo.split(',').map((s: string) => s.trim()) : null,
        observacoes: row.observacoes || row.Observacoes,
        // Set computed fields as false by default - will be calculated later
        reclamante_foi_testemunha: false,
        troca_direta: false,
        triangulacao_confirmada: false,
        prova_emprestada: false,
        score_risco: null,
        classificacao_final: 'Pendente'
      }
    })

    // Filter valid data (must have CNJ and required fields)
    const validData = processedData.filter(row => 
      row.cnj_digits && 
      row.cnj_digits.length === 20 && 
      row.reclamante_nome && 
      row.reu_nome
    )

    if (validData.length === 0) {
      throw new Error('No valid records found. Check CNJ format and required fields.')
    }

    console.log(`Filtered to ${validData.length} valid records out of ${processos.length}`)

    // Insert/update records in batches
    const batchSize = 100
    let insertedCount = 0
    let updatedCount = 0
    const errors = []

    for (let i = 0; i < validData.length; i += batchSize) {
      const batch = validData.slice(i, i + batchSize)
      
      const { error } = await supabase
        .from('processos')
        .upsert(batch, { 
          onConflict: 'org_id,cnj_digits',
          ignoreDuplicates: false 
        })

      if (error) {
        console.error(`Error in batch ${Math.floor(i / batchSize)}:`, error)
        errors.push(error.message)
      } else {
        insertedCount += batch.length
      }
    }

    // Get final count
    const { count: finalCount } = await supabase
      .from('processos')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)

    const result = {
      stagingRows: processos.length,
      validRows: validData.length,
      upserts: insertedCount,
      finalCount: finalCount || 0,
      errors: errors
    }

    console.log('Import completed:', result)

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Import error:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        stagingRows: 0,
        upserts: 0,
        errors: [error.message]
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})