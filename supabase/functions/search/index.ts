import { serve } from '../_shared/observability.ts';
import { corsHeaders, handlePreflight } from '../_shared/cors.ts';
import { getAuth } from '../_shared/auth.ts';
import { json, jsonError } from '../_shared/http.ts';
import { logger } from '../_shared/logger.ts';

const ENTITY_TYPE_LABELS_MAP: Record<string, string> = {
  process: 'Processos',
  witness: 'Testemunhas',
  claimant: 'Reclamantes',
  lawyer: 'Advogados',
  comarca: 'Comarcas',
};

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

interface SearchResponse {
  query: string;
  parsed: string;
  filters: Record<string, any>;
  scope: string;
  results: SearchResult[];
  total: number;
  isAmbiguous?: boolean;
  ambiguityType?: 'generic_name' | 'multiple_matches';
  suggestions?: {
    message: string;
    counts: Record<string, number>;
  };
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

    // Busca em processos (via RPC - mesma fonte que as tabelas)
    if (scope === 'all' || scope === 'process' || parsed.filters.type === 'process') {
      const { data: rpcResult, error: processError } = await supa.rpc('rpc_get_assistjur_processos', {
        p_org_id: organization_id,
        p_filters: { 
          search: parsed.cleanQuery,
          classificacao: parsed.filters.risco ? [parsed.filters.risco] : undefined
        },
        p_page: 1,
        p_limit: limit
      });

      if (processError) {
        logger.error(`❌ Erro ao buscar processos: ${processError.message}`, requestId);
      }

      const processos = rpcResult?.[0]?.data || [];
      logger.info(`📊 Processos encontrados via RPC: ${processos.length}`, requestId);

      if (processos.length > 0) {
        processos.forEach((p: any) => {
          const matchType = parsed.filters.cnj && p.cnj?.includes(parsed.filters.cnj) ? 'exact' : 'partial';
          results.push({
            id: p.cnj || `proc_${Math.random()}`,
            type: 'process',
            title: p.cnj || 'CNJ não disponível',
            subtitle: `${p.reclamante || 'N/A'} × ${p.reclamada || 'N/A'}`,
            highlights: [p.cnj || '', p.reclamante || '', p.reclamada || ''],
            meta: {
              status: p.status,
              classificacao: p.classificacao || p.classificacao_estrategica,
              testemunhas: p.qtd_testemunhas || 0,
            },
            score: calculateScore(matchType, 'process', {}),
          });
        });
      }
    }

    // Busca em testemunhas (via RPC)
    if (scope === 'all' || scope === 'witness') {
      const { data: rpcResult, error: witnessError } = await supa.rpc('rpc_get_assistjur_testemunhas', {
        p_org_id: organization_id,
        p_filters: { search: parsed.cleanQuery },
        p_page: 1,
        p_limit: limit
      });

      if (witnessError) {
        logger.error(`❌ Erro ao buscar testemunhas: ${witnessError.message}`, requestId);
      }

      const testemunhas = rpcResult?.[0]?.data || [];
      logger.info(`📊 Testemunhas encontradas: ${testemunhas.length}`, requestId);

      if (testemunhas.length > 0) {
        testemunhas.forEach((t: any, idx: number) => {
          const bothPoles = t.foi_testemunha_em_ambos_polos === true;
          const qtdDepoimentos = t.qtd_depoimentos || 0;
          
          results.push({
            id: `w_${idx}`,
            type: 'witness',
            title: t.nome_testemunha || 'Nome não disponível',
            subtitle: `${qtdDepoimentos} depoimentos`,
            highlights: [t.nome_testemunha || ''],
            meta: {
              depoimentos: qtdDepoimentos,
              ambosPoles: bothPoles,
              classificacao: t.classificacao || 'Normal',
            },
            score: calculateScore('partial', 'witness', { bothPoles }),
          });
        });
      }
    }

    // Busca em reclamantes (via RPC de processos)
    if (scope === 'all' || scope === 'claimant') {
      const { data: rpcResult, error: claimantError } = await supa.rpc('rpc_get_assistjur_processos', {
        p_org_id: organization_id,
        p_filters: { search: parsed.cleanQuery },
        p_page: 1,
        p_limit: limit
      });

      if (claimantError) {
        logger.error(`❌ Erro ao buscar reclamantes: ${claimantError.message}`, requestId);
      }

      const processos = rpcResult?.[0]?.data || [];
      logger.info(`📊 Processos para reclamantes encontrados: ${processos.length}`, requestId);

      if (processos.length > 0) {
        const uniqueClaimants = new Map<string, any>();
        processos.forEach((p: any) => {
          const name = p.reclamante;
          if (name && !uniqueClaimants.has(name)) {
            uniqueClaimants.set(name, p);
          }
        });

        uniqueClaimants.forEach((p: any, name: string) => {
          results.push({
            id: `c_${name}`,
            type: 'claimant',
            title: name,
            subtitle: 'Reclamante',
            highlights: [name],
            meta: {
              cnj: p.cnj || '',
            },
            score: calculateScore('partial', 'claimant', {}),
          });
        });
      }
    }

    // Ordenar por score
    results.sort((a, b) => b.score - a.score);

    // Limitar resultados finais
    const finalResults = results.slice(0, limit);

    // Detectar ambiguidade
    let isAmbiguous = false;
    let ambiguityType: 'generic_name' | 'multiple_matches' | undefined;
    let suggestions: { message: string; counts: Record<string, number> } | undefined;

    // Critérios de ambiguidade
    const hasMultipleWitnesses = finalResults.filter((r) => r.type === 'witness').length > 1;
    const hasMultipleClaimants = finalResults.filter((r) => r.type === 'claimant').length > 1;
    const isGenericQuery = parsed.cleanQuery.length > 0 && parsed.cleanQuery.split(' ').length <= 2 && !parsed.filters.cnj;
    const totalResults = finalResults.length;

    if (isGenericQuery && (hasMultipleWitnesses || hasMultipleClaimants) && totalResults >= 3) {
      isAmbiguous = true;
      ambiguityType = hasMultipleWitnesses || hasMultipleClaimants ? 'multiple_matches' : 'generic_name';
      
      const counts: Record<string, number> = {};
      finalResults.forEach((r) => {
        const label = ENTITY_TYPE_LABELS_MAP[r.type] || r.type;
        counts[label] = (counts[label] || 0) + 1;
      });

      const countText = Object.entries(counts)
        .map(([type, count]) => `${count} ${type.toLowerCase()}`)
        .join(', ');

      suggestions = {
        message: `${totalResults} resultados encontrados (${countText}). Selecione uma opção ou refine sua busca.`,
        counts,
      };
    }

    logger.info(`✅ Retornando ${finalResults.length} resultados${isAmbiguous ? ' [AMBÍGUO]' : ''}`, requestId);

    const response: SearchResponse = {
      query: q,
      parsed: parsed.cleanQuery,
      filters: parsed.filters,
      scope,
      results: finalResults,
      total: finalResults.length,
    };

    if (isAmbiguous) {
      response.isAmbiguous = isAmbiguous;
      response.ambiguityType = ambiguityType;
      response.suggestions = suggestions;
    }

    return json(200, response, { ...ch, 'x-request-id': requestId });
  } catch (error) {
    logger.error(`❌ Erro na busca: ${error.message}`, requestId);
    return jsonError(500, error.message, { requestId }, { ...ch, 'x-request-id': requestId });
  }
});
