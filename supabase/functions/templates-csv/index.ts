import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

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

function buildCsv(sheetName: string): string {
  let data: any[] = [];
  
  switch (sheetName) {
    case 'Por Processo':
      data = processoSamples;
      break;
    case 'Por Testemunha':
      data = testemunhaSamples;
      break;
    case 'Dicionario':
      data = dicionarioFields;
      break;
    default:
      throw new Error(`Sheet "${sheetName}" não encontrada`);
  }

  if (data.length === 0) {
    throw new Error(`Nenhum dado encontrado para a aba "${sheetName}"`);
  }

  // Obter headers
  const headers = Object.keys(data[0]);
  
  // Função para escapar valores CSV
  const escapeCsvValue = (value: any): string => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    // Se contém separador, quebra de linha ou aspas, envolver em aspas duplas
    if (str.includes(';') || str.includes('\n') || str.includes('"')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Construir CSV
  const lines: string[] = [];
  
  // Header
  lines.push(headers.map(h => escapeCsvValue(h)).join(';'));
  
  // Dados
  data.forEach(row => {
    const values = headers.map(header => escapeCsvValue(row[header]));
    lines.push(values.join(';'));
  });

  return lines.join('\n');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const sheet = url.searchParams.get('sheet')
    
    if (!sheet) {
      return new Response(
        JSON.stringify({ error: 'Parâmetro "sheet" é obrigatório' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const validSheets = ['Por Processo', 'Por Testemunha', 'Dicionario'];
    if (!validSheets.includes(sheet)) {
      return new Response(
        JSON.stringify({ error: `Aba "${sheet}" inválida. Use: ${validSheets.join(', ')}` }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const csvContent = buildCsv(sheet)
    const filename = `template-${sheet.toLowerCase().replace(/\s+/g, '-')}.csv`
    
    return new Response(csvContent, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error('Erro ao gerar template CSV:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro interno do servidor' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})