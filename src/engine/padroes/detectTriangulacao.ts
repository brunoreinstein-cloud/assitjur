/**
 * Detecção de Triangulação: ciclos A→B→C→A em grafo testemunha→reclamante
 * Identifica redes circulares de testimonial
 */

export interface TriangulacaoResult {
  ciclo: string[]; // [A, B, C, A] - nomes das pessoas no ciclo
  cnjs: string[]; // CNJs envolvidos no ciclo
  advogados: string[]; // Advogados comuns no ciclo
  comarcas: string[]; // Comarcas envolvidas
  desenho: string; // Representação visual do ciclo
  confianca: number; // 0-100
  tamanho_ciclo: number; // 3 = triangulo, 4+ = ciclo maior
}

export interface TriangulacaoDetectionResult {
  detected: boolean;
  matches: TriangulacaoResult[];
  summary: {
    total_ciclos: number;
    maior_ciclo: number;
    pessoas_envolvidas: string[];
    cnjs_afetados: string[];
  };
}

interface GrafoNode {
  nome: string;
  testificaEm: Set<string>; // CNJs onde é testemunha
  reclamanteEm: Set<string>; // CNJs onde é reclamante
}

/**
 * Detecta padrões de triangulação em rede de testemunhas/reclamantes
 */
export function detectTriangulacao(
  processos: any[],
): TriangulacaoDetectionResult {
  const matches: TriangulacaoResult[] = [];

  // 1. Construir grafo de relacionamentos pessoa -> CNJs
  const grafo = buildGrafoRelacionamentos(processos);

  // 2. Detectar ciclos no grafo
  const ciclos = findCyclesInGrafo(grafo, processos);

  // 3. Processar cada ciclo encontrado
  for (const ciclo of ciclos) {
    if (ciclo.length < 3) continue; // Precisa de pelo menos 3 pessoas para triangulação

    const triangulacao = buildTriangulacaoResult(ciclo, processos, grafo);
    if (triangulacao.confianca >= 30) {
      // Filtro de confiança mínima
      matches.push(triangulacao);
    }
  }

  // 4. Calcular summary
  const pessoasEnvolvidas = new Set<string>();
  const cnjsAfetados = new Set<string>();
  let maiorCiclo = 0;

  for (const match of matches) {
    match.ciclo.forEach((pessoa) => pessoasEnvolvidas.add(pessoa));
    match.cnjs.forEach((cnj) => cnjsAfetados.add(cnj));
    maiorCiclo = Math.max(maiorCiclo, match.tamanho_ciclo);
  }

  return {
    detected: matches.length > 0,
    matches,
    summary: {
      total_ciclos: matches.length,
      maior_ciclo: maiorCiclo,
      pessoas_envolvidas: Array.from(pessoasEnvolvidas),
      cnjs_afetados: Array.from(cnjsAfetados),
    },
  };
}

/**
 * Constrói grafo de relacionamentos entre pessoas e CNJs
 */
function buildGrafoRelacionamentos(processos: any[]): Map<string, GrafoNode> {
  const grafo = new Map<string, GrafoNode>();

  for (const processo of processos) {
    const cnj = processo.cnj;

    // Adicionar reclamante
    const reclamante = processo.reclamante_limpo;
    if (reclamante) {
      const nomeNorm = normalizeNome(reclamante);
      if (!grafo.has(nomeNorm)) {
        grafo.set(nomeNorm, {
          nome: nomeNorm,
          testificaEm: new Set(),
          reclamanteEm: new Set(),
        });
      }
      grafo.get(nomeNorm)!.reclamanteEm.add(cnj);
    }

    // Adicionar testemunhas
    const todasTestemunhas = [
      ...(processo.testemunhas_ativo_limpo || []),
      ...(processo.testemunhas_passivo_limpo || []),
      ...(processo.todas_testemunhas || []),
    ];

    for (const testemunha of todasTestemunhas) {
      if (!testemunha) continue;

      const nomeNorm = normalizeNome(testemunha);
      if (!grafo.has(nomeNorm)) {
        grafo.set(nomeNorm, {
          nome: nomeNorm,
          testificaEm: new Set(),
          reclamanteEm: new Set(),
        });
      }
      grafo.get(nomeNorm)!.testificaEm.add(cnj);
    }
  }

  return grafo;
}

/**
 * Encontra ciclos no grafo usando busca em profundidade
 */
function findCyclesInGrafo(
  grafo: Map<string, GrafoNode>,
  processos: any[],
): string[][] {
  const ciclos: string[][] = [];
  const visitados = new Set<string>();
  const stack = new Set<string>();

  // Para cada pessoa no grafo, tentar encontrar ciclos
  for (const [nome] of grafo) {
    if (!visitados.has(nome)) {
      dfsForCycles(nome, grafo, processos, visitados, stack, [], ciclos);
    }
  }

  return ciclos;
}

/**
 * DFS para encontrar ciclos
 */
function dfsForCycles(
  atual: string,
  grafo: Map<string, GrafoNode>,
  processos: any[],
  visitados: Set<string>,
  stack: Set<string>,
  path: string[],
  ciclos: string[][],
): void {
  visitados.add(atual);
  stack.add(atual);
  path.push(atual);

  const node = grafo.get(atual);
  if (!node) return;

  // Para cada CNJ onde esta pessoa é testemunha,
  // encontrar quem são os reclamantes (próximos no ciclo)
  for (const cnj of node.testificaEm) {
    const processo = processos.find((p) => p.cnj === cnj);
    if (!processo) continue;

    const reclamante = processo.reclamante_limpo;
    if (!reclamante) continue;

    const reclamanteNorm = normalizeNome(reclamante);

    // Se o reclamante está no stack atual, encontramos um ciclo
    if (stack.has(reclamanteNorm)) {
      const cycleStart = path.indexOf(reclamanteNorm);
      if (cycleStart >= 0) {
        const ciclo = [...path.slice(cycleStart), reclamanteNorm];
        if (ciclo.length >= 4) {
          // Pelo menos 3 pessoas + repetição
          ciclos.push(ciclo);
        }
      }
    }
    // Se não visitado, continuar DFS
    else if (!visitados.has(reclamanteNorm)) {
      dfsForCycles(
        reclamanteNorm,
        grafo,
        processos,
        visitados,
        stack,
        path,
        ciclos,
      );
    }
  }

  stack.delete(atual);
  path.pop();
}

/**
 * Constrói resultado detalhado da triangulação
 */
function buildTriangulacaoResult(
  ciclo: string[],
  processos: any[],
  grafo: Map<string, GrafoNode>,
): TriangulacaoResult {
  const cnjs = new Set<string>();
  const advogados = new Set<string>();
  const comarcas = new Set<string>();

  // Encontrar CNJs envolvidos no ciclo
  for (let i = 0; i < ciclo.length - 1; i++) {
    const pessoa = ciclo[i];
    const proximo = ciclo[i + 1];

    const node = grafo.get(pessoa);
    if (!node) continue;

    // CNJs onde pessoa é testemunha e próximo é reclamante
    for (const cnj of node.testificaEm) {
      const processo = processos.find((p) => p.cnj === cnj);
      if (!processo) continue;

      const reclamante = normalizeNome(processo.reclamante_limpo || "");
      if (reclamante === proximo) {
        cnjs.add(cnj);

        // Coletar advogados e comarcas
        (processo.advogados_parte_ativa || []).forEach((adv: string) => {
          if (adv) advogados.add(adv);
        });

        if (processo.comarca) comarcas.add(processo.comarca);
      }
    }
  }

  const tamanho = ciclo.length - 1; // Remove duplicação do último elemento
  const desenho = buildDesenhoTriangulacao(ciclo);
  const confianca = calculateTriangulacaoConfidence(
    tamanho,
    cnjs.size,
    advogados.size,
    comarcas.size,
  );

  return {
    ciclo,
    cnjs: Array.from(cnjs),
    advogados: Array.from(advogados),
    comarcas: Array.from(comarcas),
    desenho,
    confianca,
    tamanho_ciclo: tamanho,
  };
}

/**
 * Cria representação visual do ciclo
 */
function buildDesenhoTriangulacao(ciclo: string[]): string {
  if (ciclo.length <= 1) return "";

  const pessoas = ciclo.slice(0, -1); // Remove duplicação do último
  return pessoas.join(" → ") + " → " + pessoas[0];
}

/**
 * Calcula confiança da detecção (0-100)
 */
function calculateTriangulacaoConfidence(
  tamanho: number,
  numCNJs: number,
  numAdvogados: number,
  numComarcas: number,
): number {
  let score = 0;

  // Base por triangulação detectada
  score += 30;

  // Ciclos maiores são mais suspeitos
  if (tamanho === 3)
    score += 20; // Triângulo clássico
  else if (tamanho === 4)
    score += 25; // Quadrado
  else score += 15; // Ciclos muito grandes podem ser coincidência

  // Múltiplos CNJs aumentam confiança
  score += Math.min(numCNJs * 5, 25);

  // Advogados comuns são suspeitos
  score += Math.min(numAdvogados * 3, 15);

  // Múltiplas comarcas reduzem suspeita (pode ser coincidência)
  if (numComarcas > 2) score -= 10;

  return Math.max(0, Math.min(score, 100));
}

/**
 * Normaliza nome para comparação
 */
function normalizeNome(nome: string): string {
  return nome.toLowerCase().trim().replace(/\s+/g, " ");
}

/**
 * Atualiza flags de triangulação nos processos
 */
export function updateTriangulacaoFlags(
  processos: any[],
  triangulacaoResults: TriangulacaoResult[],
): any[] {
  const cnjsComTriangulacao = new Set<string>();
  const triangulacaoDetails = new Map<string, TriangulacaoResult[]>();

  // Mapear CNJs afetados
  for (const result of triangulacaoResults) {
    for (const cnj of result.cnjs) {
      cnjsComTriangulacao.add(cnj);
      if (!triangulacaoDetails.has(cnj)) {
        triangulacaoDetails.set(cnj, []);
      }
      triangulacaoDetails.get(cnj)!.push(result);
    }
  }

  return processos.map((processo) => {
    if (cnjsComTriangulacao.has(processo.cnj)) {
      const detalhes = triangulacaoDetails.get(processo.cnj) || [];
      const desenho = detalhes.map((d) => d.desenho).join("; ");
      const cnjsRelacionados = [...new Set(detalhes.flatMap((d) => d.cnjs))];

      return {
        ...processo,
        triangulacao_confirmada: true,
        desenho_triangulacao: desenho,
        cnjs_triangulacao: cnjsRelacionados,
      };
    }

    return processo;
  });
}

/**
 * Atualiza flags de triangulação nas testemunhas
 */
export function updateTestemunhaTriangulacaoFlags(
  testemunhas: any[],
  triangulacaoResults: TriangulacaoResult[],
): any[] {
  const testemunhasEnvolvidasMap = new Map<string, TriangulacaoResult[]>();

  // Mapear testemunhas envolvidas
  for (const result of triangulacaoResults) {
    for (const pessoa of result.ciclo) {
      const nomeNorm = normalizeNome(pessoa);
      if (!testemunhasEnvolvidasMap.has(nomeNorm)) {
        testemunhasEnvolvidasMap.set(nomeNorm, []);
      }
      testemunhasEnvolvidasMap.get(nomeNorm)!.push(result);
    }
  }

  return testemunhas.map((testemunha) => {
    const nomeNorm = normalizeNome(testemunha.nome_testemunha);
    const envolvimentos = testemunhasEnvolvidasMap.get(nomeNorm);

    if (envolvimentos && envolvimentos.length > 0) {
      const cnjsRelacionados = [
        ...new Set(envolvimentos.flatMap((e) => e.cnjs)),
      ];

      return {
        ...testemunha,
        participou_triangulacao: true,
        cnjs_triangulacao: cnjsRelacionados,
      };
    }

    return testemunha;
  });
}
