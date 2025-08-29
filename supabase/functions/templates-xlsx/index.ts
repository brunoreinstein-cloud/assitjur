import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

// Import XLSX for Deno - using ESM.sh for better compatibility
import * as XLSX from 'https://esm.sh/xlsx@0.18.5'

// Generate valid CNJ with correct check digits
function generateValidCNJ(sequential?: number): string {
  const seq = sequential || Math.floor(Math.random() * 9999999) + 1000000;
  const year = 2024;
  const justice = '5'; // Justiça do Trabalho
  const tribunal = '02'; // TRT 2ª Região
  const origin = String(1000 + (seq - 1000000)).padStart(4, '0');
  const sequentialStr = String(seq).padStart(7, '0');
  
  // Build CNJ without check digits: NNNNNNN + AAAA + J + TR + OOOO
  const cnjWithoutCheckDigits = sequentialStr + year + justice + tribunal + origin;
  
  // Calculate check digits using official algorithm
  const weights = [2, 3, 4, 5, 6, 7, 8, 9, 2, 3, 4, 5, 6, 7, 8, 9, 2, 3];
  let sum = 0;
  
  const digits = cnjWithoutCheckDigits.split('').map(Number);
  for (let i = 0; i < digits.length; i++) {
    sum += digits[i] * weights[i];
  }
  
  const remainder = sum % 97;
  const checkDigits = (98 - remainder).toString().padStart(2, '0');
  
  return `${sequentialStr}-${checkDigits}.${year}.${justice}.${tribunal}.${origin}`;
}

// Generate valid CNJs for examples
const validCNJs = [
  generateValidCNJ(1000000),
  generateValidCNJ(1000001), 
  generateValidCNJ(1000002),
  generateValidCNJ(1000003),
  generateValidCNJ(1000004),
  generateValidCNJ(1000005),
  generateValidCNJ(1000006),
  generateValidCNJ(1000007),
  generateValidCNJ(1000008),
  generateValidCNJ(1000009),
  generateValidCNJ(1000010),
  generateValidCNJ(1000011)
];

// Canonical sample data - inlined for edge function
const canonicalProcessoSamples = [
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

const canonicalTestemunhaSamples = [
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

const canonicalDicionarioFields = [
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
    Campo: 'UF',
    Tipo: 'texto',
    Obrigatorio: 'Sim',
    Regra: 'Sigla de 2 letras do estado',
    Exemplo: 'SP'
  },
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
  }
];

/**
 * Build canonical XLSX template using the standardized format
 */
function buildCanonicalXlsx(): Uint8Array {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Por Processo with canonical data
  const processoWs = XLSX.utils.json_to_sheet(canonicalProcessoSamples);
  XLSX.utils.book_append_sheet(wb, processoWs, 'Por Processo');

  // Sheet 2: Por Testemunha with canonical data
  const testemunhaWs = XLSX.utils.json_to_sheet(canonicalTestemunhaSamples);
  XLSX.utils.book_append_sheet(wb, testemunhaWs, 'Por Testemunha');

  // Sheet 3: Dicionario with canonical field definitions
  const dicionarioWs = XLSX.utils.json_to_sheet(canonicalDicionarioFields);
  XLSX.utils.book_append_sheet(wb, dicionarioWs, 'Dicionario');

  // Generate buffer with compression
  return XLSX.write(wb, { 
    type: 'array', 
    bookType: 'xlsx',
    compression: true 
  });
}

interface ProcessoSample {
  CNJ: string;
  Reclamante_Limpo: string;
  Reu_Nome: string;
}

interface TestemunhaSample {
  Nome_Testemunha: string;
  CNJs_Como_Testemunha: string;
  Reclamante_Nome?: string;
  Reu_Nome?: string;
}

interface DicionarioField {
  Aba: string;
  Campo: string;
  Tipo: string;
  Obrigatorio: string;
  Regra: string;
  Exemplo: string;
}

const processoSamples: ProcessoSample[] = [
  {
    CNJ: generateValidCNJ(1000000),
    Reclamante_Limpo: 'João Silva Santos',
    Reu_Nome: 'Empresa ABC Ltda'
  },
  {
    CNJ: generateValidCNJ(1000001),
    Reclamante_Limpo: 'Maria Oliveira Costa',
    Reu_Nome: 'Indústria XYZ S/A'
  },
  {
    CNJ: generateValidCNJ(1000002),
    Reclamante_Limpo: 'Pedro Almeida Lima',
    Reu_Nome: 'Comércio DEF ME'
  },
  {
    CNJ: generateValidCNJ(1000003),
    Reclamante_Limpo: 'Ana Paula Ferreira',
    Reu_Nome: 'Tech Solutions Ltda'
  },
  {
    CNJ: generateValidCNJ(1000004),
    Reclamante_Limpo: 'Carlos Eduardo Souza',
    Reu_Nome: 'Logística GHI S/A'
  },
  {
    CNJ: generateValidCNJ(1000005),
    Reclamante_Limpo: 'Luciana Ribeiro Dias',
    Reu_Nome: 'Metalúrgica JKL Ltda'
  },
  {
    CNJ: generateValidCNJ(1000006),
    Reclamante_Limpo: 'Roberto Carlos Mendes',
    Reu_Nome: 'Serviços MNO Ltda'
  },
  {
    CNJ: generateValidCNJ(1000007),
    Reclamante_Limpo: 'Fernanda Lima Santos',
    Reu_Nome: 'Construção PQR S/A'
  },
  {
    CNJ: generateValidCNJ(1000008),
    Reclamante_Limpo: 'Marcos Antônio Silva',
    Reu_Nome: 'Alimentação STU Ltda'
  },
  {
    CNJ: generateValidCNJ(1000009),
    Reclamante_Limpo: 'Patrícia Gomes Oliveira',
    Reu_Nome: 'Transporte VWX ME'
  }
];

// Usar CNJs dos processos para as testemunhas
const cnjPool = processoSamples.map(p => p.CNJ);

const testemunhaSamples: TestemunhaSample[] = [
  {
    Nome_Testemunha: 'Roberto Silva Mendes',
    CNJs_Como_Testemunha: `['${cnjPool[0]}','${cnjPool[1]}']`, // JSON-like
    Reclamante_Nome: '', // Será preenchido via join
    Reu_Nome: '' // Pode ser auto-preenchido
  },
  {
    Nome_Testemunha: 'Luciana Gomes Oliveira',
    CNJs_Como_Testemunha: `${cnjPool[2]}; ${cnjPool[3]}`, // Separado por ;
    Reclamante_Nome: '',
    Reu_Nome: ''
  },
  {
    Nome_Testemunha: 'Marcos Antônio Lima',
    CNJs_Como_Testemunha: `${cnjPool[1]}, ${cnjPool[4]}`, // Separado por ,
    Reclamante_Nome: '',
    Reu_Nome: ''
  },
  {
    Nome_Testemunha: 'Patricia Costa Santos',
    CNJs_Como_Testemunha: `["${cnjPool[0]}","${cnjPool[3]}","${cnjPool[4]}"]`, // JSON com aspas duplas
    Reclamante_Nome: '',
    Reu_Nome: ''
  }
];

const dicionarioFields: DicionarioField[] = [
  {
    Aba: 'Por Processo',
    Campo: 'CNJ',
    Tipo: 'texto (com máscara)',
    Obrigatorio: 'Sim',
    Regra: 'Exatamente 20 dígitos após remover pontuação. Dígitos verificadores devem ser válidos',
    Exemplo: generateValidCNJ(1000000)
  },
  {
    Aba: 'Por Processo',
    Campo: 'Reclamante_Limpo',
    Tipo: 'texto',
    Obrigatorio: 'Sim',
    Regra: 'Nome completo do reclamante. Não pode estar vazio ou conter apenas espaços',
    Exemplo: 'João Silva Santos'
  },
  {
    Aba: 'Por Processo',
    Campo: 'Reu_Nome',
    Tipo: 'texto',
    Obrigatorio: 'Sim',
    Regra: 'Nome da empresa ou pessoa ré. Não pode estar vazio ou conter apenas espaços',
    Exemplo: 'Empresa ABC Ltda'
  },
  {
    Aba: 'Por Testemunha',
    Campo: 'Nome_Testemunha',
    Tipo: 'texto',
    Obrigatorio: 'Sim',
    Regra: 'Nome completo da testemunha. Não pode estar vazio ou conter apenas espaços',
    Exemplo: 'Roberto Silva Mendes'
  },
  {
    Aba: 'Por Testemunha',
    Campo: 'CNJs_Como_Testemunha',
    Tipo: 'lista (string)',
    Obrigatorio: 'Sim',
    Regra: 'Lista de CNJs onde atuou como testemunha. Aceita formatos: JSON-like, separado por ; ou ,',
    Exemplo: `['${generateValidCNJ(1000000)}','${generateValidCNJ(1000001)}']`
  }
];

function buildTemplateXlsx(): Uint8Array {
  // Criar workbook
  const wb = XLSX.utils.book_new();

  // Aba "Por Processo"
  const processoWs = XLSX.utils.json_to_sheet(processoSamples);
  XLSX.utils.book_append_sheet(wb, processoWs, 'Por Processo');

  // Aba "Por Testemunha"
  const testemunhaWs = XLSX.utils.json_to_sheet(testemunhaSamples);
  XLSX.utils.book_append_sheet(wb, testemunhaWs, 'Por Testemunha');

  // Aba "Dicionario"
  const dicionarioWs = XLSX.utils.json_to_sheet(dicionarioFields);
  XLSX.utils.book_append_sheet(wb, dicionarioWs, 'Dicionario');

  // Gerar buffer
  return XLSX.write(wb, { 
    type: 'array', 
    bookType: 'xlsx',
    compression: true 
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const buffer = buildCanonicalXlsx()
    
    return new Response(buffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="AssistJurIA_Template.xlsx"',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error('Erro ao gerar template XLSX:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})