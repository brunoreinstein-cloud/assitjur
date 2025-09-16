/**
 * AssistJur.IA - Canonical Format Exporters
 * Updated formatters to use canonical headers and formatting rules
 */

import { PorProcesso, PorTestemunha } from "@/types/mapa-testemunhas";
import { CANONICAL_HEADERS_PROCESSO, CANONICAL_HEADERS_TESTEMUNHA } from "@/lib/templates/canonical-samples";
import { formatToCanonicalList } from "@/lib/templates/canonical-builders";

export const formatCNJ = (cnj: string) => {
  if (!cnj) return '';
  // Format CNJ: 0000000-00.0000.0.00.0000 but preserve as string
  const cleaned = cnj.replace(/\D/g, '');
  if (cleaned.length === 20) {
    return cleaned.replace(/(\d{7})(\d{2})(\d{4})(\d{1})(\d{2})(\d{4})/, '$1-$2.$3.$4.$5.$6');
  }
  return cnj; // Keep original format if not 20 digits
};

export const formatRisk = (classification: string | null) => {
  if (!classification) return { text: 'N/A', variant: 'secondary' as const };
  
  const lower = classification.toLowerCase();
  
  if (lower.includes('alto') || lower.includes('crítico')) {
    return { text: classification, variant: 'destructive' as const };
  }
  
  if (lower.includes('médio') || lower.includes('atenção')) {
    return { text: classification, variant: 'warning' as const };
  }
  
  if (lower.includes('baixo') || lower.includes('observação')) {
    return { text: classification, variant: 'success' as const };
  }
  
  return { text: classification, variant: 'secondary' as const };
};

export const formatBooleanBadge = (value: boolean | null | undefined) => {
  if (value === null || value === undefined) {
    return { text: 'N/A', variant: 'secondary' as const };
  }
  
  return {
    text: value ? 'Sim' : 'Não',
    variant: value ? 'destructive' as const : 'success' as const
  };
};

export const formatArrayForDisplay = (arr: string[] | null | undefined, maxItems = 3) => {
  if (!arr || arr.length === 0) {
    return { visible: [], hidden: 0, total: 0 };
  }
  
  return {
    visible: arr.slice(0, maxItems),
    hidden: Math.max(0, arr.length - maxItems),
    total: arr.length
  };
};

export const formatNumber = (num: number | null | undefined) => {
  if (num === null || num === undefined) return 'N/A';
  return num.toLocaleString('pt-BR');
};

export const formatDate = (date: string | Date | null | undefined) => {
  if (!date) return 'N/A';
  
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('pt-BR');
  } catch {
    return 'Data inválida';
  }
};

/**
 * CANONICAL EXPORT FORMATTERS - Use exact canonical headers
 */

export const formatProcessoToCanonical = (processo: PorProcesso): Record<string, any> => {
  return {
    'CNJ': processo.cnj || '—',
    'Status': processo.status || '—',
    'Fase': processo.fase || '—',
    'UF': processo.uf || '—',
    'Comarca': processo.comarca || '—',
    'Reclamantes': processo.reclamante_limpo || '—',
    'Advogados_Ativo': formatToCanonicalList(processo.advogados_parte_ativa || []),
    'Testemunhas_Ativo': formatToCanonicalList(processo.testemunhas_ativo_limpo || []),
    'Testemunhas_Passivo': formatToCanonicalList(processo.testemunhas_passivo_limpo || []),
    'Todas_Testemunhas': formatToCanonicalList(processo.todas_testemunhas || []),
    'Reclamante_Foi_Testemunha': processo.reclamante_foi_testemunha || false,
    'Qtd_Reclamante_Testemunha': processo.qtd_vezes_reclamante_foi_testemunha || 0,
    'CNJs_Reclamante_Testemunha': formatToCanonicalList(processo.cnjs_em_que_reclamante_foi_testemunha || []),
    'Reclamante_Testemunha_Polo_Passivo': processo.reclamante_testemunha_polo_passivo || false,
    'CNJs_Passivo': formatToCanonicalList(processo.cnjs_passivo || []),
    'Triangulacao_Confirmada': processo.triangulacao_confirmada || false,
    'Desenho_Triangulacao': processo.desenho_triangulacao || '—',
    'CNJs_Triangulacao': formatToCanonicalList(processo.cnjs_triangulacao || []),
    'Contem_Prova_Emprestada': processo.contem_prova_emprestada || false,
    'Testemunhas_Prova_Emprestada': formatToCanonicalList(processo.testemunhas_prova_emprestada || []),
    'Classificacao_Final': processo.classificacao_final || '—',
    'Insight_Estrategico': processo.insight_estrategico || '—'
  };
};

export const formatTestemunhaToCanonical = (testemunha: PorTestemunha): Record<string, any> => {
  return {
    'Nome_Testemunha': testemunha.nome_testemunha,
    'Qtd_Depoimentos': testemunha.qtd_depoimentos || 0,
    'CNJs_Como_Testemunha': formatToCanonicalList(testemunha.cnjs_como_testemunha || []),
    'Ja_Foi_Reclamante': testemunha.ja_foi_reclamante || false,
    'CNJs_Como_Reclamante': formatToCanonicalList(testemunha.cnjs_como_reclamante || []),
    'Foi_Testemunha_Ativo': testemunha.foi_testemunha_ativo || false,
    'Foi_Testemunha_Passivo': testemunha.foi_testemunha_passivo || false,
    'CNJs_Passivo': formatToCanonicalList(testemunha.cnjs_passivo || []),
    'Foi_Ambos_Polos': testemunha.foi_testemunha_em_ambos_polos || false,
    'Participou_Troca_Favor': testemunha.participou_troca_favor || false,
    'CNJs_Troca_Favor': formatToCanonicalList(testemunha.cnjs_troca_favor || []),
    'Participou_Triangulacao': testemunha.participou_triangulacao || false,
    'CNJs_Triangulacao': formatToCanonicalList(testemunha.cnjs_triangulacao || []),
    'E_Prova_Emprestada': testemunha.e_prova_emprestada || false,
    'Classificacao': testemunha.classificacao || '—',
    'Classificacao_Estrategica': testemunha.classificacao_estrategica || '—'
  };
};

/**
 * Validate canonical headers match exactly
 */
export function validateCanonicalHeaders(
  actualHeaders: string[],
  sheetType: 'processo' | 'testemunha'
): { valid: boolean; missing: string[]; extra: string[] } {
  const expectedHeaders = (sheetType === 'processo' 
    ? [...CANONICAL_HEADERS_PROCESSO] 
    : [...CANONICAL_HEADERS_TESTEMUNHA]) as string[];
  
  const missing = expectedHeaders.filter(h => !actualHeaders.includes(h));
  const extra = actualHeaders.filter(h => !expectedHeaders.includes(h));
  
  return {
    valid: missing.length === 0 && extra.length === 0,
    missing,
    extra
  };
}

/**
 * Get canonical headers for validation
 */
export function getExpectedCanonicalHeaders(sheetType: 'processo' | 'testemunha'): readonly string[] {
  return sheetType === 'processo' 
    ? CANONICAL_HEADERS_PROCESSO
    : CANONICAL_HEADERS_TESTEMUNHA;
}