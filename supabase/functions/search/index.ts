import { serve } from '../_shared/observability.ts';
import { corsHeaders, handlePreflight } from '../_shared/cors.ts';
import { getAuth } from '../_shared/auth.ts';
import { json, jsonError } from '../_shared/http.ts';
import { logger } from '../_shared/logger.ts';

interface SearchQuery {
  q: string;
  scope?: 'all' | 'process' | 'witness' | 'claimant' | 'lawyer' | 'comarca';
  limit?: number;
}

interface SearchResult {
  id: string;
  type: 'process' | 'witness' | 'claimant' | 'lawyer' | 'comarca';
  title: string;
  subtitle?: string;
  highlights: string[];
  meta: Record<string, any>;
  score: number;
}

// Parser de query inteligente
function parseSearchQuery(query: string) {
  const filters: Record<string, any> = {};
  let cleanQuery = query;

  // Detectar operadores
  const operatorPatterns = {
    process: /p:|proc:/i,
    witness: /w:|test:/i,
    claimant: /r:/i,
    uf: /uf:(\w{2})/i,
    comarca: /comarca:([^,\s]+)/i,
    risco: /risco:(baixo|medio|alto)/i,
  };

  Object.entries(operatorPatterns).forEach(([key, pattern]) => {
    const match = cleanQuery.match(pattern);
    if (match) {
      filters[key] = match[1] || true;
      cleanQuery = cleanQuery.replace(match[0], '').trim();
    }
  });

  // Detectar padrão CNJ
  const cnjPattern = /\d{7}-?\d{2}\.?\d{4}\.?\d\.?\d{2}\.?\d{4}/;
  const cnjMatch = cleanQuery.match(cnjPattern);
  if (cnjMatch) {
    filters.cnj = cnjMatch[0].replace(/[^\d.-]/g, '');
    filters.type = 'process';
    cleanQuery = cleanQuery.replace(cnjMatch[0], '').trim();
  }

  // Detectar CPF/CNPJ mascarado
  const cpfPattern = /\d{3}\.\*{3}\.\*{3}-\d{2}|\*{3}\.\d{3}\.\d{3}-\*{2}/;
  if (cpfPattern.test(cleanQuery)) {
    filters.hasCpf = true;
  }

  return {
    cleanQuery: cleanQuery.trim(),
    filters,
    originalQuery: query,
  };
}

// Scoring unificado
function calculateScore(
  matchType: 'exact' | 'partial' | 'fuzzy',
  entityType: string,
  signals: {
    bothPoles?: boolean;
    highRiskLinks?: number;
    evidenceCount?: number;
    localMatch?: boolean;
  }
): number {
  // Score base por tipo de match
  let baseScore = matchType === 'exact' ? 1.0 : matchType === 'partial' ? 0.7 : 0.5;

  // Peso por tipo de entidade
  const typeWeights: Record<string, number> = {
    witness: 1.0,
    claimant: 0.9,
    process: 1.0,
    lawyer: 0.7,
    comarca: 0.6,
  };

  baseScore *= typeWeights[entityType] || 0.5;

  // Sinais de qualidade
  if (signals.bothPoles) baseScore += 0.2;
  if (signals.highRiskLinks && signals.highRiskLinks > 0) baseScore += 0.15;
  if (signals.evidenceCount && signals.evidenceCount >= 2) baseScore += 0.1;
  if (signals.localMatch) baseScore += 0.05;

  return Math.min(baseScore, 1.0);
}

serve('search', async (req) => {
  const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();
  const ch = corsHeaders(req);
  const pre = handlePreflight(req, requestId);
  if (pre) return pre;

  try {
    const { user, organization_id, supa } = await getAuth(req);
    if (!user || !organization_id) {
      return json(401, { error: 'Unauthorized' }, { ...ch, 'x-request-id': requestId });
    }

    const { q, scope = 'all', limit = 20 }: SearchQuery = await req.json();

    if (!q || q.length < 2) {
      return json(400, { error: 'Query too short' }, { ...ch, 'x-request-id': requestId });
    }

    logger.info(`🔍 Busca unificada: q="${q}", scope="${scope}"`, requestId);

    const parsed = parseSearchQuery(q);
    logger.info(`📝 Query parseada: ${JSON.stringify(parsed)}`, requestId);

    const results: SearchResult[] = [];

    // Busca em processos (se scope permitir)
    if (scope === 'all' || scope === 'process' || parsed.filters.type === 'process') {
      const processQuery = supa
        .from('processos')
        .select('id, cnj, cnj_normalizado, reclamante_nome, reu_nome, comarca, status, fase, classificacao_final')
        .eq('org_id', organization_id)
        .is('deleted_at', null)
        .limit(limit);

      if (parsed.filters.cnj) {
        processQuery.ilike('cnj_normalizado', `%${parsed.filters.cnj}%`);
      } else if (parsed.cleanQuery) {
        processQuery.or(
          `cnj.ilike.%${parsed.cleanQuery}%,reclamante_nome.ilike.%${parsed.cleanQuery}%,reu_nome.ilike.%${parsed.cleanQuery}%`
        );
      }

      if (parsed.filters.uf) {
        processQuery.ilike('comarca', `%${parsed.filters.uf}%`);
      }

      const { data: processos } = await processQuery;

      if (processos) {
        processos.forEach((p) => {
          const matchType = parsed.filters.cnj && p.cnj_normalizado?.includes(parsed.filters.cnj) ? 'exact' : 'partial';
          results.push({
            id: p.id,
            type: 'process',
            title: p.cnj || 'CNJ não disponível',
            subtitle: `${p.reclamante_nome || 'N/A'} × ${p.reu_nome || 'N/A'}`,
            highlights: [p.cnj_normalizado || '', p.reclamante_nome || '', p.reu_nome || ''],
            meta: {
              status: p.status,
              fase: p.fase,
              comarca: p.comarca,
              classificacao: p.classificacao_final,
            },
            score: calculateScore(matchType, 'process', {}),
          });
        });
      }
    }

    // Busca em testemunhas (via staging)
    if (scope === 'all' || scope === 'witness') {
      const witnessQuery = supa
        .from('por_testemunha_staging')
        .select('nome_testemunha, qtd_depoimentos, foi_testemunha_em_ambos_polos, classificacao')
        .eq('org_id', organization_id)
        .ilike('nome_testemunha', `%${parsed.cleanQuery}%`)
        .limit(limit);

      const { data: testemunhas } = await witnessQuery;

      if (testemunhas) {
        testemunhas.forEach((t, idx) => {
          const bothPoles = t.foi_testemunha_em_ambos_polos === 'Sim';
          results.push({
            id: `w_${idx}`,
            type: 'witness',
            title: t.nome_testemunha || 'Nome não disponível',
            subtitle: `${t.qtd_depoimentos || 0} depoimentos`,
            highlights: [t.nome_testemunha || ''],
            meta: {
              depoimentos: t.qtd_depoimentos,
              ambosPoles: bothPoles,
              classificacao: t.classificacao,
            },
            score: calculateScore('partial', 'witness', { bothPoles }),
          });
        });
      }
    }

    // Busca em reclamantes (via staging)
    if (scope === 'all' || scope === 'claimant') {
      const claimantQuery = supa
        .from('por_processo_staging')
        .select('reclamante_limpo, cnj')
        .eq('org_id', organization_id)
        .ilike('reclamante_limpo', `%${parsed.cleanQuery}%`)
        .limit(limit);

      const { data: reclamantes } = await claimantQuery;

      if (reclamantes) {
        const uniqueClaimants = new Map<string, any>();
        reclamantes.forEach((r) => {
          const name = r.reclamante_limpo;
          if (name && !uniqueClaimants.has(name)) {
            uniqueClaimants.set(name, r);
          }
        });

        uniqueClaimants.forEach((r, name) => {
          results.push({
            id: `r_${name}`,
            type: 'claimant',
            title: name,
            subtitle: 'Reclamante',
            highlights: [name],
            meta: {},
            score: calculateScore('partial', 'claimant', {}),
          });
        });
      }
    }

    // Ordenar por score
    results.sort((a, b) => b.score - a.score);

    // Limitar resultados finais
    const finalResults = results.slice(0, limit);

    logger.info(`✅ Retornando ${finalResults.length} resultados`, requestId);

    return json(
      200,
      {
        query: q,
        parsed: parsed.cleanQuery,
        filters: parsed.filters,
        scope,
        results: finalResults,
        total: finalResults.length,
      },
      { ...ch, 'x-request-id': requestId }
    );
  } catch (error) {
    logger.error(`❌ Erro na busca: ${error.message}`, requestId);
    return jsonError(500, error.message, { requestId }, { ...ch, 'x-request-id': requestId });
  }
});
