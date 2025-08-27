import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

// Import XLSX for Deno
import * as XLSX from 'https://cdn.skypack.dev/xlsx'

interface ProcessoSample {
  CNJ: string;
  Reclamante_Limpo: string;
  Reu_Nome: string;
  UF?: string;
  Comarca?: string;
  Fase?: string;
  Status?: string;
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

// Gerar CNJ sintético no formato correto
function genCNJ(): string {
  const ano = 2018 + Math.floor(Math.random() * 8); // 2018-2025
  const sequencial = String(Math.floor(Math.random() * 999999)).padStart(7, '0');
  const dv = String(Math.floor(Math.random() * 100)).padStart(2, '0');
  const justica = '5'; // Justiça do Trabalho
  const tribunal = String(Math.floor(Math.random() * 24) + 1).padStart(2, '0');
  const origem = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
  
  return `${sequencial.substring(0, 7)}-${dv}.${ano}.${justica}.${tribunal}.${origem}`;
}

const processoSamples: ProcessoSample[] = [
  {
    CNJ: genCNJ(),
    Reclamante_Limpo: 'Maria Santos Silva',
    Reu_Nome: 'Empresa Alpha Ltda',
    UF: 'SP',
    Comarca: 'São Paulo',
    Fase: 'Conhecimento',
    Status: 'Em andamento'
  },
  {
    CNJ: genCNJ(),
    Reclamante_Limpo: 'João Pereira Costa',
    Reu_Nome: 'Beta Indústria S.A.',
    UF: 'RJ',
    Comarca: 'Rio de Janeiro',
    Fase: 'Execução',
    Status: 'Arquivado'
  },
  {
    CNJ: genCNJ(),
    Reclamante_Limpo: 'Ana Oliveira Lima',
    Reu_Nome: 'Gamma Serviços ME',
    UF: 'MG',
    Comarca: 'Belo Horizonte',
    Fase: 'Recurso',
    Status: 'Julgado'
  },
  {
    CNJ: genCNJ(),
    Reclamante_Limpo: 'Carlos Eduardo Souza',
    Reu_Nome: 'Delta Tech Solutions',
    UF: 'SP',
    Comarca: 'Campinas',
    Fase: 'Conhecimento',
    Status: 'Conciliado'
  },
  {
    CNJ: genCNJ(),
    Reclamante_Limpo: 'Fernanda Ribeiro Dias',
    Reu_Nome: 'Epsilon Logística S.A.',
    UF: 'SP',
    Comarca: 'Santos',
    Fase: 'Execução',
    Status: 'Suspenso'
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
    Regra: '20 dígitos após remover pontuações',
    Exemplo: '0012345-67.2024.5.02.0001'
  },
  {
    Aba: 'Por Processo',
    Campo: 'Reclamante_Limpo',
    Tipo: 'texto',
    Obrigatorio: 'Sim',
    Regra: 'Nome do reclamante',
    Exemplo: 'Ana Lima'
  },
  {
    Aba: 'Por Processo',
    Campo: 'Reu_Nome',
    Tipo: 'texto',
    Obrigatorio: 'Sim',
    Regra: 'Nome da empresa/ré',
    Exemplo: 'Empresa X S.A.'
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
    Campo: 'CNJs_Como_Testemunha',
    Tipo: 'lista (string)',
    Obrigatorio: 'Sim',
    Regra: 'Aceita JSON-like, ; ou ,',
    Exemplo: "['0000000-00.2024.5.02.0001','0000000-00.2024.5.02.0002']"
  },
  {
    Aba: 'Por Testemunha',
    Campo: 'Reclamante_Nome',
    Tipo: 'texto',
    Obrigatorio: 'Opcional',
    Regra: 'Join automático pela aba Por Processo',
    Exemplo: '(vazio)'
  },
  {
    Aba: 'Por Testemunha',
    Campo: 'Reu_Nome',
    Tipo: 'texto',
    Obrigatorio: 'Opcional',
    Regra: 'Pode ser auto-preenchido pelo "Réu padrão"',
    Exemplo: '(vazio)'
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
        'Content-Disposition': 'attachment; filename="template-hubjuria.xlsx"',
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