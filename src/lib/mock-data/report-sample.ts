import type { ConclusiveReportData } from "@/components/reports/ConclusiveReportTemplate";

/**
 * Dados de exemplo para teste do relatório conclusivo
 */
export const mockReportData: ConclusiveReportData = {
  // Metadados do relatório
  organizacao: "Advocacia Silva & Associados Ltda",
  periodo_analise: {
    inicio: "2024-01-01",
    fim: "2024-08-29",
  },
  analista_responsavel: "Dr. João Silva",
  data_geracao: new Date().toISOString(),

  // Dados principais
  analysis_result: {
    trocaDireta: [
      {
        testemunhaA: "Maria Santos",
        testemunhaB: "João Pereira",
        cnjsA: ["0001234-56.2024.5.02.0001"],
        cnjsB: ["0001235-57.2024.5.02.0002"],
        advogadosComuns: ["Dr. Carlos Costa"],
        confianca: 0.92,
      },
    ],
    triangulacao: [
      {
        ciclo: ["Ana Silva", "Pedro Costa", "Maria Santos"],
        cnjs: [
          "0001234-56.2024.5.02.0001",
          "0001235-57.2024.5.02.0002",
          "0001236-58.2024.5.02.0003",
        ],
        advogados: ["Dr. Carlos Costa", "Dra. Ana Oliveira"],
        comarcas: ["São Paulo", "Campinas"],
        desenho: "A → B → C → A",
        confianca: 0.87,
      },
    ],
    duploPapel: [
      {
        nome: "Carlos Mendes",
        cnjs_como_reclamante: ["0001237-59.2024.5.02.0004"],
        cnjs_como_testemunha: [
          "0001238-60.2024.5.02.0005",
          "0001239-61.2024.5.02.0006",
        ],
        polo_passivo: true,
        risco: "ALTO",
      },
    ],
    provaEmprestada: [
      {
        nome: "Roberto Lima",
        qtd_depoimentos: 15,
        cnjs: ["0001240-62.2024.5.02.0007", "0001241-63.2024.5.02.0008"],
        advogados_recorrentes: ["Dr. Fernando Pinto"],
        concentracao_comarca: 0.85,
        alerta: true,
      },
    ],
    homonimos: [
      {
        nome: "José Silva",
        score: 75,
        fatores: {
          comarca_uf: 0.8,
          advogado_ativo: 0.6,
          temporalidade: 0.7,
          nome_comum: true,
        },
        probabilidade: "ALTA",
        cnjs_suspeitos: [
          "0001242-64.2024.5.02.0009",
          "0001243-65.2024.5.02.0010",
        ],
      },
    ],
    padroes: {
      total_processos: 1250,
      processos_com_triangulacao: 15,
      processos_com_troca_direta: 8,
      processos_com_prova_emprestada: 12,
      testemunhas_profissionais: 5,
      advogados_ofensores: ["Dr. Carlos Costa", "Dr. Fernando Pinto"],
      concentracao_uf: {
        SP: 0.65,
        RJ: 0.2,
        MG: 0.1,
        RS: 0.05,
      },
    },
  },

  processos_scores: [
    {
      cnj: "0001234-56.2024.5.02.0001",
      score_final: 92,
      score_breakdown: {
        total: 92,
        components: {
          duplo_papel: {
            score: 85,
            weight: 0.3,
            description:
              "Testemunha identificada como reclamante em outro processo",
            factor_type: "DUPLO_PAPEL",
          },
          prova_emprestada: {
            score: 78,
            weight: 0.25,
            description: "Testemunha com histórico de múltiplos depoimentos",
            factor_type: "PROVA_EMPRESTADA",
          },
          troca_direta: {
            score: 90,
            weight: 0.2,
            description: "Padrão de troca direta detectado",
            factor_type: "TROCA_DIRETA",
          },
        },
        classification: "CRITICO",
        recommendations: [
          "Contraditar testemunha imediatamente",
          "Investigar vínculo com advogados comuns",
          "Solicitar análise de padrões de depoimento",
        ],
        calculated_at: new Date().toISOString(),
      },
      fatores_risco: [
        "Testemunha com duplo papel (reclamante/testemunha)",
        "Padrão de troca direta com alta confiança",
        "Concentração geográfica suspeita",
      ],
      classificacao_estrategica: "Crítico - Ação Imediata",
      prioridade_contradita: "URGENTE",
      confidence_level: 0.94,
      last_updated: new Date().toISOString(),
    },
    {
      cnj: "0001235-57.2024.5.02.0002",
      score_final: 87,
      score_breakdown: {
        total: 87,
        components: {
          triangulacao: {
            score: 85,
            weight: 0.15,
            description: "Parte de rede de triangulação identificada",
            factor_type: "TRIANGULACAO",
          },
          prova_emprestada: {
            score: 82,
            weight: 0.25,
            description: "Testemunha profissional suspeita",
            factor_type: "PROVA_EMPRESTADA",
          },
        },
        classification: "CRITICO",
        recommendations: [
          "Contraditar com urgência",
          "Mapear rede completa de testemunhas",
        ],
        calculated_at: new Date().toISOString(),
      },
      fatores_risco: [
        "Participação em rede de triangulação",
        "Testemunha profissional confirmada",
      ],
      classificacao_estrategica: "Crítico - Investigação Necessária",
      prioridade_contradita: "URGENTE",
      confidence_level: 0.91,
      last_updated: new Date().toISOString(),
    },
    {
      cnj: "0001236-58.2024.5.02.0003",
      score_final: 45,
      score_breakdown: {
        total: 45,
        components: {
          homonimo: {
            score: 65,
            weight: 0.1,
            description: "Possível homônimo detectado",
            factor_type: "HOMONIMO",
          },
        },
        classification: "BAIXO",
        recommendations: [
          "Verificar identidade da testemunha",
          "Monitorar para novos padrões",
        ],
        calculated_at: new Date().toISOString(),
      },
      fatores_risco: ["Possível caso de homonímia"],
      classificacao_estrategica: "Normal - Monitoramento",
      prioridade_contradita: "BAIXA",
      confidence_level: 0.68,
      last_updated: new Date().toISOString(),
    },
  ],

  testemunhas_scores: [
    {
      nome: "Maria Santos",
      score_final: 88,
      score_breakdown: {
        total: 88,
        components: {
          prova_emprestada: {
            score: 90,
            weight: 0.4,
            description: "Testemunha com 15+ depoimentos",
            factor_type: "PROVA_EMPRESTADA",
          },
          troca_direta: {
            score: 85,
            weight: 0.3,
            description: "Participação confirmada em troca direta",
            factor_type: "TROCA_DIRETA",
          },
        },
        classification: "CRITICO",
        recommendations: [
          "Contraditar em todos os casos pendentes",
          "Investigar histórico completo",
        ],
        calculated_at: new Date().toISOString(),
      },
      classificacao: "PROFISSIONAL",
      alerta_prova_emprestada: true,
      recomendacao_acao: "Contraditar imediatamente",
      risk_level: "CRITICO",
      last_updated: new Date().toISOString(),
    },
    {
      nome: "João Silva",
      score_final: 35,
      score_breakdown: {
        total: 35,
        components: {
          homonimo: {
            score: 70,
            weight: 0.15,
            description: "Nome comum, possível homonímia",
            factor_type: "HOMONIMO",
          },
        },
        classification: "BAIXO",
        recommendations: [
          "Verificar CPF e documentos",
          "Confirmar identidade antes de ação",
        ],
        calculated_at: new Date().toISOString(),
      },
      classificacao: "NORMAL",
      alerta_prova_emprestada: false,
      recomendacao_acao: "Verificar identidade",
      risk_level: "BAIXO",
      last_updated: new Date().toISOString(),
    },
  ],

  scoring_metrics: {
    total_casos_analisados: 1250,
    distribuicao_scores: {
      critico: 3,
      alto: 15,
      medio: 125,
      baixo: 850,
      minimo: 257,
    },
    avg_score: 28.5,
    casos_contradita_recomendada: 18,
    casos_investigacao_necessaria: 25,
    accuracy_rate: 0.94,
  },

  // Resumo executivo
  resumo_executivo: {
    total_processos: 1250,
    processos_criticos: 3,
    padroes_detectados: 5,
    risco_geral: "MEDIO",
    confiabilidade_analise: 94,
    observacoes_gerais:
      "A análise identificou padrões suspeitos concentrados em um pequeno grupo de testemunhas e advogados. Embora a maioria dos casos apresente baixo risco, há evidências claras de esquemas organizados de fraude testemunhal que requerem ação imediata. A concentração geográfica e temporal dos padrões sugere coordenação entre os envolvidos.",
  },

  // Recomendações estratégicas
  recomendacoes: {
    imediatas: [
      "Contraditar testemunhas críticas (Maria Santos, Carlos Mendes) em todos os processos pendentes",
      "Notificar Ministério Público sobre possível esquema organizado de fraude",
      "Suspender andamento dos processos com score ≥ 85 até investigação completa",
      "Implementar verificação de CPF obrigatória para todas as testemunhas",
    ],
    curto_prazo: [
      "Desenvolver protocolo de verificação automática de padrões suspeitos",
      "Criar lista de observação para advogados e testemunhas recorrentes",
      "Implementar sistema de alertas para casos similares futuros",
      "Treinar equipe jurídica sobre identificação de padrões de fraude",
    ],
    longo_prazo: [
      "Estabelecer parcerias com outros escritórios para compartilhamento de inteligência",
      "Desenvolver banco de dados nacional de testemunhas suspeitas",
      "Criar metodologia de scoring preventivo para novos casos",
      "Implementar auditoria trimestral de padrões emergentes",
    ],
  },

  roi: {
    investimento: 50000,
    retorno: 150000,
    percentual: 200,
  },
};
