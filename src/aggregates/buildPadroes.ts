/**
 * Construtor de agregados para padrões detectados
 * Gera métricas consolidadas para assistjuria.padroes_agregados
 */

import { supabase } from '@/integrations/supabase/client';

export interface TestemunhaProfissional {
  nome: string;
  qtd_depoimentos: number;
  cnjs: string[];
  risco: 'ALTO' | 'MEDIO' | 'BAIXO';
  concentracao_comarca: string;
  advogados_recorrentes: string[];
}

export interface AdvogadoRecorrente {
  nome: string;
  qtd_processos: number;
  testemunhas_associadas: string[];
  padroes_detectados: string[];
  concentracao_uf: string;
}

export interface ConcentracaoGeografica {
  uf: string;
  comarca: string;
  total_processos: number;
  processos_suspeitos: number;
  percentual_suspeita: number;
  padroes_predominantes: string[];
}

export interface TendenciaTemporal {
  periodo: string; // YYYY-MM
  total_processos: number;
  triangulacoes: number;
  trocas_diretas: number;
  duplo_papel: number;
  prova_emprestada: number;
  crescimento_percentual: number;
}

export interface PadroesAgregados {
  org_id: string;
  total_processos: number;
  processos_com_triangulacao: number;
  processos_com_troca_direta: number;
  processos_com_duplo_papel: number;
  processos_com_prova_emprestada: number;
  testemunhas_profissionais: TestemunhaProfissional[];
  advogados_recorrentes: AdvogadoRecorrente[];
  concentracao_uf: Record<string, ConcentracaoGeografica>;
  concentracao_comarca: Record<string, ConcentracaoGeografica>;
  tendencia_temporal: TendenciaTemporal[];
}

/**
 * Constrói agregados completos dos padrões detectados
 */
interface ProcessoData {
  triangulacao_confirmada?: boolean;
  troca_direta?: boolean;
  reclamante_foi_testemunha?: boolean;
  contem_prova_emprestada?: boolean;
  cnj?: string;
  comarca?: string;
  uf?: string;
  created_at?: string;
  testemunhas_ativo?: string[];
  testemunhas_passivo?: string[];
  advogados_ativo?: string[];
  advogados_passivo?: string[];
  [key: string]: any;
}

interface TestemunhaData {
  nome?: string;
  cnj?: string;
  [key: string]: any;
}

export async function buildPadroesAgregados(
  orgId: string,
  processos: ProcessoData[],
  testemunhas: TestemunhaData[]
): Promise<PadroesAgregados> {
  
  // 1. Contadores básicos
  const contadores = calculateContadores(processos);
  
  // 2. Testemunhas profissionais (>10 depoimentos)
  const testemunhasProfissionais = buildTestemunhasProfissionais(testemunhas, processos);
  
  // 3. Advogados recorrentes
  const advogadosRecorrentes = buildAdvogadosRecorrentes(processos, testemunhas);
  
  // 4. Concentração geográfica
  const { concentracaoUF, concentracaoComarca } = buildConcentracaoGeografica(processos);
  
  // 5. Tendência temporal
  const tendenciaTemporal = buildTendenciaTemporal(processos);
  
  return {
    org_id: orgId,
    total_processos: processos.length,
    ...contadores,
    testemunhas_profissionais: testemunhasProfissionais,
    advogados_recorrentes: advogadosRecorrentes,
    concentracao_uf: concentracaoUF,
    concentracao_comarca: concentracaoComarca,
    tendencia_temporal: tendenciaTemporal
  };
}

/**
 * Calcula contadores básicos de padrões
 */
function calculateContadores(processos: ProcessoData[]) {
  let triangulacao = 0;
  let trocaDireta = 0;
  let duploPapel = 0;
  let provaEmprestada = 0;
  
  for (const processo of processos) {
    if (processo.triangulacao_confirmada) triangulacao++;
    if (processo.troca_direta) trocaDireta++;
    if (processo.reclamante_foi_testemunha) duploPapel++;
    if (processo.contem_prova_emprestada) provaEmprestada++;
  }
  
  return {
    processos_com_triangulacao: triangulacao,
    processos_com_troca_direta: trocaDireta,
    processos_com_duplo_papel: duploPapel,
    processos_com_prova_emprestada: provaEmprestada
  };
}

/**
 * Constrói lista de testemunhas profissionais
 */
function buildTestemunhasProfissionais(
  testemunhas: TestemunhaData[],
  processos: ProcessoData[]
): TestemunhaProfissional[] {
  return testemunhas
    .filter(t => (t.qtd_depoimentos || 0) > 10)
    .map(testemunha => {
      const cnjs = testemunha.cnjs_como_testemunha || [];
      
      // Encontrar comarca mais frequente
      const comarcaCount = new Map<string, number>();
      const advogadosSet = new Set<string>();
      
      for (const cnj of cnjs) {
        const processo = processos.find(p => p.cnj === cnj);
        if (processo) {
          const comarca = processo.comarca || 'Desconhecida';
          comarcaCount.set(comarca, (comarcaCount.get(comarca) || 0) + 1);
          
          (processo.advogados_parte_ativa || []).forEach((adv: string) => {
            if (adv) advogadosSet.add(adv);
          });
        }
      }
      
      const comarcaMaisFrequente = Array.from(comarcaCount.entries())
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Desconhecida';
      
      // Determinar risco baseado em quantidade e concentração
      let risco: 'ALTO' | 'MEDIO' | 'BAIXO' = 'BAIXO';
      const qtd = testemunha.qtd_depoimentos || 0;
      
      if (qtd > 30 || advogadosSet.size > 5) risco = 'ALTO';
      else if (qtd > 20 || advogadosSet.size > 2) risco = 'MEDIO';
      
      return {
        nome: testemunha.nome_testemunha,
        qtd_depoimentos: qtd,
        cnjs,
        risco,
        concentracao_comarca: comarcaMaisFrequente,
        advogados_recorrentes: Array.from(advogadosSet)
      };
    })
    .sort((a, b) => b.qtd_depoimentos - a.qtd_depoimentos);
}

/**
 * Constrói lista de advogados recorrentes
 */
function buildAdvogadosRecorrentes(
  processos: ProcessoData[],
  testemunhas: TestemunhaData[]
): AdvogadoRecorrente[] {
  const advogadoStats = new Map<string, {
    processos: Set<string>;
    testemunhas: Set<string>;
    padroes: Set<string>;
    ufs: Map<string, number>;
  }>();
  
  // Processar cada processo
  for (const processo of processos) {
    const advogados = processo.advogados_parte_ativa || [];
    const uf = processo.uf || 'Desconhecida';
    const padroes: string[] = [];
    
    if (processo.triangulacao_confirmada) padroes.push('triangulacao');
    if (processo.troca_direta) padroes.push('troca_direta');
    if (processo.reclamante_foi_testemunha) padroes.push('duplo_papel');
    if (processo.contem_prova_emprestada) padroes.push('prova_emprestada');
    
    const todasTestemunhas = [
      ...(processo.testemunhas_ativo_limpo || []),
      ...(processo.testemunhas_passivo_limpo || []),
      ...(processo.todas_testemunhas || [])
    ];
    
    for (const advogado of advogados) {
      if (!advogado) continue;
      
      const nome = advogado.trim();
      if (!advogadoStats.has(nome)) {
        advogadoStats.set(nome, {
          processos: new Set(),
          testemunhas: new Set(),
          padroes: new Set(),
          ufs: new Map()
        });
      }
      
      const stats = advogadoStats.get(nome)!;
      stats.processos.add(processo.cnj);
      stats.ufs.set(uf, (stats.ufs.get(uf) || 0) + 1);
      
      padroes.forEach(p => stats.padroes.add(p));
      todasTestemunhas.forEach(t => {
        if (t) stats.testemunhas.add(t);
      });
    }
  }
  
  // Filtrar apenas advogados com atividade suspeita (≥5 processos OU ≥2 padrões)
  return Array.from(advogadoStats.entries())
    .filter(([_, stats]) => 
      stats.processos.size >= 5 || stats.padroes.size >= 2
    )
    .map(([nome, stats]) => {
      const ufMaisFrequente = Array.from(stats.ufs.entries())
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Desconhecida';
      
      return {
        nome,
        qtd_processos: stats.processos.size,
        testemunhas_associadas: Array.from(stats.testemunhas),
        padroes_detectados: Array.from(stats.padroes),
        concentracao_uf: ufMaisFrequente
      };
    })
    .sort((a, b) => b.qtd_processos - a.qtd_processos);
}

/**
 * Constrói concentração geográfica
 */
function buildConcentracaoGeografica(processos: ProcessoData[]): {
  concentracaoUF: Record<string, ConcentracaoGeografica>;
  concentracaoComarca: Record<string, ConcentracaoGeografica>;
} {
  const ufStats = new Map<string, {
    total: number;
    suspeitos: number;
    padroes: Map<string, number>;
    comarcas: Set<string>;
  }>();
  
  const comarcaStats = new Map<string, {
    uf: string;
    total: number;
    suspeitos: number;
    padroes: Map<string, number>;
  }>();
  
  // Processar cada processo
  for (const processo of processos) {
    const uf = processo.uf || 'Desconhecida';
    const comarca = processo.comarca || 'Desconhecida';
    const chaveComarca = `${uf}|${comarca}`;
    
    const isSuspeito = !!(
      processo.triangulacao_confirmada ||
      processo.troca_direta ||
      processo.reclamante_foi_testemunha ||
      processo.contem_prova_emprestada
    );
    
    const padroes: string[] = [];
    if (processo.triangulacao_confirmada) padroes.push('triangulacao');
    if (processo.troca_direta) padroes.push('troca_direta');
    if (processo.reclamante_foi_testemunha) padroes.push('duplo_papel');
    if (processo.contem_prova_emprestada) padroes.push('prova_emprestada');
    
    // Stats por UF
    if (!ufStats.has(uf)) {
      ufStats.set(uf, {
        total: 0,
        suspeitos: 0,
        padroes: new Map(),
        comarcas: new Set()
      });
    }
    
    const ufStat = ufStats.get(uf)!;
    ufStat.total++;
    ufStat.comarcas.add(comarca);
    if (isSuspeito) ufStat.suspeitos++;
    padroes.forEach(p => ufStat.padroes.set(p, (ufStat.padroes.get(p) || 0) + 1));
    
    // Stats por Comarca
    if (!comarcaStats.has(chaveComarca)) {
      comarcaStats.set(chaveComarca, {
        uf,
        total: 0,
        suspeitos: 0,
        padroes: new Map()
      });
    }
    
    const comarcaStat = comarcaStats.get(chaveComarca)!;
    comarcaStat.total++;
    if (isSuspeito) comarcaStat.suspeitos++;
    padroes.forEach(p => comarcaStat.padroes.set(p, (comarcaStat.padroes.get(p) || 0) + 1));
  }
  
  // Converter para formato final
  const concentracaoUF: Record<string, ConcentracaoGeografica> = {};
  for (const [uf, stats] of ufStats) {
    const padroesPredo = Array.from(stats.padroes.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([padrao, _]) => padrao);
    
    concentracaoUF[uf] = {
      uf,
      comarca: `${stats.comarcas.size} comarcas`,
      total_processos: stats.total,
      processos_suspeitos: stats.suspeitos,
      percentual_suspeita: (stats.suspeitos / stats.total) * 100,
      padroes_predominantes: padroesPredo
    };
  }
  
  const concentracaoComarca: Record<string, ConcentracaoGeografica> = {};
  for (const [chave, stats] of comarcaStats) {
    const [uf, comarca] = chave.split('|');
    const padroesPredo = Array.from(stats.padroes.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([padrao, _]) => padrao);
    
    concentracaoComarca[chave] = {
      uf,
      comarca,
      total_processos: stats.total,
      processos_suspeitos: stats.suspeitos,
      percentual_suspeita: (stats.suspeitos / stats.total) * 100,
      padroes_predominantes: padroesPredo
    };
  }
  
  return { concentracaoUF, concentracaoComarca };
}

/**
 * Constrói tendência temporal
 */
function buildTendenciaTemporal(processos: ProcessoData[]): TendenciaTemporal[] {
  const temporalStats = new Map<string, {
    total: number;
    triangulacoes: number;
    trocas: number;
    duplo: number;
    prova: number;
  }>();
  
  for (const processo of processos) {
    const data = processo.data_audiencia;
    if (!data) continue;
    
    try {
      const date = new Date(data);
      const periodo = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      
      if (!temporalStats.has(periodo)) {
        temporalStats.set(periodo, {
          total: 0,
          triangulacoes: 0,
          trocas: 0,
          duplo: 0,
          prova: 0
        });
      }
      
      const stats = temporalStats.get(periodo)!;
      stats.total++;
      if (processo.triangulacao_confirmada) stats.triangulacoes++;
      if (processo.troca_direta) stats.trocas++;
      if (processo.reclamante_foi_testemunha) stats.duplo++;
      if (processo.contem_prova_emprestada) stats.prova++;
      
    } catch {
      // Ignora datas inválidas
    }
  }
  
  // Converter para array ordenado e calcular crescimento
  const periodos = Array.from(temporalStats.entries())
    .sort((a, b) => a[0].localeCompare(b[0]));
  
  const tendencias: TendenciaTemporal[] = [];
  
  for (let i = 0; i < periodos.length; i++) {
    const [periodo, stats] = periodos[i];
    
    let crescimento = 0;
    if (i > 0) {
      const [_, statsAnterior] = periodos[i - 1];
      const totalAnterior = statsAnterior.total;
      if (totalAnterior > 0) {
        crescimento = ((stats.total - totalAnterior) / totalAnterior) * 100;
      }
    }
    
    tendencias.push({
      periodo,
      total_processos: stats.total,
      triangulacoes: stats.triangulacoes,
      trocas_diretas: stats.trocas,
      duplo_papel: stats.duplo,
      prova_emprestada: stats.prova,
      crescimento_percentual: crescimento
    });
  }
  
  return tendencias;
}

/**
 * Salva agregados no banco de dados usando SQL direto
 */
export async function savePadroesAgregados(agregados: PadroesAgregados): Promise<void> {
  const { error } = await supabase.rpc('upsert_padroes_agregados' as any, {
    p_org_id: agregados.org_id,
    p_data: {
      total_processos: agregados.total_processos,
      processos_com_triangulacao: agregados.processos_com_triangulacao,
      processos_com_troca_direta: agregados.processos_com_troca_direta,
      processos_com_duplo_papel: agregados.processos_com_duplo_papel,
      processos_com_prova_emprestada: agregados.processos_com_prova_emprestada,
      testemunhas_profissionais: agregados.testemunhas_profissionais,
      advogados_recorrentes: agregados.advogados_recorrentes,
      concentracao_uf: agregados.concentracao_uf,
      concentracao_comarca: agregados.concentracao_comarca,
      tendencia_temporal: agregados.tendencia_temporal
    }
  });
  
  if (error) {
    throw new Error(`Erro ao salvar agregados: ${error.message}`);
  }
}