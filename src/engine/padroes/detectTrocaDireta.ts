/**
 * Detecção de Troca Direta: A testemunha de B E B testemunha de A
 * Padrão que indica possível reciprocidade suspeita
 */

export interface TrocaDiretaResult {
  testemunhaA: string;
  testemunhaB: string;
  cnjsA: string[]; // CNJs onde A é testemunha de B
  cnjsB: string[]; // CNJs onde B é testemunha de A
  advogadosComuns: string[];
  confianca: number; // 0-100
  tipo: "reciproca" | "circular";
}

export interface TrocaDiretaDetectionResult {
  detected: boolean;
  matches: TrocaDiretaResult[];
  summary: {
    total_reciprocas: number;
    testemunhas_envolvidas: string[];
    cnjs_afetados: string[];
  };
}

/**
 * Detecta padrões de troca direta entre testemunhas
 */
export function detectTrocaDireta(
  processos: any[],
): TrocaDiretaDetectionResult {
  const matches: TrocaDiretaResult[] = [];
  const testemunhasEnvolvidas = new Set<string>();
  const cnjsAfetados = new Set<string>();

  // 1. Criar mapa de testemunha -> CNJs onde ela testifica
  const testemunhaToCNJs = new Map<string, Set<string>>();

  for (const processo of processos) {
    const cnj = processo.cnj;
    const todasTestemunhas = [
      ...(processo.testemunhas_ativo_limpo || []),
      ...(processo.testemunhas_passivo_limpo || []),
      ...(processo.todas_testemunhas || []),
    ];

    for (const testemunha of todasTestemunhas) {
      if (!testemunha) continue;

      const nomeNormalizado = normalizeNome(testemunha);
      if (!testemunhaToCNJs.has(nomeNormalizado)) {
        testemunhaToCNJs.set(nomeNormalizado, new Set());
      }
      testemunhaToCNJs.get(nomeNormalizado)!.add(cnj);
    }
  }

  // 2. Criar mapa de CNJ -> reclamantes para identificar quando testemunha é de quem
  const cnjToReclamantes = new Map<string, string[]>();
  for (const processo of processos) {
    const reclamantes = [processo.reclamante_limpo].filter(Boolean);
    cnjToReclamantes.set(processo.cnj, reclamantes);
  }

  // 3. Detectar reciprocidade: A testemunha nos processos de B E B testemunha nos processos de A
  const nomes = Array.from(testemunhaToCNJs.keys());

  for (let i = 0; i < nomes.length; i++) {
    for (let j = i + 1; j < nomes.length; j++) {
      const testemunhaA = nomes[i];
      const testemunhaB = nomes[j];

      const cnjsDeA = testemunhaToCNJs.get(testemunhaA) || new Set();
      const cnjsDeB = testemunhaToCNJs.get(testemunhaB) || new Set();

      // CNJs onde A é testemunha (potencialmente de B como reclamante)
      const cnjsOndeATestifica = Array.from(cnjsDeA);
      // CNJs onde B é testemunha (potencialmente de A como reclamante)
      const cnjsOndeBTestifica = Array.from(cnjsDeB);

      // Verificar se há reciprocidade real baseada em reclamantes
      const cnjsAparaB: string[] = [];
      const cnjsBparaA: string[] = [];

      // A testifica em processos onde B pode ser reclamante
      for (const cnj of cnjsOndeATestifica) {
        const reclamantes = cnjToReclamantes.get(cnj) || [];
        if (reclamantes.some((r) => normalizeNome(r) === testemunhaB)) {
          cnjsAparaB.push(cnj);
        }
      }

      // B testifica em processos onde A pode ser reclamante
      for (const cnj of cnjsOndeBTestifica) {
        const reclamantes = cnjToReclamantes.get(cnj) || [];
        if (reclamantes.some((r) => normalizeNome(r) === testemunhaA)) {
          cnjsBparaA.push(cnj);
        }
      }

      // Se há reciprocidade real, registrar
      if (cnjsAparaB.length > 0 && cnjsBparaA.length > 0) {
        const advogadosComuns = findAdvogadosComuns(
          [...cnjsAparaB, ...cnjsBparaA],
          processos,
        );

        const confianca = calculateTrocaConfidence(
          cnjsAparaB.length,
          cnjsBparaA.length,
          advogadosComuns.length,
        );

        matches.push({
          testemunhaA,
          testemunhaB,
          cnjsA: cnjsAparaB,
          cnjsB: cnjsBparaA,
          advogadosComuns,
          confianca,
          tipo: "reciproca",
        });

        testemunhasEnvolvidas.add(testemunhaA);
        testemunhasEnvolvidas.add(testemunhaB);
        cnjsAparaB.forEach((cnj) => cnjsAfetados.add(cnj));
        cnjsBparaA.forEach((cnj) => cnjsAfetados.add(cnj));
      }
    }
  }

  return {
    detected: matches.length > 0,
    matches,
    summary: {
      total_reciprocas: matches.length,
      testemunhas_envolvidas: Array.from(testemunhasEnvolvidas),
      cnjs_afetados: Array.from(cnjsAfetados),
    },
  };
}

/**
 * Normaliza nome para comparação
 */
function normalizeNome(nome: string): string {
  return nome.toLowerCase().trim().replace(/\s+/g, " ");
}

/**
 * Encontra advogados comuns nos CNJs especificados
 */
function findAdvogadosComuns(cnjs: string[], processos: any[]): string[] {
  const advogadoCount = new Map<string, number>();

  for (const cnj of cnjs) {
    const processo = processos.find((p) => p.cnj === cnj);
    if (!processo) continue;

    const advogados = processo.advogados_parte_ativa || [];
    for (const advogado of advogados) {
      if (!advogado) continue;
      const normalizado = normalizeNome(advogado);
      advogadoCount.set(normalizado, (advogadoCount.get(normalizado) || 0) + 1);
    }
  }

  // Retorna advogados que aparecem em mais de um CNJ
  return Array.from(advogadoCount.entries())
    .filter(([_, count]) => count > 1)
    .map(([advogado, _]) => advogado);
}

/**
 * Calcula nível de confiança da detecção (0-100)
 */
function calculateTrocaConfidence(
  cnjsAparaB: number,
  cnjsBparaA: number,
  advogadosComuns: number,
): number {
  let score = 0;

  // Base: reciprocidade detectada
  score += 40;

  // Múltiplos CNJs aumentam confiança
  if (cnjsAparaB > 1) score += 15;
  if (cnjsBparaA > 1) score += 15;

  // Advogados comuns aumentam suspeita
  score += Math.min(advogadosComuns * 10, 30);

  return Math.min(score, 100);
}

/**
 * Atualiza flags de troca direta nos processos
 */
export function updateTrocaDiretaFlags(
  processos: any[],
  trocaResults: TrocaDiretaResult[],
): any[] {
  const cnjsComTroca = new Set<string>();
  const trocaDetails = new Map<string, TrocaDiretaResult[]>();

  // Mapear CNJs afetados
  for (const result of trocaResults) {
    for (const cnj of [...result.cnjsA, ...result.cnjsB]) {
      cnjsComTroca.add(cnj);
      if (!trocaDetails.has(cnj)) {
        trocaDetails.set(cnj, []);
      }
      trocaDetails.get(cnj)!.push(result);
    }
  }

  // Atualizar processos
  return processos.map((processo) => {
    if (cnjsComTroca.has(processo.cnj)) {
      const detalhes = trocaDetails.get(processo.cnj) || [];
      const desenho = detalhes
        .map((d) => `${d.testemunhaA} ↔ ${d.testemunhaB}`)
        .join("; ");
      const cnjsRelacionados = [
        ...new Set(detalhes.flatMap((d) => [...d.cnjsA, ...d.cnjsB])),
      ];

      return {
        ...processo,
        troca_direta: true,
        desenho_troca_direta: desenho,
        cnjs_troca_direta: cnjsRelacionados,
      };
    }

    return processo;
  });
}

/**
 * Atualiza flags de troca direta nas testemunhas
 */
export function updateTestemunhaTrocaFlags(
  testemunhas: any[],
  trocaResults: TrocaDiretaResult[],
): any[] {
  const testemunhasEnvolvidasMap = new Map<string, TrocaDiretaResult[]>();

  // Mapear testemunhas envolvidas
  for (const result of trocaResults) {
    const nomeA = normalizeNome(result.testemunhaA);
    const nomeB = normalizeNome(result.testemunhaB);

    if (!testemunhasEnvolvidasMap.has(nomeA)) {
      testemunhasEnvolvidasMap.set(nomeA, []);
    }
    if (!testemunhasEnvolvidasMap.has(nomeB)) {
      testemunhasEnvolvidasMap.set(nomeB, []);
    }

    testemunhasEnvolvidasMap.get(nomeA)!.push(result);
    testemunhasEnvolvidasMap.get(nomeB)!.push(result);
  }

  return testemunhas.map((testemunha) => {
    const nomeNorm = normalizeNome(testemunha.nome_testemunha);
    const envolvimentos = testemunhasEnvolvidasMap.get(nomeNorm);

    if (envolvimentos && envolvimentos.length > 0) {
      const cnjsRelacionados = [
        ...new Set(envolvimentos.flatMap((e) => [...e.cnjsA, ...e.cnjsB])),
      ];

      return {
        ...testemunha,
        participou_troca_favor: true,
        cnjs_troca_favor: cnjsRelacionados,
      };
    }

    return testemunha;
  });
}
