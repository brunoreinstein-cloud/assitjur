import { AssistJurProcesso } from '@/hooks/useAssistJurProcessos';

export const mockProcessosData: AssistJurProcesso[] = [
  {
    cnj: "5001234-12.2024.5.02.0001",
    reclamante: "João da Silva Santos",
    reclamada: "Empresa XYZ Ltda",
    testemunhas_ativas: ["Maria Oliveira", "Carlos Pereira"],
    testemunhas_passivas: ["Ana Costa", "Pedro Lima"],
    qtd_testemunhas: 4,
    classificacao: "Atenção",
    classificacao_estrategica: "Média complexidade",
    created_at: new Date().toISOString()
  },
  {
    cnj: "5001235-13.2024.5.02.0001",
    reclamante: "Ana Paula Ferreira",
    reclamada: "Tech Solutions S.A.",
    testemunhas_ativas: ["Roberto Silva"],
    testemunhas_passivas: ["Lucia Santos", "Fernando Costa", "Mariana Oliveira"],
    qtd_testemunhas: 4,
    classificacao: "Crítico",
    classificacao_estrategica: "Alta complexidade",
    created_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    cnj: "5001236-14.2024.5.02.0001",
    reclamante: "Carlos Eduardo Souza",
    reclamada: "Indústria ABC Ltda",
    testemunhas_ativas: ["Patricia Lima"],
    testemunhas_passivas: ["José Maria"],
    qtd_testemunhas: 2,
    classificacao: "Normal",
    classificacao_estrategica: "Baixa complexidade",
    created_at: new Date(Date.now() - 172800000).toISOString()
  }
];

export const mockStatsData = {
  total: 150,
  criticos: 25,
  atencao: 45,
  observacao: 35,
  normais: 45,
  percentualCritico: "16.7"
};