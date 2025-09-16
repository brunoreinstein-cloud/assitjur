/**
 * AssistJur.IA - Canonical Template Data Structure
 * Headers and sample data following the standardized format
 */

import { generateSequentialCNJs } from '@/lib/cnj-generator';

// ===== CANONICAL HEADERS =====

export const CANONICAL_HEADERS_PROCESSO = [
  'CNJ', 'reclamante_nome', 'reu_nome', 'Status', 'Fase', 'UF', 'Comarca', 'Reclamantes', 
  'Advogados_Ativo', 'Testemunhas_Ativo', 'Testemunhas_Passivo', 
  'Todas_Testemunhas', 'Reclamante_Foi_Testemunha', 'Qtd_Reclamante_Testemunha',
  'CNJs_Reclamante_Testemunha', 'Reclamante_Testemunha_Polo_Passivo', 'CNJs_Passivo',
  'Triangulacao_Confirmada', 'Desenho_Triangulacao', 'CNJs_Triangulacao',
  'Contem_Prova_Emprestada', 'Testemunhas_Prova_Emprestada', 
  'Classificacao_Final', 'Insight_Estrategico'
] as const;

export const CANONICAL_HEADERS_TESTEMUNHA = [
  'Nome_Testemunha', 'Qtd_Depoimentos', 'CNJs_Como_Testemunha', 
  'Ja_Foi_Reclamante', 'CNJs_Como_Reclamante', 'Foi_Testemunha_Ativo', 
  'Foi_Testemunha_Passivo', 'CNJs_Passivo', 'Foi_Ambos_Polos', 
  'Participou_Troca_Favor', 'CNJs_Troca_Favor', 'Participou_Triangulacao', 
  'CNJs_Triangulacao', 'E_Prova_Emprestada', 'Classificacao', 'Classificacao_Estrategica'
] as const;

// ===== CANONICAL SAMPLE DATA =====

// Generate valid CNJs for examples
const validCNJs = generateSequentialCNJs(12, 2024);

export interface CanonicalProcessoSample {
  CNJ: string;
  reclamante_nome: string;
  reu_nome: string;
  Status: string;
  Fase: string;
  UF: string;
  Comarca: string;
  Reclamantes: string;
  Advogados_Ativo: string;
  Testemunhas_Ativo: string;
  Testemunhas_Passivo: string;
  Todas_Testemunhas: string;
  Reclamante_Foi_Testemunha: boolean;
  Qtd_Reclamante_Testemunha: number;
  CNJs_Reclamante_Testemunha: string;
  Reclamante_Testemunha_Polo_Passivo: boolean;
  CNJs_Passivo: string;
  Triangulacao_Confirmada: boolean;
  Desenho_Triangulacao: string;
  CNJs_Triangulacao: string;
  Contem_Prova_Emprestada: boolean;
  Testemunhas_Prova_Emprestada: string;
  Classificacao_Final: string;
  Insight_Estrategico: string;
}

export interface CanonicalTestemunhaSample {
  Nome_Testemunha: string;
  Qtd_Depoimentos: number;
  CNJs_Como_Testemunha: string;
  Ja_Foi_Reclamante: boolean;
  CNJs_Como_Reclamante: string;
  Foi_Testemunha_Ativo: boolean;
  Foi_Testemunha_Passivo: boolean;
  CNJs_Passivo: string;
  Foi_Ambos_Polos: boolean;
  Participou_Troca_Favor: boolean;
  CNJs_Troca_Favor: string;
  Participou_Triangulacao: boolean;
  CNJs_Triangulacao: string;
  E_Prova_Emprestada: boolean;
  Classificacao: string;
  Classificacao_Estrategica: string;
}

export interface DicionarioField {
  Aba: string;
  Campo: string;
  Tipo: string;
  Obrigatorio: string;
  Regra: string;
  Exemplo: string;
}

// ===== SAMPLE DATA =====

export const canonicalProcessoSamples: CanonicalProcessoSample[] = [
  {
    CNJ: validCNJs[0],
    reclamante_nome: 'Ana Lima',
    reu_nome: 'Empresa XYZ Ltda',
    Status: 'Em andamento',
    Fase: 'Instrução',
    UF: 'RJ',
    Comarca: 'Rio de Janeiro',
    Reclamantes: 'Ana Lima',
    Advogados_Ativo: 'Dr. Xavier Silva; Dra. Yasmim Oliveira',
    Testemunhas_Ativo: 'João Pereira',
    Testemunhas_Passivo: '—',
    Todas_Testemunhas: 'João Pereira; Beatriz Nunes',
    Reclamante_Foi_Testemunha: true,
    Qtd_Reclamante_Testemunha: 1,
    CNJs_Reclamante_Testemunha: validCNJs[9],
    Reclamante_Testemunha_Polo_Passivo: false,
    CNJs_Passivo: '—',
    Triangulacao_Confirmada: true,
    Desenho_Triangulacao: 'A→B→C→A',
    CNJs_Triangulacao: `${validCNJs[1]}; ${validCNJs[2]}; ${validCNJs[3]}`,
    Contem_Prova_Emprestada: true,
    Testemunhas_Prova_Emprestada: 'João Pereira',
    Classificacao_Final: 'Risco Alto',
    Insight_Estrategico: 'Triangulação + prova emprestada'
  },
  {
    CNJ: validCNJs[1],
    reclamante_nome: 'Pedro Santos',
    reu_nome: 'Indústria ABC S/A',
    Status: 'Sentenciado',
    Fase: 'Execução',
    UF: 'SP',
    Comarca: 'São Paulo',
    Reclamantes: 'Pedro Santos',
    Advogados_Ativo: 'Dra. Maria Legal',
    Testemunhas_Ativo: 'Carlos Costa',
    Testemunhas_Passivo: 'Ana Silva',
    Todas_Testemunhas: 'Carlos Costa; Ana Silva',
    Reclamante_Foi_Testemunha: false,
    Qtd_Reclamante_Testemunha: 0,
    CNJs_Reclamante_Testemunha: '—',
    Reclamante_Testemunha_Polo_Passivo: false,
    CNJs_Passivo: '—',
    Triangulacao_Confirmada: false,
    Desenho_Triangulacao: '—',
    CNJs_Triangulacao: '—',
    Contem_Prova_Emprestada: false,
    Testemunhas_Prova_Emprestada: '—',
    Classificacao_Final: 'Risco Baixo',
    Insight_Estrategico: 'Processo regular sem irregularidades'
  },
  {
    CNJ: validCNJs[2],
    reclamante_nome: 'Julia Martins',
    reu_nome: 'Comércio DEF ME',
    Status: 'Arquivado',
    Fase: 'Conhecimento',
    UF: 'MG',
    Comarca: 'Belo Horizonte',
    Reclamantes: 'Julia Martins',
    Advogados_Ativo: 'Dr. Roberto Advocacia; Sociedade Advogados MG',
    Testemunhas_Ativo: 'Beatriz Nunes; João Pereira',
    Testemunhas_Passivo: '—',
    Todas_Testemunhas: 'Beatriz Nunes; João Pereira',
    Reclamante_Foi_Testemunha: false,
    Qtd_Reclamante_Testemunha: 0,
    CNJs_Reclamante_Testemunha: '—',
    Reclamante_Testemunha_Polo_Passivo: false,
    CNJs_Passivo: '—',
    Triangulacao_Confirmada: false,
    Desenho_Triangulacao: '—',
    CNJs_Triangulacao: '—',
    Contem_Prova_Emprestada: true,
    Testemunhas_Prova_Emprestada: 'João Pereira',
    Classificacao_Final: 'Risco Médio',
    Insight_Estrategico: 'Testemunha recorrente - monitorar'
  }
];

export const canonicalTestemunhaSamples: CanonicalTestemunhaSample[] = [
  {
    Nome_Testemunha: 'João Pereira',
    Qtd_Depoimentos: 12,
    CNJs_Como_Testemunha: `${validCNJs[0]}; ${validCNJs[9]}`,
    Ja_Foi_Reclamante: false,
    CNJs_Como_Reclamante: '—',
    Foi_Testemunha_Ativo: true,
    Foi_Testemunha_Passivo: false,
    CNJs_Passivo: '—',
    Foi_Ambos_Polos: false,
    Participou_Troca_Favor: true,
    CNJs_Troca_Favor: `${validCNJs[4]}↔${validCNJs[5]}`,
    Participou_Triangulacao: true,
    CNJs_Triangulacao: `${validCNJs[1]}; ${validCNJs[2]}; ${validCNJs[3]}`,
    E_Prova_Emprestada: true,
    Classificacao: 'ALTA',
    Classificacao_Estrategica: 'CRÍTICO'
  },
  {
    Nome_Testemunha: 'Beatriz Nunes',
    Qtd_Depoimentos: 3,
    CNJs_Como_Testemunha: `${validCNJs[0]}; ${validCNJs[2]}; ${validCNJs[6]}`,
    Ja_Foi_Reclamante: true,
    CNJs_Como_Reclamante: validCNJs[7],
    Foi_Testemunha_Ativo: true,
    Foi_Testemunha_Passivo: true,
    CNJs_Passivo: validCNJs[8],
    Foi_Ambos_Polos: true,
    Participou_Troca_Favor: false,
    CNJs_Troca_Favor: '—',
    Participou_Triangulacao: false,
    CNJs_Triangulacao: '—',
    E_Prova_Emprestada: false,
    Classificacao: 'MÉDIA',
    Classificacao_Estrategica: 'ATENÇÃO'
  },
  {
    Nome_Testemunha: 'Carlos Costa',
    Qtd_Depoimentos: 1,
    CNJs_Como_Testemunha: validCNJs[1],
    Ja_Foi_Reclamante: false,
    CNJs_Como_Reclamante: '—',
    Foi_Testemunha_Ativo: true,
    Foi_Testemunha_Passivo: false,
    CNJs_Passivo: '—',
    Foi_Ambos_Polos: false,
    Participou_Troca_Favor: false,
    CNJs_Troca_Favor: '—',
    Participou_Triangulacao: false,
    CNJs_Triangulacao: '—',
    E_Prova_Emprestada: false,
    Classificacao: 'BAIXA',
    Classificacao_Estrategica: 'NORMAL'
  }
];

// ===== DICTIONARY FIELDS =====

export const canonicalDicionarioFields: DicionarioField[] = [
  // Por Processo - Obrigatórios
  {
    Aba: 'Por Processo',
    Campo: 'CNJ',
    Tipo: 'texto',
    Obrigatorio: 'Sim',
    Regra: 'String com 20 dígitos (preserva formato original). Validação interna remove pontuação.',
    Exemplo: validCNJs[0]
  },
  {
    Aba: 'Por Processo',
    Campo: 'reclamante_nome',
    Tipo: 'texto',
    Obrigatorio: 'Sim (legado)',
    Regra: 'Nome principal do reclamante (campo de compatibilidade)',
    Exemplo: 'Ana Lima'
  },
  {
    Aba: 'Por Processo',
    Campo: 'reu_nome',
    Tipo: 'texto',
    Obrigatorio: 'Sim (legado)',
    Regra: 'Nome do réu/empresa (campo de compatibilidade)',
    Exemplo: 'Empresa XYZ Ltda'
  },
  {
    Aba: 'Por Processo',
    Campo: 'Status',
    Tipo: 'texto',
    Obrigatorio: 'Não',
    Regra: 'Status atual do processo',
    Exemplo: 'Em andamento'
  },
  {
    Aba: 'Por Processo',
    Campo: 'Fase',
    Tipo: 'texto',
    Obrigatorio: 'Não',
    Regra: 'Fase processual atual',
    Exemplo: 'Instrução'
  },
  {
    Aba: 'Por Processo',
    Campo: 'UF',
    Tipo: 'texto',
    Obrigatorio: 'Sim',
    Regra: 'Sigla de 2 letras do estado',
    Exemplo: 'SP'
  },
  {
    Aba: 'Por Processo',
    Campo: 'Comarca',
    Tipo: 'texto',
    Obrigatorio: 'Sim',
    Regra: 'Nome da comarca',
    Exemplo: 'São Paulo'
  },
  {
    Aba: 'Por Processo',
    Campo: 'Reclamantes',
    Tipo: 'lista',
    Obrigatorio: 'Sim',
    Regra: 'Lista separada por ; (ponto e vírgula). Não usar []',
    Exemplo: 'Ana Lima; Pedro Santos'
  },
  {
    Aba: 'Por Processo',
    Campo: 'Advogados_Ativo',
    Tipo: 'lista',
    Obrigatorio: 'Sim',
    Regra: 'Lista separada por ; (primeiro é principal na UI)',
    Exemplo: 'Dr. Xavier Silva; Dra. Yasmim Oliveira'
  },
  {
    Aba: 'Por Processo',
    Campo: 'Testemunhas_Ativo',
    Tipo: 'lista',
    Obrigatorio: 'Não',
    Regra: 'Lista separada por ; ou — se vazio',
    Exemplo: 'João Pereira; Carlos Costa'
  },
  {
    Aba: 'Por Processo',
    Campo: 'Testemunhas_Passivo',
    Tipo: 'lista',
    Obrigatorio: 'Não',
    Regra: 'Lista separada por ; ou — se vazio',
    Exemplo: 'Ana Silva'
  },
  {
    Aba: 'Por Processo',
    Campo: 'Todas_Testemunhas',
    Tipo: 'lista',
    Obrigatorio: 'Sim',
    Regra: 'União de todas as testemunhas, separadas por ;',
    Exemplo: 'João Pereira; Beatriz Nunes; Carlos Costa'
  },
  {
    Aba: 'Por Processo',
    Campo: 'Reclamante_Foi_Testemunha',
    Tipo: 'boolean',
    Obrigatorio: 'Não',
    Regra: 'true/false',
    Exemplo: 'true'
  },
  {
    Aba: 'Por Processo',
    Campo: 'Qtd_Reclamante_Testemunha',
    Tipo: 'número',
    Obrigatorio: 'Não',
    Regra: 'Quantidade de vezes que reclamante foi testemunha',
    Exemplo: '1'
  },
  {
    Aba: 'Por Processo',
    Campo: 'CNJs_Reclamante_Testemunha',
    Tipo: 'lista',
    Obrigatorio: 'Não',
    Regra: 'Lista de CNJs separados por ; ou — se vazio',
    Exemplo: `${validCNJs[9]}`
  },
  {
    Aba: 'Por Processo',
    Campo: 'Reclamante_Testemunha_Polo_Passivo',
    Tipo: 'boolean',
    Obrigatorio: 'Não',
    Regra: 'true/false',
    Exemplo: 'false'
  },
  {
    Aba: 'Por Processo',
    Campo: 'CNJs_Passivo',
    Tipo: 'lista',
    Obrigatorio: 'Não',
    Regra: 'CNJs onde reclamante foi testemunha do polo passivo',
    Exemplo: '—'
  },
  {
    Aba: 'Por Processo',
    Campo: 'Triangulacao_Confirmada',
    Tipo: 'boolean',
    Obrigatorio: 'Não',
    Regra: 'true/false',
    Exemplo: 'true'
  },
  {
    Aba: 'Por Processo',
    Campo: 'Desenho_Triangulacao',
    Tipo: 'texto',
    Obrigatorio: 'Não',
    Regra: 'Padrão da triangulação (A→B→C→A) ou — se não houver',
    Exemplo: 'A→B→C→A'
  },
  {
    Aba: 'Por Processo',
    Campo: 'CNJs_Triangulacao',
    Tipo: 'lista',
    Obrigatorio: 'Não',
    Regra: 'CNJs envolvidos na triangulação, separados por ;',
    Exemplo: `${validCNJs[1]}; ${validCNJs[2]}; ${validCNJs[3]}`
  },
  {
    Aba: 'Por Processo',
    Campo: 'Contem_Prova_Emprestada',
    Tipo: 'boolean',
    Obrigatorio: 'Não',
    Regra: 'true/false',
    Exemplo: 'true'
  },
  {
    Aba: 'Por Processo',
    Campo: 'Testemunhas_Prova_Emprestada',
    Tipo: 'lista',
    Obrigatorio: 'Não',
    Regra: 'Nomes das testemunhas de prova emprestada, separados por ;',
    Exemplo: 'João Pereira'
  },
  {
    Aba: 'Por Processo',
    Campo: 'Classificacao_Final',
    Tipo: 'texto',
    Obrigatorio: 'Não',
    Regra: 'Classificação de risco (Risco Alto, Risco Médio, Risco Baixo)',
    Exemplo: 'Risco Alto'
  },
  {
    Aba: 'Por Processo',
    Campo: 'Insight_Estrategico',
    Tipo: 'texto',
    Obrigatorio: 'Não',
    Regra: 'Resumo dos principais achados',
    Exemplo: 'Triangulação + prova emprestada'
  },

  // Por Testemunha - Obrigatórios
  {
    Aba: 'Por Testemunha',
    Campo: 'Nome_Testemunha',
    Tipo: 'texto',
    Obrigatorio: 'Sim',
    Regra: 'Nome completo da testemunha',
    Exemplo: 'João Pereira'
  },
  {
    Aba: 'Por Testemunha',
    Campo: 'Qtd_Depoimentos',
    Tipo: 'número',
    Obrigatorio: 'Sim',
    Regra: 'Quantidade total de depoimentos',
    Exemplo: '12'
  },
  {
    Aba: 'Por Testemunha',
    Campo: 'CNJs_Como_Testemunha',
    Tipo: 'lista',
    Obrigatorio: 'Sim',
    Regra: 'Lista de CNJs separados por ;',
    Exemplo: `${validCNJs[0]}; ${validCNJs[9]}`
  },
  {
    Aba: 'Por Testemunha',
    Campo: 'Ja_Foi_Reclamante',
    Tipo: 'boolean',
    Obrigatorio: 'Não',
    Regra: 'true/false',
    Exemplo: 'false'
  },
  {
    Aba: 'Por Testemunha',
    Campo: 'CNJs_Como_Reclamante',
    Tipo: 'lista',
    Obrigatorio: 'Não',
    Regra: 'CNJs onde foi reclamante, separados por ; ou — se vazio',
    Exemplo: '—'
  },
  {
    Aba: 'Por Testemunha',
    Campo: 'Foi_Testemunha_Ativo',
    Tipo: 'boolean',
    Obrigatorio: 'Não',
    Regra: 'true/false',
    Exemplo: 'true'
  },
  {
    Aba: 'Por Testemunha',
    Campo: 'Foi_Testemunha_Passivo',
    Tipo: 'boolean',
    Obrigatorio: 'Não',
    Regra: 'true/false',
    Exemplo: 'false'
  },
  {
    Aba: 'Por Testemunha',
    Campo: 'CNJs_Passivo',
    Tipo: 'lista',
    Obrigatorio: 'Não',
    Regra: 'CNJs onde foi testemunha do polo passivo',
    Exemplo: '—'
  },
  {
    Aba: 'Por Testemunha',
    Campo: 'Foi_Ambos_Polos',
    Tipo: 'boolean',
    Obrigatorio: 'Não',
    Regra: 'true/false',
    Exemplo: 'false'
  },
  {
    Aba: 'Por Testemunha',
    Campo: 'Participou_Troca_Favor',
    Tipo: 'boolean',
    Obrigatorio: 'Não',
    Regra: 'true/false',
    Exemplo: 'true'
  },
  {
    Aba: 'Por Testemunha',
    Campo: 'CNJs_Troca_Favor',
    Tipo: 'lista',
    Obrigatorio: 'Não',
    Regra: 'Padrão CNJ_A↔CNJ_B ou lista separada por ;',
    Exemplo: `${validCNJs[4]}↔${validCNJs[5]}`
  },
  {
    Aba: 'Por Testemunha',
    Campo: 'Participou_Triangulacao',
    Tipo: 'boolean',
    Obrigatorio: 'Não',
    Regra: 'true/false',
    Exemplo: 'true'
  },
  {
    Aba: 'Por Testemunha',
    Campo: 'CNJs_Triangulacao',
    Tipo: 'lista',
    Obrigatorio: 'Não',
    Regra: 'CNJs da triangulação, separados por ;',
    Exemplo: `${validCNJs[1]}; ${validCNJs[2]}; ${validCNJs[3]}`
  },
  {
    Aba: 'Por Testemunha',
    Campo: 'E_Prova_Emprestada',
    Tipo: 'boolean',
    Obrigatorio: 'Não',
    Regra: 'true/false',
    Exemplo: 'true'
  },
  {
    Aba: 'Por Testemunha',
    Campo: 'Classificacao',
    Tipo: 'texto',
    Obrigatorio: 'Não',
    Regra: 'ALTA, MÉDIA, BAIXA',
    Exemplo: 'ALTA'
  },
  {
    Aba: 'Por Testemunha',
    Campo: 'Classificacao_Estrategica',
    Tipo: 'texto',
    Obrigatorio: 'Não',
    Regra: 'CRÍTICO, ATENÇÃO, NORMAL',
    Exemplo: 'CRÍTICO'
  }
];