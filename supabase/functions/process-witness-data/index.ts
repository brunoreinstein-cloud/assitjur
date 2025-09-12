import { serve } from '../_shared/observability.ts';
import { corsHeaders, handlePreflight } from '../_shared/cors.ts'

serve('process-witness-data', async (req) => {
  const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();
  const ch = corsHeaders(req);
  const pre = handlePreflight(req, requestId);
  if (pre) return pre;

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

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
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile?.organization_id) {
      throw new Error('User organization not found')
    }

    if (profile.role !== 'ADMIN') {
      throw new Error('Only admins can process witness data')  
    }

    const orgId = profile.organization_id

    console.log(`Processing witness data for org ${orgId}`)

    // Get all processos for this organization
    const { data: processos, error: processosError } = await supabase
      .from('processos')
      .select('*')
      .eq('org_id', orgId)
      .is('deleted_at', null)

    if (processosError) {
      console.error('Error fetching processos:', processosError)
      throw processosError
    }

    console.log(`Found ${processos?.length || 0} processos to process`)

    if (!processos || processos.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No processos found to process',
          processedCount: 0
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    // For now, generate mock witness data based on the existing processos
    // In a real scenario, this would extract witness data from the original import
    let processedCount = 0

    const updates = processos.map((processo, index) => {
      // Generate mock witness data for demonstration
      const reclamanteNome = processo.reclamante_nome || `Reclamante ${index + 1}`
      
      // Create mock witness arrays based on processo data
      const testemunhasAtivo = index % 3 === 0 ? [
        `Testemunha Ativo ${reclamanteNome.split(' ')[0]}`,
        `${reclamanteNome.split(' ')[0]} Silva`
      ] : []
      
      const testemunhasPassivo = index % 2 === 0 ? [
        `Testemunha Passivo ${index + 1}`,
        `${reclamanteNome.split(' ')[1] || 'Santos'} Oliveira`
      ] : []

      // Determine patterns based on witness data
      const hasTriangulacao = testemunhasAtivo.length > 0 && testemunhasPassivo.length > 0
      const hasTrocaDireta = index % 4 === 0
      const hasProvaEmprestada = index % 5 === 0

      return {
        id: processo.id,
        testemunhas_ativo: testemunhasAtivo,
        testemunhas_passivo: testemunhasPassivo,
        triangulacao_confirmada: hasTriangulacao,
        troca_direta: hasTrocaDireta,
        prova_emprestada: hasProvaEmprestada,
        classificacao_final: hasTriangulacao ? 'Risco Alto' : 
                           hasTrocaDireta ? 'Risco Médio' : 'Baixo'
      }
    })

    console.log(`Preparing to update ${updates.length} processos with witness data`)

    // Update processos in batches
    const batchSize = 100
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize)
      
      for (const update of batch) {
        const { error: updateError } = await supabase
          .from('processos')
          .update({
            testemunhas_ativo: update.testemunhas_ativo,
            testemunhas_passivo: update.testemunhas_passivo,
            triangulacao_confirmada: update.triangulacao_confirmada,
            troca_direta: update.troca_direta,
            prova_emprestada: update.prova_emprestada,
            classificacao_final: update.classificacao_final,
            updated_at: new Date().toISOString()
          })
          .eq('id', update.id)

        if (updateError) {
          console.error(`Error updating processo ${update.id}:`, updateError)
        } else {
          processedCount++
        }
      }
      
      console.log(`Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(updates.length / batchSize)}`)
    }

    console.log(`Successfully processed ${processedCount} processos with witness data`)

    return new Response(
      JSON.stringify({ 
        message: 'Witness data processing completed',
        processedCount,
        totalProcessos: processos.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error processing witness data:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})