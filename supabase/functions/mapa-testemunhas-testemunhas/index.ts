import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handlePreflight } from "../_shared/cors.ts"
import { enforceRateLimit } from "../_shared/rate-limit.ts"

serve(async (req) => {
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  const rl = await enforceRateLimit(req, { route: "mapa-testemunhas-testemunhas", limit: 60, windowMs: 60_000 })
  if (!rl.allowed) return rl.response

  const headers = { ...corsHeaders(req), ...rl.headers }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers }
    );
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers }
      );
    }

    // Buscar perfil do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { status: 404, headers }
      );
    }

    let payload: any;
    try {
      payload = await req.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: 'bad_request',
          detail: 'JSON inválido',
          example: { page: 1, limit: 20 }
        }),
        { status: 400, headers }
      );
    }

    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return new Response(
        JSON.stringify({
          error: 'invalid_payload',
          detail: 'Corpo deve ser um objeto JSON.',
          example: { page: 1, limit: 20 }
        }),
        { status: 400, headers }
      );
    }

    const { page: rawPage, limit: rawLimit, ...filters } = payload as Record<string, any>;

    let page = Number(rawPage ?? 1);
    if (!Number.isFinite(page) || page < 1) page = 1;

    let limit = Number(rawLimit ?? 20);
    if (!Number.isFinite(limit) || limit < 1) limit = 20;
    if (limit > 200) limit = 200;

    const boolKeys = ['ambosPolos', 'jaFoiReclamante', 'temTriangulacao', 'temTroca'];
    for (const key of boolKeys) {
      if (filters[key] !== undefined) {
        if (filters[key] === 'true') filters[key] = true;
        else if (filters[key] === 'false') filters[key] = false;
        else if (typeof filters[key] !== 'boolean') {
          return new Response(
            JSON.stringify({ error: 'bad_request', detail: 'Parâmetros inválidos', example: { page: 1, limit: 20 } }),
            { status: 400, headers }
          );
        }
      }
    }

    for (const key of ['qtdDeposMin', 'qtdDeposMax']) {
      if (filters[key] !== undefined) {
        const numVal = Number(filters[key]);
        if (Number.isFinite(numVal)) {
          filters[key] = numVal;
        } else {
          return new Response(
            JSON.stringify({ error: 'bad_request', detail: 'Parâmetros inválidos', example: { page: 1, limit: 20 } }),
            { status: 400, headers }
          );
        }
      }
    }

    const safePayload = { page, limit, ...filters };
    console.log('[fn] payload:', safePayload);

    const tenantId = profile.organization_id;

    // Paginação e filtros diretamente na consulta
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('assistjur.processos_testemunhas')
      .select(
        `
        id,
        processo_id,
        status_oitiva,
        relevancia,
        risco,
        proxima_movimentacao,
        tags,
        foi_testemunha_em_ambos_polos,
        ja_foi_reclamante,
        participou_triangulacao,
        participou_troca_favor,
        qtd_depoimentos,
        processo:assistjur.processos!inner (
          id,
          numero
        ),
        testemunha:assistjur.testemunhas!inner (
          id,
          nome
        )
      `,
        { count: 'exact' }
      )
      .eq('tenant_id', tenantId);

    if (filters.ambosPolos !== undefined) {
      query = query.eq('foi_testemunha_em_ambos_polos', filters.ambosPolos);
    }
    if (filters.jaFoiReclamante !== undefined) {
      query = query.eq('ja_foi_reclamante', filters.jaFoiReclamante);
    }
    if (filters.qtdDeposMin !== undefined) {
      query = query.gte('qtd_depoimentos', filters.qtdDeposMin);
    }
    if (filters.qtdDeposMax !== undefined) {
      query = query.lte('qtd_depoimentos', filters.qtdDeposMax);
    }
    if (filters.temTriangulacao !== undefined) {
      query = query.eq('participou_triangulacao', filters.temTriangulacao);
    }
    if (filters.temTroca !== undefined) {
      query = query.eq('participou_troca_favor', filters.temTroca);
    }
    if (filters.search) {
      query = query.ilike('testemunha.nome', `%${filters.search}%`);
    }

    const { data: vinculos, error: vinculosError, count } = await query.range(from, to);

    if (vinculosError) {
      console.error('Error fetching processos_testemunhas:', vinculosError);

      const { code } = vinculosError as { code?: string };
      let status = 500;

      if (code === '42501') {
        status = 403;
      } else if (code?.startsWith('PGRST')) {
        status = 400;
      }

      return new Response(
        JSON.stringify({ error: vinculosError.message }),
        { status, headers }
      );
    }

    if (!vinculos || vinculos.length === 0) {
      return new Response(
        JSON.stringify({
          data: [],
          count: 0,
          page,
          limit
        }),
        { headers }
      );
    }

    // Agregação de dados por testemunha
    const testemunhaMap = new Map<string, any>();

    vinculos.forEach(v => {
      const witness = v.testemunha;
      const process = v.processo;
      if (!witness?.nome) return;

      const key = witness.id;
      if (!testemunhaMap.has(key)) {
        testemunhaMap.set(key, {
          testemunha_id: witness.id,
          nome_testemunha: witness.nome.trim(),
          qtd_depoimentos: 0,
          cnjs_como_testemunha: [],
          processos: [],
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
          classificacao: 'Normal',
          classificacao_estrategica: 'Normal',
          org_id: tenantId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }

      const agg = testemunhaMap.get(key);
      agg.qtd_depoimentos += 1;

      if (process?.numero) {
        agg.cnjs_como_testemunha.push(process.numero);
        agg.processos.push({
          vinculo_id: v.id,
          processo_id: v.processo_id,
          processo_numero: process.numero,
          status_oitiva: v.status_oitiva,
          relevancia: v.relevancia,
          risco: v.risco,
          proxima_movimentacao: v.proxima_movimentacao,
          tags: v.tags || []
        });
      }
    });

    // Converter para array e ordenar por quantidade de depoimentos (decrescente)
    const testemunhasArray = Array.from(testemunhaMap.values()).sort(
      (a, b) => b.qtd_depoimentos - a.qtd_depoimentos
    );

    const totalProcessos = new Set(vinculos.map(v => v.processo_id)).size;
    console.log(
      `Aggregated ${testemunhasArray.length} unique witnesses from ${totalProcessos} processos`
    );

    return new Response(
      JSON.stringify({
        data: testemunhasArray,
        count: count ?? testemunhasArray.length,
        page,
        limit,
        total_witnesses: testemunhasArray.length,
        total_processos: totalProcessos,
      }),
      { headers }
    );

  } catch (error) {
    console.error('Error in mapa-testemunhas-testemunhas:', error);
    const { code, message } = error as { code?: string; message?: string };
    return new Response(
      JSON.stringify({ error: { code, message } }),
      { status: 500, headers }
    );
  }
})

