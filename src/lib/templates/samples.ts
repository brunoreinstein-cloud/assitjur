export interface ProcessoSample {
  CNJ: string;
  Reclamante_Limpo: string;
  Reu_Nome: string;
  UF?: string;
  Comarca?: string;
  Fase?: string;
  Status?: string;
}

export interface TestemunhaSample {
  Nome_Testemunha: string;
  CNJs_Como_Testemunha: string;
  Reclamante_Nome?: string;
  Reu_Nome?: string;
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
import { generateValidCNJ } from '../cnj-generator';

// Gerar CNJ sintético no formato correto com dígitos verificadores válidos
export function genCNJ(): string {
  return generateValidCNJ();
}

export const processoSamples: ProcessoSample[] = [
  {
    CNJ: '1000000-09.2024.5.02.1000',
    Reclamante_Limpo: 'João Silva Santos',
    Reu_Nome: 'Empresa ABC Ltda',
    UF: 'SP',
    Comarca: 'São Paulo',
    Fase: 'Conhecimento',
    Status: 'Em andamento'
  },
  {
    CNJ: '1000001-58.2024.5.02.1001',
    Reclamante_Limpo: 'Maria Oliveira Costa',
    Reu_Nome: 'Indústria XYZ S/A',
    UF: 'SP',
    Comarca: 'São Paulo',
    Fase: 'Execução',
    Status: 'Arquivado'
  },
  {
    CNJ: '1000002-06.2024.5.02.1002',
    Reclamante_Limpo: 'Pedro Almeida Lima',
    Reu_Nome: 'Comércio DEF ME',
    UF: 'SP',
    Comarca: 'Santos',
    Fase: 'Conhecimento',
    Status: 'Sentenciado'
  },
  {
    CNJ: '1000003-55.2024.5.02.1003',
    Reclamante_Limpo: 'Ana Paula Ferreira',
    Reu_Nome: 'Tech Solutions Ltda',
    UF: 'SP',
    Comarca: 'Campinas',
    Fase: 'Recurso',
    Status: 'Em andamento'
  },
  {
    CNJ: '1000004-03.2024.5.02.1004',
    Reclamante_Limpo: 'Carlos Eduardo Souza',
    Reu_Nome: 'Logística GHI S/A',
    UF: 'SP',
    Comarca: 'São Paulo',
    Fase: 'Conhecimento',
    Status: 'Conciliado'
  },
  {
    CNJ: '1000005-52.2024.5.02.1005',
    Reclamante_Limpo: 'Luciana Ribeiro Dias',
    Reu_Nome: 'Metalúrgica JKL Ltda',
    UF: 'SP',
    Comarca: 'São Bernardo do Campo',
    Fase: 'Execução',
    Status: 'Em andamento'
  },
  {
    CNJ: '1000006-00.2024.5.02.1006',
    Reclamante_Limpo: 'Roberto Carlos Mendes',
    Reu_Nome: 'Serviços MNO Ltda',
    UF: 'SP',
    Comarca: 'São Paulo',
    Fase: 'Conhecimento',
    Status: 'Suspenso'
  },
  {
    CNJ: '1000007-49.2024.5.02.1007',
    Reclamante_Limpo: 'Fernanda Lima Santos',
    Reu_Nome: 'Construção PQR S/A',
    UF: 'SP',
    Comarca: 'Osasco',
    Fase: 'Conhecimento',
    Status: 'Em andamento'
  },
  {
    CNJ: '1000008-97.2024.5.02.1008',
    Reclamante_Limpo: 'Marcos Antônio Silva',
    Reu_Nome: 'Alimentação STU Ltda',
    UF: 'SP',
    Comarca: 'São Paulo',
    Fase: 'Recurso',
    Status: 'Julgado'
  },
  {
    CNJ: '1000009-46.2024.5.02.1009',
    Reclamante_Limpo: 'Patrícia Gomes Oliveira',
    Reu_Nome: 'Transporte VWX ME',
    UF: 'SP',
    Comarca: 'Guarulhos',
    Fase: 'Conhecimento',
    Status: 'Arquivado'
  }
];

// Usar CNJs dos processos para as testemunhas
const cnjPool = processoSamples.map(p => p.CNJ);

export const testemunhaSamples: TestemunhaSample[] = [
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

export const dicionarioFields: DicionarioField[] = [
  {
    Aba: 'Por Processo',
    Campo: 'CNJ',
    Tipo: 'texto (com máscara)',
    Obrigatorio: 'Sim',
    Regra: '20 dígitos com dígitos verificadores válidos',
    Exemplo: '1000000-71.2024.5.02.1000'
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
    Exemplo: "['1000000-71.2024.5.02.1000','1000001-20.2024.5.02.1001']"
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