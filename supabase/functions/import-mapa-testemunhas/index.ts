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

    const { porProcesso, porTestemunha } = await req.json()

    if (!porProcesso || !porTestemunha) {
      throw new Error('Missing required data: porProcesso and porTestemunha')
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
    console.log(`Por Processo: ${porProcesso.length} rows`)
    console.log(`Por Testemunha: ${porTestemunha.length} rows`)

    // Clear existing staging data for this organization
    await supabase.from('hubjuria.stg_por_processo').delete().eq('org_id', orgId)
    await supabase.from('hubjuria.stg_por_testemunha').delete().eq('org_id', orgId)

    // Insert into staging tables
    const stagingProcessos = porProcesso.map((row: any) => ({
      raw: row,
      org_id: orgId
    }))

    const stagingTestemunhas = porTestemunha.map((row: any) => ({
      raw: row,
      org_id: orgId
    }))

    const { error: stgProcessoError } = await supabase
      .from('hubjuria.stg_por_processo')
      .insert(stagingProcessos)

    if (stgProcessoError) {
      console.error('Error inserting staging processos:', stgProcessoError)
      throw stgProcessoError
    }

    const { error: stgTestemunhaError } = await supabase
      .from('hubjuria.stg_por_testemunha')
      .insert(stagingTestemunhas)

    if (stgTestemunhaError) {
      console.error('Error inserting staging testemunhas:', stgTestemunhaError)
      throw stgTestemunhaError
    }

    // Transform and insert into final tables using SQL functions
    const transformProcessosSQL = `
      INSERT INTO hubjuria.por_processo (
        cnj, status, uf, comarca, fase, reclamante_limpo,
        advogados_parte_ativa, testemunhas_ativo_limpo, testemunhas_passivo_limpo, todas_testemunhas,
        reclamante_foi_testemunha, qtd_vezes_reclamante_foi_testemunha, cnjs_em_que_reclamante_foi_testemunha,
        reclamante_testemunha_polo_passivo, cnjs_passivo,
        troca_direta, desenho_troca_direta, cnjs_troca_direta,
        triangulacao_confirmada, desenho_triangulacao, cnjs_triangulacao,
        testemunha_do_reclamante_ja_foi_testemunha_antes, qtd_total_depos_unicos, cnjs_depos_unicos,
        contem_prova_emprestada, testemunhas_prova_emprestada, classificacao_final, insight_estrategico,
        org_id
      )
      SELECT
        raw->>'CNJ',
        raw->>'Status',
        raw->>'UF',
        raw->>'Comarca',
        raw->>'Fase',
        raw->>'Reclamante_Limpo',
        hubjuria.parse_list(raw->>'ADVOGADOS_PARTE_ATIVA'),
        hubjuria.parse_list(raw->>'Testemunhas_Ativo_Limpo'),
        hubjuria.parse_list(raw->>'Testemunhas_Passivo_Limpo'),
        hubjuria.parse_list(raw->>'Todas_Testemunhas'),
        (raw->>'Reclamante_foi_Testemunha') ilike 'sim',
        nullif(raw->>'Qtd_Vezes_Reclamante_Foi_Testemunha','')::int,
        hubjuria.parse_list(raw->>'CNJs_Em_Que_Reclamante_Foi_Testemunha'),
        (raw->>'Reclamante-Testemunha_Polo_Passivo') ilike 'sim',
        hubjuria.parse_list(raw->>'CNJs_Passivo'),
        (coalesce(raw->>'Troca_Direta','') ilike 'sim' or coalesce(raw->>'Troca_Direta','') ilike 'true'),
        raw->>'Desenho_Troca_Direta',
        hubjuria.parse_list(raw->>'CNJs_Troca_Direta'),
        (coalesce(raw->>'Triangulacao_Confirmada','') ilike 'sim' or coalesce(raw->>'Triangulacao_Confirmada','') ilike 'true'),
        raw->>'Desenho_Triangulacao',
        hubjuria.parse_list(raw->>'CNJs_Triangulacao'),
        (raw->>'Testemunha_do_Reclamante_Já_Foi_Testemunha_Antes') ilike 'sim',
        nullif(raw->>'Qtd_Total_Depos_Únicos','')::int,
        hubjuria.parse_list(raw->>'CNJs_Depos_Únicos'),
        (coalesce(raw->>'Contém_Prova_Emprestada','') ilike 'sim' or coalesce(raw->>'Contém_Prova_Emprestada','') ilike 'true'),
        hubjuria.parse_list(raw->>'Testemunhas_Prova_Emprestada'),
        raw->>'Classificação_Final',
        raw->>'Insight_Estratégico',
        org_id
      FROM hubjuria.stg_por_processo
      WHERE org_id = $1
      ON CONFLICT (cnj) DO UPDATE SET
        status = excluded.status,
        uf = excluded.uf,
        comarca = excluded.comarca,
        fase = excluded.fase,
        reclamante_limpo = excluded.reclamante_limpo,
        advogados_parte_ativa = excluded.advogados_parte_ativa,
        testemunhas_ativo_limpo = excluded.testemunhas_ativo_limpo,
        testemunhas_passivo_limpo = excluded.testemunhas_passivo_limpo,
        todas_testemunhas = excluded.todas_testemunhas,
        reclamante_foi_testemunha = excluded.reclamante_foi_testemunha,
        qtd_vezes_reclamante_foi_testemunha = excluded.qtd_vezes_reclamante_foi_testemunha,
        cnjs_em_que_reclamante_foi_testemunha = excluded.cnjs_em_que_reclamante_foi_testemunha,
        reclamante_testemunha_polo_passivo = excluded.reclamante_testemunha_polo_passivo,
        cnjs_passivo = excluded.cnjs_passivo,
        troca_direta = excluded.troca_direta,
        desenho_troca_direta = excluded.desenho_troca_direta,
        cnjs_troca_direta = excluded.cnjs_troca_direta,
        triangulacao_confirmada = excluded.triangulacao_confirmada,
        desenho_triangulacao = excluded.desenho_triangulacao,
        cnjs_triangulacao = excluded.cnjs_triangulacao,
        testemunha_do_reclamante_ja_foi_testemunha_antes = excluded.testemunha_do_reclamante_ja_foi_testemunha_antes,
        qtd_total_depos_unicos = excluded.qtd_total_depos_unicos,
        cnjs_depos_unicos = excluded.cnjs_depos_unicos,
        contem_prova_emprestada = excluded.contem_prova_emprestada,
        testemunhas_prova_emprestada = excluded.testemunhas_prova_emprestada,
        classificacao_final = excluded.classificacao_final,
        insight_estrategico = excluded.insight_estrategico
    `

    const { error: transformProcessosError } = await supabase.rpc('execute_sql', {
      sql_query: transformProcessosSQL,
      params: [orgId]
    })

    if (transformProcessosError) {
      console.error('Error transforming processos:', transformProcessosError)
    }

    const transformTestemunhasSQL = `
      INSERT INTO hubjuria.por_testemunha (
        nome_testemunha, qtd_depoimentos, cnjs_como_testemunha, ja_foi_reclamante, cnjs_como_reclamante,
        foi_testemunha_ativo, cnjs_ativo, foi_testemunha_passivo, cnjs_passivo, foi_testemunha_em_ambos_polos,
        participou_troca_favor, cnjs_troca_favor, participou_triangulacao, cnjs_triangulacao,
        e_prova_emprestada, classificacao, classificacao_estrategica, org_id
      )
      SELECT
        raw->>'Nome_Testemunha',
        nullif(raw->>'Qtd_Depoimentos','')::int,
        hubjuria.parse_list(raw->>'CNJs_Como_Testemunha'),
        (raw->>'Já_Foi_Reclamante') ilike 'sim',
        hubjuria.parse_list(raw->>'CNJs_Como_Reclamante'),
        (raw->>'Foi_Testemunha_Ativo') ilike 'sim',
        hubjuria.parse_list(raw->>'CNJs_Ativo'),
        (raw->>'Foi_Testemunha_Passivo') ilike 'sim',
        hubjuria.parse_list(raw->>'CNJs_Passivo'),
        (raw->>'Foi_Testemunha_Em_Ambos_Polos') ilike 'sim',
        (raw->>'Participou_Troca_Favor') ilike 'sim',
        hubjuria.parse_list(raw->>'CNJs_Troca_Favor'),
        (raw->>'Participou_Triangulacao') ilike 'sim',
        hubjuria.parse_list(raw->>'CNJs_Triangulacao'),
        (raw->>'É_Prova_Emprestada') ilike 'sim',
        raw->>'Classificação',
        raw->>'Classificação_Estratégica',
        org_id
      FROM hubjuria.stg_por_testemunha
      WHERE org_id = $1
      ON CONFLICT (nome_testemunha) DO UPDATE SET
        qtd_depoimentos = excluded.qtd_depoimentos,
        cnjs_como_testemunha = excluded.cnjs_como_testemunha,
        ja_foi_reclamante = excluded.ja_foi_reclamante,
        cnjs_como_reclamante = excluded.cnjs_como_reclamante,
        foi_testemunha_ativo = excluded.foi_testemunha_ativo,
        cnjs_ativo = excluded.cnjs_ativo,
        foi_testemunha_passivo = excluded.foi_testemunha_passivo,
        cnjs_passivo = excluded.cnjs_passivo,
        foi_testemunha_em_ambos_polos = excluded.foi_testemunha_em_ambos_polos,
        participou_troca_favor = excluded.participou_troca_favor,
        cnjs_troca_favor = excluded.cnjs_troca_favor,
        participou_triangulacao = excluded.participou_triangulacao,
        cnjs_triangulacao = excluded.cnjs_triangulacao,
        e_prova_emprestada = excluded.e_prova_emprestada,
        classificacao = excluded.classificacao,
        classificacao_estrategica = excluded.classificacao_estrategica
    `

    const { error: transformTestemunhasError } = await supabase.rpc('execute_sql', {
      sql_query: transformTestemunhasSQL,
      params: [orgId]
    })

    if (transformTestemunhasError) {
      console.error('Error transforming testemunhas:', transformTestemunhasError)
    }

    // Get counts for response
    const { count: processosCount } = await supabase
      .from('hubjuria.por_processo')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)

    const { count: testemunhasCount } = await supabase
      .from('hubjuria.por_testemunha')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)

    const result = {
      stagingRows: porProcesso.length + porTestemunha.length,
      upserts: (processosCount || 0) + (testemunhasCount || 0),
      errors: []
    }

    if (transformProcessosError) {
      result.errors.push(`Erro ao processar dados de processos: ${transformProcessosError.message}`)
    }
    if (transformTestemunhasError) {
      result.errors.push(`Erro ao processar dados de testemunhas: ${transformTestemunhasError.message}`)
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