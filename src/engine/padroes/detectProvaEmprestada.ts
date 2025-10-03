/**
 * Detecção de Prova Emprestada: testemunhas com qtd_depoimentos > 10
 * Identifica testemunhas "profissionais" que testificam excessivamente
 */

export interface ProvaEmprestadaResult {
  nome: string;
  qtd_depoimentos: number;
  cnjs: string[];
  advogados_recorrentes: string[]; // Advogados que aparecem frequentemente
  concentracao_comarca: number; // % de concentração na comarca mais frequente
  concentracao_uf: number; // % de concentração na UF mais frequente
  timeline_suspeita: boolean; // Se há concentração temporal suspeita
  alerta: boolean; // Se deve gerar alerta (>10 depoimentos)
  risco: "ALTO" | "MEDIO" | "BAIXO";
  confianca: number; // 0-100
  distribuicao_geografica: {
    uf: string;
    comarca: string;
    count: number;
    percentage: number;
  }[];
  distribuicao_temporal: {
    ano: string;
    mes: string;
    count: number;
  }[];
}

export interface ProvaEmprestadaDetectionResult {
  detected: boolean;
  matches: ProvaEmprestadaResult[];
  summary: {
    total_testemunhas_profissionais: number;
    media_depoimentos: number;
    max_depoimentos: number;
    alertas_criticos: number; // >20 depoimentos
    cnjs_afetados: string[];
  };
}

/**
 * Detecta padrões de prova emprestada
 */
export function detectProvaEmprestada(
  processos: any[],
  testemunhas: any[],
): ProvaEmprestadaDetectionResult {
  const matches: ProvaEmprestadaResult[] = [];

  // Filtrar testemunhas com mais de 10 depoimentos
  const testemunhasSuspeitas = testemunhas.filter(
    (t) => (t.qtd_depoimentos || 0) > 10,
  );

  for (const testemunha of testemunhasSuspeitas) {
    const resultado = buildProvaEmprestadaResult(testemunha, processos);
    matches.push(resultado);
  }

  // Calcular summary
  const cnjsAfetados = new Set<string>();
  let totalDepoimentos = 0;
  let maxDepoimentos = 0;
  let alertasCriticos = 0;

  for (const match of matches) {
    match.cnjs.forEach((cnj) => cnjsAfetados.add(cnj));
    totalDepoimentos += match.qtd_depoimentos;
    maxDepoimentos = Math.max(maxDepoimentos, match.qtd_depoimentos);
    if (match.qtd_depoimentos > 20) alertasCriticos++;
  }

  return {
    detected: matches.length > 0,
    matches,
    summary: {
      total_testemunhas_profissionais: matches.length,
      media_depoimentos:
        matches.length > 0 ? Math.round(totalDepoimentos / matches.length) : 0,
      max_depoimentos: maxDepoimentos,
      alertas_criticos: alertasCriticos,
      cnjs_afetados: Array.from(cnjsAfetados),
    },
  };
}

/**
 * Constrói resultado detalhado de prova emprestada
 */
function buildProvaEmprestadaResult(
  testemunha: any,
  processos: any[],
): ProvaEmprestadaResult {
  const nome = testemunha.nome_testemunha;
  const qtdDepoimentos = testemunha.qtd_depoimentos || 0;
  const cnjs = testemunha.cnjs_como_testemunha || [];

  // Encontrar processos relacionados
  const processosRelacionados = processos.filter((p) => cnjs.includes(p.cnj));

  // Analisar advogados recorrentes
  const advogadosRecorrentes = findAdvogadosRecorrentes(processosRelacionados);

  // Analisar concentração geográfica
  const distribuicaoGeografica = analyzeDistribuicaoGeografica(
    processosRelacionados,
  );
  const concentracaoComarca = calculateMaxConcentracao(
    distribuicaoGeografica.map((d) => d.count),
  );
  const concentracaoUF = calculateConcentracaoUF(processosRelacionados);

  // Analisar distribuição temporal
  const distribuicaoTemporal = analyzeDistribuicaoTemporal(
    processosRelacionados,
  );
  const timelineSuspeita = analyzeTimelineSuspeita(distribuicaoTemporal);

  // Calcular risco e confiança
  const risco = calculateProvaEmprestadaRisk(
    qtdDepoimentos,
    advogadosRecorrentes.length,
    concentracaoComarca,
    timelineSuspeita,
  );

  const confianca = calculateProvaEmprestadaConfidence(
    qtdDepoimentos,
    advogadosRecorrentes.length,
    concentracaoComarca,
    processosRelacionados.length,
  );

  return {
    nome,
    qtd_depoimentos: qtdDepoimentos,
    cnjs,
    advogados_recorrentes: advogadosRecorrentes,
    concentracao_comarca: concentracaoComarca,
    concentracao_uf: concentracaoUF,
    timeline_suspeita: timelineSuspeita,
    alerta: qtdDepoimentos > 10,
    risco,
    confianca,
    distribuicao_geografica: distribuicaoGeografica,
    distribuicao_temporal: distribuicaoTemporal,
  };
}

/**
 * Encontra advogados que aparecem frequentemente nos processos
 */
function findAdvogadosRecorrentes(processos: any[]): string[] {
  const advogadoCount = new Map<string, number>();

  for (const processo of processos) {
    const advogados = processo.advogados_parte_ativa || [];
    for (const advogado of advogados) {
      if (!advogado) continue;
      const normalizado = normalizeNome(advogado);
      advogadoCount.set(normalizado, (advogadoCount.get(normalizado) || 0) + 1);
    }
  }

  // Advogados que aparecem em pelo menos 30% dos processos
  const minFrequencia = Math.max(2, Math.ceil(processos.length * 0.3));

  return Array.from(advogadoCount.entries())
    .filter(([_, count]) => count >= minFrequencia)
    .sort((a, b) => b[1] - a[1])
    .map(([advogado, _]) => advogado);
}

/**
 * Analisa distribuição geográfica
 */
function analyzeDistribuicaoGeografica(processos: any[]): {
  uf: string;
  comarca: string;
  count: number;
  percentage: number;
}[] {
  const geografiaCount = new Map<
    string,
    { uf: string; comarca: string; count: number }
  >();

  for (const processo of processos) {
    const uf = processo.uf || "Desconhecida";
    const comarca = processo.comarca || "Desconhecida";
    const key = `${uf}|${comarca}`;

    if (!geografiaCount.has(key)) {
      geografiaCount.set(key, { uf, comarca, count: 0 });
    }
    geografiaCount.get(key)!.count++;
  }

  const total = processos.length;
  return Array.from(geografiaCount.values())
    .map((item) => ({
      ...item,
      percentage: (item.count / total) * 100,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Calcula concentração máxima (% do valor mais frequente)
 */
function calculateMaxConcentracao(counts: number[]): number {
  if (counts.length === 0) return 0;

  const max = Math.max(...counts);
  const total = counts.reduce((sum, count) => sum + count, 0);

  return (max / total) * 100;
}

/**
 * Calcula concentração por UF
 */
function calculateConcentracaoUF(processos: any[]): number {
  const ufCount = new Map<string, number>();

  for (const processo of processos) {
    const uf = processo.uf || "Desconhecida";
    ufCount.set(uf, (ufCount.get(uf) || 0) + 1);
  }

  if (ufCount.size === 0) return 0;

  const maxCount = Math.max(...Array.from(ufCount.values()));
  return (maxCount / processos.length) * 100;
}

/**
 * Analisa distribuição temporal
 */
function analyzeDistribuicaoTemporal(processos: any[]): {
  ano: string;
  mes: string;
  count: number;
}[] {
  const temporalCount = new Map<string, number>();

  for (const processo of processos) {
    const data = processo.data_audiencia;
    if (!data) continue;

    try {
      const date = new Date(data);
      const ano = date.getFullYear().toString();
      const mes = (date.getMonth() + 1).toString().padStart(2, "0");
      const key = `${ano}-${mes}`;

      temporalCount.set(key, (temporalCount.get(key) || 0) + 1);
    } catch {
      // Ignora datas inválidas
    }
  }

  return Array.from(temporalCount.entries())
    .map(([key, count]) => {
      const [ano, mes] = key.split("-");
      return { ano, mes, count };
    })
    .sort((a, b) => `${a.ano}-${a.mes}`.localeCompare(`${b.ano}-${b.mes}`));
}

/**
 * Analisa se há timeline suspeita (concentração temporal)
 */
function analyzeTimelineSuspeita(distribuicaoTemporal: any[]): boolean {
  if (distribuicaoTemporal.length === 0) return false;

  const totalDepoimentos = distribuicaoTemporal.reduce(
    (sum, item) => sum + item.count,
    0,
  );

  // Verificar se mais de 50% dos depoimentos estão em período ≤ 6 meses
  const sortedByCount = [...distribuicaoTemporal].sort(
    (a, b) => b.count - a.count,
  );

  let accumCount = 0;
  let monthsUsed = 0;

  for (const item of sortedByCount) {
    accumCount += item.count;
    monthsUsed++;

    if (accumCount / totalDepoimentos > 0.5) {
      return monthsUsed <= 6;
    }
  }

  return false;
}

/**
 * Calcula nível de risco
 */
function calculateProvaEmprestadaRisk(
  qtdDepoimentos: number,
  advogadosRecorrentes: number,
  concentracaoComarca: number,
  timelineSuspeita: boolean,
): "ALTO" | "MEDIO" | "BAIXO" {
  let score = 0;

  // Quantidade de depoimentos
  if (qtdDepoimentos > 30) score += 4;
  else if (qtdDepoimentos > 20) score += 3;
  else if (qtdDepoimentos > 15) score += 2;
  else score += 1;

  // Advogados recorrentes
  if (advogadosRecorrentes > 3) score += 3;
  else if (advogadosRecorrentes > 1) score += 2;
  else if (advogadosRecorrentes > 0) score += 1;

  // Concentração geográfica
  if (concentracaoComarca > 80) score += 2;
  else if (concentracaoComarca > 60) score += 1;

  // Timeline suspeita
  if (timelineSuspeita) score += 2;

  if (score >= 8) return "ALTO";
  if (score >= 5) return "MEDIO";
  return "BAIXO";
}

/**
 * Calcula confiança da detecção (0-100)
 */
function calculateProvaEmprestadaConfidence(
  qtdDepoimentos: number,
  advogadosRecorrentes: number,
  concentracaoComarca: number,
  processosAnalisados: number,
): number {
  let score = 0;

  // Base por prova emprestada detectada
  score += 50;

  // Quantidade de depoimentos
  score += Math.min(qtdDepoimentos * 1.5, 30);

  // Advogados recorrentes são forte indicador
  score += Math.min(advogadosRecorrentes * 5, 20);

  return Math.min(score, 100);
}

/**
 * Normaliza nome para comparação
 */
function normalizeNome(nome: string): string {
  return nome.toLowerCase().trim().replace(/\s+/g, " ");
}

/**
 * Atualiza flags de prova emprestada nos processos
 */
export function updateProvaEmprestadaFlags(
  processos: any[],
  provaResults: ProvaEmprestadaResult[],
): any[] {
  const testemunhasProva = new Map<string, ProvaEmprestadaResult>();

  for (const result of provaResults) {
    testemunhasProva.set(normalizeNome(result.nome), result);
  }

  return processos.map((processo) => {
    const todasTestemunhas = [
      ...(processo.testemunhas_ativo_limpo || []),
      ...(processo.testemunhas_passivo_limpo || []),
      ...(processo.todas_testemunhas || []),
    ];

    const testemunhasComProva = todasTestemunhas.filter((nome) =>
      testemunhasProva.has(normalizeNome(nome || "")),
    );

    if (testemunhasComProva.length > 0) {
      return {
        ...processo,
        contem_prova_emprestada: true,
        testemunhas_prova_emprestada: testemunhasComProva,
      };
    }

    return processo;
  });
}

/**
 * Atualiza flags de prova emprestada nas testemunhas
 */
export function updateTestemunhaProvaEmprestadaFlags(
  testemunhas: any[],
  provaResults: ProvaEmprestadaResult[],
): any[] {
  const testemunhasProva = new Map<string, ProvaEmprestadaResult>();

  for (const result of provaResults) {
    testemunhasProva.set(normalizeNome(result.nome), result);
  }

  return testemunhas.map((testemunha) => {
    const nome = normalizeNome(testemunha.nome_testemunha);
    const provaResult = testemunhasProva.get(nome);

    if (provaResult) {
      return {
        ...testemunha,
        e_prova_emprestada: provaResult.alerta,
      };
    } else {
      // Aplicar regra simples: >10 depoimentos = prova emprestada
      return {
        ...testemunha,
        e_prova_emprestada: (testemunha.qtd_depoimentos || 0) > 10,
      };
    }
  });
}
