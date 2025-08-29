export interface ProcessoSample {
  cnj: string;
  uf: string;
  comarca: string;
  reclamante_nome: string;
  reu_nome: string;
  advogados_ativo: string;
  todas_testemunhas: string;
  fase?: string;
  status?: string;
  data_audiencia?: string;
  observacoes?: string;
}

export interface TestemunhaSample {
  nome_testemunha: string;
  qtd_depoimentos: number;
  cnjs_como_testemunha: string;
  reclamante_nome?: string;
  reu_nome?: string;
}

export interface DicionarioField {
  Aba: string;
  Campo: string;
  Tipo: string;
  Obrigatorio: string;
  Regra: string;
  Exemplo: string;
}

// Import the CNJ generator with valid check digits
import { generateSequentialCNJs } from '../cnj-generator';

// Gerar CNJs sequenciais com dígitos verificadores corretos
const correctCNJs = generateSequentialCNJs(10, 2024);

export const processoSamples: ProcessoSample[] = [
  {
    cnj: correctCNJs[0],
    uf: 'SP',
    comarca: 'São Paulo',
    reclamante_nome: 'João Silva Santos',
    reu_nome: 'Empresa ABC Ltda',
    advogados_ativo: 'Dr. Carlos Advocacia; Dra. Ana Jurídica',
    todas_testemunhas: 'Roberto Silva Mendes; Luciana Gomes Oliveira',
    fase: 'Conhecimento',
    status: 'Em andamento',
    data_audiencia: '2024-09-15',
    observacoes: 'Ação trabalhista por rescisão indireta'
  },
  {
    cnj: correctCNJs[1],
    uf: 'SP',
    comarca: 'São Paulo',
    reclamante_nome: 'Maria Oliveira Costa',
    reu_nome: 'Indústria XYZ S/A',
    advogados_ativo: 'Escritório Silva & Associados',
    todas_testemunhas: 'Marcos Antônio Lima; Patricia Costa Santos',
    fase: 'Execução',
    status: 'Arquivado',
    data_audiencia: '2024-08-20',
    observacoes: 'Processo executório de verbas rescisórias'
  },
  {
    cnj: correctCNJs[2],
    uf: 'SP',
    comarca: 'Santos',
    reclamante_nome: 'Pedro Almeida Lima',
    reu_nome: 'Comércio DEF ME',
    advogados_ativo: 'Dra. Fernanda Legal',
    todas_testemunhas: 'Roberto Silva Mendes',
    fase: 'Conhecimento',
    status: 'Sentenciado',
    observacoes: 'Ação de cobrança de horas extras'
  },
  {
    cnj: correctCNJs[3],
    uf: 'SP',
    comarca: 'Campinas',
    reclamante_nome: 'Ana Paula Ferreira',
    reu_nome: 'Tech Solutions Ltda',
    advogados_ativo: 'Dr. Pedro Trabalhista; Sociedade de Advogados XYZ',
    todas_testemunhas: 'Luciana Gomes Oliveira; Patricia Costa Santos',
    fase: 'Recurso',
    status: 'Em andamento',
    data_audiencia: '2024-10-05',
    observacoes: 'Recurso ordinário - adicional de insalubridade'
  },
  {
    cnj: correctCNJs[4],
    uf: 'SP',
    comarca: 'São Paulo',
    reclamante_nome: 'Carlos Eduardo Souza',
    reu_nome: 'Logística GHI S/A',
    advogados_ativo: 'Advocacia Corporativa Ltda',
    todas_testemunhas: 'Marcos Antônio Lima',
    fase: 'Conhecimento',
    status: 'Conciliado',
    observacoes: 'Acordo homologado em audiência'
  }
];

// Usar CNJs dos processos para as testemunhas
const cnjPool = processoSamples.map(p => p.cnj);

export const testemunhaSamples: TestemunhaSample[] = [
  {
    nome_testemunha: 'Roberto Silva Mendes',
    qtd_depoimentos: 3,
    cnjs_como_testemunha: `['${cnjPool[0]}','${cnjPool[1]}','${cnjPool[2]}']`, // JSON-like
    reclamante_nome: '', // Será preenchido via join
    reu_nome: '' // Pode ser auto-preenchido
  },
  {
    nome_testemunha: 'Luciana Gomes Oliveira',
    qtd_depoimentos: 2,
    cnjs_como_testemunha: `${cnjPool[1]}; ${cnjPool[3]}`, // Separado por ;
    reclamante_nome: '',
    reu_nome: ''
  },
  {
    nome_testemunha: 'Marcos Antônio Lima',
    qtd_depoimentos: 2,
    cnjs_como_testemunha: `${cnjPool[1]}, ${cnjPool[4]}`, // Separado por ,
    reclamante_nome: '',
    reu_nome: ''
  },
  {
    nome_testemunha: 'Patricia Costa Santos',
    qtd_depoimentos: 3,
    cnjs_como_testemunha: `["${cnjPool[0]}","${cnjPool[3]}","${cnjPool[4]}"]`, // JSON com aspas duplas
    reclamante_nome: '',
    reu_nome: ''
  }
];

export const dicionarioFields: DicionarioField[] = [
  // Campos obrigatórios Por Processo
  {
    Aba: 'Por Processo',
    Campo: 'cnj',
    Tipo: 'texto (com máscara)',
    Obrigatorio: 'Sim',
    Regra: 'Exatamente 20 dígitos após remover pontuação. Dígitos verificadores devem ser válidos',
    Exemplo: correctCNJs[0]
  },
  {
    Aba: 'Por Processo',
    Campo: 'uf',
    Tipo: 'texto',
    Obrigatorio: 'Sim',
    Regra: 'Unidade Federativa (sigla de 2 letras). Ex: SP, RJ, MG',
    Exemplo: 'SP'
  },
  {
    Aba: 'Por Processo',
    Campo: 'comarca',
    Tipo: 'texto',
    Obrigatorio: 'Sim',
    Regra: 'Nome da comarca onde tramita o processo',
    Exemplo: 'São Paulo'
  },
  {
    Aba: 'Por Processo',
    Campo: 'reclamante_nome',
    Tipo: 'texto',
    Obrigatorio: 'Sim',
    Regra: 'Nome completo do reclamante. Não pode estar vazio ou conter apenas espaços',
    Exemplo: 'João Silva Santos'
  },
  {
    Aba: 'Por Processo',
    Campo: 'reu_nome',
    Tipo: 'texto',
    Obrigatorio: 'Sim',
    Regra: 'Nome da empresa ou pessoa ré. Não pode estar vazio ou conter apenas espaços',
    Exemplo: 'Empresa ABC Ltda'
  },
  {
    Aba: 'Por Processo',
    Campo: 'advogados_ativo',
    Tipo: 'lista (string)',
    Obrigatorio: 'Sim',
    Regra: 'Lista de advogados do polo ativo. Mínimo 1. Aceita separação por ; ou ,',
    Exemplo: 'Dr. Carlos Advocacia; Dra. Ana Jurídica'
  },
  {
    Aba: 'Por Processo',
    Campo: 'todas_testemunhas',
    Tipo: 'lista (string)',
    Obrigatorio: 'Sim',
    Regra: 'Lista de todas as testemunhas do processo. Mínimo 1. Aceita separação por ; ou ,',
    Exemplo: 'Roberto Silva; Luciana Gomes; Marcos Lima'
  },
  // Campos opcionais Por Processo
  {
    Aba: 'Por Processo',
    Campo: 'fase',
    Tipo: 'texto',
    Obrigatorio: 'Não',
    Regra: 'Fase atual do processo (Conhecimento, Execução, Recurso, etc.)',
    Exemplo: 'Conhecimento'
  },
  {
    Aba: 'Por Processo',
    Campo: 'status',
    Tipo: 'texto',
    Obrigatorio: 'Não',
    Regra: 'Status atual do processo',
    Exemplo: 'Em andamento'
  },
  {
    Aba: 'Por Processo',
    Campo: 'data_audiencia',
    Tipo: 'data',
    Obrigatorio: 'Não',
    Regra: 'Data da próxima audiência (formato YYYY-MM-DD ou DD/MM/YYYY)',
    Exemplo: '2024-09-15'
  },
  {
    Aba: 'Por Processo',
    Campo: 'observacoes',
    Tipo: 'texto longo',
    Obrigatorio: 'Não',
    Regra: 'Observações gerais sobre o processo',
    Exemplo: 'Ação trabalhista por rescisão indireta'
  },
  // Campos obrigatórios Por Testemunha
  {
    Aba: 'Por Testemunha',
    Campo: 'nome_testemunha',
    Tipo: 'texto',
    Obrigatorio: 'Sim',
    Regra: 'Nome completo da testemunha. Não pode estar vazio ou conter apenas espaços',
    Exemplo: 'Roberto Silva Mendes'
  },
  {
    Aba: 'Por Testemunha',
    Campo: 'qtd_depoimentos',
    Tipo: 'número',
    Obrigatorio: 'Sim',
    Regra: 'Quantidade de depoimentos prestados pela testemunha. Deve ser maior que 0',
    Exemplo: '3'
  },
  {
    Aba: 'Por Testemunha',
    Campo: 'cnjs_como_testemunha',
    Tipo: 'lista (string)',
    Obrigatorio: 'Sim',
    Regra: 'Lista de CNJs onde atuou como testemunha. Mínimo 1. Aceita formatos: JSON-like, separado por ; ou ,',
    Exemplo: `['${correctCNJs[0]}','${correctCNJs[1]}']`
  },
  // Campos opcionais Por Testemunha
  {
    Aba: 'Por Testemunha',
    Campo: 'reclamante_nome',
    Tipo: 'texto',
    Obrigatorio: 'Não',
    Regra: 'Nome do reclamante (será preenchido automaticamente via join com processos)',
    Exemplo: 'João Silva Santos'
  },
  {
    Aba: 'Por Testemunha',
    Campo: 'reu_nome',
    Tipo: 'texto',
    Obrigatorio: 'Não',
    Regra: 'Nome do réu (será preenchido automaticamente via join com processos)',
    Exemplo: 'Empresa ABC Ltda'
  }
];