/**
 * Detecção de Duplo Papel: interseção reclamante↔testemunha
 * Identifica pessoas que ora são reclamantes, ora testemunhas
 */

export interface DuploPapelResult {
  nome: string;
  cnjs_como_reclamante: string[];
  cnjs_como_testemunha: string[];
  polo_ativo_testemunha: boolean; // Se foi testemunha do polo ativo
  polo_passivo_testemunha: boolean; // Se foi testemunha do polo passivo
  cnjs_polo_passivo: string[];
  risco: 'ALTO' | 'MEDIO' | 'BAIXO';
  confianca: number; // 0-100
  advogados_comuns: string[]; // Advogados que aparecem em ambos os papéis
  timeline: {
    cnj: string;
    data: string | null;
    papel: 'reclamante' | 'testemunha_ativo' | 'testemunha_passivo';
  }[];
}

export interface DuploPapelDetectionResult {
  detected: boolean;
  matches: DuploPapelResult[];
  summary: {
    total_pessoas: number;
    risco_alto: number;
    risco_medio: number;
    risco_baixo: number;
    cnjs_afetados: string[];
  };
}

/**
 * Detecta padrões de duplo papel
 */
export function detectDuploPapel(
  processos: any[],
  testemunhas: any[]
): DuploPapelDetectionResult {
  const matches: DuploPapelResult[] = [];
  
  // 1. Mapear todas as pessoas e seus papéis
  const pessoasPapeis = buildPessoasPapeisMap(processos);
  
  // 2. Detectar duplo papel para cada pessoa
  for (const [nome, papeis] of pessoasPapeis) {
    if (papeis.reclamante.length > 0 && papeis.testemunha.length > 0) {
      const resultado = buildDuploPapelResult(nome, papeis, processos);
      matches.push(resultado);
    }
  }
  
  // 3. Calcular summary
  const riscoCounts = { ALTO: 0, MEDIO: 0, BAIXO: 0 };
  const cnjsAfetados = new Set<string>();
  
  for (const match of matches) {
    riscoCounts[match.risco]++;
    match.cnjs_como_reclamante.forEach(cnj => cnjsAfetados.add(cnj));
    match.cnjs_como_testemunha.forEach(cnj => cnjsAfetados.add(cnj));
  }

  return {
    detected: matches.length > 0,
    matches,
    summary: {
      total_pessoas: matches.length,
      risco_alto: riscoCounts.ALTO,
      risco_medio: riscoCounts.MEDIO,
      risco_baixo: riscoCounts.BAIXO,
      cnjs_afetados: Array.from(cnjsAfetados)
    }
  };
}

interface PessoaPapeis {
  reclamante: { cnj: string; data: string | null }[];
  testemunha: { 
    cnj: string; 
    data: string | null; 
    polo: 'ativo' | 'passivo' | 'indefinido';
  }[];
}

/**
 * Constrói mapa pessoas -> papéis nos processos
 */
function buildPessoasPapeisMap(processos: any[]): Map<string, PessoaPapeis> {
  const pessoasPapeis = new Map<string, PessoaPapeis>();
  
  for (const processo of processos) {
    const cnj = processo.cnj;
    const data = processo.data_audiencia || null;
    
    // Adicionar reclamante
    const reclamante = processo.reclamante_limpo;
    if (reclamante) {
      const nomeNorm = normalizeNome(reclamante);
      if (!pessoasPapeis.has(nomeNorm)) {
        pessoasPapeis.set(nomeNorm, { reclamante: [], testemunha: [] });
      }
      pessoasPapeis.get(nomeNorm)!.reclamante.push({ cnj, data });
    }
    
    // Adicionar testemunhas do polo ativo
    const testemunhasAtivo = processo.testemunhas_ativo_limpo || [];
    for (const testemunha of testemunhasAtivo) {
      if (!testemunha) continue;
      
      const nomeNorm = normalizeNome(testemunha);
      if (!pessoasPapeis.has(nomeNorm)) {
        pessoasPapeis.set(nomeNorm, { reclamante: [], testemunha: [] });
      }
      pessoasPapeis.get(nomeNorm)!.testemunha.push({ 
        cnj, 
        data, 
        polo: 'ativo' 
      });
    }
    
    // Adicionar testemunhas do polo passivo
    const testemunhasPassivo = processo.testemunhas_passivo_limpo || [];
    for (const testemunha of testemunhasPassivo) {
      if (!testemunha) continue;
      
      const nomeNorm = normalizeNome(testemunha);
      if (!pessoasPapeis.has(nomeNorm)) {
        pessoasPapeis.set(nomeNorm, { reclamante: [], testemunha: [] });
      }
      pessoasPapeis.get(nomeNorm)!.testemunha.push({ 
        cnj, 
        data, 
        polo: 'passivo' 
      });
    }
    
    // Adicionar testemunhas gerais (se não especificadas por polo)
    const todasTestemunhas = processo.todas_testemunhas || [];
    for (const testemunha of todasTestemunhas) {
      if (!testemunha) continue;
      
      const nomeNorm = normalizeNome(testemunha);
      if (!pessoasPapeis.has(nomeNorm)) {
        pessoasPapeis.set(nomeNorm, { reclamante: [], testemunha: [] });
      }
      
      // Verificar se já foi adicionada especificamente por polo
      const jaAdicionada = pessoasPapeis.get(nomeNorm)!.testemunha
        .some(t => t.cnj === cnj && t.polo !== 'indefinido');
      
      if (!jaAdicionada) {
        pessoasPapeis.get(nomeNorm)!.testemunha.push({ 
          cnj, 
          data, 
          polo: 'indefinido' 
        });
      }
    }
  }
  
  return pessoasPapeis;
}

/**
 * Constrói resultado detalhado de duplo papel
 */
function buildDuploPapelResult(
  nome: string,
  papeis: PessoaPapeis,
  processos: any[]
): DuploPapelResult {
  const cnjsReclamante = papeis.reclamante.map(r => r.cnj);
  const cnjsTestemunha = papeis.testemunha.map(t => t.cnj);
  
  // Analisar polos das testemunhas
  const poloAtivo = papeis.testemunha.some(t => t.polo === 'ativo');
  const poloPassivo = papeis.testemunha.some(t => t.polo === 'passivo');
  const cnjsPoloPassivo = papeis.testemunha
    .filter(t => t.polo === 'passivo')
    .map(t => t.cnj);
  
  // Encontrar advogados comuns
  const advogadosComuns = findAdvogadosComuns(
    [...cnjsReclamante, ...cnjsTestemunha],
    processos
  );
  
  // Construir timeline
  const timeline = [
    ...papeis.reclamante.map(r => ({
      cnj: r.cnj,
      data: r.data,
      papel: 'reclamante' as const
    })),
    ...papeis.testemunha.map(t => ({
      cnj: t.cnj,
      data: t.data,
      papel: t.polo === 'ativo' ? 'testemunha_ativo' as const : 
             t.polo === 'passivo' ? 'testemunha_passivo' as const :
             'testemunha_ativo' as const // default
    }))
  ].sort((a, b) => {
    if (!a.data && !b.data) return 0;
    if (!a.data) return 1;
    if (!b.data) return -1;
    return a.data.localeCompare(b.data);
  });
  
  // Calcular risco e confiança
  const risco = calculateDuploPapelRisk(
    cnjsReclamante.length,
    cnjsTestemunha.length,
    poloPassivo,
    advogadosComuns.length
  );
  
  const confianca = calculateDuploPapelConfidence(
    cnjsReclamante.length,
    cnjsTestemunha.length,
    advogadosComuns.length,
    timeline.length
  );

  return {
    nome,
    cnjs_como_reclamante: cnjsReclamante,
    cnjs_como_testemunha: cnjsTestemunha,
    polo_ativo_testemunha: poloAtivo,
    polo_passivo_testemunha: poloPassivo,
    cnjs_polo_passivo: cnjsPoloPassivo,
    risco,
    confianca,
    advogados_comuns: advogadosComuns,
    timeline
  };
}

/**
 * Calcula nível de risco
 */
function calculateDuploPapelRisk(
  numReclamante: number,
  numTestemunha: number,
  poloPassivo: boolean,
  advogadosComuns: number
): 'ALTO' | 'MEDIO' | 'BAIXO' {
  let score = 0;
  
  // Múltiplos papéis aumentam risco
  if (numReclamante > 2) score += 2;
  if (numTestemunha > 3) score += 2;
  
  // Testemunha do polo passivo é mais suspeito
  if (poloPassivo) score += 3;
  
  // Advogados comuns são muito suspeitos
  if (advogadosComuns > 0) score += 4;
  if (advogadosComuns > 2) score += 2;
  
  if (score >= 7) return 'ALTO';
  if (score >= 4) return 'MEDIO';
  return 'BAIXO';
}

/**
 * Calcula confiança da detecção (0-100)
 */
function calculateDuploPapelConfidence(
  numReclamante: number,
  numTestemunha: number,
  advogadosComuns: number,
  timelineEntries: number
): number {
  let score = 0;
  
  // Base por duplo papel detectado
  score += 40;
  
  // Múltiplas ocorrências aumentam confiança
  score += Math.min(numReclamante * 5, 20);
  score += Math.min(numTestemunha * 3, 15);
  
  // Advogados comuns são forte indicador
  score += Math.min(advogadosComuns * 8, 25);
  
  return Math.min(score, 100);
}

/**
 * Encontra advogados comuns nos CNJs especificados
 */
function findAdvogadosComuns(cnjs: string[], processos: any[]): string[] {
  const advogadoCount = new Map<string, number>();
  
  for (const cnj of cnjs) {
    const processo = processos.find(p => p.cnj === cnj);
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
 * Normaliza nome para comparação
 */
function normalizeNome(nome: string): string {
  return nome.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Atualiza flags de duplo papel nos processos
 */
export function updateDuploPapelFlags(
  processos: any[],
  duploPapelResults: DuploPapelResult[]
): any[] {
  const pessoasComDuplo = new Map<string, DuploPapelResult>();
  
  for (const result of duploPapelResults) {
    pessoasComDuplo.set(normalizeNome(result.nome), result);
  }
  
  return processos.map(processo => {
    const reclamante = normalizeNome(processo.reclamante_limpo || '');
    const duploPapel = pessoasComDuplo.get(reclamante);
    
    if (duploPapel) {
      return {
        ...processo,
        reclamante_foi_testemunha: true,
        qtd_vezes_reclamante_foi_testemunha: duploPapel.cnjs_como_testemunha.length,
        cnjs_em_que_reclamante_foi_testemunha: duploPapel.cnjs_como_testemunha,
        reclamante_testemunha_polo_passivo: duploPapel.polo_passivo_testemunha,
        cnjs_passivo: duploPapel.cnjs_polo_passivo
      };
    }
    
    return processo;
  });
}

/**
 * Atualiza flags de duplo papel nas testemunhas
 */
export function updateTestemunhaDuploPapelFlags(
  testemunhas: any[],
  duploPapelResults: DuploPapelResult[]
): any[] {
  const pessoasComDuplo = new Map<string, DuploPapelResult>();
  
  for (const result of duploPapelResults) {
    pessoasComDuplo.set(normalizeNome(result.nome), result);
  }
  
  return testemunhas.map(testemunha => {
    const nome = normalizeNome(testemunha.nome_testemunha);
    const duploPapel = pessoasComDuplo.get(nome);
    
    if (duploPapel) {
      return {
        ...testemunha,
        ja_foi_reclamante: true,
        cnjs_como_reclamante: duploPapel.cnjs_como_reclamante,
        foi_testemunha_ativo: duploPapel.polo_ativo_testemunha,
        foi_testemunha_passivo: duploPapel.polo_passivo_testemunha,
        foi_testemunha_em_ambos_polos: duploPapel.polo_ativo_testemunha && duploPapel.polo_passivo_testemunha
      };
    }
    
    return testemunha;
  });
}