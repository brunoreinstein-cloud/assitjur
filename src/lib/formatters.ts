import { PorProcesso, PorTestemunha } from "@/types/mapa-testemunhas";

export const formatCNJ = (cnj: string) => {
  if (!cnj) return "";
  // Format CNJ: 0000000-00.0000.0.00.0000
  const cleaned = cnj.replace(/\D/g, "");
  if (cleaned.length === 20) {
    return cleaned.replace(
      /(\d{7})(\d{2})(\d{4})(\d{1})(\d{2})(\d{4})/,
      "$1-$2.$3.$4.$5.$6",
    );
  }
  return cnj;
};

export const formatRisk = (classification: string | null) => {
  if (!classification) return { text: "N/A", variant: "secondary" as const };

  const lower = classification.toLowerCase();

  if (lower.includes("alto") || lower.includes("crítico")) {
    return { text: classification, variant: "destructive" as const };
  }

  if (lower.includes("médio") || lower.includes("atenção")) {
    return { text: classification, variant: "warning" as const };
  }

  if (lower.includes("baixo") || lower.includes("observação")) {
    return { text: classification, variant: "success" as const };
  }

  return { text: classification, variant: "secondary" as const };
};

export const formatBooleanBadge = (value: boolean | null | undefined) => {
  if (value === null || value === undefined) {
    return { text: "N/A", variant: "secondary" as const };
  }

  return {
    text: value ? "Sim" : "Não",
    variant: value ? ("destructive" as const) : ("success" as const),
  };
};

export const formatArrayForDisplay = (
  arr: string[] | null | undefined,
  maxItems = 3,
) => {
  if (!arr || arr.length === 0) {
    return { visible: [], hidden: 0, total: 0 };
  }

  return {
    visible: arr.slice(0, maxItems),
    hidden: Math.max(0, arr.length - maxItems),
    total: arr.length,
  };
};

export const formatNumber = (num: number | null | undefined) => {
  if (num === null || num === undefined) return "N/A";
  return num.toLocaleString("pt-BR");
};

export const formatDate = (date: string | Date | null | undefined) => {
  if (!date) return "N/A";

  try {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("pt-BR");
  } catch {
    return "Data inválida";
  }
};

// Export CSV helpers
export const formatProcessoForCSV = (processo: PorProcesso) => {
  return {
    CNJ: processo.cnj,
    UF: processo.uf || "",
    Comarca: processo.comarca || "",
    Fase: processo.fase || "",
    Status: processo.status || "",
    Reclamante: processo.reclamante_limpo || "",
    "Qtd Depos Únicos": processo.qtd_total_depos_unicos || 0,
    "Classificação Final": processo.classificacao_final || "",
    Triangulação: processo.triangulacao_confirmada ? "Sim" : "Não",
    "Troca Direta": processo.troca_direta ? "Sim" : "Não",
    "Prova Emprestada": processo.contem_prova_emprestada ? "Sim" : "Não",
    "Todas Testemunhas": processo.todas_testemunhas?.join("; ") || "",
    "CNJs Triangulação": processo.cnjs_triangulacao?.join("; ") || "",
    "CNJs Troca Direta": processo.cnjs_troca_direta?.join("; ") || "",
    "Insight Estratégico": processo.insight_estrategico || "",
    "Data Criação": formatDate(processo.created_at),
    "Última Atualização": formatDate(processo.updated_at),
  };
};

export const formatTestemunhaForCSV = (testemunha: PorTestemunha) => {
  return {
    "Nome Testemunha": testemunha.nome_testemunha,
    "Qtd Depoimentos": testemunha.qtd_depoimentos || 0,
    "Em Ambos Polos": testemunha.foi_testemunha_em_ambos_polos ? "Sim" : "Não",
    "Já Foi Reclamante": testemunha.ja_foi_reclamante ? "Sim" : "Não",
    "Classificação Estratégica": testemunha.classificacao_estrategica || "",
    Classificação: testemunha.classificacao || "",
    "CNJs como Testemunha": testemunha.cnjs_como_testemunha?.join("; ") || "",
    "CNJs como Reclamante": testemunha.cnjs_como_reclamante?.join("; ") || "",
    "Participou Triangulação": testemunha.participou_triangulacao
      ? "Sim"
      : "Não",
    "Participou Troca Favor": testemunha.participou_troca_favor ? "Sim" : "Não",
    "É Prova Emprestada": testemunha.e_prova_emprestada ? "Sim" : "Não",
    "Data Criação": formatDate(testemunha.created_at),
    "Última Atualização": formatDate(testemunha.updated_at),
  };
};
