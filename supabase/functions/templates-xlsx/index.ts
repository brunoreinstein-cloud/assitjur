import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

// Import XLSX for Deno - using ESM.sh for better compatibility
import * as XLSX from 'https://esm.sh/xlsx@0.18.5'

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

// Wrapper for backward compatibility
function genCNJ(): string {
  return generateValidCNJ();
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
    const buffer = buildTemplateXlsx()
    
    return new Response(buffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="template-assistjur.xlsx"',
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