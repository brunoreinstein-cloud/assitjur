/**
 * Strings de internacionalização - Português Brasil
 * Centralizadas para facilitar manutenção e tradução
 */

export const strings = {
  // LGPD & Compliance
  lgpdNotice: 'Conteúdo assistivo. Revisão humana obrigatória.',
  complianceFooter: 'Validação nos autos é obrigatória. Dados tratados conforme LGPD.',
  complianceNote: 'AssistJur.IA - Conformidade LGPD e dados seguros',
  
  // Report Structure
  reportSections: {
    executiveSummary: '📌 Resumo Executivo',
    detailedAnalysis: '📋 Análise Detalhada', 
    strategicAlerts: '⚠️ Alertas Estratégicos',
    activePole: '🎯 Polo Ativo & Estratégias',
    nextSteps: '➡️ Próximos Passos'
  },
  
  // Risk Levels
  riskLevels: {
    critical: 'CRÍTICO',
    warning: 'ATENÇÃO', 
    observation: 'OBSERVAÇÃO',
    high: 'Alto',
    medium: 'Médio',
    low: 'Baixo'
  },
  
  // Pattern Types
  patterns: {
    trocaDireta: 'Troca Direta',
    triangulacao: 'Triangulação',
    duploPapel: 'Duplo Papel',
    provaEmprestada: 'Prova Emprestada',
    homonimos: 'Homônimos'
  },
  
  // Actions & Buttons
  actions: {
    export: 'Exportar',
    print: 'Imprimir',
    download: 'Baixar',
    copy: 'Copiar',
    validate: 'Validar',
    publish: 'Publicar',
    cancel: 'Cancelar',
    continue: 'Continuar',
    back: 'Voltar'
  },
  
  // Status Messages
  status: {
    loading: 'Carregando...',
    processing: 'Processando...',
    complete: 'Concluído',
    error: 'Erro',
    draft: 'Rascunho',
    published: 'Publicado',
    archived: 'Arquivado'
  },
  
  // Chat Interface
  chat: {
    placeholder: 'Descreva o que você precisa analisar...',
    thinking: 'Analisando padrões...',
    generating: 'Gerando relatório...',
    analysisComplete: 'Análise concluída',
    exportAuditLog: 'Relatório gerado por {user} às {timestamp}'
  },
  
  // Import Wizard
  import: {
    steps: {
      upload: 'Upload',
      validation: 'Validação', 
      preview: 'Prévia',
      publish: 'Publicação'
    },
    compliance: {
      title: 'Compliance LGPD',
      maskedData: 'Dados mascarados: CPFs e informações sensíveis são automaticamente mascarados para proteção.',
      mandatoryValidation: 'Validação obrigatória: Confirmação nos autos é obrigatória antes de decisões.'
    }
  },
  
  // Validation Messages
  validation: {
    cnjPreserved: 'CNJ preservado como string original',
    dataProcessed: 'Dados processados com sucesso',
    lgpdCompliant: 'Conforme LGPD',
    auditLogged: 'Registrado no log de auditoria'
  },
  
  // Email Templates
  email: {
    welcome: {
      subject: 'Bem-vindo ao AssistJur.IA',
      greeting: 'Olá {name},',
      body: 'Sua conta foi criada com sucesso. Você agora tem acesso à análise avançada de testemunhas.'
    },
    importComplete: {
      subject: 'Importação concluída - AssistJur.IA',
      body: 'Sua importação de dados foi processada com sucesso.'
    }
  },
  
  // Common Phrases
  common: {
    systemName: 'AssistJur.IA',
    fullName: 'AssistJur.IA - Assistente de Testemunhas',
    lastUpdate: 'Última atualização',
    version: 'Versão',
    generatedBy: 'Gerado por',
    at: 'às',
    on: 'em',
    total: 'Total',
    cases: 'casos',
    processes: 'processos',
    witnesses: 'testemunhas'
  }
} as const;

export type StringKeys = keyof typeof strings;
export type DeepStringKeys<T> = T extends string 
  ? never 
  : T extends object 
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends string
          ? K
          : T[K] extends object
          ? `${K}.${DeepStringKeys<T[K]>}`
          : never
        : never;
    }[keyof T]
  : never;

export type AllStringKeys = DeepStringKeys<typeof strings>;

// Helper function to get nested string values
export function getString(key: AllStringKeys, params?: Record<string, any>): string {
  const keys = key.split('.');
  let value: any = strings;
  
  for (const k of keys) {
    value = value?.[k];
  }
  
  if (typeof value !== 'string') {
    console.warn(`String key not found: ${key}`);
    return key;
  }
  
  // Simple parameter replacement
  if (params) {
    return value.replace(/\{(\w+)\}/g, (match: string, paramKey: string) => {
      return params[paramKey] || match;
    });
  }
  
  return value;
}